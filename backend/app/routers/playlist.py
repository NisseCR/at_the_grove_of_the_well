"""Playlist routes: full CRUD for playlists, tracks, and categories."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.database import get_session
from app.models.assets import AudioAsset, ImageAsset
from app.models.playlist import Playlist, PlaylistCategory, PlaylistCategoryLink, PlaylistTrack
from app.schemas import (
    PlaylistCategoryCreateIn,
    PlaylistCategoryEntryOut,
    PlaylistCategoryOut,
    PlaylistCategoryPatchIn,
    PlaylistCreateIn,
    PlaylistEditorOut,
    PlaylistPatchIn,
    PlaylistTrackEditorOut,
)

router = APIRouter(prefix="/playlist")


# ---------------------------------------------------------------------------
# Serialisers
# ---------------------------------------------------------------------------


def _playlist_editor_out(p: Playlist) -> PlaylistEditorOut:
    """Serialize a Playlist entity to its editor response schema."""
    return PlaylistEditorOut(
        id=str(p.id),
        slug=p.slug,
        label=p.label,
        volume=p.volume,
        src=p.cover.src if p.cover else "",
        thumb_src=p.cover.thumb_src if p.cover else None,
        cover_id=str(p.cover_id) if p.cover_id else None,
        tracks=[
            PlaylistTrackEditorOut(
                audio_asset_id=str(t.audio_asset_id),
                label=t.audio_asset.label,
                src=t.audio_asset.src,
            )
            for t in p.tracks
        ],
    )


def _category_out(cat: PlaylistCategory) -> PlaylistCategoryOut:
    """Serialize a PlaylistCategory entity to its response schema."""
    return PlaylistCategoryOut(
        id=str(cat.id),
        label=cat.label,
        order=cat.display_order,
        playlists=[PlaylistCategoryEntryOut(id=str(p.id), label=p.label) for p in cat.playlists],
    )


def _playlist_load_options():
    """Eager-load options for a fully populated PlaylistEditorOut."""
    return [
        selectinload(Playlist.cover),
        selectinload(Playlist.tracks).selectinload(PlaylistTrack.audio_asset),
    ]


def _category_load_options():
    """Eager-load options for a fully populated PlaylistCategoryOut."""
    return [selectinload(PlaylistCategory.playlists)]


# ---------------------------------------------------------------------------
# Category routes — declared before /{playlist_id} to avoid path conflicts
# ---------------------------------------------------------------------------


@router.get("/categories")
def get_categories(session: Session = Depends(get_session)) -> list[PlaylistCategoryOut]:
    """Return all playlist categories sorted by display order."""
    cats = session.scalars(
        select(PlaylistCategory)
        .options(*_category_load_options())
        .order_by(PlaylistCategory.display_order)
    ).all()
    return [_category_out(cat) for cat in cats]


@router.post("/categories")
def create_category(
    body: PlaylistCategoryCreateIn,
    session: Session = Depends(get_session),
) -> PlaylistCategoryOut:
    """Create a new playlist category."""
    cat = PlaylistCategory(label=body.label, display_order=body.display_order)
    session.add(cat)
    session.commit()
    session.refresh(cat)
    session.refresh(cat, ["playlists"])
    return _category_out(cat)


@router.patch("/categories/{category_id}")
def patch_category(
    category_id: UUID,
    body: PlaylistCategoryPatchIn,
    session: Session = Depends(get_session),
) -> PlaylistCategoryOut:
    """Update label or display_order on a category."""
    cat = session.get(PlaylistCategory, category_id, options=_category_load_options())
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Category {category_id} not found")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(cat, field, value)

    session.commit()
    session.refresh(cat)
    return _category_out(cat)


@router.delete("/categories/{category_id}", status_code=204)
def delete_category(category_id: UUID, session: Session = Depends(get_session)) -> None:
    """Delete a playlist category. Linked playlists are not deleted."""
    cat = session.get(PlaylistCategory, category_id)
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Category {category_id} not found")
    session.delete(cat)
    session.commit()


@router.post("/categories/{category_id}/playlists/{playlist_id}", status_code=204)
def add_playlist_to_category(
    category_id: UUID,
    playlist_id: UUID,
    session: Session = Depends(get_session),
) -> None:
    """Add a playlist to a category. No-ops if already linked."""
    if not session.get(PlaylistCategory, category_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Category {category_id} not found")
    if not session.get(Playlist, playlist_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Playlist {playlist_id} not found")

    existing = session.get(PlaylistCategoryLink, (category_id, playlist_id))
    if not existing:
        session.add(PlaylistCategoryLink(category_id=category_id, playlist_id=playlist_id))
        session.commit()


@router.delete("/categories/{category_id}/playlists/{playlist_id}", status_code=204)
def remove_playlist_from_category(
    category_id: UUID,
    playlist_id: UUID,
    session: Session = Depends(get_session),
) -> None:
    """Remove a playlist from a category."""
    link = session.get(PlaylistCategoryLink, (category_id, playlist_id))
    if link:
        session.delete(link)
        session.commit()


# ---------------------------------------------------------------------------
# Playlist reads
# ---------------------------------------------------------------------------


@router.get("")
def get_playlists(session: Session = Depends(get_session)) -> list[PlaylistEditorOut]:
    """Return all playlists with their cover and tracks."""
    playlists = session.scalars(
        select(Playlist).options(*_playlist_load_options()).order_by(Playlist.label)
    ).all()
    return [_playlist_editor_out(p) for p in playlists]


@router.get("/{playlist_id}")
def get_playlist(playlist_id: UUID, session: Session = Depends(get_session)) -> PlaylistEditorOut:
    """Return a single playlist by UUID."""
    playlist = session.get(Playlist, playlist_id, options=_playlist_load_options())
    if not playlist:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Playlist {playlist_id} not found")
    return _playlist_editor_out(playlist)


# ---------------------------------------------------------------------------
# Playlist writes
# ---------------------------------------------------------------------------


@router.post("")
def create_playlist(body: PlaylistCreateIn, session: Session = Depends(get_session)) -> PlaylistEditorOut:
    """Create a new playlist."""
    cover_id = UUID(body.cover_id) if body.cover_id else None
    if cover_id and not session.get(ImageAsset, cover_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ImageAsset not found")

    playlist = Playlist(
        label=body.label,
        slug=body.slug or None,
        volume=body.volume,
        cover_id=cover_id,
    )
    session.add(playlist)
    session.commit()
    session.refresh(playlist)
    session.refresh(playlist, ["cover", "tracks"])
    return _playlist_editor_out(playlist)


@router.patch("/{playlist_id}")
def patch_playlist(
    playlist_id: UUID,
    body: PlaylistPatchIn,
    session: Session = Depends(get_session),
) -> PlaylistEditorOut:
    """Update one or more fields on a playlist. Only provided fields are changed."""
    playlist = session.get(Playlist, playlist_id, options=_playlist_load_options())
    if not playlist:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Playlist {playlist_id} not found")

    fields = body.model_dump(exclude_unset=True)
    if "cover_id" in fields:
        raw_id = fields.pop("cover_id")
        cover_id = UUID(raw_id) if raw_id else None
        if cover_id and not session.get(ImageAsset, cover_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ImageAsset not found")
        playlist.cover_id = cover_id

    for field, value in fields.items():
        setattr(playlist, field, value or None if field == "slug" else value)

    session.commit()
    session.refresh(playlist)
    return _playlist_editor_out(playlist)


@router.delete("/{playlist_id}", status_code=204)
def delete_playlist(playlist_id: UUID, session: Session = Depends(get_session)) -> None:
    """Delete a playlist and all its tracks."""
    playlist = session.get(Playlist, playlist_id)
    if not playlist:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Playlist {playlist_id} not found")
    session.delete(playlist)
    session.commit()


# ---------------------------------------------------------------------------
# Track management
# ---------------------------------------------------------------------------


@router.post("/{playlist_id}/tracks/{audio_asset_id}", status_code=204)
def add_track(
    playlist_id: UUID,
    audio_asset_id: UUID,
    session: Session = Depends(get_session),
) -> None:
    """Append an audio asset to a playlist. No-ops if already present."""
    if not session.get(Playlist, playlist_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Playlist {playlist_id} not found")
    if not session.get(AudioAsset, audio_asset_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="AudioAsset not found")

    existing = session.get(PlaylistTrack, (playlist_id, audio_asset_id))
    if not existing:
        existing_tracks = session.scalars(
            select(PlaylistTrack).where(PlaylistTrack.playlist_id == playlist_id)
        ).all()
        session.add(
            PlaylistTrack(
                playlist_id=playlist_id,
                audio_asset_id=audio_asset_id,
                track_order=len(existing_tracks),
            )
        )
        session.commit()


@router.delete("/{playlist_id}/tracks/{audio_asset_id}", status_code=204)
def remove_track(
    playlist_id: UUID,
    audio_asset_id: UUID,
    session: Session = Depends(get_session),
) -> None:
    """Remove a track from a playlist."""
    track = session.get(PlaylistTrack, (playlist_id, audio_asset_id))
    if track:
        session.delete(track)
        session.commit()
