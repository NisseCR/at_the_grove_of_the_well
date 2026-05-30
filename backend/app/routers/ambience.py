from fastapi import APIRouter, Request
from app.models.ambience import AmbienceAsset
from app.dependencies import get_or_404

router = APIRouter(prefix="/ambience")


@router.get("")
def get_ambiences(request: Request) -> list[AmbienceAsset]:
    return request.app.state.ambience_service.list_ambiences()


@router.get("/{ambience_id}")
def get_ambience(request: Request, ambience_id: str) -> AmbienceAsset:
    return request.app.state.ambience_service.load_ambience_from_id(ambience_id)


@router.post("")
def create(ambience: AmbienceAsset):
    pass


@router.put("/{ambience_id}")
def update_ambience(ambience_id: str, ambience: AmbienceAsset):
    pass


@router.delete("/{ambience_id}")
def delete_scene(ambience_id: str):
    pass
