import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()


class Settings:
    """Application settings loaded from environment variables."""

    def __init__(self) -> None:
        self.base_dir = Path(__file__).resolve().parents[2]
        self.app_name = "Paracosm"
        self.scenes_dir = self.base_dir / "data" / "scenes"
        self._resolve_origins()
        self._resolve_auth()
        self._resolve_r2()

    def _resolve_origins(self) -> None:
        raw = os.environ.get("ALLOWED_ORIGINS", "")
        self.allowed_origins = [o.strip() for o in raw.split(",") if o.strip()]

    def _resolve_auth(self) -> None:
        password = os.environ.get("CONTROLLER_PASSWORD")
        if not password:
            raise KeyError("CONTROLLER_PASSWORD is not set in .env")
        self.controller_password = password

    def _resolve_r2(self) -> None:
        self.r2_account_id = os.environ.get("R2_ACCOUNT_ID", "")
        self.r2_access_key = os.environ.get("R2_ACCESS_KEY", "")
        self.r2_secret_key = os.environ.get("R2_SECRET_KEY", "")
        self.r2_bucket = os.environ.get("R2_BUCKET", "")


settings = Settings()
