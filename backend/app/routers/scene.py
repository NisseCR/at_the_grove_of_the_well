"""Scene routes: categories, list, and single scene."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.database import get_session
from app.models.scene import Scene, SceneBackground, SceneLayer
from app.models.scene import SceneCategory
from app.schemas import (
    BackgroundAssetOut,
    LayerAssetOut,
    SceneCategoryEntryOut,
    SceneCategoryOut,
    SceneOut,
)

router = APIRouter(prefix="/scene")


def _scene_load_options():
    """Eager-load options for a fully populated SceneOut."""
    return [
        selectinload(Scene.background).selectinload(SceneBackground.image_asset),
        selectinload(Scene.background).selectinload(SceneBackground.video_asset),
        selectinload(Scene.layers).selectinload(SceneLayer.image_asset),
        selectinload(Scene.layers).selectinload(SceneLayer.video_asset),
    ]


def _build_background(bg: SceneBackground | None, scene_id: str) -> BackgroundAssetOut:
    """Serialize a SceneBackground, resolving whichever asset type is set."""
    if bg is None:
        return BackgroundAssetOut(id=scene_id, src="", type="image")

    if bg.image_asset:
        return BackgroundAssetOut(
            id=str(bg.image_asset.id),
            src=bg.image_asset.src,
            type="image",
            thumb_src=bg.image_asset.thumb_src,
            loop=bg.loop,
            opacity=bg.opacity,
            brightness=bg.brightness,
            grayscale=bg.grayscale,
            blur=bg.blur,
            flip=bg.flip,
            blend_mode=bg.blend_mode,
        )

    if bg.video_asset:
        return BackgroundAssetOut(
            id=str(bg.video_asset.id),
            src=bg.video_asset.src,
            type="video",
            loop=bg.loop,
            opacity=bg.opacity,
            brightness=bg.brightness,
            grayscale=bg.grayscale,
            blur=bg.blur,
            flip=bg.flip,
            blend_mode=bg.blend_mode,
        )

    return BackgroundAssetOut(id=scene_id, src="", type="image")


def _build_scene(scene: Scene) -> SceneOut:
    """Build a SceneOut from an already-loaded Scene."""
    background = _build_background(scene.background, str(scene.id))

    layers = []
    for layer in scene.layers:
        if layer.image_asset:
            asset_id = str(layer.image_asset.id)
            src = layer.image_asset.src
            asset_type = "image"
        elif layer.video_asset:
            asset_id = str(layer.video_asset.id)
            src = layer.video_asset.src
            asset_type = "video"
        else:
            asset_id = str(layer.id)
            src = ""
            asset_type = "image"

        layers.append(LayerAssetOut(
            id=asset_id,
            src=src,
            type=asset_type,
            loop=layer.loop,
            opacity=layer.opacity,
            brightness=layer.brightness,
            grayscale=layer.grayscale,
            blur=layer.blur,
            flip=layer.flip,
            blend_mode=layer.blend_mode,
            order=layer.layer_order,
        ))

    return SceneOut(
        id=str(scene.id),
        slug=scene.slug,
        label=scene.label,
        background=background,
        layers=layers,
    )


@router.get("/categories")
def get_scene_categories(session: Session = Depends(get_session)) -> list[SceneCategoryOut]:
    """Return all scene categories with their scene entries, sorted by display order."""
    categories = session.scalars(
        select(SceneCategory)
        .options(selectinload(SceneCategory.scenes))
        .order_by(SceneCategory.display_order)
    ).all()

    return [
        SceneCategoryOut(
            id=str(cat.id),
            label=cat.label,
            order=cat.display_order,
            scenes=[SceneCategoryEntryOut(id=str(s.id), label=s.label) for s in cat.scenes],
        )
        for cat in categories
    ]


@router.get("")
def get_scenes(session: Session = Depends(get_session)) -> list[SceneOut]:
    """Return all scenes with their backgrounds and layers."""
    scenes = session.scalars(
        select(Scene).options(*_scene_load_options()).order_by(Scene.label)
    ).all()
    return [_build_scene(scene) for scene in scenes]


@router.get("/{scene_id}")
def get_scene(scene_id: UUID, session: Session = Depends(get_session)) -> SceneOut:
    """Return a single scene by UUID."""
    scene = session.get(Scene, scene_id, options=_scene_load_options())
    if not scene:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"Scene {scene_id} not found"
        )
    return _build_scene(scene)
