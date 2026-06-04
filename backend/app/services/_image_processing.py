"""Image processing for asset uploads.

Converts images to WebP, resizes to a maximum of 1920px on the longest edge,
and generates a 400px thumbnail variant.
"""

import io

from PIL import Image

MAX_DIMENSION = 1920
THUMBNAIL_DIMENSION = 400
WEBP_QUALITY = 85


class ImageProcessor:
    """Converts images to WebP, caps the longest edge, and generates thumbnails."""

    def __init__(
        self,
        max_dimension: int = MAX_DIMENSION,
        thumbnail_dimension: int = THUMBNAIL_DIMENSION,
        quality: int = WEBP_QUALITY,
    ) -> None:
        self.max_dimension = max_dimension
        self.thumbnail_dimension = thumbnail_dimension
        self.quality = quality

    def _load(self, data: bytes) -> Image.Image:
        """Decode bytes and convert to RGB."""
        return Image.open(io.BytesIO(data)).convert("RGB")

    def _resize_to_max(self, image: Image.Image) -> Image.Image:
        """Resize so the longest edge does not exceed max_dimension. Preserves aspect ratio."""
        w, h = image.size
        longest = max(w, h)
        if longest <= self.max_dimension:
            return image
        scale = self.max_dimension / longest
        return image.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)

    def _resize_to_thumbnail(self, image: Image.Image) -> Image.Image:
        """Scale so the longest edge equals thumbnail_dimension. Preserves aspect ratio."""
        w, h = image.size
        longest = max(w, h)
        scale = self.thumbnail_dimension / longest
        return image.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)

    def _to_webp(self, image: Image.Image) -> bytes:
        """Encode an image as WebP bytes."""
        buf = io.BytesIO()
        image.save(buf, "WEBP", quality=self.quality)
        return buf.getvalue()

    def process(self, data: bytes) -> tuple[bytes, bytes]:
        """Process raw image bytes into (full_res_webp, thumbnail_webp)."""
        image = self._load(data)
        full_res = self._resize_to_max(image)
        thumbnail = self._resize_to_thumbnail(image)
        return self._to_webp(full_res), self._to_webp(thumbnail)
