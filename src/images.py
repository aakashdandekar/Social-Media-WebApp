import os
from dotenv import load_dotenv
from imagekitio import ImageKit

load_dotenv()

#ImageKit Config
imagekit = ImageKit(
    public_key=os.getenv("IMAGEKIT_PUBLIC_KEY"),
    private_key=os.getenv("IMAGEKIT_PRIVATE_KEY"),
    url_endpoint=os.getenv("IMAGEKIT_URL")
)