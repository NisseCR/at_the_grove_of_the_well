"""Pydantic response schemas matching the frontend TypeScript types."""

from typing import Optional

from pydantic import BaseModel


class SceneAssetOut(BaseModel):
    id: str
    src: str
    loop: bool = True
    opacity: float = 1.0
    brightness: float = 1.0
    grayscale: float = 0.0
    blur: float = 0.0
    flip: bool = False
    blend_mode: str = "normal"


class BackgroundAssetOut(SceneAssetOut):
    """The background image asset for a scene."""

    thumb_src: Optional[str]
    type: str = "image"


class LayerAssetOut(SceneAssetOut):
    """An ordered video overlay layer within a scene. Videos have no thumbnail."""

    order: int
    type: str = "video"


class SceneConfigOut(BaseModel):
    """A scene with its background image and ordered video layers."""

    id: str
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


class AmbienceAssetOut(BaseModel):
    """A single ambience audio asset."""

    id: str
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


class MusicTrackOut(BaseModel):
    """A single music track within a playlist."""

    id: str
    src: str


class PlaylistOut(BaseModel):
    """A playlist with its cover image and ordered tracks."""

    id: str
    label: str
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
