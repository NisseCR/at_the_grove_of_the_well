from fastapi import APIRouter, Request
from app.models.ambience import AmbienceAsset, AmbienceCategory

router = APIRouter(prefix="/ambience")


@router.get("/categories")
def get_ambience_categories(request: Request) -> list[AmbienceCategory]:
    return request.app.state.ambience_service.list_ambience_categories()


@router.get("")
def get_ambiences(request: Request) -> list[AmbienceAsset]:
    return request.app.state.ambience_service.list_ambiences()


@router.get("/{ambience_id}")
def get_ambience(request: Request, ambience_id: str) -> AmbienceAsset:
    return request.app.state.ambience_service.load_ambience_from_id(ambience_id)
