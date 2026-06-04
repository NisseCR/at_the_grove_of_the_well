"""Audio processing utilities for asset preprocessing.

Requires ffmpeg to be installed and available on PATH.
"""

import json
import subprocess
from pathlib import Path

AUDIO_EXTENSIONS = {".ogg", ".mp3", ".wav", ".flac", ".aac", ".m4a"}

SAMPLE_RATE = 48000
LUFS_TARGET = -16.0
TRUE_PEAK = -1.5
LRA = 11


class AudioProcessor:
    """Normalises audio loudness to a target LUFS and resamples to a target sample rate.

    Uses ffmpeg's loudnorm filter with a two-pass approach for accurate normalisation:
    the first pass measures the file's integrated loudness, and the second pass applies
    linear gain based on those measurements.

    Output is always OGG/Vorbis regardless of the input format.
    """

    def __init__(
        self,
        sample_rate: int = SAMPLE_RATE,
        target_lufs: float = LUFS_TARGET,
        true_peak: float = TRUE_PEAK,
        lra: int = LRA,
    ) -> None:
        self.sample_rate = sample_rate
        self.target_lufs = target_lufs
        self.true_peak = true_peak
        self.lra = lra

    def _loudnorm_filter(self, extra: str = "") -> str:
        """Build a loudnorm filter string with the configured target values.

        Extra parameters (e.g. measured values for the second pass) are appended
        when provided.
        """
        base = (
            f"loudnorm=I={self.target_lufs}"
            f":TP={self.true_peak}"
            f":LRA={self.lra}"
        )
        return f"{base}{extra}"

    def measure_loudness(self, input_path: Path) -> dict:
        """Run the loudnorm first pass to measure the file's loudness characteristics.

        Returns the measured values as a dict with keys:
        input_i, input_tp, input_lra, input_thresh.

        Raises ValueError if the loudnorm JSON block cannot be parsed from ffmpeg output.
        """
        af = self._loudnorm_filter(":print_format=json")
        result = subprocess.run(
            ["ffmpeg", "-i", str(input_path), "-af", af, "-f", "null", "-"],
            capture_output=True,
            text=True,
        )
        # loudnorm writes its JSON summary to stderr
        stderr = result.stderr
        start = stderr.rfind("{")
        end = stderr.rfind("}")
        if start == -1 or end == -1:
            raise ValueError(f"Could not parse loudnorm output for: {input_path}")
        return json.loads(stderr[start : end + 1])

    def apply_normalization(self, input_path: Path, output_path: Path, measured: dict) -> None:
        """Apply loudness normalisation and resampling using measured loudness values.

        Uses linear normalisation mode for a transparent, lossless gain adjustment.
        Output is encoded as OGG/Vorbis quality 6 (~192 kbps equivalent).
        """
        extra = (
            f":measured_I={measured['input_i']}"
            f":measured_TP={measured['input_tp']}"
            f":measured_LRA={measured['input_lra']}"
            f":measured_thresh={measured['input_thresh']}"
            f":linear=true"
        )
        af = self._loudnorm_filter(extra)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(
            [
                "ffmpeg",
                "-i", str(input_path),
                "-map", "0:a",
                "-af", af,
                "-ar", str(self.sample_rate),
                "-c:a", "libvorbis",
                "-q:a", "6",
                "-y",
                str(output_path),
            ],
            capture_output=True,
            text=True,
            check=True,
        )

    def process(self, input_path: Path, output_path: Path) -> None:
        """Process a single audio file: normalise loudness and resample.

        Runs a two-pass loudnorm: first measures integrated loudness, then applies
        linear gain to reach the target LUFS. Output is always OGG/Vorbis.
        """
        measured = self.measure_loudness(input_path)
        self.apply_normalization(input_path, output_path, measured)
