"""Ambience routes: categories, list, single, and full CRUD for editor."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.database import get_session
from app.models.ambience import Ambience, AmbienceCategory, AmbienceCategoryLink
from app.models.assets import AudioAsset, ImageAsset
from app.schemas import (
    AmbienceCategoryCreateIn,
    AmbienceCategoryEntryOut,
    AmbienceCategoryOut,
    AmbienceCategoryPatchIn,
    AmbienceCreateIn,
    AmbienceOut,
    AmbiencePatchIn,
)

router = APIRouter(prefix="/ambience")


# ---------------------------------------------------------------------------
# Serialisers
# ---------------------------------------------------------------------------


def _ambience_out(a: Ambience) -> AmbienceOut:
    """Serialize an Ambience entity to its response schema."""
    return AmbienceOut(
        id=str(a.id),
        slug=a.slug,
        label=a.label,
        volume=a.volume,
        loop=a.loop,
        src=a.audio_asset.src if a.audio_asset else "",
        audio_asset_id=str(a.audio_asset_id) if a.audio_asset_id else None,
        audio_asset_label=a.audio_asset.label if a.audio_asset else None,
    )


def _category_out(cat: AmbienceCategory) -> AmbienceCategoryOut:
    """Serialize an AmbienceCategory entity to its response schema."""
    return AmbienceCategoryOut(
        id=str(cat.id),
        label=cat.label,
        src=cat.thumb.src if cat.thumb else "",
        thumb_src=cat.thumb.thumb_src if cat.thumb else None,
        order=cat.display_order,
        ambiences=[AmbienceCategoryEntryOut(id=str(a.id), label=a.label) for a in cat.ambiences],
    )


def _category_load_options():
    """Eager-load options for a fully populated AmbienceCategoryOut."""
    return [
        selectinload(AmbienceCategory.thumb),
        selectinload(AmbienceCategory.ambiences),
    ]


# ---------------------------------------------------------------------------
# Ambience reads
# ---------------------------------------------------------------------------


@router.get("/categories")
def get_ambience_categories(session: Session = Depends(get_session)) -> list[AmbienceCategoryOut]:
    """Return all ambience categories sorted by display order."""
    categories = session.scalars(
        select(AmbienceCategory)
        .options(*_category_load_options())
        .order_by(AmbienceCategory.display_order)
    ).all()
    return [_category_out(cat) for cat in categories]


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
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Ambience {ambience_id} not found")
    return _ambience_out(ambience)


# ---------------------------------------------------------------------------
# Ambience writes
# ---------------------------------------------------------------------------


@router.post("")
def create_ambience(body: AmbienceCreateIn, session: Session = Depends(get_session)) -> AmbienceOut:
    """Create a new ambience entity."""
    audio_asset_id = UUID(body.audio_asset_id) if body.audio_asset_id else None
    if audio_asset_id and not session.get(AudioAsset, audio_asset_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="AudioAsset not found")

    ambience = Ambience(
        label=body.label,
        slug=body.slug or None,
        volume=body.volume,
        loop=body.loop,
        audio_asset_id=audio_asset_id,
    )
    session.add(ambience)
    session.commit()
    session.refresh(ambience)
    if ambience.audio_asset_id:
        session.refresh(ambience, ["audio_asset"])
    return _ambience_out(ambience)


@router.patch("/{ambience_id}")
def patch_ambience(
    ambience_id: UUID,
    body: AmbiencePatchIn,
    session: Session = Depends(get_session),
) -> AmbienceOut:
    """Update one or more fields on an ambience. Only provided fields are changed."""
    ambience = session.get(Ambience, ambience_id, options=[selectinload(Ambience.audio_asset)])
    if not ambience:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Ambience {ambience_id} not found")

    fields = body.model_dump(exclude_unset=True)
    if "audio_asset_id" in fields:
        raw_id = fields.pop("audio_asset_id")
        audio_asset_id = UUID(raw_id) if raw_id else None
        if audio_asset_id and not session.get(AudioAsset, audio_asset_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="AudioAsset not found")
        ambience.audio_asset_id = audio_asset_id

    for field, value in fields.items():
        setattr(ambience, field, value or None if field == "slug" else value)

    session.commit()
    session.refresh(ambience)
    session.refresh(ambience, ["audio_asset"])
    return _ambience_out(ambience)


@router.delete("/{ambience_id}", status_code=204)
def delete_ambience(ambience_id: UUID, session: Session = Depends(get_session)) -> None:
    """Delete an ambience entity and remove it from any categories."""
    ambience = session.get(Ambience, ambience_id)
    if not ambience:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Ambience {ambience_id} not found")
    session.delete(ambience)
    session.commit()


# ---------------------------------------------------------------------------
# Category writes
# ---------------------------------------------------------------------------


@router.post("/categories")
def create_category(
    body: AmbienceCategoryCreateIn,
    session: Session = Depends(get_session),
) -> AmbienceCategoryOut:
    """Create a new ambience category."""
    cat = AmbienceCategory(label=body.label, display_order=body.display_order)
    session.add(cat)
    session.commit()
    session.refresh(cat)
    session.refresh(cat, ["ambiences", "thumb"])
    return _category_out(cat)


@router.patch("/categories/{category_id}")
def patch_category(
    category_id: UUID,
    body: AmbienceCategoryPatchIn,
    session: Session = Depends(get_session),
) -> AmbienceCategoryOut:
    """Update label, display_order, or thumbnail on a category."""
    cat = session.get(AmbienceCategory, category_id, options=_category_load_options())
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Category {category_id} not found")

    fields = body.model_dump(exclude_unset=True)
    if "thumb_id" in fields:
        raw_id = fields.pop("thumb_id")
        thumb_id = UUID(raw_id) if raw_id else None
        if thumb_id and not session.get(ImageAsset, thumb_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ImageAsset not found")
        cat.thumb_id = thumb_id

    for field, value in fields.items():
        setattr(cat, field, value)

    session.commit()
    session.refresh(cat)
    return _category_out(cat)


@router.delete("/categories/{category_id}", status_code=204)
def delete_category(category_id: UUID, session: Session = Depends(get_session)) -> None:
    """Delete an ambience category. Linked ambiences are not deleted."""
    cat = session.get(AmbienceCategory, category_id)
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Category {category_id} not found")
    session.delete(cat)
    session.commit()


# ---------------------------------------------------------------------------
# Category ↔ Ambience linking
# ---------------------------------------------------------------------------


@router.post("/categories/{category_id}/ambiences/{ambience_id}", status_code=204)
def add_ambience_to_category(
    category_id: UUID,
    ambience_id: UUID,
    session: Session = Depends(get_session),
) -> None:
    """Add an ambience to a category. No-ops if already linked."""
    if not session.get(AmbienceCategory, category_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Category {category_id} not found")
    if not session.get(Ambience, ambience_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Ambience {ambience_id} not found")

    existing = session.get(AmbienceCategoryLink, (category_id, ambience_id))
    if not existing:
        session.add(AmbienceCategoryLink(category_id=category_id, ambience_id=ambience_id))
        session.commit()


@router.delete("/categories/{category_id}/ambiences/{ambience_id}", status_code=204)
def remove_ambience_from_category(
    category_id: UUID,
    ambience_id: UUID,
    session: Session = Depends(get_session),
) -> None:
    """Remove an ambience from a category."""
    link = session.get(AmbienceCategoryLink, (category_id, ambience_id))
    if link:
        session.delete(link)
        session.commit()
