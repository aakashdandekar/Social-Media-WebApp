# Social-Media-WebApp

A RESTful backend API for a social media platform built with **FastAPI**, **MongoDB**, and **ImageKit**. It supports user authentication, post uploads (images & videos), likes, comments, profiles, and follow/unfollow functionality.

---

## 🚀 Tech Stack

| Layer         | Technology                          |
|---------------|-------------------------------------|
| Framework     | FastAPI                             |
| Server        | Uvicorn                             |
| Database      | MongoDB (via Motor async driver)    |
| Auth          | JWT (python-jose) + bcrypt (passlib)|
| Media Storage | ImageKit                            |
| Validation    | Pydantic                            |
| Config        | python-dotenv                       |

---

## ✨ Features

- **Authentication** — Register and login with JWT-based access tokens (2-hour expiry)
- **Feed** — Randomized post feed (excludes your own posts)
- **Posts** — Upload image/video posts with captions via ImageKit CDN
- **Likes** — Toggle like/unlike on any post
- **Comments** — Add or delete comments on posts
- **Profiles** — Setup, update, and view public or private profiles with bio, followers, and following
- **Follow/Unfollow** — Follow or unfollow other users (toggle behavior)
- **Search** — Search for users by username

---

## 📁 Project Structure

```
Social-Media-WebApp/
├── main.py               # Entry point — starts Uvicorn server
├── requirements.txt      # Python dependencies
└── src/
    ├── app.py            # All API route definitions
    ├── auth.py           # Password hashing, JWT creation & verification
    ├── db.py             # MongoDB connection setup
    ├── images.py         # ImageKit client configuration
    └── schemas.py        # Pydantic models (User, Login, Post, Profile)
```

---

## ⚙️ Setup & Installation

### Prerequisites

- Python 3.10+
- MongoDB instance (local or Atlas)
- [ImageKit](https://imagekit.io/) account

### 1. Clone the repository

```bash
git clone https://github.com/aakashdandekar/Social-Media-WebApp.git
cd Social-Media-WebApp
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
MONGO_URL=your_mongodb_connection_string
DATABASE_NAME=your_database_name
SECRET_KEY=your_jwt_secret_key

IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
IMAGEKIT_URL=your_imagekit_url_endpoint
```

### 4. Run the server

```bash
python main.py
```

The API will be available at `http://localhost:8000`.

Interactive API docs (Swagger UI) are accessible at `http://localhost:8000/docs`.

---

## 🔌 API Endpoints

### Auth

| Method | Endpoint     | Description                          | Auth Required |
|--------|--------------|--------------------------------------|---------------|
| POST   | `/register`  | Register a new user, returns JWT     | ❌            |
| POST   | `/login`     | Login with email & password          | ❌            |

### Feed

| Method | Endpoint | Description                              | Auth Required |
|--------|----------|------------------------------------------|---------------|
| GET    | `/`      | Get a randomized feed (excludes own posts) | ✅          |

### Posts

| Method | Endpoint                      | Description                     | Auth Required |
|--------|-------------------------------|---------------------------------|---------------|
| POST   | `/upload`                     | Upload an image or video post   | ✅            |
| POST   | `/like/{post_id}`             | Toggle like/unlike on a post    | ✅            |
| POST   | `/add-comment/{post_id}`      | Add a comment to a post         | ✅            |
| DELETE | `/delete-comment/{post_id}`   | Delete your comment on a post   | ✅            |
| DELETE | `/post/{post_id}`             | Delete your own post            | ✅            |

### Profiles

| Method | Endpoint                    | Description                         | Auth Required |
|--------|-----------------------------|-------------------------------------|---------------|
| POST   | `/setup-profile/{user_id}`  | Create profile with bio             | ✅            |
| POST   | `/update-profile/{user_id}` | Update profile bio                  | ✅            |
| GET    | `/profile`                  | Get your own profile + posts        | ✅            |
| GET    | `/profile/{username}`       | View a public profile by username   | ❌            |
| POST   | `/follow/{user_to_follow}`  | Toggle follow/unfollow a user       | ✅            |
| GET    | `/search?searched={query}`  | Search for a user by username       | ✅            |

---

## 🗄️ Database Collections

| Collection     | Description                                      |
|----------------|--------------------------------------------------|
| `user`         | Stores user credentials (userId, email, hashed password) |
| `post`         | Stores posts (file URL, caption, likes, comments) |
| `profile-data` | Stores profile bio, followers, and following lists |

---

## 🔒 Authentication

All protected routes require a Bearer token in the `Authorization` header:

```
Authorization: Bearer <your_access_token>
```

Tokens are signed JWTs with a 2-hour expiry, generated on register and login.

---

## 🌐 CORS

CORS middleware is present in the code but currently commented out. To enable it for a frontend running at `http://localhost:5173`, uncomment the `app.add_middleware(...)` block in `src/app.py`.

---

## 📄 License

This project is licensed under the terms of the [LICENSE](./LICENSE) file.
