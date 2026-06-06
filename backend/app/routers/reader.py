"""Reader routes — public endpoints for listing and fetching markdown story files."""

import re
from pathlib import Path

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import FileResponse
from pydantic import BaseModel

from app.core.config import settings

router = APIRouter(prefix="/reader")

READER_DIR = settings.base_dir / "data" / "reader"
_FM_PATTERN = re.compile(r"^---\n(.*?)\n---", re.DOTALL)


class ReaderFileOut(BaseModel):
    """Minimal story file descriptor for the listing endpoint."""

    slug: str
    title: str


def _extract_title(content: str, slug: str) -> str:
    """Return the title from frontmatter, falling back to a humanised slug."""
    match = _FM_PATTERN.match(content)
    if match:
        for line in match.group(1).splitlines():
            if line.startswith("title:"):
                return line[len("title:"):].strip()
    return slug.replace("-", " ").title()


@router.get("")
def list_stories() -> list[ReaderFileOut]:
    """Return slug and title for every markdown file in the reader data directory."""
    if not READER_DIR.is_dir():
        return []
    stories = []
    for path in sorted(READER_DIR.glob("*.md")):
        content = path.read_text(encoding="utf-8")
        stories.append(ReaderFileOut(slug=path.stem, title=_extract_title(content, path.stem)))
    return stories


@router.get("/{slug}")
def get_story(slug: str) -> FileResponse:
    """Serve the raw markdown file as text/plain."""
    path = READER_DIR / f"{slug}.md"
    if not path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Story '{slug}' not found",
        )
    return FileResponse(path, media_type="text/plain; charset=utf-8")
