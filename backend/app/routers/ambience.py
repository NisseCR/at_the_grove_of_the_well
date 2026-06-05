"""Ambience routes: categories, list, and single ambience."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.database import get_session
from app.models.ambience import Ambience, AmbienceCategory
from app.schemas import AmbienceCategoryEntryOut, AmbienceCategoryOut, AmbienceOut

router = APIRouter(prefix="/ambience")


def _ambience_out(a: Ambience) -> AmbienceOut:
    """Serialize an Ambience entity to its response schema."""
    return AmbienceOut(
        id=str(a.id),
        slug=a.slug,
        label=a.label,
        volume=a.volume,
        loop=a.loop,
        src=a.audio_asset.src if a.audio_asset else "",
    )


@router.get("/categories")
def get_ambience_categories(session: Session = Depends(get_session)) -> list[AmbienceCategoryOut]:
    """Return all ambience categories sorted by display order."""
    categories = session.scalars(
        select(AmbienceCategory)
        .options(
            selectinload(AmbienceCategory.thumb),
            selectinload(AmbienceCategory.ambiences),
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
            ambiences=[
                AmbienceCategoryEntryOut(id=str(a.id), label=a.label)
                for a in cat.ambiences
            ],
        )
        for cat in categories
    ]


@router.get("")
def get_ambiences(session: Session = Depends(get_session)) -> list[AmbienceOut]:
    """Return all ambience entities with their audio asset."""
    ambiences = session.scalars(
        select(Ambience)
        .options(selectinload(Ambience.audio_asset))
        .order_by(Ambience.label)
    ).all()
    return [_ambience_out(a) for a in ambiences]


@router.get("/{ambience_id}")
def get_ambience(ambience_id: UUID, session: Session = Depends(get_session)) -> AmbienceOut:
    """Return a single ambience entity by UUID."""
    ambience = session.get(Ambience, ambience_id, options=[selectinload(Ambience.audio_asset)])
    if not ambience:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ambience {ambience_id} not found",
        )
    return _ambience_out(ambience)
