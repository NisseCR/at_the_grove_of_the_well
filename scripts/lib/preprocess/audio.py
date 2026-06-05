"""
Audio preprocessing.

Loudness-normalises to -16 LUFS and resamples to 48 kHz. Output is always
OGG/Vorbis. Requires ffmpeg on PATH.

Modes
-----
``"music"``   — two-pass loudnorm, raises and lowers to hit the target.
``"ambience"``— only lowers loudness if above target; quiet sources are left alone.
"""

import json
import subprocess
from pathlib import Path
from typing import Literal

SAMPLE_RATE = 48000
LUFS_TARGET = -16.0
TRUE_PEAK = -1.5
LRA = 11

NormMode = Literal["music", "ambience"]


def _loudnorm_filter(extra: str = "") -> str:
    """Build an ffmpeg loudnorm filter string, optionally with measured values appended."""
    return f"loudnorm=I={LUFS_TARGET}:TP={TRUE_PEAK}:LRA={LRA}{extra}"


def _measure_loudness(input_path: Path) -> dict:
    """Run the loudnorm first pass and parse JSON loudness measurements from stderr."""
    result = subprocess.run(
        ["ffmpeg", "-i", str(input_path), "-af", _loudnorm_filter(":print_format=json"), "-f", "null", "-"],
        capture_output=True,
        text=True,
    )
    stderr = result.stderr
    start = stderr.rfind("{")
    end = stderr.rfind("}")
    if start == -1 or end == -1:
        raise ValueError(f"Could not parse loudnorm measurements for {input_path.name}")
    return json.loads(stderr[start : end + 1])


def _apply_normalization(input_path: Path, output_path: Path, measured: dict) -> None:
    """Apply loudness normalisation and resampling using pre-measured loudness values."""
    extra = (
        f":measured_I={measured['input_i']}"
        f":measured_TP={measured['input_tp']}"
        f":measured_LRA={measured['input_lra']}"
        f":measured_thresh={measured['input_thresh']}"
        f":linear=true"
    )
    subprocess.run(
        [
            "ffmpeg", "-i", str(input_path),
            "-map", "0:a",
            "-af", _loudnorm_filter(extra),
            "-ar", str(SAMPLE_RATE),
            "-c:a", "libvorbis",
            "-q:a", "6",
            "-y", str(output_path),
        ],
        capture_output=True,
        text=True,
        check=True,
    )


def _resample_only(input_path: Path, output_path: Path) -> None:
    """Resample to the target rate without any loudness adjustment."""
    subprocess.run(
        [
            "ffmpeg", "-i", str(input_path),
            "-map", "0:a",
            "-ar", str(SAMPLE_RATE),
            "-c:a", "libvorbis",
            "-q:a", "6",
            "-y", str(output_path),
        ],
        capture_output=True,
        text=True,
        check=True,
    )


def process_audio(source: Path, dest: Path, mode: NormMode = "music") -> None:
    """
    Convert a source audio file to OGG and write it to dest.

    ``"music"`` mode normalises both up and down to the target LUFS.
    ``"ambience"`` mode only reduces loudness if the source is above target;
    quiet sources are resampled without gain change.
    """
    measured = _measure_loudness(source)
    measured_lufs = float(measured["input_i"])

    if mode == "ambience" and measured_lufs <= LUFS_TARGET:
        _resample_only(source, dest)
    else:
        _apply_normalization(source, dest, measured)
