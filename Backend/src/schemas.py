from pydantic import BaseModel, EmailStr

class Profile(BaseModel):
    userId: str
    bio: str
    followers: set
    following: set

class Post(BaseModel):
    fileID: str
    userId: str
    url: str
    filetype: str
    caption: str
    likes: int
    liked_by: set
    comments: dict
    created_at: str

class Login(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    userId: str
    email: EmailStr
    password: str
    created_at: str