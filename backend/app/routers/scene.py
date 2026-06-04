"""Scene routes: categories, list, and single scene."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.database import get_session
from app.models.scene import Scene, SceneBackground, SceneCategory, SceneLayer
from app.schemas import (
    LayerAssetOut,
    BackgroundAssetOut,
    SceneCategoryEntryOut,
    SceneCategoryOut,
    SceneConfigOut,
)

router = APIRouter(prefix="/scene")


def _scene_load_options():
    """Eager-load options for a fully populated SceneConfigOut."""
    return [
        selectinload(Scene.background).selectinload(SceneBackground.image_asset),
        selectinload(Scene.layers).selectinload(SceneLayer.video_asset),
    ]


def _build_scene(scene: Scene) -> SceneConfigOut:
    """Build a SceneConfigOut from an already-loaded Scene."""
    bg = scene.background
    image = bg.image_asset if bg else None

    background = BackgroundAssetOut(
        id=str(image.id) if image else str(scene.id),
        src=image.src if image else "",
        thumb_src=image.thumb_src if image else None,
        loop=bg.loop if bg else True,
        opacity=bg.opacity if bg else 1.0,
        brightness=bg.brightness if bg else 1.0,
        grayscale=bg.grayscale if bg else 0.0,
        blur=bg.blur if bg else 0.0,
        flip=bg.flip if bg else False,
        blend_mode=bg.blend_mode if bg else "normal",
    )

    layers = [
        LayerAssetOut(
            id=str(layer.id),
            src=layer.video_asset.src if layer.video_asset else "",
            loop=layer.loop,
            opacity=layer.opacity,
            brightness=layer.brightness,
            grayscale=layer.grayscale,
            blur=layer.blur,
            flip=layer.flip,
            blend_mode=layer.blend_mode,
            order=layer.layer_order,
        )
        for layer in scene.layers
    ]

    return SceneConfigOut(
        id=str(scene.id), label=scene.label, background=background, layers=layers
    )


@router.get("/categories")
def get_scene_categories(
    session: Session = Depends(get_session),
) -> list[SceneCategoryOut]:
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
            scenes=[
                SceneCategoryEntryOut(id=str(s.id), label=s.label) for s in cat.scenes
            ],
        )
        for cat in categories
    ]


@router.get("")
def get_scenes(session: Session = Depends(get_session)) -> list[SceneConfigOut]:
    """Return all scenes with their backgrounds and layers."""
    scenes = session.scalars(
        select(Scene).options(*_scene_load_options()).order_by(Scene.label)
    ).all()

    return [_build_scene(scene) for scene in scenes]


@router.get("/{scene_id}")
def get_scene(
    scene_id: UUID, session: Session = Depends(get_session)
) -> SceneConfigOut:
    """Return a single scene by UUID."""
    scene = session.get(Scene, scene_id, options=_scene_load_options())
    if not scene:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"Scene {scene_id} not found"
        )
    return _build_scene(scene)
