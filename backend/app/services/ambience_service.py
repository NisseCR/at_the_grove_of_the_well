import json
from pathlib import Path

from app.models.ambience import AmbienceAsset, AmbienceCategory
from app.exceptions import ResourceIdNotFound, ResourceIdConflict


class AmbienceService:
    """Service for reading and writing ambience entities and categories from JSON files on disk."""

    AUDIO_EXTENSIONS = {".ogg", ".mp3", ".wav", ".flac"}

    def __init__(
        self,
        ambience_data_dir: Path,
        ambience_categories_dir: Path,
        ambience_audio_dir: Path,
    ) -> None:
        self.ambience_data_dir = ambience_data_dir
        self.ambience_categories_dir = ambience_categories_dir
        self.ambience_audio_dir = ambience_audio_dir

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

    def create_ambience(self, ambience: AmbienceAsset) -> AmbienceAsset:
        """Write a new ambience entity to disk. Raises ResourceIdConflict if the id is already taken."""
        filepath = self.ambience_data_dir / f"{ambience.id}.json"
        if filepath.exists():
            raise ResourceIdConflict("Ambience", ambience.id)
        filepath.write_text(ambience.model_dump_json(indent=2))
        return ambience

    def update_ambience(self, id: str, ambience: AmbienceAsset) -> AmbienceAsset:
        """Update an existing ambience entity. If the id changed, renames the JSON file and the audio file on disk."""
        old_filepath = self.ambience_data_dir / f"{id}.json"
        if not old_filepath.exists():
            raise ResourceIdNotFound("Ambience", id)
        new_filepath = self.ambience_data_dir / f"{ambience.id}.json"
        if ambience.id != id and new_filepath.exists():
            raise ResourceIdConflict("Ambience", ambience.id)

        if ambience.id != id:
            old_filepath.unlink()

            old_audio = self.ambience_audio_dir / Path(ambience.src).name
            if old_audio.exists():
                new_audio_name = f"{ambience.id}{old_audio.suffix}"
                new_audio = self.ambience_audio_dir / new_audio_name
                old_audio.rename(new_audio)
                ambience = AmbienceAsset(id=ambience.id, src=f"assets/audio/ambience/{new_audio_name}")

        new_filepath.write_text(ambience.model_dump_json(indent=2))
        return ambience

    def delete_ambience(self, id: str) -> AmbienceAsset:
        """Delete an ambience entity and its corresponding audio file. Raises ResourceIdNotFound if the id does not exist."""
        filepath = self.ambience_data_dir / f"{id}.json"
        if not filepath.exists():
            raise ResourceIdNotFound("Ambience", id)
        ambience = self.load_ambience_from_filepath(filepath)
        filepath.unlink()
        audio = self.ambience_audio_dir / Path(ambience.src).name
        if audio.exists():
            audio.unlink()
        return ambience

    def create_category(self, category: AmbienceCategory) -> AmbienceCategory:
        """Write a new ambience category to disk. Raises ResourceIdConflict if the id is already taken."""
        filepath = self.ambience_categories_dir / f"{category.id}.json"
        if filepath.exists():
            raise ResourceIdConflict("AmbienceCategory", category.id)
        filepath.write_text(category.model_dump_json(indent=2))
        return category

    def update_category(self, id: str, category: AmbienceCategory) -> AmbienceCategory:
        """Update an existing ambience category. If the id changed, renames the JSON file."""
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

    async def upload_ambience(self, id: str, filename: str, content: bytes) -> AmbienceAsset:
        """Save an uploaded audio file as {id}{ext} and create the corresponding entity JSON."""
        suffix = Path(filename).suffix.lower()
        if suffix not in self.AUDIO_EXTENSIONS:
            raise ValueError(f"Unsupported audio format: {suffix}")

        entity_filepath = self.ambience_data_dir / f"{id}.json"
        if entity_filepath.exists():
            raise ResourceIdConflict("Ambience", id)

        self.ambience_audio_dir.mkdir(parents=True, exist_ok=True)
        audio_filename = f"{id}{suffix}"
        audio_filepath = self.ambience_audio_dir / audio_filename
        audio_filepath.write_bytes(content)

        src = f"assets/audio/ambience/{audio_filename}"
        ambience = AmbienceAsset(id=id, src=src)
        entity_filepath.write_text(ambience.model_dump_json(indent=2))
        return ambience

    def delete_category(self, id: str) -> AmbienceCategory:
        """Delete an ambience category. Raises ResourceIdNotFound if the id does not exist."""
        filepath = self.ambience_categories_dir / f"{id}.json"
        if not filepath.exists():
            raise ResourceIdNotFound("AmbienceCategory", id)
        category = AmbienceCategory.model_validate(json.loads(filepath.read_text()))
        filepath.unlink()
        return category
