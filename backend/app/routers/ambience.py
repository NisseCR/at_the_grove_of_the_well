"""Ambience routes: categories, list, and single ambience."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.database import get_session
from app.models.ambience import AmbienceCategory
from app.models.assets import AudioAsset
from app.schemas import AmbienceAssetOut, AmbienceCategoryEntryOut, AmbienceCategoryOut

router = APIRouter(prefix="/ambience")


@router.get("/categories")
def get_ambience_categories(session: Session = Depends(get_session)) -> list[AmbienceCategoryOut]:
    """Return all ambience categories sorted by display order."""
    categories = session.scalars(
        select(AmbienceCategory)
        .options(
            selectinload(AmbienceCategory.thumb),
            selectinload(AmbienceCategory.audio_assets),
        )
        .order_by(AmbienceCategory.display_order)
    ).all()

    return [
        AmbienceCategoryOut(
            id=str(cat.id),
            label=cat.label,
            src=cat.thumb.src if cat.thumb else "",
            thumb_src=cat.thumb.thumb_src if cat.thumb else None,
            order=cat.display_order,
            ambiences=[AmbienceCategoryEntryOut(id=str(a.id), label=a.label) for a in cat.audio_assets],
        )
        for cat in categories
    ]


@router.get("")
def get_ambiences(session: Session = Depends(get_session)) -> list[AmbienceAssetOut]:
    """Return all ambience audio assets."""
    assets = session.scalars(select(AudioAsset).order_by(AudioAsset.label)).all()
    return [AmbienceAssetOut(id=str(a.id), src=a.src) for a in assets]


@router.get("/{ambience_id}")
def get_ambience(ambience_id: UUID, session: Session = Depends(get_session)) -> AmbienceAssetOut:
    """Return a single ambience audio asset by UUID."""
    asset = session.get(AudioAsset, ambience_id)
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Ambience {ambience_id} not found")
    return AmbienceAssetOut(id=str(asset.id), src=asset.src)
