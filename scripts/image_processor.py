"""Image processing utilities for asset preprocessing."""

from pathlib import Path

from PIL import Image

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".tiff", ".bmp"}

MAX_DIMENSION = 1920
THUMBNAIL_DIMENSION = 400
WEBP_QUALITY = 85


class ImageProcessor:
    """Converts images to WebP, resizes to a maximum dimension, and generates thumbnails."""

    def __init__(
        self,
        max_dimension: int = MAX_DIMENSION,
        thumbnail_dimension: int = THUMBNAIL_DIMENSION,
        quality: int = WEBP_QUALITY,
    ) -> None:
        self.max_dimension = max_dimension
        self.thumbnail_dimension = thumbnail_dimension
        self.quality = quality

    def load(self, path: Path) -> Image.Image:
        """Load an image from disk and convert to RGB."""
        return Image.open(path).convert("RGB")

    def resize_to_max(self, image: Image.Image) -> Image.Image:
        """Resize image so the longest edge does not exceed max_dimension.

        Returns the original image unchanged if it is already within bounds.
        Aspect ratio is preserved.
        """
        w, h = image.size
        longest = max(w, h)
        if longest <= self.max_dimension:
            return image
        scale = self.max_dimension / longest
        return image.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)

    def resize_to_thumbnail(self, image: Image.Image) -> Image.Image:
        """Scale image so the longest edge equals thumbnail_dimension.

        Aspect ratio is preserved.
        """
        w, h = image.size
        longest = max(w, h)
        scale = self.thumbnail_dimension / longest
        return image.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)

    def save_webp(self, image: Image.Image, path: Path) -> None:
        """Save an image as WebP at the configured quality level."""
        path.parent.mkdir(parents=True, exist_ok=True)
        image.save(path, "WEBP", quality=self.quality)

    def process(self, input_path: Path, output_dir: Path) -> tuple[Path, Path]:
        """Process a single image file.

        Produces a full-resolution WebP (longest edge capped at max_dimension)
        and a thumbnail WebP (longest edge capped at thumbnail_dimension).

        Returns a tuple of (full_res_path, thumbnail_path).
        """
        image = self.load(input_path)
        stem = input_path.stem

        full_res = self.resize_to_max(image)
        full_path = output_dir / f"{stem}.webp"
        self.save_webp(full_res, full_path)

        thumbnail = self.resize_to_thumbnail(image)
        thumb_path = output_dir / f"{stem}.thumb.webp"
        self.save_webp(thumbnail, thumb_path)

        return full_path, thumb_path
