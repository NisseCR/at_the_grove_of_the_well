import json
from pathlib import Path

from app.models.ambience import AmbienceAsset, AmbienceCategory
from app.exceptions import ResourceIdNotFound


class AmbienceService:
    """Service for reading and writing ambience entities and categories from JSON files on disk."""

    def __init__(
        self,
        ambience_data_dir: Path,
        ambience_categories_dir: Path,
    ) -> None:
        self.ambience_data_dir = ambience_data_dir
        self.ambience_categories_dir = ambience_categories_dir

    def load_ambience_from_filepath(self, file_path: Path) -> AmbienceAsset:
        """Load and validate an ambience entity from a JSON file. Raises FileNotFoundError if the path does not exist."""
        if not file_path.exists():
            raise FileNotFoundError

        ambience_json = json.loads(file_path.read_text())
        return AmbienceAsset.model_validate(ambience_json)

    def load_ambience_from_id(self, id: str) -> AmbienceAsset:
        """Load an ambience entity by id. Raises ResourceIdNotFound if no matching file exists."""
        filepath = self.ambience_data_dir / f"{id}.json"

        try:
            return self.load_ambience_from_filepath(filepath)
        except FileNotFoundError:
            raise ResourceIdNotFound("Ambience", id)

    def list_ambiences(self) -> list[AmbienceAsset]:
        """Return all ambience entities found in the data directory."""
        ambiences = []

        for file_name in self.ambience_data_dir.glob("*.json"):
            ambience = self.load_ambience_from_filepath(
                (self.ambience_data_dir / file_name)
            )
            ambiences.append(ambience)

        return ambiences

    def list_ambience_categories(self) -> list[AmbienceCategory]:
        """Return all ambience categories sorted by their order field."""
        categories = []

        for file_path in self.ambience_categories_dir.glob("*.json"):
            data = json.loads(file_path.read_text())
            categories.append(AmbienceCategory.model_validate(data))

        return sorted(categories, key=lambda c: c.order)

    def load_category_from_id(self, id: str) -> AmbienceCategory:
        """Load an ambience category by id. Raises ResourceIdNotFound if no matching file exists."""
        filepath = self.ambience_categories_dir / f"{id}.json"
        if not filepath.exists():
            raise ResourceIdNotFound("AmbienceCategory", id)
        return AmbienceCategory.model_validate(json.loads(filepath.read_text()))

