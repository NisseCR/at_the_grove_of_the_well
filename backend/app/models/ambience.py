"""Ambience table models: categories and their links to audio assets."""

from typing import Optional
from uuid import UUID, uuid4

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class AmbienceCategory(Base):
    __tablename__ = "ambience_category"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    label: Mapped[str]
    display_order: Mapped[int]
    thumb_id: Mapped[Optional[UUID]] = mapped_column(ForeignKey("image_asset.id", ondelete="SET NULL"), default=None)

    thumb: Mapped[Optional["ImageAsset"]] = relationship()
    audio_assets: Mapped[list["AudioAsset"]] = relationship(secondary="ambience_category_link", order_by="AudioAsset.label")


class AmbienceCategoryLink(Base):
    __tablename__ = "ambience_category_link"

    category_id: Mapped[UUID] = mapped_column(ForeignKey("ambience_category.id", ondelete="CASCADE"), primary_key=True)
    audio_asset_id: Mapped[UUID] = mapped_column(ForeignKey("audio_asset.id", ondelete="CASCADE"), primary_key=True)


from app.models.assets import AudioAsset, ImageAsset  # noqa: E402
