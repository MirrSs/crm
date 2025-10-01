# from botocore.exceptions import ClientError
from fastapi import status, HTTPException
import asyncio
import aioboto3
from loguru import logger
from utils import check_user_image_extension
from settings import S3_PRODUCTS_BUCKET_NAME, S3_URL, S3_ACCESS_KEY, S3_SECRET_KEY


class S3Service:

    session = aioboto3.Session()

    @classmethod
    async def create_bucket(cls):
        async with cls.session.client(
            "s3",
            endpoint_url=S3_URL,
            aws_access_key_id=S3_ACCESS_KEY,
            aws_secret_access_key=S3_SECRET_KEY,
            use_ssl=False,
        ) as s3:
            retries = 5
            for i in range(retries):
                try:
                    await s3.head_bucket(Bucket=S3_PRODUCTS_BUCKET_NAME)
                except Exception as e:
                    logger.error(f"S3Error. {e}")
                    # if e.response["Error"]["Code"] == "404":
                    #     await s3.create_bucket(Bucket=S3_PRODUCTS_BUCKET_NAME)
                    #     return
                    # elif e.response["Error"]["Code"] == "403":
                    #     raise HTTPException(status_code=403, detail="Access denied")
                    #     pass
                    # else:
                    #     if i < retries - 1:
                    #         await asyncio.sleep(2**i)
                    #     else:
                    #         raise HTTPException(
                    #             status_code=500, detail="Unable to connect to Minio"
                    #         )

    # @classmethod
    # def get_all_s3_buckets(cls) -> list:
    #     """Return all existing AWS S3 buckets"""
    #     response = cls.client.list_buckets()
    #     response_list = []
    #     for bucket in response["Buckets"]:
    #         response_list.append(f'{bucket["Name"]}')
    #     return response_list

    @classmethod
    async def upload_file(cls, file, bucket: str, object_name: str = None) -> dict:
        """Upload a file to an S3 bucket

        :param file: File to upload
        :param bucket: Defines bucket name
        :param object_name: S3 object name. If not specified then file_name is used
        :return: True if file was uploaded, else False
        """
        async with cls.session.client(
            "s3",
            endpoint_url=S3_URL,
            aws_access_key_id=S3_ACCESS_KEY,
            aws_secret_access_key=S3_SECRET_KEY,
            use_ssl=False,
        ) as s3:
            try:
                content = await file.read()
                await s3.put_object(Bucket=bucket, Key=object_name, Body=content)
            except ClientError as e:
                raise HTTPException(status_code=400, detail=str(e))

        return {"filename": file.filename}

    @classmethod
    async def create_presigned_url(
        cls, object_name: str, bucket: str, expiration=3600
    ) -> str:
        """Generate a presigned URL to share an S3 object

        :param object_name: string
        :param bucket: Defines bucket name
        :param expiration: Time in seconds for the presigned URL to remain valid
        :return: Presigned URL as string. If error, returns None.
        """
        if object_name:
            async with cls.session.client(
                "s3",
                endpoint_url=S3_URL,
                aws_access_key_id=S3_ACCESS_KEY,
                aws_secret_access_key=S3_SECRET_KEY,
                use_ssl=False,
            ) as s3:
                try:
                    url = await s3.generate_presigned_url(
                        "get_object",
                        Params={"Bucket": bucket, "Key": object_name},
                        ExpiresIn=3600,  # URL будет действителен в течение 1 часа
                    )
                except ClientError as e:
                    raise HTTPException(status_code=400, detail=str(e))

                return url
        else:
            return ''
