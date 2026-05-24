from fastapi import APIRouter
from app.models.scene import SceneConfig

router = APIRouter(prefix="/scene")


@router.get("")
def get_scenes():
    pass


@router.get("/{scene_id}")
def get_scene(scene_id: str):
    pass


@router.post("")
def create_scene(scene: SceneConfig):
    pass


@router.put("/{scene_id}")
def update_scene(scene_id: str, scene: SceneConfig):
    pass


@router.delete("/{scene_id}")
def delete_scene(scene_id: str):
    pass
