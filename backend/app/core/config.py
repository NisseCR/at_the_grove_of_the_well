import os
from pathlib import Path
import logging
from dotenv import load_dotenv


class Settings:
    """
    Configuration for application settings, including directory specification.
    """

    def __init__(self) -> None:
        # Basic settings.
        self.base_dir = Path(__file__).resolve().parents[2]
        self.app_name = "Paracosm"

        self.static_dir = self.base_dir / "static"
        self.data_dir = self.base_dir / "data"

        self.resolve_assets_directory()

    def resolve_assets_directory(self) -> None:
        # Resolve assets directory from .env.
        env_assets_dir = os.environ.get("ASSETS_DIR")
        if env_assets_dir:
            self.assets_dir = Path(env_assets_dir).resolve()
            logging.info(f"Using extern assets directory: {self.assets_dir}")
        else:
            raise KeyError("Could not resolve the assets directory from .env")

        # Resolve top-level asset directories.
        self.audio_dir = self.assets_dir / "audio"
        self.images_dir = self.assets_dir / "images"
        self.video_dir = self.assets_dir / "video"


# Initialise .env and settings.
load_dotenv()
settings = Settings()
