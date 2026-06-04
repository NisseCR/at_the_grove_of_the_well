"""Asset preprocessor CLI.

Walks an input directory and processes all image and audio files into an
output directory, mirroring the subdirectory structure.

Images are converted to WebP at up to 1920px on the longest edge, with a
400px thumbnail variant alongside each full-resolution file.

Audio files are loudness-normalised to -16 LUFS (two-pass) and resampled
to 48000 Hz, output as OGG/Vorbis regardless of input format.

Usage:
    python preprocess.py --input /path/to/assets --output /path/to/processed

The output directory can then be synced to R2:
    rclone sync /path/to/processed r2:your-bucket/assets
"""

import argparse
import sys
from pathlib import Path

from audio_processor import AUDIO_EXTENSIONS, AudioProcessor
from image_processor import IMAGE_EXTENSIONS, ImageProcessor


def process_images(input_dir: Path, output_dir: Path, processor: ImageProcessor) -> None:
    """Find and process all image files under input_dir, writing results to output_dir.

    Each image produces a full-resolution WebP and a thumbnail WebP in the
    corresponding output subdirectory.
    """
    paths = [p for p in input_dir.rglob("*") if p.suffix.lower() in IMAGE_EXTENSIONS]
    if not paths:
        print("  No image files found.")
        return

    for input_path in sorted(paths):
        relative = input_path.relative_to(input_dir)
        output_subdir = output_dir / relative.parent
        try:
            full_path, thumb_path = processor.process(input_path, output_subdir)
            print(f"  ✓ {relative} → {full_path.name}, {thumb_path.name}")
        except Exception as exc:
            print(f"  ✗ {relative}: {exc}", file=sys.stderr)


def process_audio(input_dir: Path, output_dir: Path, processor: AudioProcessor) -> None:
    """Find and process all audio files under input_dir, writing results to output_dir.

    Each audio file is output as an OGG file with the same stem in the
    corresponding output subdirectory.
    """
    paths = [p for p in input_dir.rglob("*") if p.suffix.lower() in AUDIO_EXTENSIONS]
    if not paths:
        print("  No audio files found.")
        return

    for input_path in sorted(paths):
        relative = input_path.relative_to(input_dir)
        output_path = output_dir / relative.parent / f"{input_path.stem}.ogg"
        try:
            processor.process(input_path, output_path)
            print(f"  ✓ {relative} → {output_path.name}")
        except Exception as exc:
            print(f"  ✗ {relative}: {exc}", file=sys.stderr)


def parse_args() -> argparse.Namespace:
    """Parse and return CLI arguments."""
    parser = argparse.ArgumentParser(
        description="Preprocess image and audio assets for CDN upload.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "--input", "-i",
        required=True,
        type=Path,
        metavar="DIR",
        help="Source assets directory to read from.",
    )
    parser.add_argument(
        "--output", "-o",
        required=True,
        type=Path,
        metavar="DIR",
        help="Output directory to write processed files into.",
    )
    return parser.parse_args()


def main() -> None:
    """Entry point: validate arguments and run the image and audio processors."""
    args = parse_args()
    input_dir = args.input.resolve()
    output_dir = args.output.resolve()

    if not input_dir.exists():
        print(f"Error: input directory does not exist: {input_dir}", file=sys.stderr)
        sys.exit(1)

    if input_dir == output_dir:
        print("Error: input and output directories must be different.", file=sys.stderr)
        sys.exit(1)

    print(f"Input:  {input_dir}")
    print(f"Output: {output_dir}")
    print()

    print("Processing images...")
    process_images(input_dir, output_dir, ImageProcessor())

    print()
    print("Processing audio...")
    process_audio(input_dir, output_dir, AudioProcessor())

    print()
    print("Done.")


if __name__ == "__main__":
    main()
