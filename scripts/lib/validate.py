"""
Validate scene JSON files against the SceneConfig TypeScript type.

Generates a JSON Schema from app/src/lib/types/scene.ts using
ts-json-schema-generator (via npx), then validates every *.json file
found under source/scenes/ against that schema.
"""

import json
import logging
import subprocess
import sys
from pathlib import Path

import jsonschema

logger = logging.getLogger(__name__)

_SCENE_TYPES_FILE = (
    Path(__file__).parent.parent.parent / "app" / "src" / "lib" / "types" / "scene.ts"
)


def _generate_schema() -> dict:
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


def run(source_root: Path) -> None:
    """Validate all scene JSON files in source_root/scenes/ against SceneConfig."""
    scenes_dir = source_root / "scenes"
    if not scenes_dir.exists():
        logger.warning("No scenes/ directory found at %s", scenes_dir)
        return

    json_files = sorted(scenes_dir.rglob("*.json"))
    if not json_files:
        logger.info("No scene JSON files found.")
        return

    logger.info("Generating schema from %s", _SCENE_TYPES_FILE.name)
    schema = _generate_schema()

    errors = 0
    for json_file in json_files:
        with open(json_file, encoding="utf-8") as f:
            data = json.load(f)
        try:
            jsonschema.validate(data, schema)
            logger.info("OK: %s", json_file.name)
        except jsonschema.ValidationError as e:
            logger.error("FAIL: %s — %s", json_file.name, e.message)
            errors += 1

    if errors:
        logger.error("%d file(s) failed validation.", errors)
        sys.exit(1)
    else:
        logger.info("All %d scene(s) valid.", len(json_files))
