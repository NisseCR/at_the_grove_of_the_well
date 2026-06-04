"""Base class for asset services, handling R2 and DB operations together."""

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
    extra: dict = {}  # additional fields to set on the DB model (e.g. thumb_src)


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

    def list(self, session: Session) -> list[T]:
        """Return all assets of this type ordered by label."""
        return list(session.scalars(select(self._model).order_by(self._model.label)).all())

    def upload(self, data: bytes, label: str, session: Session) -> T:
        """Process, upload to R2, and insert a DB record. Rolls back R2 on DB failure."""
        asset_id = uuid4()
        prepared = self._prepare(asset_id, data)

        uploaded: list[str] = []
        try:
            for key, (content, content_type) in prepared.files.items():
                r2.upload(key, content, content_type)
                uploaded.append(key)
        except Exception:
            for key in uploaded:
                r2.delete(key)
            raise

        asset = self._model(id=asset_id, label=label, src=prepared.src, **prepared.extra)
        session.add(asset)
        try:
            session.commit()
        except Exception:
            for key in prepared.files:
                r2.delete(key)
            raise

        session.refresh(asset)
        return asset

    def replace(self, asset_id: UUID, data: bytes, session: Session) -> T:
        """Replace the file(s) for an existing asset. Asset ID and label are unchanged.

        All asset types use fixed extensions so the R2 key never changes on replace —
        the new file is uploaded over the same key.
        """
        asset = session.get(self._model, asset_id)
        if not asset:
            raise ResourceIdNotFound(self._resource_name, str(asset_id))

        prepared = self._prepare(asset_id, data)
        for key, (content, content_type) in prepared.files.items():
            r2.upload(key, content, content_type)

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

    def patch_label(self, asset_id: UUID, label: str, session: Session) -> T:
        """Update the display label of an asset."""
        asset = session.get(self._model, asset_id)
        if not asset:
            raise ResourceIdNotFound(self._resource_name, str(asset_id))
        asset.label = label
        session.commit()
        session.refresh(asset)
        return asset
