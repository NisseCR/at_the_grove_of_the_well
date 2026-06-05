"""Asset library routes: upload, list, delete, replace, patch, and reconcile."""

from uuid import UUID

from fastapi import APIRouter, Depends, Form, UploadFile
from sqlalchemy.orm import Session, selectinload

from app.core.database import get_session
from app.models.assets import AudioAsset, ImageAsset, VideoAsset
from app.schemas import (
    AssetPatchIn,
    AudioAssetOut,
    ImageAssetOut,
    ReconcileResultOut,
    TagOut,
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


def _image_out(a: ImageAsset) -> ImageAssetOut:
    """Serialize an ImageAsset ORM object to its response schema."""
    return ImageAssetOut(
        id=str(a.id),
        label=a.label,
        artist=a.artist,
        src=a.src,
        thumb_src=a.thumb_src,
        created_at=a.created_at,
        updated_at=a.updated_at,
        tags=[TagOut(id=str(t.id), label=t.label) for t in a.tags],
    )


def _audio_out(a: AudioAsset) -> AudioAssetOut:
    """Serialize an AudioAsset ORM object to its response schema."""
    return AudioAssetOut(
        id=str(a.id),
        label=a.label,
        artist=a.artist,
        src=a.src,
        duration=a.duration,
        created_at=a.created_at,
        updated_at=a.updated_at,
        tags=[TagOut(id=str(t.id), label=t.label) for t in a.tags],
    )


def _video_out(a: VideoAsset) -> VideoAssetOut:
    """Serialize a VideoAsset ORM object to its response schema."""
    return VideoAssetOut(
        id=str(a.id),
        label=a.label,
        artist=a.artist,
        src=a.src,
        duration=a.duration,
        created_at=a.created_at,
        updated_at=a.updated_at,
        tags=[TagOut(id=str(t.id), label=t.label) for t in a.tags],
    )


# ---------------------------------------------------------------------------
# Images
# ---------------------------------------------------------------------------


@router.get("/images")
def get_images(session: Session = Depends(get_session)) -> list[ImageAssetOut]:
    """Return all image assets."""
    assets = image_asset_service.list(session, selectinload(ImageAsset.tags))
    return [_image_out(a) for a in assets]


@router.post("/images")
async def upload_image(
    file: UploadFile,
    label: str = Form(...),
    artist: str | None = Form(None),
    session: Session = Depends(get_session),
) -> ImageAssetOut:
    """Upload a single image. Converts to WebP, caps at 1920px, and generates a thumbnail."""
    data = await file.read()
    asset = image_asset_service.upload(data, label, session, artist=artist)
    return _image_out(asset)


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
        results.append(_image_out(asset))
    return results


@router.patch("/images/{asset_id}")
def patch_image(
    asset_id: UUID,
    body: AssetPatchIn,
    session: Session = Depends(get_session),
) -> ImageAssetOut:
    """Update label and/or artist on an image asset."""
    fields = body.model_dump(exclude_unset=True)
    asset = image_asset_service.patch(asset_id, session, **fields)
    return _image_out(asset)


@router.post("/images/{asset_id}/replace")
async def replace_image(
    asset_id: UUID,
    file: UploadFile,
    session: Session = Depends(get_session),
) -> ImageAssetOut:
    """Replace the file for an existing image asset."""
    data = await file.read()
    asset = image_asset_service.replace(asset_id, data, session)
    return _image_out(asset)


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
    assets = audio_asset_service.list(session, selectinload(AudioAsset.tags))
    return [_audio_out(a) for a in assets]


@router.post("/audio")
async def upload_audio(
    file: UploadFile,
    label: str = Form(...),
    artist: str | None = Form(None),
    session: Session = Depends(get_session),
) -> AudioAssetOut:
    """Upload a single audio file. Normalises to -16 LUFS and resamples to 48000 Hz OGG."""
    data = await file.read()
    asset = audio_asset_service.upload(data, label, session, artist=artist)
    return _audio_out(asset)


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
        results.append(_audio_out(asset))
    return results


@router.patch("/audio/{asset_id}")
def patch_audio(
    asset_id: UUID,
    body: AssetPatchIn,
    session: Session = Depends(get_session),
) -> AudioAssetOut:
    """Update label and/or artist on an audio asset."""
    fields = body.model_dump(exclude_unset=True)
    asset = audio_asset_service.patch(asset_id, session, **fields)
    return _audio_out(asset)


@router.post("/audio/{asset_id}/replace")
async def replace_audio(
    asset_id: UUID,
    file: UploadFile,
    session: Session = Depends(get_session),
) -> AudioAssetOut:
    """Replace the file for an existing audio asset."""
    data = await file.read()
    asset = audio_asset_service.replace(asset_id, data, session)
    return _audio_out(asset)


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
    assets = video_asset_service.list(session, selectinload(VideoAsset.tags))
    return [_video_out(a) for a in assets]


@router.post("/video")
async def upload_video(
    file: UploadFile,
    label: str = Form(...),
    artist: str | None = Form(None),
    session: Session = Depends(get_session),
) -> VideoAssetOut:
    """Upload a single video file."""
    data = await file.read()
    asset = video_asset_service.upload(data, label, session, artist=artist)
    return _video_out(asset)


@router.post("/video/bulk")
async def upload_video_bulk(
    files: list[UploadFile],
    session: Session = Depends(get_session),
) -> list[VideoAssetOut]:
    """Upload multiple video files. Label defaults to filename stem."""
    results = []
    for file in files:
        data = await file.read()
        label = (file.filename or "upload").rsplit(".", 1)[0]
        asset = video_asset_service.upload(data, label, session)
        results.append(_video_out(asset))
    return results


@router.patch("/video/{asset_id}")
def patch_video(
    asset_id: UUID,
    body: AssetPatchIn,
    session: Session = Depends(get_session),
) -> VideoAssetOut:
    """Update label and/or artist on a video asset."""
    fields = body.model_dump(exclude_unset=True)
    asset = video_asset_service.patch(asset_id, session, **fields)
    return _video_out(asset)


@router.post("/video/{asset_id}/replace")
async def replace_video(
    asset_id: UUID,
    file: UploadFile,
    session: Session = Depends(get_session),
) -> VideoAssetOut:
    """Replace the file for an existing video asset."""
    data = await file.read()
    asset = video_asset_service.replace(asset_id, data, session)
    return _video_out(asset)


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
