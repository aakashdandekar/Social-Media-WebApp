from fastapi import FastAPI, HTTPException, File, UploadFile, Depends, Form
from fastapi.concurrency import run_in_threadpool
from bson import ObjectId
from src.schemas import Post, User, Login
from src.db import database
from src.images import imagekit
from imagekitio.models.UploadFileRequestOptions import UploadFileRequestOptions
from datetime import datetime
from random import randint
from src.auth import hash, check_hash, create_access_token, get_current_user

app = FastAPI()

"""
Conditions:
1. async awit compulsary when dealing with data and motor lib, if using pymongo no async await
2. If you give = None to any function parameter it becomes a query
"""

#Register/Login
@app.post('/register')
async def register(user: User):
    try:
        collection = database["user"]

        exist = await collection.find_one({
            "$or": [
                {"email": user.email},
                {"username": user.userId}
            ]
        })

        if exist:
            raise HTTPException(status_code=400, detail="User already exists!")

        password = hash(user.password)

        result = await collection.insert_one({
            "userId": user.userId,
            "email": user.email,
            "password": hash(password),
            "created_at": datetime.utcnow()
        })

        token = create_access_token(str(result.inserted_id))

        return {
            "message": "User registered successfully",
            "access_token": token
        }
    
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


@app.post("/login")
async def login(user: Login):
    collection = database["user"]
    db_user = await collection.find_one({"email": user.email})

    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(str(db_user["_id"]))

    return {"access_token": token}


#Fetch and Feed
@app.get('/feed')
async def get_feed():
    collection = database["post"]
    total = await collection.count_documents({})
    half = total // 2

    if half == 0:
        half = 1

    items = []
    data = collection.aggregate([{
        "$sample": {
            "size": half
        }
    }])

    async for post in data:
        post["_id"] = str(post["_id"])    
        items.append(post)

    return {"feed": items}

#Post Operations
@app.post('/upload')
async def upload_post(
    file: UploadFile = File(...),
    caption: str = Form(""),
    user_id: str = Depends(get_current_user)
):
    collection = database["post"]
    contents = await file.read()

    upload_response = await run_in_threadpool(
        imagekit.upload_file,
        file=contents,
        file_name=file.filename,
        options=UploadFileRequestOptions(
            use_unique_file_name=True,
            tags=["backend_upload"]
        )
    )

    try:
        if not upload_response.response_metadata:
            raise HTTPException(status_code=500, detail="Image Upload Failed!")

        data = upload_response.response_metadata.raw

        result = await collection.insert_one({
            "fileID": data["fileId"],
            "userId": ObjectId(user_id),
            "url": data["url"],
            "filetype": "video" if file.content_type.startswith("video/") else "image",
            "caption": caption,
            "created_at": datetime.utcnow()
        })

        return {
            "id": str(result.inserted_id),
            "image_url": data["url"]
        }
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail="Post Upload Failed!")

@app.get("/profile")
async def get_profile(user_id: str = Depends(get_current_user)):
    users_collection = db["users"]
    posts_collection = db["post"]

    user = await users_collection.find_one(
        {"_id": ObjectId(user_id)},
        {"password": 0}
    )

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    posts = await posts_collection.find(
        {"user_id": ObjectId(user_id)}
    ).to_list(100)

    user["_id"] = str(user["_id"])

    for post in posts:
        post["_id"] = str(post["_id"])
        post["user_id"] = str(post["user_id"])

    return {
        "user": user,
        "posts": posts
    }

@app.delete('/post/{post_id}')
async def delete_post(
    post_id: str,
    user_id: str = Depends(get_current_user)
):
    collection = database["post"]

    try:
        post_objectID = ObjectId(post_id)
        result = await collection.find_one_and_delete({
            "_id": post_objectID,
            "userID": ObjectId(user_id)
        })

        return {
            "success": True,
            "message": "Post successfully deleted!"
        }

    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=404, detail="Post not Found!")


#Public Profile
@app.get("/profile/{username}")
async def get_public_profile(username: str):
    user = await db["users"].find_one(
        {"username": username},
        {"password": 0}
    )

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    posts = await db["post"].find(
        {"user_id": user["_id"]}
    ).to_list(100)

    user["_id"] = str(user["_id"])

    for post in posts:
        post["_id"] = str(post["_id"])
        post["user_id"] = str(post["user_id"])

    return {
        "user": user,
        "posts": posts
    }