import json
from pathlib import Path

from app.models.scene import SceneConfig, BackgroundConfig, LayerConfig


class SceneService:
    """ """

    IMAGE_EXTENSIONS = {".png", ".jpg", ".webp"}
    VIDEO_EXTENSIONS = {".webm"}

    def __init__(self, scene_data_dir: Path) -> None:
        self.scene_data_dir = scene_data_dir

    def load_scene_from_file(self, file_path: Path) -> SceneConfig:
        """
        Load a single scene config from a given filepath and validate against the SceneConfig model.
        """
        scene_json = json.loads(file_path.read_text())
        return SceneConfig.model_validate(scene_json)

    def list_scenes(self) -> list[SceneConfig]:
        """
        Load all scene configs.
        """
        scenes = []

        for filename in self.scene_data_dir.glob("*.json"):
            scene = self.load_scene_from_file((self.scene_data_dir / filename))
            scenes.append(scene)

        return scenes
