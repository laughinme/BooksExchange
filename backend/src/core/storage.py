import asyncio
import mimetypes
import shutil
from pathlib import Path
from typing import Optional

import aiofiles
import boto3
from botocore.config import Config

from core.config import Settings


settings = Settings()  # type: ignore


class MediaStorage:
    def __init__(self) -> None:
        self._s3_enabled = all(
            [
            settings.S3_ENDPOINT_URL,
            settings.S3_ACCESS_KEY_ID,
            settings.S3_SECRET_ACCESS_KEY,
            settings.S3_BUCKET,
            ]
        )
        self._s3_client = None

    @property
    def s3_enabled(self) -> bool:
        return self._s3_enabled

    def _client(self):
        if self._s3_client is None:
            self._s3_client = boto3.client(
                "s3",
                endpoint_url=settings.S3_ENDPOINT_URL,
                aws_access_key_id=settings.S3_ACCESS_KEY_ID,
                aws_secret_access_key=settings.S3_SECRET_ACCESS_KEY,
                region_name=settings.S3_REGION,
                config=Config(s3={"addressing_style": settings.S3_ADDRESSING_STYLE}),
            )
        return self._s3_client

    def _public_base_url(self) -> str:
        if self._s3_enabled:
            if settings.S3_PUBLIC_URL:
                return settings.S3_PUBLIC_URL.rstrip("/")
            endpoint = (settings.S3_ENDPOINT_URL or "").rstrip("/")
            bucket = settings.S3_BUCKET or ""
            return f"{endpoint}/{bucket}"
        site = settings.SITE_URL.rstrip("/")
        media = settings.MEDIA_DIR.strip("/")
        if site:
            return f"{site}/{media}"
        return f"/{media}"

    async def clear_prefix(self, prefix: str) -> None:
        if self._s3_enabled:
            # Best-effort cleanup can be added later; keep noop for now.
            return
        path = Path(settings.MEDIA_DIR) / prefix

        def _clear() -> None:
            if path.exists():
                shutil.rmtree(path)

        await asyncio.to_thread(_clear)

    async def upload_bytes(
        self,
        key: str,
        data: bytes,
        content_type: Optional[str] = None,
    ) -> str:
        if self._s3_enabled:
            def _put() -> None:
                extra = {}
                if content_type:
                    extra["ContentType"] = content_type
                self._client().put_object(
                    Bucket=settings.S3_BUCKET,
                    Key=key,
                    Body=data,
                    **extra,
                )

            await asyncio.to_thread(_put)
        else:
            path = Path(settings.MEDIA_DIR) / key
            path.parent.mkdir(parents=True, exist_ok=True)
            async with aiofiles.open(path, "wb") as out:
                await out.write(data)

        return f"{self._public_base_url()}/{key}"

    async def upload_uploadfile(self, key: str, file) -> str:
        data = await file.read()
        await file.seek(0)
        return await self.upload_bytes(key, data, file.content_type)

    async def upload_file_path(self, key: str, path: Path) -> str:
        content_type, _ = mimetypes.guess_type(path.name)
        if content_type is None:
            content_type = "application/octet-stream"
        data = await asyncio.to_thread(path.read_bytes)
        return await self.upload_bytes(key, data, content_type)
