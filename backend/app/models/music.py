from pydantic import BaseModel


class MusicTrack(BaseModel):
    id: str
    src: str


class Playlist(BaseModel):
    id: str
    src: str
    tracks: list[MusicTrack]


class PlaylistCategoryEntry(BaseModel):
    id: str
    label: str


class PlaylistCategory(BaseModel):
    id: str
    order: int
    playlists: list[PlaylistCategoryEntry]
