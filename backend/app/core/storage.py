"""Cloudflare R2 storage client using the S3-compatible API."""

import boto3
from botocore.exceptions import ClientError

from app.core.config import settings


def _make_client():
    """Build a boto3 S3 client pointed at the Cloudflare R2 endpoint."""
    if not all([settings.r2_account_id, settings.r2_access_key, settings.r2_secret_key, settings.r2_bucket]):
        raise RuntimeError(
            "R2 credentials are not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY, "
            "R2_SECRET_KEY, and R2_BUCKET in .env."
        )
    return boto3.client(
        "s3",
        endpoint_url=f"https://{settings.r2_account_id}.r2.cloudflarestorage.com",
        aws_access_key_id=settings.r2_access_key,
        aws_secret_access_key=settings.r2_secret_key,
        region_name="auto",
    )


class R2Storage:
    """Thin wrapper around boto3 for Cloudflare R2 object storage."""

    def __init__(self):
        self._client = None

    @property
    def client(self):
        """Lazily initialise the boto3 client on first use."""
        if self._client is None:
            self._client = _make_client()
        return self._client

    def upload(self, key: str, data: bytes, content_type: str) -> None:
        """Upload bytes to R2 under the given key."""
        self.client.put_object(
            Bucket=settings.r2_bucket,
            Key=key,
            Body=data,
            ContentType=content_type,
        )

    def delete(self, key: str) -> None:
        """Delete an object from R2. No-op if the key does not exist."""
        self.client.delete_object(Bucket=settings.r2_bucket, Key=key)

    def list_keys(self) -> list[str]:
        """Return every object key in the bucket, handling pagination."""
        keys: list[str] = []
        paginator = self.client.get_paginator("list_objects_v2")
        for page in paginator.paginate(Bucket=settings.r2_bucket):
            for obj in page.get("Contents", []):
                keys.append(obj["Key"])
        return keys


r2 = R2Storage()
