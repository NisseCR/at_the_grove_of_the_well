"""One-shot seed: migrates existing JSON data files into the SQLite database.

Run from the backend directory:
    python seed.py
"""

import json
from pathlib import Path

from sqlalchemy.orm import Session

from app.core.database import create_db_and_tables, engine
from app.models.assets import AudioAsset, ImageAsset, VideoAsset
from app.models.ambience import AmbienceCategory, AmbienceCategoryLink
from app.models.playlist import Playlist, PlaylistCategory, PlaylistCategoryLink, PlaylistTrack
from app.models.scene import Scene, SceneBackground, SceneCategory, SceneCategoryLink, SceneLayer

DATA_DIR = Path(__file__).parent / "data"
ENTITIES_DIR = DATA_DIR / "entities"
CATEGORIES_DIR = DATA_DIR / "categories"


def _load(path: Path) -> dict:
    with open(path) as f:
        return json.load(f)


def _label_from_id(slug: str) -> str:
    return slug.replace("-", " ").title()


def seed() -> None:
    """Seed the SQLite database from the JSON data files."""
    create_db_and_tables()

    with Session(engine) as session:
        image_assets: dict[str, ImageAsset] = {}
        audio_assets: dict[str, AudioAsset] = {}
        video_assets: dict[str, VideoAsset] = {}

        def get_image(src: str, label: str) -> ImageAsset:
            if src not in image_assets:
                asset = ImageAsset(label=label, src=src)
                session.add(asset)
                image_assets[src] = asset
            return image_assets[src]

        def get_audio(src: str, label: str) -> AudioAsset:
            if src not in audio_assets:
                asset = AudioAsset(label=label, src=src)
                session.add(asset)
                audio_assets[src] = asset
            return audio_assets[src]

        def get_video(src: str, label: str) -> VideoAsset:
            if src not in video_assets:
                asset = VideoAsset(label=label, src=src)
                session.add(asset)
                video_assets[src] = asset
            return video_assets[src]

        # Build slug → label maps from category files
        scene_labels: dict[str, str] = {}
        for path in (CATEGORIES_DIR / "scenes").glob("*.json"):
            for entry in _load(path).get("scenes", []):
                scene_labels.setdefault(entry["id"], entry["label"])

        ambience_labels: dict[str, str] = {}
        for path in (CATEGORIES_DIR / "ambiences").glob("*.json"):
            for entry in _load(path).get("ambiences", []):
                ambience_labels.setdefault(entry["id"], entry["label"])

        playlist_labels: dict[str, str] = {}
        for path in (CATEGORIES_DIR / "music").glob("*.json"):
            for entry in _load(path).get("playlists", []):
                playlist_labels.setdefault(entry["id"], entry["label"])

        # Scenes
        scene_by_slug: dict[str, Scene] = {}
        for path in sorted((ENTITIES_DIR / "scenes").glob("*.json")):
            data = _load(path)
            slug = data["id"]
            label = scene_labels.get(slug, _label_from_id(slug))
            scene = Scene(label=label)
            session.add(scene)

            bg = data.get("background")
            if bg:
                image = get_image(bg["src"], label=f"{label} background")
                session.add(SceneBackground(scene_id=scene.id, image_asset_id=image.id))
            else:
                session.add(SceneBackground(scene_id=scene.id))

            for layer_data in data.get("layers", []):
                video = get_video(layer_data["src"], label=_label_from_id(layer_data["id"]))
                session.add(SceneLayer(
                    scene_id=scene.id,
                    video_asset_id=video.id,
                    layer_order=layer_data["order"],
                    opacity=layer_data.get("opacity", 1.0),
                    brightness=layer_data.get("brightness", 1.0),
                    grayscale=layer_data.get("grayscale", 0.0),
                    blur=layer_data.get("blur", 0.0),
                    flip=layer_data.get("flip", False),
                ))

            scene_by_slug[slug] = scene

        session.flush()

        # Scene categories
        for path in sorted((CATEGORIES_DIR / "scenes").glob("*.json")):
            data = _load(path)
            category = SceneCategory(label=_label_from_id(data["id"]), display_order=data["order"])
            session.add(category)
            session.flush()
            for entry in data.get("scenes", []):
                if scene := scene_by_slug.get(entry["id"]):
                    session.add(SceneCategoryLink(category_id=category.id, scene_id=scene.id))

        # Ambiences
        ambience_audio_by_slug: dict[str, AudioAsset] = {}
        for path in sorted((ENTITIES_DIR / "ambiences").glob("*.json")):
            data = _load(path)
            slug = data["id"]
            audio = get_audio(data["src"], label=ambience_labels.get(slug, _label_from_id(slug)))
            ambience_audio_by_slug[slug] = audio

        session.flush()

        # Ambience categories
        for path in sorted((CATEGORIES_DIR / "ambiences").glob("*.json")):
            data = _load(path)
            thumb = None
            if "src" in data:
                thumb = get_image(data["src"], label=f"{_label_from_id(data['id'])} thumbnail")
                session.flush()
            category = AmbienceCategory(
                label=_label_from_id(data["id"]),
                display_order=data["order"],
                thumb_id=thumb.id if thumb else None,
            )
            session.add(category)
            session.flush()
            for entry in data.get("ambiences", []):
                if audio := ambience_audio_by_slug.get(entry["id"]):
                    session.add(AmbienceCategoryLink(category_id=category.id, audio_asset_id=audio.id))

        # Playlists
        playlist_by_slug: dict[str, Playlist] = {}
        for path in sorted((ENTITIES_DIR / "music").glob("*.json")):
            data = _load(path)
            slug = data["id"]
            label = playlist_labels.get(slug, _label_from_id(slug))
            cover = get_image(data["src"], label=f"{label} cover") if "src" in data else None
            playlist = Playlist(label=label, cover_id=cover.id if cover else None)
            session.add(playlist)
            session.flush()
            for i, track in enumerate(data.get("tracks", [])):
                audio = get_audio(track["src"], label=_label_from_id(track["id"]))
                session.add(PlaylistTrack(playlist_id=playlist.id, audio_asset_id=audio.id, track_order=i))
            playlist_by_slug[slug] = playlist

        session.flush()

        # Playlist categories
        for path in sorted((CATEGORIES_DIR / "music").glob("*.json")):
            data = _load(path)
            category = PlaylistCategory(label=_label_from_id(data["id"]), display_order=data["order"])
            session.add(category)
            session.flush()
            for entry in data.get("playlists", []):
                if playlist := playlist_by_slug.get(entry["id"]):
                    session.add(PlaylistCategoryLink(category_id=category.id, playlist_id=playlist.id))

        session.commit()
        print(f"Done. Seeded {len(scene_by_slug)} scenes, {len(ambience_audio_by_slug)} ambiences, {len(playlist_by_slug)} playlists.")
        print(f"Assets: {len(image_assets)} images, {len(audio_assets)} audio, {len(video_assets)} video.")


if __name__ == "__main__":
    seed()
