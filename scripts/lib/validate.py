"""
Validate source assets before syncing to R2.

Scenes  — validates source/scenes/**/*.json against the SceneConfig TypeScript
           type using ts-json-schema-generator + jsonschema.

Stories — validates source/stories/**/*.md frontmatter (required fields) and
           inline trigger blocks (valid keys and value format).
"""

import json
import logging
import re
import subprocess
import sys
from pathlib import Path

import frontmatter
import jsonschema

logger = logging.getLogger(__name__)

_SCENE_TYPES_FILE = (
    Path(__file__).parent.parent.parent / "app" / "src" / "lib" / "types" / "scene.ts"
)

# Frontmatter fields that must be present in every chapter file.
# `scene` must be a non-null string; the others may be null.
_REQUIRED_FIELDS = ("title", "scene", "ambiences", "playlist")

_TRIGGER_RE = re.compile(r"<!--\s*trigger\s*\n(.*?)-->", re.DOTALL)
_VALID_TRIGGER_KEYS = {"ambiences", "playlist"}

# Loose format patterns — category.slug[@volume] or slug[@volume]
_AMBIENCE_TOKEN_RE = re.compile(r"^[\w-]+\.[\w-]+(@[\d.]+)?$")
_PLAYLIST_RE = re.compile(r"^[\w-]+(@[\d.]+)?$")


# ---------------------------------------------------------------------------
# Scene validation
# ---------------------------------------------------------------------------

def _generate_scene_schema() -> dict:
    """Generate a JSON Schema for SceneConfig from the TypeScript source."""
    npx = "npx.cmd" if sys.platform == "win32" else "npx"
    result = subprocess.run(
        [
            npx, "--yes", "ts-json-schema-generator",
            "--path", str(_SCENE_TYPES_FILE),
            "--type", "SceneConfig",
            "--no-type-check",
        ],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        raise RuntimeError(f"Schema generation failed:\n{result.stderr}")
    return json.loads(result.stdout)


def _validate_scenes(source_root: Path) -> int:
    """Validate all scene JSON files. Returns error count."""
    scenes_dir = source_root / "scenes"
    if not scenes_dir.exists():
        logger.info("No scenes/ directory — skipping scene validation.")
        return 0

    json_files = sorted(scenes_dir.rglob("*.json"))
    if not json_files:
        logger.info("No scene JSON files found.")
        return 0

    logger.info("Generating schema from %s", _SCENE_TYPES_FILE.name)
    schema = _generate_scene_schema()

    errors = 0
    for json_file in json_files:
        with open(json_file, encoding="utf-8") as f:
            data = json.load(f)
        try:
            jsonschema.validate(data, schema)
            logger.info("OK (scene): %s", json_file.name)
        except jsonschema.ValidationError as e:
            logger.error("FAIL (scene): %s — %s", json_file.name, e.message)
            errors += 1
    return errors


# ---------------------------------------------------------------------------
# Story validation
# ---------------------------------------------------------------------------

def _validate_trigger(block: str, filename: str, index: int) -> list[str]:
    """Parse and validate a single trigger block body. Returns list of error messages."""
    errors = []
    keys_found = set()

    for line in block.strip().splitlines():
        line = line.strip()
        if not line:
            continue
        if ":" not in line:
            errors.append(f"trigger {index}: unparseable line: {line!r}")
            continue

        key, _, value = line.partition(":")
        key = key.strip()
        value = value.strip()

        if key not in _VALID_TRIGGER_KEYS:
            errors.append(f"trigger {index}: unknown key {key!r}")
            continue

        keys_found.add(key)

        if not value:
            errors.append(f"trigger {index}: empty value for {key!r}")
            continue

        if key == "ambiences":
            for token in (t.strip() for t in value.split(",")):
                if token.lower() not in ("none", "null") and not _AMBIENCE_TOKEN_RE.match(token):
                    errors.append(
                        f"trigger {index}: invalid ambience token {token!r} "
                        f"(expected category.slug or category.slug@volume)"
                    )
        elif key == "playlist":
            if value.lower() not in ("none", "null") and not _PLAYLIST_RE.match(value):
                errors.append(
                    f"trigger {index}: invalid playlist value {value!r} "
                    f"(expected slug or slug@volume)"
                )

    if not keys_found:
        errors.append(f"trigger {index}: no valid keys found")

    return errors


def _validate_story(md_file: Path) -> list[str]:
    """Validate a single story markdown file. Returns list of error messages."""
    errors = []
    post = frontmatter.load(str(md_file))

    for field in _REQUIRED_FIELDS:
        if field not in post.metadata:
            errors.append(f"missing frontmatter field: {field!r}")
        elif field == "scene" and not post.metadata[field]:
            errors.append(f"frontmatter field 'scene' must not be null or empty")

    for i, match in enumerate(re.finditer(_TRIGGER_RE, post.content), start=1):
        trigger_errors = _validate_trigger(match.group(1), md_file.name, i)
        errors.extend(trigger_errors)

    return errors


def _validate_stories(source_root: Path) -> int:
    """Validate all story markdown files. Returns error count."""
    stories_dir = source_root / "stories"
    if not stories_dir.exists():
        logger.info("No stories/ directory — skipping story validation.")
        return 0

    md_files = sorted(stories_dir.rglob("*.md"))
    if not md_files:
        logger.info("No story markdown files found.")
        return 0

    errors = 0
    for md_file in md_files:
        file_errors = _validate_story(md_file)
        if file_errors:
            for msg in file_errors:
                logger.error("FAIL (story): %s — %s", md_file.name, msg)
            errors += len(file_errors)
        else:
            logger.info("OK (story): %s", md_file.name)
    return errors


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def run(source_root: Path) -> None:
    """Validate all scenes and stories under source_root."""
    scene_errors = _validate_scenes(source_root)
    story_errors = _validate_stories(source_root)

    total = scene_errors + story_errors
    if total:
        logger.error("%d error(s) found.", total)
        sys.exit(1)
