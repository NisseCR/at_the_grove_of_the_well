"""Video processing for asset uploads.

Currently handles thumbnail extraction from the first frame.
Full transcoding (e.g. to WebM) is a future concern.
Requires ffmpeg on PATH and Pillow.
"""

import io
import os
import subprocess
import tempfile

from PIL import Image

THUMB_WIDTH = 480


class VideoProcessor:
    """Extracts a WebP thumbnail from the first frame of a video.

    Uses ffmpeg to pull one PNG frame via stdout pipe, then Pillow to
    resize and encode as WebP. Returns None rather than raising if the
    video has no video stream or ffmpeg fails for any reason.
    """

    def __init__(self, thumb_width: int = THUMB_WIDTH) -> None:
        self.thumb_width = thumb_width

    def extract_thumbnail(self, data: bytes) -> bytes | None:
        """Return a WebP thumbnail of the first video frame, or None on failure.

        Writes the raw video bytes to a temporary file so ffmpeg can seek
        and decode it. Uses delete=False for Windows compatibility.

        :param data: Raw video bytes in any format ffmpeg can decode.
        :returns: WebP image bytes, or None if no frame could be extracted.
        """
        tmp_path: str | None = None
        try:
            with tempfile.NamedTemporaryFile(suffix=".video", delete=False) as f:
                f.write(data)
                tmp_path = f.name

            result = subprocess.run(
                [
                    "ffmpeg",
                    "-i", tmp_path,
                    "-ss", "0",
                    "-vframes", "1",
                    "-vf", f"scale={self.thumb_width}:-2",
                    "-f", "image2pipe",
                    "-vcodec", "png",
                    "pipe:1",
                ],
                capture_output=True,
            )

            if not result.stdout:
                return None

            img = Image.open(io.BytesIO(result.stdout))
            buf = io.BytesIO()
            img.save(buf, "WEBP", quality=82)
            return buf.getvalue()

        except Exception:
            return None
        finally:
            if tmp_path and os.path.exists(tmp_path):
                os.unlink(tmp_path)
