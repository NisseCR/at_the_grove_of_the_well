import os
from pathlib import Path
import logging
from dotenv import load_dotenv

load_dotenv()


class Settings:
    """
    Configuration for application settings, including directory specification.
    """

    def __init__(self) -> None:
        self.base_dir = Path(__file__).resolve().parents[2]
        self.app_name = "Paracosm"

        self.resolve_data_directory()
        self.resolve_assets_directory()
        self.resolve_origins()

    def resolve_assets_directory(self) -> None:
        # Resolve assets directory from .env.
        env_assets_dir = os.environ.get("ASSETS_DIR")
        if env_assets_dir:
            self.assets_dir = Path(env_assets_dir).resolve()
            logging.info(f"Using extern assets directory: {self.assets_dir}")
        else:
            raise KeyError("Could not resolve the assets directory from .env")

        # Resolve top-level asset directories.
        self.audio_assets_dir = self.assets_dir / "audio"
        self.image_assets_dir = self.assets_dir / "images"
        self.video_assets_dir = self.assets_dir / "video"
        self.ambience_audio_dir = self.audio_assets_dir / "ambience"
        # TODO add music to audio assets.

    def resolve_data_directory(self) -> None:
        self.data_dir = self.base_dir / "data"

        # Resolve entities.
        self.entities_dir = self.data_dir / "entities"
        self.scene_data_dir = self.entities_dir / "scenes"
        self.music_data_dir = self.entities_dir / "music"
        self.ambience_data_dir = self.entities_dir / "ambiences"

        # Resolve categories.
        self.categories_dir = self.data_dir / "categories"
        self.scene_categories_dir = self.categories_dir / "scenes"
        self.music_categories_dir = self.categories_dir / "music"
        self.ambience_categories_dir = self.categories_dir / "ambiences"

    def resolve_origins(self) -> None:
        raw = os.environ.get("ALLOWED_ORIGINS", "")
        self.allowed_origins = [o.strip() for o in raw.split(",") if o.strip()]


settings = Settings()
