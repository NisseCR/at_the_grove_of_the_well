from pathlib import Path


IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


class ImageService:
    """Service for managing image assets on disk."""

    def __init__(self, image_dir: Path) -> None:
        self.image_dir = image_dir

    async def upload_image(self, filename: str, content: bytes) -> str:
        """Save an uploaded image file and return its src path."""
        suffix = Path(filename).suffix.lower()
        if suffix not in IMAGE_EXTENSIONS:
            raise ValueError(f"Unsupported image format: {suffix}")

        self.image_dir.mkdir(parents=True, exist_ok=True)
        (self.image_dir / filename).write_bytes(content)
        return f"assets/images/{filename}"
