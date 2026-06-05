"""Video asset service."""

from uuid import UUID

from app.models.assets import VideoAsset
from app.services._base_asset_service import BaseAssetService, PreparedUpload
from app.services._media_utils import extract_duration
from app.services._video_processing import VideoProcessor


class VideoAssetService(BaseAssetService[VideoAsset]):
    """Manages video assets. Output is always WebM; a WebP thumbnail is generated from the first frame."""

    _model = VideoAsset
    _resource_name = "VideoAsset"

    def __init__(self) -> None:
        self._processor = VideoProcessor()

    def _preprocess(self, data: bytes) -> bytes:
        """Placeholder for future video preprocessing (e.g. transcode to WebM).

        Currently returns input unchanged.
        """
        return data

    def _keys(self, asset_id: UUID) -> list[str]:
        """Return the video and thumbnail R2 keys for this asset."""
        return [
            f"assets/video/{asset_id}.webm",
            f"assets/video/{asset_id}.thumb.webp",
        ]

    def _prepare(self, asset_id: UUID, data: bytes, **_) -> PreparedUpload:
        """Process video bytes, extract thumbnail and duration, and return files ready for upload."""
        processed = self._preprocess(data)
        src = f"assets/video/{asset_id}.webm"
        thumb_src = f"assets/video/{asset_id}.thumb.webp"

        duration = extract_duration(processed, ".webm")
        thumb = self._processor.extract_thumbnail(processed)

        files: dict[str, tuple[bytes, str]] = {src: (processed, "video/webm")}
        extra: dict = {"duration": duration, "thumb_src": None}

        if thumb:
            files[thumb_src] = (thumb, "image/webp")
            extra["thumb_src"] = thumb_src

        return PreparedUpload(files=files, src=src, extra=extra)


video_asset_service = VideoAssetService()
