"""Audio processing for asset uploads.

Loudness-normalises to -16 LUFS (two-pass) and resamples to 48000 Hz.
Output is always OGG/Vorbis regardless of input format. Requires ffmpeg on PATH.

Normalization modes
-------------------
``"music"``
    Full two-pass loudnorm: raises *and* lowers loudness to hit the target LUFS.
    Use for music tracks where a consistent perceived volume is essential.

``"ambience"``
    Measure-first: only applies loudnorm when the source is *louder* than the
    target.  Quiet ambiences are left at their natural level; only overly loud
    ones are brought down.  This prevents soft rain or wind loops from being
    boosted to an unnatural volume.
"""

import json
import os
import subprocess
import tempfile
from typing import Literal

SAMPLE_RATE = 48000
LUFS_TARGET = -16.0
TRUE_PEAK = -1.5
LRA = 11

NormMode = Literal["music", "ambience"]


class AudioProcessor:
    """Normalises loudness and resamples audio to a target sample rate.

    Uses ffmpeg's loudnorm filter with a two-pass approach: the first pass
    measures integrated loudness, the second applies linear gain.
    Output is always OGG/Vorbis quality 6 (~192 kbps equivalent).
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
        """Build a loudnorm filter string, optionally appending measured values."""
        base = (
            f"loudnorm=I={self.target_lufs}"
            f":TP={self.true_peak}"
            f":LRA={self.lra}"
        )
        return f"{base}{extra}"

    def _measure_loudness(self, input_path: str) -> dict:
        """Run the loudnorm first pass and parse the JSON loudness measurements from stderr."""
        af = self._loudnorm_filter(":print_format=json")
        result = subprocess.run(
            ["ffmpeg", "-i", input_path, "-af", af, "-f", "null", "-"],
            capture_output=True,
            text=True,
        )
        stderr = result.stderr
        start = stderr.rfind("{")
        end = stderr.rfind("}")
        if start == -1 or end == -1:
            raise ValueError("Could not parse loudnorm measurements from ffmpeg output.")
        return json.loads(stderr[start : end + 1])

    def _apply_normalization(self, input_path: str, output_path: str, measured: dict) -> None:
        """Apply loudness normalisation and resampling using measured values."""
        extra = (
            f":measured_I={measured['input_i']}"
            f":measured_TP={measured['input_tp']}"
            f":measured_LRA={measured['input_lra']}"
            f":measured_thresh={measured['input_thresh']}"
            f":linear=true"
        )
        af = self._loudnorm_filter(extra)
        subprocess.run(
            [
                "ffmpeg", "-i", input_path,
                "-map", "0:a",
                "-af", af,
                "-ar", str(self.sample_rate),
                "-c:a", "libvorbis",
                "-q:a", "6",
                "-y", output_path,
            ],
            capture_output=True,
            text=True,
            check=True,
        )

    def _resample_only(self, input_path: str, output_path: str) -> None:
        """Resample to the target rate without any loudness adjustment."""
        subprocess.run(
            [
                "ffmpeg", "-i", input_path,
                "-map", "0:a",
                "-ar", str(self.sample_rate),
                "-c:a", "libvorbis",
                "-q:a", "6",
                "-y", output_path,
            ],
            capture_output=True,
            text=True,
            check=True,
        )

    def process(self, data: bytes, mode: NormMode = "music") -> bytes:
        """Normalise loudness and resample. Returns processed OGG bytes.

        Uses temporary files because ffmpeg requires file-based I/O.
        Files are cleaned up in the finally block regardless of outcome.
        Uses delete=False for Windows compatibility — ffmpeg cannot open a file
        held open by another process.

        :param data: Raw audio bytes in any format ffmpeg can decode.
        :param mode: ``"music"`` normalises both up and down to the target LUFS.
                     ``"ambience"`` only reduces loudness if the source is above target;
                     quiet sources are resampled without any gain change.
        """
        input_tmp: str | None = None
        output_tmp: str | None = None
        try:
            with tempfile.NamedTemporaryFile(suffix=".audio", delete=False) as f:
                f.write(data)
                input_tmp = f.name

            output_tmp = input_tmp + ".ogg"

            measured = self._measure_loudness(input_tmp)
            measured_lufs = float(measured["input_i"])

            skip_normalization = (
                mode == "ambience" and measured_lufs <= self.target_lufs
            )

            if skip_normalization:
                self._resample_only(input_tmp, output_tmp)
            else:
                self._apply_normalization(input_tmp, output_tmp, measured)

            with open(output_tmp, "rb") as f:
                return f.read()
        finally:
            if input_tmp and os.path.exists(input_tmp):
                os.unlink(input_tmp)
            if output_tmp and os.path.exists(output_tmp):
                os.unlink(output_tmp)
