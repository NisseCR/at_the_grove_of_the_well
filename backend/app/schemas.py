"""Pydantic response schemas matching the frontend TypeScript types."""

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel


# ---------------------------------------------------------------------------
# Tags
# ---------------------------------------------------------------------------


class TagOut(BaseModel):
    """A single tag."""

    id: str
    label: str


# ---------------------------------------------------------------------------
# Assets
# ---------------------------------------------------------------------------


class ImageAssetOut(BaseModel):
    """A single image asset in the library."""

    id: str
    label: str
    artist: Optional[str] = None
    src: str
    thumb_src: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    tags: list[TagOut] = []


class AudioAssetOut(BaseModel):
    """A single audio asset in the library."""

    id: str
    label: str
    artist: Optional[str] = None
    src: str
    duration: Optional[float] = None
    created_at: datetime
    updated_at: datetime
    tags: list[TagOut] = []


class VideoAssetOut(BaseModel):
    """A single video asset in the library."""

    id: str
    label: str
    artist: Optional[str] = None
    src: str
    duration: Optional[float] = None
    created_at: datetime
    updated_at: datetime
    tags: list[TagOut] = []


class AssetPatchIn(BaseModel):
    """Payload for patching an asset's label and/or artist."""

    label: Optional[str] = None
    artist: Optional[str] = None


# ---------------------------------------------------------------------------
# Scenes
# ---------------------------------------------------------------------------


class SceneAssetOut(BaseModel):
    """Shared visual properties for a scene background or layer."""

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
    """The background asset for a scene. thumb_src only populated for images."""

    thumb_src: Optional[str] = None


class LayerAssetOut(SceneAssetOut):
    """An ordered overlay layer within a scene."""

    order: int


class SceneOut(BaseModel):
    """A scene with its background and ordered layers."""

    id: str
    slug: Optional[str] = None
    label: str
    background: BackgroundAssetOut
    layers: list[LayerAssetOut]


class SceneCategoryEntryOut(BaseModel):
    id: str
    label: str


class SceneCategoryOut(BaseModel):
    id: str
    label: str
    order: int
    scenes: list[SceneCategoryEntryOut]


# ---------------------------------------------------------------------------
# Ambiences
# ---------------------------------------------------------------------------


class AmbienceOut(BaseModel):
    """A single ambience entity with playback config and resolved audio src."""

    id: str
    slug: Optional[str] = None
    label: str
    volume: float
    loop: bool
    src: str


class AmbienceCategoryEntryOut(BaseModel):
    id: str
    label: str


class AmbienceCategoryOut(BaseModel):
    id: str
    label: str
    src: str
    thumb_src: Optional[str] = None
    order: int
    ambiences: list[AmbienceCategoryEntryOut]


# ---------------------------------------------------------------------------
# Music / Playlists
# ---------------------------------------------------------------------------


class MusicTrackOut(BaseModel):
    """A single music track within a playlist."""

    id: str
    src: str


class PlaylistOut(BaseModel):
    """A playlist with its cover image and ordered tracks."""

    id: str
    slug: Optional[str] = None
    label: str
    volume: float
    src: str
    thumb_src: Optional[str] = None
    tracks: list[MusicTrackOut]


class PlaylistCategoryEntryOut(BaseModel):
    id: str
    label: str


class PlaylistCategoryOut(BaseModel):
    id: str
    label: str
    order: int
    playlists: list[PlaylistCategoryEntryOut]


# ---------------------------------------------------------------------------
# Reconcile
# ---------------------------------------------------------------------------


class OrphanedFileOut(BaseModel):
    """An R2 object with no matching DB record."""

    key: str


class BrokenAssetOut(BaseModel):
    """A DB asset record whose R2 file is missing."""

    id: str
    label: str
    src: str
    type: str


class ReconcileResultOut(BaseModel):
    """Result of a reconcile diff between R2 and the DB."""

    orphaned_files: list[OrphanedFileOut]
    broken_assets: list[BrokenAssetOut]
