import os
from pathlib import Path
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
        self.resolve_origins()
        self.resolve_auth()
        self.database_url = f"sqlite:///{self.data_dir}/app.db"

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

    def resolve_auth(self) -> None:
        password = os.environ.get("CONTROLLER_PASSWORD")
        if not password:
            raise KeyError("CONTROLLER_PASSWORD is not set in .env")
        self.controller_password = password


settings = Settings()
