from typing import TypeVar, Callable
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

T = TypeVar("T")
_bearer = HTTPBearer()


def get_or_404(fetcher: Callable[[], T | None], detail: str) -> T:
    result = fetcher()
    if result is None:
        raise HTTPException(status_code=404, detail=detail)
    return result


def require_auth(request: Request, credentials: HTTPAuthorizationCredentials = Depends(_bearer)) -> None:
    if credentials.credentials != request.app.state.auth_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
