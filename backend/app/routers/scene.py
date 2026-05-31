from fastapi import APIRouter, Request
from app.models.scene import SceneConfig, SceneCategory
from app.dependencies import get_or_404

router = APIRouter(prefix="/scene")


@router.get("/categories")
def get_scene_categories(request: Request) -> list[SceneCategory]:
    return request.app.state.scene_service.list_scene_categories()


@router.get("")
def get_scenes(request: Request) -> list[SceneConfig]:
    return request.app.state.scene_service.list_scenes()


@router.get("/{scene_id}")
def get_scene(request: Request, scene_id: str) -> SceneConfig:
    return request.app.state.scene_service.load_scene_from_id(scene_id)


@router.post("")
def create_scene(scene: SceneConfig):
    pass


@router.put("/{scene_id}")
def update_scene(scene_id: str, scene: SceneConfig):
    pass


@router.delete("/{scene_id}")
def delete_scene(scene_id: str):
    pass
