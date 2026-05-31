import json
from pathlib import Path

from app.models.ambience import AmbienceAsset, AmbienceCategory
from app.exceptions import ResourceIdNotFound, ResourceIdConflict


class AmbienceService:
    """ """

    AUDIO_EXTENSIONS = {".ogg", ".mp3"}

    def __init__(self, ambience_data_dir: Path, ambience_categories_dir: Path) -> None:
        self.ambience_data_dir = ambience_data_dir
        self.ambience_categories_dir = ambience_categories_dir

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

    def list_ambience_categories(self) -> list[AmbienceCategory]:
        """
        Load all ambience categories, sorted by order.
        """
        categories = []

        for file_path in self.ambience_categories_dir.glob("*.json"):
            data = json.loads(file_path.read_text())
            categories.append(AmbienceCategory.model_validate(data))

        return sorted(categories, key=lambda c: c.order)

    def load_category_from_id(self, id: str) -> AmbienceCategory:
        filepath = self.ambience_categories_dir / f"{id}.json"
        if not filepath.exists():
            raise ResourceIdNotFound("AmbienceCategory", id)
        return AmbienceCategory.model_validate(json.loads(filepath.read_text()))

    def create_ambience(self, ambience: AmbienceAsset) -> AmbienceAsset:
        filepath = self.ambience_data_dir / f"{ambience.id}.json"
        if filepath.exists():
            raise ResourceIdConflict("Ambience", ambience.id)
        filepath.write_text(ambience.model_dump_json(indent=2))
        return ambience

    def update_ambience(self, id: str, ambience: AmbienceAsset) -> AmbienceAsset:
        old_filepath = self.ambience_data_dir / f"{id}.json"
        if not old_filepath.exists():
            raise ResourceIdNotFound("Ambience", id)
        new_filepath = self.ambience_data_dir / f"{ambience.id}.json"
        if ambience.id != id and new_filepath.exists():
            raise ResourceIdConflict("Ambience", ambience.id)
        if ambience.id != id:
            old_filepath.unlink()
        new_filepath.write_text(ambience.model_dump_json(indent=2))
        return ambience

    def delete_ambience(self, id: str) -> AmbienceAsset:
        filepath = self.ambience_data_dir / f"{id}.json"
        if not filepath.exists():
            raise ResourceIdNotFound("Ambience", id)
        ambience = self.load_ambience_from_filepath(filepath)
        filepath.unlink()
        return ambience

    def create_category(self, category: AmbienceCategory) -> AmbienceCategory:
        filepath = self.ambience_categories_dir / f"{category.id}.json"
        if filepath.exists():
            raise ResourceIdConflict("AmbienceCategory", category.id)
        filepath.write_text(category.model_dump_json(indent=2))
        return category

    def update_category(self, id: str, category: AmbienceCategory) -> AmbienceCategory:
        old_filepath = self.ambience_categories_dir / f"{id}.json"
        if not old_filepath.exists():
            raise ResourceIdNotFound("AmbienceCategory", id)
        new_filepath = self.ambience_categories_dir / f"{category.id}.json"
        if category.id != id and new_filepath.exists():
            raise ResourceIdConflict("AmbienceCategory", category.id)
        if category.id != id:
            old_filepath.unlink()
        new_filepath.write_text(category.model_dump_json(indent=2))
        return category

    def delete_category(self, id: str) -> AmbienceCategory:
        filepath = self.ambience_categories_dir / f"{id}.json"
        if not filepath.exists():
            raise ResourceIdNotFound("AmbienceCategory", id)
        category = AmbienceCategory.model_validate(json.loads(filepath.read_text()))
        filepath.unlink()
        return category
