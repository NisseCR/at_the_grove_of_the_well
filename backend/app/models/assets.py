"""Asset table models for images, audio, and video files stored on the CDN."""

from typing import Optional
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel


class ImageAsset(SQLModel, table=True):
    """An image file on the CDN with a corresponding thumbnail variant.

    thumb_src stores the preprocessed thumbnail path independently so that
    content-hash versioning can update full-res and thumbnail separately.
    """

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    label: str
    src: str
    thumb_src: Optional[str] = None


class AudioAsset(SQLModel, table=True):
    """An audio file on the CDN.

    Used for both ambience sounds and music tracks — the context in which an
    asset is used is determined by the tables that reference it, not by a type
    field on the asset itself.
    """

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    label: str
    src: str


class VideoAsset(SQLModel, table=True):
    """A video file on the CDN. Used as ordered overlay layers within scenes."""

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    label: str
    src: str
