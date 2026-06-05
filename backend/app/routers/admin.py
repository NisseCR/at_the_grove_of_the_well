"""Admin routes — manual R2 sync trigger."""

import logging

from fastapi import APIRouter, HTTPException, status

from app import state
from app.core.config import settings
from app.schemas import SyncResultOut
from app.services.scanner import scan

router = APIRouter(prefix="/admin")

logger = logging.getLogger(__name__)


@router.post("/sync")
def sync() -> SyncResultOut:
    """Re-scan R2 and local scene configs, rebuild in-memory data."""
    try:
        new_data = scan(settings.scenes_dir)
    except Exception as exc:
        logger.error("Sync failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Sync failed: {exc}",
        )

    state.data = new_data

    return SyncResultOut(
        last_synced=new_data.last_synced or "",
        ambience_categories=len(new_data.ambience_categories),
        ambiences=len(new_data.ambiences),
        playlist_categories=len(new_data.playlist_categories),
        playlists=len(new_data.playlists),
        scene_categories=len(new_data.scene_categories),
        scenes=len(new_data.scenes),
    )
