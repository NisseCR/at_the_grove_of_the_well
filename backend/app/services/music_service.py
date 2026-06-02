import json
from pathlib import Path

from app.models.music import Playlist, PlaylistCategory
from app.exceptions import ResourceIdNotFound


class MusicService:
    """Service for reading playlist entities and categories from JSON files on disk."""

    def __init__(self, music_data_dir: Path, music_categories_dir: Path) -> None:
        self.music_data_dir = music_data_dir
        self.music_categories_dir = music_categories_dir

    def list_playlists(self) -> list[Playlist]:
        """Return all playlists found in the data directory."""
        playlists = []
        for file_path in self.music_data_dir.glob("*.json"):
            data = json.loads(file_path.read_text())
            playlists.append(Playlist.model_validate(data))
        return playlists

    def get_playlist(self, id: str) -> Playlist:
        """Load a playlist by id. Raises ResourceIdNotFound if no matching file exists."""
        file_path = self.music_data_dir / f"{id}.json"
        if not file_path.exists():
            raise ResourceIdNotFound("Playlist", id)
        return Playlist.model_validate(json.loads(file_path.read_text()))

    def list_categories(self) -> list[PlaylistCategory]:
        """Return all playlist categories sorted by their order field."""
        categories = []
        for file_path in self.music_categories_dir.glob("*.json"):
            data = json.loads(file_path.read_text())
            categories.append(PlaylistCategory.model_validate(data))
        return sorted(categories, key=lambda c: c.order)
