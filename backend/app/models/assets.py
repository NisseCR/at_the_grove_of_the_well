"""Asset table models for images, audio, and video files stored on the CDN."""

from typing import Optional
from uuid import UUID, uuid4

from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class ImageAsset(Base):
    __tablename__ = "image_asset"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    label: Mapped[str]
    src: Mapped[str]
    thumb_src: Mapped[Optional[str]] = mapped_column(default=None)


class AudioAsset(Base):
    """Used for both ambience sounds and music tracks."""

    __tablename__ = "audio_asset"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    label: Mapped[str]
    src: Mapped[str]


class VideoAsset(Base):
    __tablename__ = "video_asset"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    label: Mapped[str]
    src: Mapped[str]
