"""Asset library routes: upload, list, delete, replace, label patch, and reconcile."""

from uuid import UUID

from fastapi import APIRouter, Depends, Form, UploadFile
from sqlalchemy.orm import Session

from app.core.database import get_session
from app.schemas import (
    AssetLabelPatchIn,
    AudioAssetOut,
    ImageAssetOut,
    ReconcileResultOut,
    VideoAssetOut,
)
from app.core.storage import r2
from app.services import (
    audio_asset_service,
    image_asset_service,
    reconcile_service,
    video_asset_service,
)

router = APIRouter(prefix="/assets")


# ---------------------------------------------------------------------------
# Images
# ---------------------------------------------------------------------------


@router.get("/images")
def get_images(session: Session = Depends(get_session)) -> list[ImageAssetOut]:
    """Return all image assets."""
    assets = image_asset_service.list(session)
    return [
        ImageAssetOut(id=str(a.id), label=a.label, src=a.src, thumb_src=a.thumb_src)
        for a in assets
    ]


@router.post("/images")
async def upload_image(
    file: UploadFile,
    label: str = Form(...),
    session: Session = Depends(get_session),
) -> ImageAssetOut:
    """Upload a single image. Converts to WebP, caps at 1920px, and generates a thumbnail."""
    data = await file.read()
    asset = image_asset_service.upload(data, label, session)
    return ImageAssetOut(
        id=str(asset.id), label=asset.label, src=asset.src, thumb_src=asset.thumb_src
    )


@router.post("/images/bulk")
async def upload_images_bulk(
    files: list[UploadFile],
    session: Session = Depends(get_session),
) -> list[ImageAssetOut]:
    """Upload multiple images. Label defaults to filename stem."""
    results = []
    for file in files:
        data = await file.read()
        label = file.filename.rsplit(".", 1)[0] if file.filename else "untitled"
        asset = image_asset_service.upload(data, label, session)
        results.append(
            ImageAssetOut(
                id=str(asset.id),
                label=asset.label,
                src=asset.src,
                thumb_src=asset.thumb_src,
            )
        )
    return results


@router.patch("/images/{asset_id}")
def patch_image(
    asset_id: UUID,
    body: AssetLabelPatchIn,
    session: Session = Depends(get_session),
) -> ImageAssetOut:
    """Update the display label of an image asset."""
    asset = image_asset_service.patch_label(asset_id, body.label, session)
    return ImageAssetOut(
        id=str(asset.id), label=asset.label, src=asset.src, thumb_src=asset.thumb_src
    )


@router.post("/images/{asset_id}/replace")
async def replace_image(
    asset_id: UUID,
    file: UploadFile,
    session: Session = Depends(get_session),
) -> ImageAssetOut:
    """Replace the file for an existing image asset."""
    data = await file.read()
    asset = image_asset_service.replace(asset_id, data, session)
    return ImageAssetOut(
        id=str(asset.id), label=asset.label, src=asset.src, thumb_src=asset.thumb_src
    )


@router.delete("/images/{asset_id}", status_code=204)
def delete_image(asset_id: UUID, session: Session = Depends(get_session)) -> None:
    """Delete an image asset from the DB and R2."""
    image_asset_service.delete(asset_id, session)


# ---------------------------------------------------------------------------
# Audio
# ---------------------------------------------------------------------------


@router.get("/audio")
def get_audio(session: Session = Depends(get_session)) -> list[AudioAssetOut]:
    """Return all audio assets."""
    assets = audio_asset_service.list(session)
    return [AudioAssetOut(id=str(a.id), label=a.label, src=a.src) for a in assets]


@router.post("/audio")
async def upload_audio(
    file: UploadFile,
    label: str = Form(...),
    session: Session = Depends(get_session),
) -> AudioAssetOut:
    """Upload a single audio file. Normalises to -16 LUFS and resamples to 48000 Hz OGG."""
    data = await file.read()
    asset = audio_asset_service.upload(data, label, session)
    return AudioAssetOut(id=str(asset.id), label=asset.label, src=asset.src)


