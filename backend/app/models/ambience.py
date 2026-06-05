"""Ambience table models: ambience entities, categories, and their links."""

from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4

from sqlalchemy import ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Ambience(Base):
    """A domain entity wrapping one AudioAsset. The slug is the stable identifier
    used in immersive reader tags (e.g. [ambience:forest-day])."""

    __tablename__ = "ambience"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    slug: Mapped[Optional[str]] = mapped_column(unique=True, default=None)
    label: Mapped[str]
    volume: Mapped[float] = mapped_column(default=0.5)
    loop: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())
    audio_asset_id: Mapped[Optional[UUID]] = mapped_column(
        ForeignKey("audio_asset.id", ondelete="SET NULL"), default=None
    )

    audio_asset: Mapped[Optional["AudioAsset"]] = relationship()


class AmbienceCategory(Base):
    __tablename__ = "ambience_category"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    label: Mapped[str]
    display_order: Mapped[int]
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())
    thumb_id: Mapped[Optional[UUID]] = mapped_column(
        ForeignKey("image_asset.id", ondelete="SET NULL"), default=None
    )

    thumb: Mapped[Optional["ImageAsset"]] = relationship()
    ambiences: Mapped[list["Ambience"]] = relationship(
        secondary="ambience_category_link", order_by="Ambience.label"
    )


class AmbienceCategoryLink(Base):
    __tablename__ = "ambience_category_link"

    category_id: Mapped[UUID] = mapped_column(
        ForeignKey("ambience_category.id", ondelete="CASCADE"), primary_key=True
    )
    ambience_id: Mapped[UUID] = mapped_column(
        ForeignKey("ambience.id", ondelete="CASCADE"), primary_key=True
    )


from app.models.assets import AudioAsset, ImageAsset  # noqa: E402
