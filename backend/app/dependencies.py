from typing import TypeVar, Callable
from fastapi import HTTPException, Request

T = TypeVar("T")


def get_or_404(fetcher: Callable[[], T | None], detail: str) -> T:
    """
    Call fetcher(), return the result, or raise a 404 with detail if None.
    """
    result = fetcher()
    if result is None:
        raise HTTPException(status_code=404, detail=detail)
    return result
