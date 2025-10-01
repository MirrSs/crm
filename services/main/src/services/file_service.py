from services.s3_service import S3Service
from fastapi import status
from settings import S3_PRODUCTS_BUCKET_NAME
from utils import generate_hash
import os


class FileService:
    pass
    # @classmethod
    # async def update_product_image(cls, product: ProductSchema, file) -> str:
    #     filename, file_extension = os.path.splitext(file.filename)
    #     value = await generate_hash(f"product_{filename}")
    #     new_filename = f"{product.id}_{value}{file_extension}"
    #     await S3Service.upload_file(file, S3_PRODUCTS_BUCKET_NAME, new_filename)
    #     return new_filename
