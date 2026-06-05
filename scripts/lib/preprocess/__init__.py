"""
Preprocess orchestrator.

Walks the source tree, hashes each file, skips cached entries, and dispatches
to the appropriate processor (audio, image, video). Outputs are written to a
mirrored directory tree under OUTPUT_PATH.
"""

import os
from pathlib import Path

from dotenv import load_dotenv

from lib.cache import hash_file, is_cached, load_cache, save_cache
from lib.preprocess.audio import process_audio
from lib.preprocess.image import process_image
from lib.preprocess.video import process_video

load_dotenv()

AUDIO_EXTENSIONS = {".mp3", ".wav", ".flac", ".aac", ".m4a", ".ogg"}
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
VIDEO_EXTENSIONS = {".webm", ".mp4", ".mov"}

CACHE_FILENAME = "cache.json"


def _output_root() -> Path:
    """Return OUTPUT_PATH from environment, raising if unset."""
    raw = os.getenv("OUTPUT_PATH")
    if not raw:
        raise RuntimeError("OUTPUT_PATH is not set in .env")
    return Path(raw)


def _is_cover(path: Path) -> bool:
    """Return True if the file is a cover image (named cover.*)."""
    return path.stem.lower() == "cover"


def _mirror_path(source_root: Path, source_file: Path, output_root: Path, new_suffix: str) -> Path:
    """Return the output path for a source file, replacing its suffix."""
    relative = source_file.relative_to(source_root)
    return output_root / relative.with_suffix(new_suffix)


def run(source_root: Path) -> None:
    """
    Process all assets under source_root and write converted files to OUTPUT_PATH.

    Skips files whose SHA256 hash matches the cache. Updates the cache after
    each successful conversion.
    """
    output_root = _output_root()
    cache_path = output_root / CACHE_FILENAME
    cache = load_cache(cache_path)

    processed = skipped = errors = 0

    for source_file in sorted(source_root.rglob("*")):
        if not source_file.is_file():
            continue

        # Skip hidden files (e.g. .gitkeep)
        if any(part.startswith(".") for part in source_file.parts):
            continue

        suffix = source_file.suffix.lower()
        cache_key = source_file.relative_to(source_root).as_posix()
        file_hash = hash_file(source_file)

        if is_cached(cache, cache_key, file_hash):
            skipped += 1
            continue

        try:
            if suffix in AUDIO_EXTENSIONS:
                out_path = _mirror_path(source_root, source_file, output_root, ".ogg")
                out_path.parent.mkdir(parents=True, exist_ok=True)
                # Ambience folder uses gentle normalisation; playlists use full two-pass
                mode = "ambience" if "ambiences" in source_file.parts else "music"
                process_audio(source_file, out_path, mode=mode)

            elif suffix in IMAGE_EXTENSIONS:
                out_path = _mirror_path(source_root, source_file, output_root, ".webp")
                out_path.parent.mkdir(parents=True, exist_ok=True)
                generate_thumb = _is_cover(source_file)
                process_image(source_file, out_path, thumbnail=generate_thumb)

            elif suffix in VIDEO_EXTENSIONS:
                out_path = _mirror_path(source_root, source_file, output_root, suffix)
                out_path.parent.mkdir(parents=True, exist_ok=True)
                process_video(source_file, out_path)

            else:
                print(f"SKIP (unsupported): {cache_key}")
                continue

        except Exception as exc:
            print(f"ERROR: {cache_key} — {exc}")
            errors += 1
            continue

        cache[cache_key] = file_hash
        save_cache(cache_path, cache)
        print(f"OK: {cache_key}")
        processed += 1

    print(f"\nDone — {processed} processed, {skipped} cached, {errors} error(s).")
