"""Scene routes — GET only, served from in-memory state."""

from fastapi import APIRouter, HTTPException, status

from app import state
from app.schemas import SceneCategoryOut, SceneOut

router = APIRouter(prefix="/scene")


@router.get("/categories")
def get_scene_categories() -> list[SceneCategoryOut]:
    """Return all scene categories sorted by display order."""
    return state.data.scene_categories


@router.get("")
def get_scenes() -> list[SceneOut]:
    """Return all scenes with their backgrounds and layers."""
    return state.data.scenes


@router.get("/{scene_id}")
def get_scene(scene_id: str) -> SceneOut:
    """Return a single scene by its slug ID."""
    for scene in state.data.scenes:
        if scene.id == scene_id:
            return scene
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Scene '{scene_id}' not found",
    )
