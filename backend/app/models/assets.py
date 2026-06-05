"""Asset table models for images, audio, and video files stored on the CDN."""

from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4

from sqlalchemy import func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ImageAsset(Base):
    __tablename__ = "image_asset"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    label: Mapped[str]
    artist: Mapped[Optional[str]] = mapped_column(default=None)
    src: Mapped[str]
    thumb_src: Mapped[Optional[str]] = mapped_column(default=None)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())

    tags: Mapped[list["Tag"]] = relationship(secondary="image_asset_tag")


class AudioAsset(Base):
    """Used for both ambience sounds and music tracks."""

    __tablename__ = "audio_asset"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    label: Mapped[str]
    artist: Mapped[Optional[str]] = mapped_column(default=None)
    src: Mapped[str]
    duration: Mapped[Optional[float]] = mapped_column(default=None)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())

    tags: Mapped[list["Tag"]] = relationship(secondary="audio_asset_tag")


class VideoAsset(Base):
    __tablename__ = "video_asset"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    label: Mapped[str]
    artist: Mapped[Optional[str]] = mapped_column(default=None)
    src: Mapped[str]
    duration: Mapped[Optional[float]] = mapped_column(default=None)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())

    tags: Mapped[list["Tag"]] = relationship(secondary="video_asset_tag")


from app.models.tags import Tag  # noqa: E402
