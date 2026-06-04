"""Scene table models: scenes, backgrounds, layers, and categories."""

from typing import Optional
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel

from app.models.enums import BlendMode


class SceneVisualProperties(SQLModel):
    """Shared CSS visual properties applied to scene backgrounds and layers.

    These map directly to CSS filter and blend-mode values applied by the
    player's SceneAsset component.
    """

    loop: bool = True
    opacity: float = 1.0
    brightness: float = 1.0
    grayscale: float = 0.0
    blur: float = 0.0
    flip: bool = False
    blend_mode: BlendMode = BlendMode.normal


class Scene(SQLModel, table=True):
    """A named scene composed of a background image and ordered video layers."""

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    label: str


class SceneBackground(SceneVisualProperties, table=True):
    """The background image for a scene with CSS compositing properties.

    Uses scene_id as its primary key, enforcing a strict 1:1 relationship
    with Scene. Deleting the scene cascades to this row; deleting the image
    asset sets image_asset_id to null rather than removing the background.
    """

    scene_id: UUID = Field(
        primary_key=True,
        foreign_key="scene.id",
        ondelete="CASCADE",
    )
    image_asset_id: Optional[UUID] = Field(
        default=None,
        foreign_key="imageasset.id",
        ondelete="SET NULL",
    )


class SceneLayer(SceneVisualProperties, table=True):
    """An ordered video overlay layer within a scene.

    layer_order determines the z-index stack; lower values render beneath
    higher values. Deleting the scene cascades to all its layers; deleting
    the video asset sets video_asset_id to null.
    """

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    scene_id: UUID = Field(foreign_key="scene.id", ondelete="CASCADE")
    video_asset_id: Optional[UUID] = Field(
        default=None,
        foreign_key="videoasset.id",
        ondelete="SET NULL",
    )
    layer_order: int


class SceneCategory(SQLModel, table=True):
    """A display category for grouping scenes in the controller.

    display_order controls the position of this category relative to others.
    """

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    label: str
    display_order: int


class SceneCategoryLink(SQLModel, table=True):
    """Many-to-many link between scenes and scene categories."""

    category_id: UUID = Field(
        foreign_key="scenecategory.id",
        primary_key=True,
        ondelete="CASCADE",
    )
    scene_id: UUID = Field(
        foreign_key="scene.id",
        primary_key=True,
        ondelete="CASCADE",
    )
