"""Playlist table models: playlists, tracks, and categories."""

from typing import Optional
from uuid import UUID, uuid4

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Playlist(Base):
    __tablename__ = "playlist"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    slug: Mapped[Optional[str]] = mapped_column(unique=True, default=None)
    label: Mapped[str]
    cover_id: Mapped[Optional[UUID]] = mapped_column(ForeignKey("image_asset.id", ondelete="SET NULL"), default=None)

    cover: Mapped[Optional["ImageAsset"]] = relationship()
    tracks: Mapped[list["PlaylistTrack"]] = relationship(order_by="PlaylistTrack.track_order")


class PlaylistTrack(Base):
    """Composite PK prevents the same track appearing twice in a playlist."""

    __tablename__ = "playlist_track"

    playlist_id: Mapped[UUID] = mapped_column(ForeignKey("playlist.id", ondelete="CASCADE"), primary_key=True)
    audio_asset_id: Mapped[UUID] = mapped_column(ForeignKey("audio_asset.id", ondelete="CASCADE"), primary_key=True)
    track_order: Mapped[int]

    audio_asset: Mapped["AudioAsset"] = relationship()


class PlaylistCategory(Base):
    __tablename__ = "playlist_category"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    label: Mapped[str]
    display_order: Mapped[int]

    playlists: Mapped[list["Playlist"]] = relationship(secondary="playlist_category_link", order_by="Playlist.label")


class PlaylistCategoryLink(Base):
    __tablename__ = "playlist_category_link"

    category_id: Mapped[UUID] = mapped_column(ForeignKey("playlist_category.id", ondelete="CASCADE"), primary_key=True)
    playlist_id: Mapped[UUID] = mapped_column(ForeignKey("playlist.id", ondelete="CASCADE"), primary_key=True)


from app.models.assets import AudioAsset, ImageAsset  # noqa: E402
