"""SQLModel table models.

All models are imported here so that SQLModel.metadata is fully populated
before create_db_and_tables() is called.
"""

from app.models.assets import AudioAsset, ImageAsset, VideoAsset
from app.models.ambience import AmbienceCategory, AmbienceCategoryLink
from app.models.enums import BlendMode
from app.models.playlist import Playlist, PlaylistCategory, PlaylistCategoryLink, PlaylistTrack
from app.models.scene import Scene, SceneBackground, SceneCategory, SceneCategoryLink, SceneLayer

__all__ = [
    "ImageAsset",
    "AudioAsset",
    "VideoAsset",
    "Scene",
    "SceneBackground",
    "SceneLayer",
    "SceneCategory",
    "SceneCategoryLink",
    "AmbienceCategory",
    "AmbienceCategoryLink",
    "Playlist",
    "PlaylistTrack",
    "PlaylistCategory",
    "PlaylistCategoryLink",
    "BlendMode",
]
