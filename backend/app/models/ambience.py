"""Ambience table models: categories and their links to audio assets."""

from typing import Optional
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel


class AmbienceCategory(SQLModel, table=True):
    """A display category for grouping ambience sounds in the controller.

    display_order controls the position of this category relative to others.
    Deleting the thumbnail image sets thumb_id to null rather than removing
    the category.
    """

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    label: str
    display_order: int
    thumb_id: Optional[UUID] = Field(
        default=None,
        foreign_key="imageasset.id",
        ondelete="SET NULL",
    )


class AmbienceCategoryLink(SQLModel, table=True):
    """Many-to-many link between ambience categories and audio assets.

    Deleting either the category or the audio asset removes the link row.
    """

    category_id: UUID = Field(
        foreign_key="ambiencecategory.id",
        primary_key=True,
        ondelete="CASCADE",
    )
    audio_asset_id: UUID = Field(
        foreign_key="audioasset.id",
        primary_key=True,
        ondelete="CASCADE",
    )
