"""Music routes: playlist categories, list, and single playlist."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.database import get_session
from app.models.playlist import Playlist, PlaylistCategory, PlaylistTrack
from app.schemas import MusicTrackOut, PlaylistCategoryEntryOut, PlaylistCategoryOut, PlaylistOut

router = APIRouter(prefix="/music")


def _playlist_load_options():
    """Eager-load options for a fully populated PlaylistOut."""
    return [
        selectinload(Playlist.cover),
        selectinload(Playlist.tracks).selectinload(PlaylistTrack.audio_asset),
    ]


def _build_playlist(playlist: Playlist) -> PlaylistOut:
    """Build a PlaylistOut from an already-loaded Playlist."""
    return PlaylistOut(
        id=str(playlist.id),
        slug=playlist.slug,
        label=playlist.label,
        volume=playlist.volume,
        src=playlist.cover.src if playlist.cover else "",
        thumb_src=playlist.cover.thumb_src if playlist.cover else None,
        tracks=[MusicTrackOut(id=str(t.audio_asset.id), src=t.audio_asset.src) for t in playlist.tracks],
    )


@router.get("/playlist/categories")
def get_playlist_categories(session: Session = Depends(get_session)) -> list[PlaylistCategoryOut]:
    """Return all playlist categories sorted by display order."""
    categories = session.scalars(
        select(PlaylistCategory)
        .options(selectinload(PlaylistCategory.playlists))
        .order_by(PlaylistCategory.display_order)
    ).all()

    return [
        PlaylistCategoryOut(
            id=str(cat.id),
            label=cat.label,
            order=cat.display_order,
            playlists=[PlaylistCategoryEntryOut(id=str(p.id), label=p.label) for p in cat.playlists],
        )
        for cat in categories
    ]


@router.get("/playlist")
def get_playlists(session: Session = Depends(get_session)) -> list[PlaylistOut]:
    """Return all playlists with their covers and tracks."""
    playlists = session.scalars(
        select(Playlist)
        .options(*_playlist_load_options())
        .order_by(Playlist.label)
    ).all()
    return [_build_playlist(p) for p in playlists]


@router.get("/playlist/{playlist_id}")
def get_playlist(playlist_id: UUID, session: Session = Depends(get_session)) -> PlaylistOut:
    """Return a single playlist by UUID."""
    playlist = session.get(Playlist, playlist_id, options=_playlist_load_options())
    if not playlist:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Playlist {playlist_id} not found")
    return _build_playlist(playlist)
