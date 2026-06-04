"""Reconcile service: diff R2 bucket contents against DB asset records."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.storage import r2
from app.models.assets import AudioAsset, ImageAsset, VideoAsset


class ReconcileService:
    """Identifies orphaned R2 files and broken DB asset records."""

    def reconcile(self, session: Session) -> dict:
        """Diff R2 bucket contents against DB asset records.

        Orphaned files: R2 keys not referenced by any DB asset (including thumbnails).
        Broken assets: DB records whose main src file is missing from R2.
        """
        r2_keys = set(r2.list_keys())

        all_db_srcs: set[str] = set()
        main_srcs: dict[str, dict] = {}

        for asset in session.scalars(select(ImageAsset)).all():
            all_db_srcs.add(asset.src)
            main_srcs[asset.src] = {"id": str(asset.id), "label": asset.label, "type": "image"}
            if asset.thumb_src:
                all_db_srcs.add(asset.thumb_src)

        for asset in session.scalars(select(AudioAsset)).all():
            all_db_srcs.add(asset.src)
            main_srcs[asset.src] = {"id": str(asset.id), "label": asset.label, "type": "audio"}

        for asset in session.scalars(select(VideoAsset)).all():
            all_db_srcs.add(asset.src)
            main_srcs[asset.src] = {"id": str(asset.id), "label": asset.label, "type": "video"}

        orphaned_files = [{"key": key} for key in r2_keys if key not in all_db_srcs]
        broken_assets = [
            {"id": meta["id"], "label": meta["label"], "src": src, "type": meta["type"]}
            for src, meta in main_srcs.items()
            if src not in r2_keys
        ]

        return {"orphaned_files": orphaned_files, "broken_assets": broken_assets}


reconcile_service = ReconcileService()
