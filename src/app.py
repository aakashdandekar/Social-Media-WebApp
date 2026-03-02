from fastapi import FastAPI, HTTPException, File, UploadFile, Depends, Form
from fastapi.concurrency import run_in_threadpool
from bson import ObjectId
from src.schemas import User, Login
from src.db import database
from src.images import imagekit
from imagekitio.models.UploadFileRequestOptions import UploadFileRequestOptions
from datetime import datetime, timezone
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
            "password": password,
            "created_at": datetime.now(tz=timezone.utc)
        })

        token = create_access_token(str(result.inserted_id))

        return {
            "message": "User registered successfully",
            "access_token": token
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


@app.post("/login")
async def login(user: Login):
    collection = database["user"]
    db_user = await collection.find_one({
        "email": user.email
    })

    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if check_hash(user.password, db_user["password"]):
        token = create_access_token(str(db_user["_id"]))
    else:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return {"access_token": token}


#Fetch and Feed
@app.get('/feed')
async def get_feed(user_id: User = Depends(get_current_user)):
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
        post["userId"] = str(post["userId"])
        
        if user_id != post["userId"]:
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
            "likes": 0,
            "liked_by": [],
            "comments": {},
            "created_at": datetime.now(tz=timezone.utc)
        })

        return {
            "id": str(result.inserted_id),
            "image_url": data["url"]
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail="Post Upload Failed!")

@app.post("/like/{post_id}")
async def like_post(
    post_id: str,
    user_id: str = Depends(get_current_user)
):
    try:
        collection = database["post"]

        post = await collection.find_one({
            "_id": ObjectId(post_id)
        })

        if not post:
            raise HTTPException(status_code=404, detail="Post not found")

        user_obj_id = ObjectId(user_id)

        if user_obj_id in post.get("liked_by", []):
            await collection.update_one(
                {"_id": ObjectId(post_id)},
                {
                    "$inc": {"likes": -1},
                    "$pull": {"liked_by": user_obj_id}
                }
            )
            return {"message": "Post unliked"}
        
        else:
            await collection.update_one(
                {"_id": ObjectId(post_id)},
                {
                    "$inc": {"likes": 1},
                    "$addToSet": {"liked_by": user_obj_id}
                }
            )
            return {"message": "Post liked"}

    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@app.post("/add-comment/{post_id}")
async def comment_post(
    post_id: str,
    comment_data: str,
    user_id: str = Depends(get_current_user)
):
    try:
        collection = database["post"]

        result = await collection.update_one(
            {"_id": ObjectId(post_id)},
            {
                "$set": {
                    f"comments.{user_id}": {
                        "text": comment_data,
                        "created_at": datetime.utcnow()
                    }
                }
            }
        )

        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Post not found")

        return {"message": "Comment posted"}

    except Exception as e:
        print("Error:", e)
        raise HTTPException(status_code=500, detail="Internal Server Error")

@app.delete("/delete-comment/{post_id}")
async def delete_comment(
    post_id: str,
    user_id: str = Depends(get_current_user)
):
    try:
        collection = database["post"]

        result = await collection.update_one(
            {"_id": ObjectId(post_id)},
            {
                "$unset": {f"comments.{user_id}": ""}
            }
        )

        if result.modified_count == 0:
            raise HTTPException(status_code=400, detail="Comment not found")

        return {"message": "Comment Deleted"}

    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

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
            "userId": ObjectId(user_id)
        })

        if not result:
            raise HTTPException(status_code=404, detail="Post not Found!")

        return {
            "success": True,
            "message": "Post successfully deleted!"
        }

    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=404, detail="Post not Found!")


#Profile Operations
@app.post("/setup-profile/{user_id}")
async def setup_profile(
    bio: str,
    user_id: str = Depends(get_current_user)
):
    try:
        collection = database['profile-data']

        user = await collection.find_one({
            "userId": ObjectId(user_id)
        })

        if user:
            raise HTTPException(status_code=400, detail="Profile already exists!")

        await collection.insert_one({
            "userId": ObjectId(user_id),
            "bio": bio,
            "followers": [],
            "following": []
        })

        return {"message": "Profile-setup succesful"}

    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@app.post("/update-profile/{user_id}")
async def update_profile(
    bio: str,
    user_id: str = Depends(get_current_user)
):
    try:
        user = await database["profile-data"].find_one({
            "userId": ObjectId(user_id)
        })

        if not user:
            raise HTTPException(status_code=404, detail="Profile has not been setup")

        await database["profile-data"].update_one(
            {"userId": ObjectId(user_id)},
            {"$set": {"bio": bio}}
        )

        return {"message": "profile has been updated!"}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error:{e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@app.get("/profile/{username}")
async def get_public_profile(username: str):
    user = await database["user"].find_one(
        {"userId": username},
        {"password": 0}
    )

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    posts = await database["post"].find(
        {"userId": user["_id"]}
    ).to_list(100)

    user["_id"] = str(user["_id"])

    for post in posts:
        post["_id"] = str(post["_id"])
        post["userId"] = str(post["userId"])

    return {
        "user": user,
        "posts": posts
    }

@app.get("/profile")
async def get_profile(user_id: str = Depends(get_current_user)):
    users_collection = database["user"]
    posts_collection = database["post"]

    user = await users_collection.find_one(
        {"_id": ObjectId(user_id)},
        {"password": 0}
    )

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    posts = await posts_collection.find(
        {"userId": ObjectId(user_id)}
    ).to_list(100)

    user["_id"] = str(user["_id"])

    for post in posts:
        post["_id"] = str(post["_id"])
        post["userId"] = str(post["userId"])

    return {
        "user": user,
        "posts": posts
    }

@app.post("/follow/{user_to_follow}")
async def follow_user(
    user_to_follow: str,
    user_id: str = Depends(get_current_user)
):
    try:
        collection_user = database["user"]
        collection_profiledata = database["profile-data"]

        user_follower = await collection_profiledata.find_one({
            "userId": ObjectId(user_to_follow)
        })

        if not user_follower:
            raise HTTPException(status_code=404, detail="User profile not found")

        result = await collection_profiledata.update_one(
            {"userId": ObjectId(user_to_follow)},
            {
                "$addToSet": {"followers": ObjectId(user_id)}
            }
        )

        user_by = await collection_user.find_one({
            "_id": ObjectId(user_id)
        })

        user_to = await collection_user.find_one({
            "_id": ObjectId(user_to_follow)
        })

        if result.modified_count > 0:
            await collection_profiledata.update_one(
                {"userId": ObjectId(user_id)},
                {
                    "$addToSet": {"following": ObjectId(user_to_follow)}
                }
            )
            return {"message": f"{user_by["userId"]} followed {user_to["userId"]}"}
        else:
            await collection_profiledata.update_one(
                {"userId": ObjectId(user_to_follow)},
                {
                    "$pull": {"followers": ObjectId(user_id)}
                }
            )

            await collection_profiledata.update_one(
                {"userId": ObjectId(user_id)},
                {
                    "$pull": {"following": ObjectId(user_to_follow)}
                }
            )
            return {"message": f"{user_by["userId"]} unfollowed {user_to["userId"]}"}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error:{e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@app.get("/search")
async def search_profile(
    searched: str,
    user_id: str = Depends(get_current_user)
):
    pass