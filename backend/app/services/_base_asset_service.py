"""Base class for asset services, handling R2 and DB operations together."""

from typing import Optional
from uuid import UUID, uuid4

from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.storage import r2
from app.exceptions import ResourceIdNotFound


class PreparedUpload(BaseModel):
    """Processed files ready for R2 upload, with their DB src values."""

    model_config = {"arbitrary_types_allowed": True}

    files: dict[str, tuple[bytes, str]]  # R2 key → (data, content_type)
    src: str
    extra: dict = {}  # additional fields to set on the DB model (e.g. thumb_src, duration)


class BaseAssetService[T]:
    """Manages an asset type: R2 storage and DB records as a single unit.

    Subclasses must set _model and _resource_name, and implement _keys and _prepare.
    """

    _model: type
    _resource_name: str

    def _keys(self, asset_id: UUID) -> list[str]:
        """All R2 keys belonging to this asset (used for deletion)."""
        raise NotImplementedError

    def _prepare(self, asset_id: UUID, data: bytes) -> PreparedUpload:
        """Process raw bytes and return upload-ready files with their R2 keys."""
        raise NotImplementedError

    def list(self, session: Session, *load_options) -> list[T]:
        """Return all assets of this type ordered by label."""
        q = select(self._model).order_by(self._model.label)
        if load_options:
            q = q.options(*load_options)
        return list(session.scalars(q).all())

    def upload(self, data: bytes, label: str, session: Session, artist: Optional[str] = None, **prepare_kwargs) -> T:
        """Process, upload to R2, and insert a DB record. Rolls back R2 on DB failure.

        Extra keyword arguments are forwarded to ``_prepare`` so subclasses can
        accept processing options (e.g. ``norm_mode`` for audio) without changing
        the base class signature.
        """
        asset_id = uuid4()
        prepared = self._prepare(asset_id, data, **prepare_kwargs)

        uploaded: list[str] = []
        try:
            for key, (content, content_type) in prepared.files.items():
                r2.upload(key, content, content_type)
                uploaded.append(key)
        except Exception:
            for key in uploaded:
                r2.delete(key)
            raise

        asset = self._model(
            id=asset_id, label=label, src=prepared.src, artist=artist, **prepared.extra
        )
        session.add(asset)
        try:
            session.commit()
        except Exception:
            for key in prepared.files:
                r2.delete(key)
            raise

        session.refresh(asset)
        return asset

    def replace(self, asset_id: UUID, data: bytes, session: Session, **prepare_kwargs) -> T:
        """Replace the file(s) for an existing asset. Asset ID and label are unchanged.

        A new file UUID is generated so the R2 key changes, busting the CDN cache.
        The DB src is updated, and the old R2 files are deleted after a successful commit.
        Extra keyword arguments are forwarded to ``_prepare`` (e.g. ``norm_mode`` for audio).
        """
        asset = session.get(self._model, asset_id)
        if not asset:
            raise ResourceIdNotFound(self._resource_name, str(asset_id))

        old_src = asset.src
        old_thumb_src = getattr(asset, "thumb_src", None)

        prepared = self._prepare(uuid4(), data, **prepare_kwargs)

        uploaded: list[str] = []
        try:
            for key, (content, content_type) in prepared.files.items():
                r2.upload(key, content, content_type)
                uploaded.append(key)
        except Exception:
            for key in uploaded:
                r2.delete(key)
            raise

        asset.src = prepared.src
        for field, value in prepared.extra.items():
            setattr(asset, field, value)
        try:
            session.commit()
        except Exception:
            for key in uploaded:
                r2.delete(key)
            raise

        r2.delete(old_src)
        if old_thumb_src:
            r2.delete(old_thumb_src)

        session.refresh(asset)
        return asset

    def delete(self, asset_id: UUID, session: Session) -> None:
        """Delete the asset from the DB then remove its files from R2."""
        asset = session.get(self._model, asset_id)
        if not asset:
            raise ResourceIdNotFound(self._resource_name, str(asset_id))

        session.delete(asset)
        session.commit()
        for key in self._keys(asset_id):
            r2.delete(key)

    def patch(self, asset_id: UUID, session: Session, **fields) -> T:
        """Update one or more fields on an asset. Only provided fields are changed."""
        asset = session.get(self._model, asset_id)
        if not asset:
            raise ResourceIdNotFound(self._resource_name, str(asset_id))
        for field, value in fields.items():
            setattr(asset, field, value)
        session.commit()
        session.refresh(asset)
        return asset
