"""Resample all audio files in an input directory to a target sample rate using ffmpeg.

Output files are written to the output directory with the same filenames.
Intended use: resample from assets/raw/ into assets/processed/.

Example:
    python scripts/resample.py assets/raw/audio/ambience assets/processed/audio/ambience
"""

import argparse
import subprocess
from pathlib import Path

AUDIO_EXTENSIONS = {".ogg", ".mp3", ".wav", ".flac"}


def resample(input_path: Path, output_path: Path, sample_rate: int) -> None:
    subprocess.run(
        ["ffmpeg", "-i", str(input_path), "-ar", str(sample_rate), str(output_path)],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


def main() -> None:
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument(
        "input_dir", type=Path, help="Directory containing source audio files"
    )
    parser.add_argument(
        "output_dir", type=Path, help="Directory to write resampled files into"
    )
    parser.add_argument(
        "--rate", type=int, default=48000, help="Target sample rate (default: 48000)"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print files that would be processed without running ffmpeg",
    )
    args = parser.parse_args()

    files = [
        f for f in args.input_dir.iterdir() if f.suffix.lower() in AUDIO_EXTENSIONS
    ]

    if not files:
        print("No audio files found.")
        return

    if not args.dry_run:
        args.output_dir.mkdir(parents=True, exist_ok=True)

    for file in sorted(files):
        output = args.output_dir / file.name
        print(f"{'[dry-run] ' if args.dry_run else ''}{file} → {output}")
        if not args.dry_run:
            resample(file, output, args.rate)

    print("Done.")


if __name__ == "__main__":
    main()
