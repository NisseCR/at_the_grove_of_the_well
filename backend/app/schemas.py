"""Pydantic response schemas for all API routes."""

from typing import Literal

from pydantic import BaseModel


# ---------------------------------------------------------------------------
# Ambiences
# ---------------------------------------------------------------------------


class AmbienceEntry(BaseModel):
    """Minimal ambience reference used inside category listings."""

    id: str
    label: str


class AmbienceCategoryOut(BaseModel):
    """An ambience category with its cover image and member list."""

    id: str
    label: str
    src: str = ""
    thumb_src: str | None = None
    order: int = 0
    ambiences: list[AmbienceEntry] = []


class AmbienceOut(BaseModel):
    """A single ambience with playback config and resolved audio src."""

    id: str
    label: str
    loop: bool = True
    src: str


# ---------------------------------------------------------------------------
# Music / Playlists
# ---------------------------------------------------------------------------


class MusicTrackOut(BaseModel):
    """A single track within a playlist."""

    id: str
    src: str


class PlaylistCategoryEntryOut(BaseModel):
    """Minimal playlist reference used inside category listings."""

    id: str
    label: str


class PlaylistCategoryOut(BaseModel):
    """A playlist category with its member list."""

    id: str
    label: str
    order: int = 0
    playlists: list[PlaylistCategoryEntryOut] = []


class PlaylistOut(BaseModel):
    """A playlist with its cover image and ordered tracks."""

    id: str
    label: str
    src: str = ""
    thumb_src: str | None = None
    tracks: list[MusicTrackOut] = []


# ---------------------------------------------------------------------------
# Scenes
# ---------------------------------------------------------------------------


class SceneAssetOut(BaseModel):
    """Visual properties shared by a scene background and its layers."""

    id: str
    src: str
    type: Literal["image", "video"]
    loop: bool = True
    opacity: float = 1.0
    brightness: float = 1.0
    grayscale: float = 0.0
    blur: float = 0.0
    flip: bool = False
    blend_mode: str = "normal"


class BackgroundAssetOut(SceneAssetOut):
    """Scene background — adds optional thumbnail."""

    thumb_src: str | None = None


class LayerAssetOut(SceneAssetOut):
    """An ordered overlay layer within a scene."""

    order: int = 0


class SceneCategoryEntryOut(BaseModel):
    """Minimal scene reference used inside category listings."""

    id: str
    label: str


class SceneCategoryOut(BaseModel):
    """A scene category with its member list."""

    id: str
    label: str
    order: int = 0
    scenes: list[SceneCategoryEntryOut] = []


class SceneOut(BaseModel):
    """A scene with its background and ordered layers."""

    id: str
    label: str
    background: BackgroundAssetOut
    layers: list[LayerAssetOut] = []


# ---------------------------------------------------------------------------
# Admin
# ---------------------------------------------------------------------------


class SyncResultOut(BaseModel):
    """Summary returned by POST /admin/sync."""

    last_synced: str
    ambience_categories: int
    ambiences: int
    playlist_categories: int
    playlists: int
    scene_categories: int
    scenes: int
