from fastapi import APIRouter, Request

from app.models.music import Playlist, PlaylistCategory

router = APIRouter(prefix="/music")


@router.get("/playlist/categories")
def get_playlist_categories(request: Request) -> list[PlaylistCategory]:
    return request.app.state.music_service.list_categories()


@router.get("/playlist")
def get_playlists(request: Request) -> list[Playlist]:
    return request.app.state.music_service.list_playlists()


@router.get("/playlist/{playlist_id}")
def get_playlist(request: Request, playlist_id: str) -> Playlist:
    return request.app.state.music_service.get_playlist(playlist_id)
