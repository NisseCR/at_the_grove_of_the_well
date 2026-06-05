"""
R2 folder scanner. Builds in-memory AppData from the bucket folder structure
and local scene JSON files.

R2 folder conventions:
  ambiences/{category-slug}/{ambience-slug}.ogg
  ambiences/{category-slug}/cover.webp
  ambiences/{category-slug}/cover.thumb.webp

  playlists/{category-slug}/{playlist-slug}/{track-slug}.ogg
  playlists/{category-slug}/{playlist-slug}/cover.webp
  playlists/{category-slug}/{playlist-slug}/cover.thumb.webp

Scene configs live in backend/data/scenes/ as JSON files (not in R2).
Ambience and playlist slugs (filename stems) are used as stable entity IDs
and must be globally unique within their type.
"""

import json
import logging
import re
from datetime import datetime, timezone
from pathlib import Path

from app.core.storage import r2
from app.schemas import (
    AmbienceCategoryOut,
    AmbienceEntry,
    AmbienceOut,
    BackgroundAssetOut,
    LayerAssetOut,
    MusicTrackOut,
    PlaylistCategoryEntryOut,
    PlaylistCategoryOut,
    PlaylistOut,
    SceneCategoryEntryOut,
    SceneCategoryOut,
    SceneOut,
)
from app.state import AppData

logger = logging.getLogger(__name__)


def _label(slug: str) -> str:
    """Strip leading numeric prefix and convert hyphens to title-cased words."""
    return re.sub(r"^\d+-", "", slug).replace("-", " ").title()


def _order(slug: str) -> int:
    """Return the leading numeric prefix of a slug as a sort key, 999 if absent."""
    m = re.match(r"^(\d+)-", slug)
    return int(m.group(1)) if m else 999


def _scan_ambiences(keys: list[str]) -> tuple[list[AmbienceCategoryOut], list[AmbienceOut]]:
    """Build ambience categories and a flat ambience list from R2 keys."""
    # cat_slug -> cover meta
    cats: dict[str, dict] = {}
    # (cat_slug, amb_slug) -> AmbienceOut
    ambiences: dict[tuple[str, str], AmbienceOut] = {}

    for key in keys:
        parts = key.split("/")
        if len(parts) != 3 or parts[0] != "ambiences":
            continue
        cat_slug, filename = parts[1], parts[2]

        if cat_slug not in cats:
            cats[cat_slug] = {"src": "", "thumb_src": None}

        if filename == "cover.webp":
            cats[cat_slug]["src"] = key
        elif filename == "cover.thumb.webp":
            cats[cat_slug]["thumb_src"] = key
        elif filename.endswith(".ogg"):
            amb_slug = Path(filename).stem
            if (cat_slug, amb_slug) in ambiences:
                logger.warning("Duplicate ambience slug '%s' in category '%s' — skipping", amb_slug, cat_slug)
                continue
            ambiences[(cat_slug, amb_slug)] = AmbienceOut(
                id=amb_slug,
                label=_label(amb_slug),
                src=key,
            )

    result_cats: list[AmbienceCategoryOut] = []
    for cat_slug, meta in sorted(cats.items(), key=lambda x: _order(x[0])):
        entries = [
            AmbienceEntry(id=slug, label=_label(slug))
            for (cs, slug) in sorted(ambiences, key=lambda k: k[1])
            if cs == cat_slug
        ]
        result_cats.append(AmbienceCategoryOut(
            id=cat_slug,
            label=_label(cat_slug),
            src=meta["src"],
            thumb_src=meta["thumb_src"],
            order=_order(cat_slug),
            ambiences=entries,
        ))

    return result_cats, list(ambiences.values())


