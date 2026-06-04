"""Image asset service."""

from uuid import UUID

from app.models.assets import ImageAsset
from app.services._base_asset_service import BaseAssetService, PreparedUpload
from app.services._image_processing import ImageProcessor


class ImageAssetService(BaseAssetService[ImageAsset]):
    """Manages image assets: converts to WebP, caps at 1920px, generates a 400px thumbnail."""

    _model = ImageAsset
    _resource_name = "ImageAsset"

    def __init__(self) -> None:
        self._processor = ImageProcessor()

    def _keys(self, asset_id: UUID) -> list[str]:
        """Return the full-res and thumbnail R2 keys for this image."""
        return [
            f"assets/images/{asset_id}.webp",
            f"assets/images/{asset_id}.thumb.webp",
        ]

    def _prepare(self, asset_id: UUID, data: bytes) -> PreparedUpload:
        """Process image bytes and return both WebP files ready for upload."""
        full_res, thumb = self._processor.process(data)
        src = f"assets/images/{asset_id}.webp"
        thumb_src = f"assets/images/{asset_id}.thumb.webp"
        return PreparedUpload(
            files={
                src: (full_res, "image/webp"),
                thumb_src: (thumb, "image/webp"),
            },
            src=src,
            extra={"thumb_src": thumb_src},
        )


image_asset_service = ImageAssetService()
