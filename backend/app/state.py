"""In-memory application data, rebuilt on startup and via POST /admin/sync."""

from pydantic import BaseModel, Field

from app.schemas import (
    AmbienceCategoryOut,
    AmbienceOut,
    PlaylistCategoryOut,
    PlaylistOut,
    SceneCategoryOut,
    SceneOut,
)


class AppData(BaseModel):
    """All content served by the app, held in memory."""

    ambience_categories: list[AmbienceCategoryOut] = Field(default_factory=list)
    ambiences: list[AmbienceOut] = Field(default_factory=list)
    playlist_categories: list[PlaylistCategoryOut] = Field(default_factory=list)
    playlists: list[PlaylistOut] = Field(default_factory=list)
    scene_categories: list[SceneCategoryOut] = Field(default_factory=list)
    scenes: list[SceneOut] = Field(default_factory=list)
    last_synced: str | None = None


# Module-level singleton. Routes read state.data; scanner replaces it on sync.
data = AppData()
