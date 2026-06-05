"""Scene table models: scenes, backgrounds, layers, and categories."""

from typing import Optional
from uuid import UUID, uuid4

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import BlendMode


class LayerProperties:
    """Mixin: shared CSS visual properties for scene backgrounds and layers."""

    loop: Mapped[bool] = mapped_column(default=True)
    opacity: Mapped[float] = mapped_column(default=1.0)
    brightness: Mapped[float] = mapped_column(default=1.0)
    grayscale: Mapped[float] = mapped_column(default=0.0)
    blur: Mapped[float] = mapped_column(default=0.0)
    flip: Mapped[bool] = mapped_column(default=False)
    blend_mode: Mapped[BlendMode] = mapped_column(default=BlendMode.normal)


class Scene(Base):
    __tablename__ = "scene"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    slug: Mapped[Optional[str]] = mapped_column(unique=True, default=None)
    label: Mapped[str]

    background: Mapped["SceneBackground"] = relationship(uselist=False)
    layers: Mapped[list["SceneLayer"]] = relationship(order_by="SceneLayer.layer_order")


class SceneBackground(LayerProperties, Base):
    """1:1 with Scene. Exactly one of image_asset_id or video_asset_id should be set."""

    __tablename__ = "scene_background"

    scene_id: Mapped[UUID] = mapped_column(
        ForeignKey("scene.id", ondelete="CASCADE"), primary_key=True
    )
    image_asset_id: Mapped[Optional[UUID]] = mapped_column(
        ForeignKey("image_asset.id", ondelete="SET NULL"), default=None
    )
    video_asset_id: Mapped[Optional[UUID]] = mapped_column(
        ForeignKey("video_asset.id", ondelete="SET NULL"), default=None
    )

    image_asset: Mapped[Optional["ImageAsset"]] = relationship(
        foreign_keys=[image_asset_id]
    )
    video_asset: Mapped[Optional["VideoAsset"]] = relationship(
        foreign_keys=[video_asset_id]
    )


class SceneLayer(LayerProperties, Base):
    """Exactly one of image_asset_id or video_asset_id should be set."""

    __tablename__ = "scene_layer"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    scene_id: Mapped[UUID] = mapped_column(ForeignKey("scene.id", ondelete="CASCADE"))
    image_asset_id: Mapped[Optional[UUID]] = mapped_column(
        ForeignKey("image_asset.id", ondelete="SET NULL"), default=None
    )
    video_asset_id: Mapped[Optional[UUID]] = mapped_column(
        ForeignKey("video_asset.id", ondelete="SET NULL"), default=None
    )
    layer_order: Mapped[int]

    image_asset: Mapped[Optional["ImageAsset"]] = relationship(
        foreign_keys=[image_asset_id]
    )
    video_asset: Mapped[Optional["VideoAsset"]] = relationship(
        foreign_keys=[video_asset_id]
    )


class SceneCategory(Base):
    __tablename__ = "scene_category"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    label: Mapped[str]
    display_order: Mapped[int]

    scenes: Mapped[list["Scene"]] = relationship(
        secondary="scene_category_link", order_by="Scene.label"
    )


class SceneCategoryLink(Base):
    __tablename__ = "scene_category_link"

    category_id: Mapped[UUID] = mapped_column(
        ForeignKey("scene_category.id", ondelete="CASCADE"), primary_key=True
    )
    scene_id: Mapped[UUID] = mapped_column(
        ForeignKey("scene.id", ondelete="CASCADE"), primary_key=True
    )


# resolve forward references used in relationship()
from app.models.assets import ImageAsset, VideoAsset  # noqa: E402
