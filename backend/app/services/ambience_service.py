import json
from pathlib import Path

from app.models.ambience import AmbienceAsset
from app.exceptions import ResourceIdNotFound


class AmbienceService:
    """ """

    AUDIO_EXTENSIONS = {".ogg", ".mp3"}

    def __init__(self, ambience_data_dir: Path) -> None:
        self.ambience_data_dir = ambience_data_dir

    def load_ambience_from_filepath(self, file_path: Path) -> AmbienceAsset:
        """
        Load a single ambience asset from a given filepath and validate against the AmbienceAsset model.

        Returns:
            The loaded ambience asset, or None if it doesn't exist.
        """
        if not file_path.exists():
            raise FileNotFoundError

        ambience_json = json.loads(file_path.read_text())
        return AmbienceAsset.model_validate(ambience_json)

    def load_ambience_from_id(self, id: str) -> AmbienceAsset:
        """
        Load a single ambience asset from a given id.

        Returns:
            The loaded ambience asset, or None if it doesn't exist.
        """
        filepath = self.ambience_data_dir / f"{id}.json"

        try:
            return self.load_ambience_from_filepath(filepath)
        except FileNotFoundError:
            raise ResourceIdNotFound("Ambience", id)

    def list_ambiences(self) -> list[AmbienceAsset]:
        """
        Load all ambience assets.
        """
        ambiences = []

        for file_name in self.ambience_data_dir.glob("*.json"):
            ambience = self.load_ambience_from_filepath(
                (self.ambience_data_dir / file_name)
            )
            ambiences.append(ambience)

        return ambiences
