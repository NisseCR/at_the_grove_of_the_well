import json
from pathlib import Path

from app.models.scene import SceneConfig
from app.exceptions import ResourceIdNotFound


class SceneService:
    """ """

    IMAGE_EXTENSIONS = {".png", ".jpg", ".webp"}
    VIDEO_EXTENSIONS = {".webm"}

    def __init__(self, scene_data_dir: Path) -> None:
        self.scene_data_dir = scene_data_dir

    def load_scene_from_filepath(self, file_path: Path) -> SceneConfig:
        """
        Load a single scene config from a given filepath and validate against the SceneConfig model.

        Returns:
            The loaded scene config, or None if it doesn't exist.
        """
        if not file_path.exists():
            raise FileNotFoundError

        scene_json = json.loads(file_path.read_text())
        return SceneConfig.model_validate(scene_json)

    def load_scene_from_id(self, id: str) -> SceneConfig:
        """
        Load a single scene from a given id.

        Returns:
            The loaded scene config, or None if it doesn't exist.
        """
        filepath = self.scene_data_dir / f"{id}.json"

        try:
            return self.load_scene_from_filepath(filepath)
        except FileNotFoundError:
            raise ResourceIdNotFound("Scene", id)

    def list_scenes(self) -> list[SceneConfig]:
        """
        Load all scene configs.
        """
        scenes = []

        for file_name in self.scene_data_dir.glob("*.json"):
            scene = self.load_scene_from_filepath((self.scene_data_dir / file_name))
            scenes.append(scene)

        return scenes
