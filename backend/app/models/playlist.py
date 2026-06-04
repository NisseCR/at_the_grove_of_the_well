"""Playlist table models: playlists, tracks, and categories."""

from typing import Optional
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel


class PlaylistCategory(SQLModel, table=True):
    """A display category for grouping playlists in the controller.

    display_order controls the position of this category relative to others.
    """

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    label: str
    display_order: int


class Playlist(SQLModel, table=True):
    """A named playlist of ordered music tracks with an optional cover image.

    Deleting the cover image sets cover_id to null rather than removing
    the playlist.
    """

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    label: str
    cover_id: Optional[UUID] = Field(
        default=None,
        foreign_key="imageasset.id",
        ondelete="SET NULL",
    )


class PlaylistTrack(SQLModel, table=True):
    """An ordered entry linking an audio asset to a playlist.

    The composite primary key (playlist_id, audio_asset_id) prevents the same
    track from appearing more than once in a given playlist. track_order
    determines playback sequence and should be unique within a playlist.
    """

    playlist_id: UUID = Field(
        foreign_key="playlist.id",
        primary_key=True,
        ondelete="CASCADE",
    )
    audio_asset_id: UUID = Field(
        foreign_key="audioasset.id",
        primary_key=True,
        ondelete="CASCADE",
    )
    track_order: int


class PlaylistCategoryLink(SQLModel, table=True):
    """Many-to-many link between playlists and playlist categories.

    Deleting either the category or the playlist removes the link row.
    """

    category_id: UUID = Field(
        foreign_key="playlistcategory.id",
        primary_key=True,
        ondelete="CASCADE",
    )
    playlist_id: UUID = Field(
        foreign_key="playlist.id",
        primary_key=True,
        ondelete="CASCADE",
    )
