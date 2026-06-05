"""Ambience routes — GET only, served from in-memory state."""

from fastapi import APIRouter, HTTPException, status

from app import state
from app.schemas import AmbienceCategoryOut, AmbienceOut

router = APIRouter(prefix="/ambience")


@router.get("/categories")
def get_ambience_categories() -> list[AmbienceCategoryOut]:
    """Return all ambience categories sorted by display order."""
    return state.data.ambience_categories


@router.get("")
def get_ambiences() -> list[AmbienceOut]:
    """Return all ambiences."""
    return state.data.ambiences


@router.get("/{ambience_id}")
def get_ambience(ambience_id: str) -> AmbienceOut:
    """Return a single ambience by its slug ID."""
    for amb in state.data.ambiences:
        if amb.id == ambience_id:
            return amb
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Ambience '{ambience_id}' not found",
    )
