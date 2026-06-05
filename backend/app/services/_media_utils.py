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
                "-show_format",
                tmp_path,
            ],
            capture_output=True,
            text=True,
        )
        probe = json.loads(result.stdout)

        # Streams carry duration for most audio formats (OGG, MP3, etc.)
        for stream in probe.get("streams", []):
            if "duration" in stream:
                return float(stream["duration"])

        # Video containers (WebM, MP4) typically store duration in the format block
        fmt_duration = probe.get("format", {}).get("duration")
        if fmt_duration:
            return float(fmt_duration)

        return None
    except Exception:
        return None
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)
