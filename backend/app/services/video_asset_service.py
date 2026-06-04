"""Video asset service."""

from uuid import UUID

from app.models.assets import VideoAsset
from app.services._base_asset_service import BaseAssetService, PreparedUpload


class VideoAssetService(BaseAssetService[VideoAsset]):
    """Manages video assets. Output is always WebM."""

    _model = VideoAsset
    _resource_name = "VideoAsset"

    def _preprocess(self, data: bytes) -> bytes:
        """Placeholder for future video preprocessing (e.g. transcode to WebM).

        Currently returns input unchanged.
        """
        return data

    def _keys(self, asset_id: UUID) -> list[str]:
        """Return the R2 key for this video asset."""
        return [f"assets/video/{asset_id}.webm"]

    def _prepare(self, asset_id: UUID, data: bytes) -> PreparedUpload:
        """Preprocess video bytes and return the WebM file ready for upload."""
        processed = self._preprocess(data)
        src = f"assets/video/{asset_id}.webm"
        return PreparedUpload(files={src: (processed, "video/webm")}, src=src)


video_asset_service = VideoAssetService()
