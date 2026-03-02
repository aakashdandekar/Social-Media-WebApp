from pydantic import BaseModel, EmailStr

class Post(BaseModel):
    fileID: str
    userId: str
    url: str
    filetype: str
    caption: str
    created_at: str

class Login(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    userId: str
    email: EmailStr
    password: str
    created_at: str