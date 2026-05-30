from fastapi import APIRouter, Request
from app.models.ambience import AmbienceConfig
from app.dependencies import get_or_404

router = APIRouter(prefix="/ambience")


@router.get("")
def get_ambiences(request: Request) -> list[AmbienceConfig]:
    return request.app.state.ambience_service.list_ambiences()


@router.get("/{ambience_id}")
def get_ambience(request: Request, ambience_id: str) -> AmbienceConfig:
    return request.app.state.ambience_service.load_ambience_from_id(ambience_id)


@router.post("")
def create(ambience: AmbienceConfig):
    pass


@router.put("/{ambience_id}")
def update_ambience(ambience_id: str, ambience: AmbienceConfig):
    pass


@router.delete("/{ambience_id}")
def delete_scene(ambience_id: str):
    pass