@router.post("/audio/bulk")
async def upload_audio_bulk(
    files: list[UploadFile],
    session: Session = Depends(get_session),
) -> list[AudioAssetOut]:
    """Upload multiple audio files. Label defaults to filename stem."""
    results = []
    for file in files:
        data = await file.read()
        label = (file.filename or "upload").rsplit(".", 1)[0]
        asset = audio_asset_service.upload(data, label, session)
        results.append(
            AudioAssetOut(id=str(asset.id), label=asset.label, src=asset.src)
        )
    return results


@router.patch("/audio/{asset_id}")
def patch_audio(
    asset_id: UUID,
    body: AssetLabelPatchIn,
    session: Session = Depends(get_session),
) -> AudioAssetOut:
    """Update the display label of an audio asset."""
    asset = audio_asset_service.patch_label(asset_id, body.label, session)
    return AudioAssetOut(id=str(asset.id), label=asset.label, src=asset.src)


@router.post("/audio/{asset_id}/replace")
async def replace_audio(
    asset_id: UUID,
    file: UploadFile,
    session: Session = Depends(get_session),
) -> AudioAssetOut:
    """Replace the file for an existing audio asset."""
    data = await file.read()
    asset = audio_asset_service.replace(asset_id, data, session)
    return AudioAssetOut(id=str(asset.id), label=asset.label, src=asset.src)


@router.delete("/audio/{asset_id}", status_code=204)
def delete_audio(asset_id: UUID, session: Session = Depends(get_session)) -> None:
    """Delete an audio asset from the DB and R2."""
    audio_asset_service.delete(asset_id, session)


# ---------------------------------------------------------------------------
# Video
# ---------------------------------------------------------------------------


@router.get("/video")
def get_video(session: Session = Depends(get_session)) -> list[VideoAssetOut]:
    """Return all video assets."""
    assets = video_asset_service.list(session)
    return [VideoAssetOut(id=str(a.id), label=a.label, src=a.src) for a in assets]


@router.post("/video")
async def upload_video(
    file: UploadFile,
    label: str = Form(...),
    session: Session = Depends(get_session),
) -> VideoAssetOut:
    """Upload a single video file."""
    data = await file.read()
    asset = video_asset_service.upload(data, label, session)
    return VideoAssetOut(id=str(asset.id), label=asset.label, src=asset.src)


@router.post("/video/bulk")
async def upload_video_bulk(
    files: list[UploadFile],
    session: Session = Depends(get_session),
) -> list[VideoAssetOut]:
    """Upload multiple video files. Label defaults to filename stem."""
    results = []
    for file in files:
        data = await file.read()
        filename = file.filename or "upload"
        label = filename.rsplit(".", 1)[0]
        asset = video_asset_service.upload(data, label, session)
        results.append(
            VideoAssetOut(id=str(asset.id), label=asset.label, src=asset.src)
        )
    return results


@router.patch("/video/{asset_id}")
def patch_video(
    asset_id: UUID,
    body: AssetLabelPatchIn,
    session: Session = Depends(get_session),
) -> VideoAssetOut:
    """Update the display label of a video asset."""
    asset = video_asset_service.patch_label(asset_id, body.label, session)
    return VideoAssetOut(id=str(asset.id), label=asset.label, src=asset.src)


@router.post("/video/{asset_id}/replace")
async def replace_video(
    asset_id: UUID,
    file: UploadFile,
    session: Session = Depends(get_session),
) -> VideoAssetOut:
    """Replace the file for an existing video asset."""
    data = await file.read()
    asset = video_asset_service.replace(asset_id, data, session)
    return VideoAssetOut(id=str(asset.id), label=asset.label, src=asset.src)


@router.delete("/video/{asset_id}", status_code=204)
def delete_video(asset_id: UUID, session: Session = Depends(get_session)) -> None:
    """Delete a video asset from the DB and R2."""
    video_asset_service.delete(asset_id, session)


# ---------------------------------------------------------------------------
# Reconcile
# ---------------------------------------------------------------------------


@router.get("/reconcile")
def get_reconcile(session: Session = Depends(get_session)) -> ReconcileResultOut:
    """Diff R2 bucket contents against DB asset records."""
    result = reconcile_service.reconcile(session)
    return ReconcileResultOut(**result)


@router.delete("/orphan/{key:path}", status_code=204)
def delete_orphan(key: str) -> None:
    """Delete an orphaned R2 file that has no matching DB record."""
    r2.delete(key)
