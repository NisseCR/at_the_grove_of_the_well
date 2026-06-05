"""Music / playlist routes — GET only, served from in-memory state."""

from fastapi import APIRouter, HTTPException, status

from app import state
from app.schemas import PlaylistCategoryOut, PlaylistOut

router = APIRouter(prefix="/music")


@router.get("/playlist/categories")
def get_playlist_categories() -> list[PlaylistCategoryOut]:
    """Return all playlist categories sorted by display order."""
    return state.data.playlist_categories


@router.get("/playlist")
def get_playlists() -> list[PlaylistOut]:
    """Return all playlists with their covers and tracks."""
    return state.data.playlists


@router.get("/playlist/{playlist_id}")
def get_playlist(playlist_id: str) -> PlaylistOut:
    """Return a single playlist by its slug ID."""
    for pl in state.data.playlists:
        if pl.id == playlist_id:
            return pl
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Playlist '{playlist_id}' not found",
    )
