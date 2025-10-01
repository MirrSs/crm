import os
from datetime import datetime
import hashlib


def check_user_image_extension(file_path: str):
    """Check file extension before putting it in db"""
    USER_IMAGE_ALLOWED_EXTENSIONS = (".jpg", ".png", ".jpeg")
    filename, file_extension = os.path.splitext(file_path)
    return file_extension in USER_IMAGE_ALLOWED_EXTENSIONS


async def generate_hash(data: str) -> str:
    data_with_datetime = data + str(datetime.now())
    hashed_data = hashlib.sha256(data_with_datetime.encode()).hexdigest()
    return hashed_data[:12]
