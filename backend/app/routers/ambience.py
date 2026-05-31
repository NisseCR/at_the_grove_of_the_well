from fastapi import APIRouter, Form, Request, UploadFile
from app.models.ambience import AmbienceAsset, AmbienceCategory

router = APIRouter(prefix="/ambience")


@router.get("/categories")
def get_ambience_categories(request: Request) -> list[AmbienceCategory]:
    return request.app.state.ambience_service.list_ambience_categories()


@router.post("/categories")
def create_category(request: Request, category: AmbienceCategory) -> AmbienceCategory:
    return request.app.state.ambience_service.create_category(category)


@router.put("/categories/{category_id}")
def update_category(request: Request, category_id: str, category: AmbienceCategory) -> AmbienceCategory:
    return request.app.state.ambience_service.update_category(category_id, category)


@router.delete("/categories/{category_id}")
def delete_category(request: Request, category_id: str) -> AmbienceCategory:
    return request.app.state.ambience_service.delete_category(category_id)


@router.get("")
def get_ambiences(request: Request) -> list[AmbienceAsset]:
    return request.app.state.ambience_service.list_ambiences()


@router.post("/upload")
async def upload_ambience(request: Request, file: UploadFile, id: str = Form(...)) -> AmbienceAsset:
    content = await file.read()
    return await request.app.state.ambience_service.upload_ambience(id, file.filename, content)


@router.post("")
def create_ambience(request: Request, ambience: AmbienceAsset) -> AmbienceAsset:
    return request.app.state.ambience_service.create_ambience(ambience)


@router.get("/{ambience_id}")
def get_ambience(request: Request, ambience_id: str) -> AmbienceAsset:
    return request.app.state.ambience_service.load_ambience_from_id(ambience_id)


@router.put("/{ambience_id}")
def update_ambience(request: Request, ambience_id: str, ambience: AmbienceAsset) -> AmbienceAsset:
    return request.app.state.ambience_service.update_ambience(ambience_id, ambience)


@router.delete("/{ambience_id}")
def delete_ambience(request: Request, ambience_id: str) -> AmbienceAsset:
    return request.app.state.ambience_service.delete_ambience(ambience_id)
