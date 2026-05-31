from fastapi import APIRouter, HTTPException, Request, UploadFile

router = APIRouter(prefix="/image")


@router.post("/upload")
async def upload_image(request: Request, file: UploadFile) -> dict:
    try:
        src = await request.app.state.image_service.upload_image(file.filename, await file.read())
        return {"src": src}
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
