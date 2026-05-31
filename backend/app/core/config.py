import os
from pathlib import Path
import logging
from dotenv import load_dotenv


class Settings:
    """
    Configuration for application settings, including directory specification.
    """

    def __init__(self) -> None:
        self.base_dir = Path(__file__).resolve().parents[2]
        self.app_name = "Paracosm"
        self.static_dir = self.base_dir / "static"

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

    def resolve_data_directory(self) -> None:
        self.data_dir = self.base_dir / "data"
        self.entities_dir = self.data_dir / "entities"
        self.scene_data_dir = self.entities_dir / "scenes"
        self.ambience_data_dir = self.entities_dir / "ambiences"
        self.categories_dir = self.data_dir / "categories"
        self.ambience_categories_dir = self.categories_dir / "ambiences"
        self.scene_categories_dir = self.categories_dir / "scenes"

    def resolve_origins(self) -> None:
        local_ip = os.environ.get("LOCAL_IP")
        self.allowed_origins = ["http://localhost:5173"]
        if local_ip:
            self.allowed_origins.append(f"http://{local_ip}:5173")


# Initialise .env and settings.
load_dotenv()
settings = Settings()
