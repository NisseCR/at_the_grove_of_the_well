"""SQLAlchemy table models.

All models are imported here so that Base.metadata is fully populated
before create_db_and_tables() is called.
"""

from app.models.assets import AudioAsset, ImageAsset, VideoAsset
from app.models.ambience import Ambience, AmbienceCategory, AmbienceCategoryLink
from app.models.enums import BlendMode
from app.models.playlist import Playlist, PlaylistCategory, PlaylistCategoryLink, PlaylistTrack
from app.models.scene import Scene, SceneBackground, SceneCategory, SceneCategoryLink, SceneLayer
from app.models.tags import AudioAssetTag, ImageAssetTag, Tag, VideoAssetTag

__all__ = [
    "ImageAsset",
    "AudioAsset",
    "VideoAsset",
    "Tag",
    "ImageAssetTag",
    "AudioAssetTag",
    "VideoAssetTag",
    "Scene",
    "SceneBackground",
    "SceneLayer",
    "SceneCategory",
    "SceneCategoryLink",
    "Ambience",
    "AmbienceCategory",
    "AmbienceCategoryLink",
    "Playlist",
    "PlaylistTrack",
    "PlaylistCategory",
    "PlaylistCategoryLink",
    "BlendMode",
]