def _scan_playlists(keys: list[str]) -> tuple[list[PlaylistCategoryOut], list[PlaylistOut]]:
    """Build playlist categories and full playlist objects from R2 keys."""
    # cat_slug -> set (just to track existence)
    cats: dict[str, None] = {}
    # (cat_slug, pl_slug) -> mutable playlist data
    pl_data: dict[tuple[str, str], dict] = {}

    for key in keys:
        parts = key.split("/")
        if len(parts) != 4 or parts[0] != "playlists":
            continue
        cat_slug, pl_slug, filename = parts[1], parts[2], parts[3]

        cats.setdefault(cat_slug, None)
        pl_key = (cat_slug, pl_slug)
        if pl_key not in pl_data:
            pl_data[pl_key] = {"src": "", "thumb_src": None, "tracks": []}

        if filename == "cover.webp":
            pl_data[pl_key]["src"] = key
        elif filename == "cover.thumb.webp":
            pl_data[pl_key]["thumb_src"] = key
        elif filename.endswith(".ogg"):
            track_slug = Path(filename).stem
            pl_data[pl_key]["tracks"].append(MusicTrackOut(id=track_slug, src=key))

    # Sort tracks by src path — numeric filename prefix ensures correct order
    for meta in pl_data.values():
        meta["tracks"].sort(key=lambda t: t.src)

    playlists: list[PlaylistOut] = []
    cat_entries: dict[str, list[PlaylistCategoryEntryOut]] = {s: [] for s in cats}

    for (cat_slug, pl_slug), meta in sorted(pl_data.items()):
        pl = PlaylistOut(
            id=pl_slug,
            label=_label(pl_slug),
            src=meta["src"],
            thumb_src=meta["thumb_src"],
            tracks=meta["tracks"],
        )
        playlists.append(pl)
        cat_entries[cat_slug].append(PlaylistCategoryEntryOut(id=pl_slug, label=_label(pl_slug)))

    result_cats = [
        PlaylistCategoryOut(
            id=cat_slug,
            label=_label(cat_slug),
            order=_order(cat_slug),
            playlists=cat_entries[cat_slug],
        )
        for cat_slug in sorted(cats, key=_order)
    ]

    return result_cats, playlists


def _scan_scenes(scenes_dir: Path) -> tuple[list[SceneCategoryOut], list[SceneOut]]:
    """Read scene JSON configs from disk and build scene + category structures."""
    if not scenes_dir.is_dir():
        return [], []

    scenes: list[SceneOut] = []
    cat_scenes: dict[str, list[SceneCategoryEntryOut]] = {}

    for path in sorted(scenes_dir.glob("*.json")):
        try:
            raw = json.loads(path.read_text(encoding="utf-8"))
            scene_id = raw.get("id", path.stem)
            category = raw.get("category", "uncategorized")

            bg = raw.get("background", {})
            bg_src = bg.get("src", "")
            background = BackgroundAssetOut(
                id=Path(bg_src).stem if bg_src else scene_id,
                src=bg_src,
                type=bg.get("type", "image"),
                thumb_src=bg.get("thumb_src"),
                loop=bg.get("loop", True),
                opacity=bg.get("opacity", 1.0),
                brightness=bg.get("brightness", 1.0),
                grayscale=bg.get("grayscale", 0.0),
                blur=bg.get("blur", 0.0),
                flip=bg.get("flip", False),
                blend_mode=bg.get("blend_mode", "normal"),
            )

            layers = [
                LayerAssetOut(
                    id=Path(lr.get("src", "")).stem or f"{scene_id}-layer-{i}",
                    src=lr.get("src", ""),
                    type=lr.get("type", "video"),
                    order=i,
                    loop=lr.get("loop", True),
                    opacity=lr.get("opacity", 1.0),
                    brightness=lr.get("brightness", 1.0),
                    grayscale=lr.get("grayscale", 0.0),
                    blur=lr.get("blur", 0.0),
                    flip=lr.get("flip", False),
                    blend_mode=lr.get("blend_mode", "normal"),
                )
                for i, lr in enumerate(raw.get("layers", []))
            ]

            scene = SceneOut(
                id=scene_id,
                label=raw.get("label", _label(scene_id)),
                background=background,
                layers=layers,
            )
            scenes.append(scene)
            cat_scenes.setdefault(category, []).append(
                SceneCategoryEntryOut(id=scene_id, label=scene.label)
            )

        except Exception as exc:
            logger.warning("Skipped scene %s — %s", path.name, exc)

    scene_categories = [
        SceneCategoryOut(
            id=cat,
            label=_label(cat),
            order=_order(cat),
            scenes=entries,
        )
        for cat, entries in sorted(cat_scenes.items(), key=lambda x: _order(x[0]))
    ]

    return scene_categories, scenes


def scan(scenes_dir: Path) -> AppData:
    """Scan R2 and local scene configs, return a fully populated AppData."""
    logger.info("Starting R2 scan...")
    keys = r2.list_keys()
    logger.info("Found %d objects in R2", len(keys))

    ambience_categories, ambiences = _scan_ambiences(keys)
    playlist_categories, playlists = _scan_playlists(keys)
    scene_categories, scenes = _scan_scenes(scenes_dir)

    logger.info(
        "Scan complete — %d ambience categories, %d ambiences, "
        "%d playlist categories, %d playlists, "
        "%d scene categories, %d scenes",
        len(ambience_categories), len(ambiences),
        len(playlist_categories), len(playlists),
        len(scene_categories), len(scenes),
    )

    return AppData(
        ambience_categories=ambience_categories,
        ambiences=ambiences,
        playlist_categories=playlist_categories,
        playlists=playlists,
        scene_categories=scene_categories,
        scenes=scenes,
        last_synced=datetime.now(timezone.utc).isoformat(),
    )
