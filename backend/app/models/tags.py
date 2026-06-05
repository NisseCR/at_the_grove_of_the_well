"""Tag table and asset link tables for filtering and discovery."""

from uuid import UUID, uuid4

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Tag(Base):
    __tablename__ = "tag"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    label: Mapped[str] = mapped_column(unique=True)


class ImageAssetTag(Base):
    __tablename__ = "image_asset_tag"

    image_asset_id: Mapped[UUID] = mapped_column(
        ForeignKey("image_asset.id", ondelete="CASCADE"), primary_key=True
    )
    tag_id: Mapped[UUID] = mapped_column(
        ForeignKey("tag.id", ondelete="CASCADE"), primary_key=True
    )


class AudioAssetTag(Base):
    __tablename__ = "audio_asset_tag"

    audio_asset_id: Mapped[UUID] = mapped_column(
        ForeignKey("audio_asset.id", ondelete="CASCADE"), primary_key=True
    )
    tag_id: Mapped[UUID] = mapped_column(
        ForeignKey("tag.id", ondelete="CASCADE"), primary_key=True
    )


class VideoAssetTag(Base):
    __tablename__ = "video_asset_tag"

    video_asset_id: Mapped[UUID] = mapped_column(
        ForeignKey("video_asset.id", ondelete="CASCADE"), primary_key=True
    )
    tag_id: Mapped[UUID] = mapped_column(
        ForeignKey("tag.id", ondelete="CASCADE"), primary_key=True
    )
