from pathlib import Path, PurePath
import boto3
import os
import io
from urllib.parse import urlparse
from typing import List
from .logging import logger

# Get credentials
# Note: boto3 will check env for credentials
# access_key = os.environ['AWS_ACCESS_KEY_ID'] if "AWS_ACCESS_KEY_ID" in os.environ else ""
# secret_key = os.environ['AWS_SECRET_ACCESS_KEY'] if "AWS_SECRET_ACCESS_KEY" in os.environ else ""
region_name = os.environ['AWS_REGION_NAME'] if "AWS_REGION_NAME" in os.environ else "ap-southeast-1"


class MyS3:
    def __init__(self, s3_uri) -> None:
        self.session = boto3.Session(region_name=region_name)
        self.client = self.session.client('s3')
        self.s3_uri = s3_uri
        parsed = urlparse(s3_uri)
        self.bucket_name = parsed.netloc
        base_prefix = parsed.path.strip("/")
        if len(base_prefix) > 0:
            base_prefix = base_prefix + "/"
        self.base_prefix = base_prefix
        # do a check to make sure has access
        self.list_object_keys(self.base_prefix, 1)

    def check_s3_object_exists(self, object_key):
        """Check if an S3 object exists.

        Args:
            object_key (str): Key of the object to check in the S3 bucket.

        Returns:
            bool: True if the object exists, False otherwise.
        """
        try:
            self.client.head_object(Bucket=self.bucket_name, Key=object_key)
            return True  # The object does exist
        except:
            return False

    def check_s3_prefix_exists(self, prefix: str):
        # Ensure the folder prefix ends with a slash
        if not prefix.endswith('/'):
            prefix += '/'

        response = self.client.list_objects_v2(Bucket=self.bucket_name, Prefix=prefix, MaxKeys=1)
        # Check if there are any contents in the response
        if 'Contents' in response:
            return True
        else:
            return False

    def list_object_keys(self, prefix: str, maxKey: int = 1000) -> List[str]:
        """Retrieves list of object keys

        Args:
            prefix (str): Limits the response to keys that begin with the specified prefix, For directory buckets, only prefixes that end in a delimiter ( /) are supported
            maxKey (int, optional): Sets the maximum number of keys returned in the response. Defaults to 1000.

        Returns:
            List[str]: List of object keys
        """
        response = self.client.list_objects_v2(
            Bucket=self.bucket_name,
            MaxKeys=maxKey,
            Prefix=prefix
        )
        if "Contents" not in response:
            return []
        else:
            return [obj['Key'] for obj in response["Contents"]]

    def upload_file(self, filepath: str, key: str):
        """Upload a file to an S3 object.

        Args:
            filepath (str): the path to the file to upload
            key (str): the name of the key to upload to
        """
        self.client.upload_file(
            Filename=filepath, Bucket=self.bucket_name, Key=key)
        logger.debug(f"Uploading file {filepath} to key {key}")

    def download_file(self, filepath: str, key: str):
        """Download an S3 object to a file.

        Args:
            filepath (str): the path to the file to upload
            key (str): the name of the key to upload to
        """
        self.client.download_file(
            Bucket=self.bucket_name, Key=key, Filename=filepath)

    def put_object(self, key: str, body: bytes | str | io.BytesIO):
        """Adds an object to a bucket.

        Args:
            key (str): Object key for which the PUT action was initiated
            body (str): Object data
        """
        if isinstance(body, str):
            body = body.encode("utf-8")
        elif isinstance(body, io.BytesIO):
            body.seek(0)
        self.client.put_object(
            Body=body,
            Bucket=self.bucket_name,
            Key=key
        )

    def get_object(self, key: str) -> bytes:
        """Retrieves an object from S3.

        Args:
            key (str): Key of the object to get
        """
        resp = self.client.get_object(
            Bucket=self.bucket_name,
            Key=key
        )
        return resp['Body'].read()

    def copy_object(self, sourceKey: str, targetKey: str):
        """Copy object from source to target

        Args:
            sourceKey (str): Key of source object
            targetKey (str): Key of target object

        Returns:
            Response of copy
        """
        # source in format {bucket}/{key}
        # copySource = f"s3://{self.bucket_name}/{sourceKey}"
        copySource = {
            "Bucket": self.bucket_name,
            "Key": sourceKey,
        }
        logger.debug(f"copySource: {copySource}, key: {targetKey}")
        resp = self.client.copy_object(
            Bucket=self.bucket_name,
            CopySource=copySource,
            Key=targetKey,
        )
        return resp

    def delete_object(self, key: str) -> bytes:
        """Delete an object from S3.

        Args:
            key (str): Key of the object to get
        """
        resp = self.client.delete_object(
            Bucket=self.bucket_name,
            Key=key
        )
        return resp

    def upload_directory_to_s3(self, source_directory: Path, prefix: str):
        """Upload all files under directory to S3

        Args:
            source_directory (Path): Path to directory to upload
            prefix (str): target S3 prefix
        """
        for file_path in source_directory.rglob('**/*'):  # Recursively go through all files
            if file_path.is_file():  # Only process files
                relative_path = file_path.relative_to(source_directory)
                s3_key = PurePath(prefix).joinpath(relative_path)
                self.upload_file(str(file_path), str(s3_key))

    def delete_objects_under_prefix(self, prefix: str):
        # List all objects under the specified prefix
        response = self.client.list_objects_v2(Bucket=self.bucket_name, Prefix=prefix)

        # Check if the response contains objects
        if 'Contents' in response:
            while response['KeyCount'] > 0:
                # List of object keys to delete
                objects_to_delete = [{'Key': obj['Key']} for obj in response['Contents']]

                # Delete the objects
                delete_response = self.client.delete_objects(
                    Bucket=self.bucket_name,
                    Delete={
                        'Objects': objects_to_delete
                    }
                )

                logger.debug(f"Deleted {len(delete_response.get('Deleted', []))} objects.")

                # Check for more objects in the next batch
                if response.get('IsTruncated'):
                    continuation_token = response['NextContinuationToken']
                    response = self.client.list_objects_v2(
                        Bucket=self.bucket_name, Prefix=prefix, ContinuationToken=continuation_token)
                else:
                    break
