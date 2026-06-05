"""Shared media utilities for asset services."""

import json
import os
import subprocess
import tempfile


def extract_duration(data: bytes, suffix: str) -> float | None:
    """Extract duration in seconds from media bytes using ffprobe.

    Returns None if duration cannot be determined (corrupt file, no streams, etc.).
    """
    tmp_path: str | None = None
    try:
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as f:
            f.write(data)
            tmp_path = f.name

        result = subprocess.run(
            [
                "ffprobe",
                "-v", "quiet",
                "-print_format", "json",
                "-show_streams",
                tmp_path,
            ],
            capture_output=True,
            text=True,
        )
        streams = json.loads(result.stdout).get("streams", [])
        for stream in streams:
            if "duration" in stream:
                return float(stream["duration"])
        return None
    except Exception:
        return None
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)
