"""Scene routes: categories, list, single scene, and full CRUD for editor."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.database import get_session
from app.models.assets import ImageAsset, VideoAsset
from app.models.scene import Scene, SceneBackground, SceneCategoryLink, SceneLayer
from app.models.scene import SceneCategory
from app.schemas import (
    BackgroundAssetOut,
    BackgroundEditorOut,
    LayerAssetOut,
    LayerEditorOut,
    SceneCategoryCreateIn,
    SceneCategoryEntryOut,
    SceneCategoryOut,
    SceneCategoryPatchIn,
    SceneCreateIn,
    SceneEditorOut,
    SceneLayerCreateIn,
    SceneLayerPatchIn,
    SceneLayerReorderIn,
    SceneOut,
    ScenePatchIn,
    SceneBackgroundPatchIn,
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


# ---------------------------------------------------------------------------
# Editor serialisers
# ---------------------------------------------------------------------------


def _build_background_editor(bg: SceneBackground | None) -> BackgroundEditorOut:
    """Serialize a SceneBackground for the editor."""
    if bg is None:
        return BackgroundEditorOut()

    asset_id = label = asset_type = thumb_src = None
    if bg.image_asset:
        asset_id = str(bg.image_asset.id)
        label = bg.image_asset.label
        asset_type = "image"
        thumb_src = bg.image_asset.thumb_src
    elif bg.video_asset:
        asset_id = str(bg.video_asset.id)
        label = bg.video_asset.label
        asset_type = "video"

    return BackgroundEditorOut(
        asset_id=asset_id,
        label=label,
        type=asset_type,
        thumb_src=thumb_src,
        loop=bg.loop,
        opacity=bg.opacity,
        brightness=bg.brightness,
        grayscale=bg.grayscale,
        blur=bg.blur,
        flip=bg.flip,
        blend_mode=bg.blend_mode,
    )


def _build_layer_editor(layer: SceneLayer) -> LayerEditorOut:
    """Serialize a SceneLayer for the editor."""
    if layer.image_asset:
        asset_id = str(layer.image_asset.id)
        label = layer.image_asset.label
        asset_type: str = "image"
    elif layer.video_asset:
        asset_id = str(layer.video_asset.id)
        label = layer.video_asset.label
        asset_type = "video"
    else:
        asset_id = str(layer.id)
        label = "Unknown"
        asset_type = "image"

    return LayerEditorOut(
        layer_id=str(layer.id),
        asset_id=asset_id,
        label=label,
        type=asset_type,
        order=layer.layer_order,
        loop=layer.loop,
        opacity=layer.opacity,
        brightness=layer.brightness,
        grayscale=layer.grayscale,
        blur=layer.blur,
        flip=layer.flip,
        blend_mode=layer.blend_mode,
    )


def _build_scene_editor(scene: Scene) -> SceneEditorOut:
    """Build a SceneEditorOut from an already-loaded Scene."""
    return SceneEditorOut(
        id=str(scene.id),
        slug=scene.slug,
        label=scene.label,
        background=_build_background_editor(scene.background),
        layers=[_build_layer_editor(layer) for layer in scene.layers],
    )


# ---------------------------------------------------------------------------
# Scene editor reads
# ---------------------------------------------------------------------------


@router.get("/{scene_id}/editor")
def get_scene_editor(scene_id: UUID, session: Session = Depends(get_session)) -> SceneEditorOut:
    """Return a single scene in editor format (includes layer_id, asset labels)."""
    scene = session.get(Scene, scene_id, options=_scene_load_options())
    if not scene:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Scene {scene_id} not found")
    return _build_scene_editor(scene)


# ---------------------------------------------------------------------------
# Scene writes
# ---------------------------------------------------------------------------


@router.post("")
def create_scene(body: SceneCreateIn, session: Session = Depends(get_session)) -> SceneEditorOut:
    """Create a new scene with a blank background."""
    scene = Scene(label=body.label, slug=body.slug or None)
    session.add(scene)
    session.flush()  # get scene.id before creating background

    background = SceneBackground(
        scene_id=scene.id,
        loop=True, opacity=1.0, brightness=1.0, grayscale=0.0, blur=0.0, flip=False, blend_mode="normal",
    )
    session.add(background)
    session.commit()
    session.refresh(scene)
    session.refresh(scene, ["background", "layers"])
    return _build_scene_editor(scene)


@router.patch("/{scene_id}")
def patch_scene(
    scene_id: UUID,
    body: ScenePatchIn,
    session: Session = Depends(get_session),
) -> SceneEditorOut:
    """Update a scene's label or slug."""
    scene = session.get(Scene, scene_id, options=_scene_load_options())
    if not scene:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Scene {scene_id} not found")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(scene, field, value or None if field == "slug" else value)

    session.commit()
    session.refresh(scene)
    return _build_scene_editor(scene)


@router.delete("/{scene_id}", status_code=204)
def delete_scene(scene_id: UUID, session: Session = Depends(get_session)) -> None:
    """Delete a scene, its background, and all layers."""
    scene = session.get(Scene, scene_id)
    if not scene:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Scene {scene_id} not found")
    session.delete(scene)
    session.commit()


# ---------------------------------------------------------------------------
# Background writes
# ---------------------------------------------------------------------------


@router.patch("/{scene_id}/background")
def patch_background(
    scene_id: UUID,
    body: SceneBackgroundPatchIn,
    session: Session = Depends(get_session),
) -> BackgroundEditorOut:
    """Update background asset and/or visual properties."""
    scene = session.get(Scene, scene_id, options=_scene_load_options())
    if not scene:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Scene {scene_id} not found")

    bg = scene.background
    if bg is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Background not found")

    fields = body.model_dump(exclude_unset=True)

    if "image_asset_id" in fields:
        raw_id = fields.pop("image_asset_id")
        image_id = UUID(raw_id) if raw_id else None
        if image_id and not session.get(ImageAsset, image_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ImageAsset not found")
        bg.image_asset_id = image_id
        bg.video_asset_id = None

    if "video_asset_id" in fields:
        raw_id = fields.pop("video_asset_id")
        video_id = UUID(raw_id) if raw_id else None
        if video_id and not session.get(VideoAsset, video_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="VideoAsset not found")
        bg.video_asset_id = video_id
        bg.image_asset_id = None

    for field, value in fields.items():
        setattr(bg, field, value)

    session.commit()
    session.refresh(bg)
    session.refresh(bg, ["image_asset", "video_asset"])
    return _build_background_editor(bg)


# ---------------------------------------------------------------------------
# Layer writes
# ---------------------------------------------------------------------------


@router.post("/{scene_id}/layers")
def add_layer(
    scene_id: UUID,
    body: SceneLayerCreateIn,
    session: Session = Depends(get_session),
) -> LayerEditorOut:
    """Append a new layer to a scene."""
    scene = session.get(Scene, scene_id)
    if not scene:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Scene {scene_id} not found")

    image_id = UUID(body.image_asset_id) if body.image_asset_id else None
    video_id = UUID(body.video_asset_id) if body.video_asset_id else None

    if image_id and not session.get(ImageAsset, image_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ImageAsset not found")
    if video_id and not session.get(VideoAsset, video_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="VideoAsset not found")

    existing = session.scalars(select(SceneLayer).where(SceneLayer.scene_id == scene_id)).all()
    layer = SceneLayer(
        scene_id=scene_id,
        image_asset_id=image_id,
        video_asset_id=video_id,
        layer_order=len(existing),
        loop=True, opacity=1.0, brightness=1.0, grayscale=0.0, blur=0.0, flip=False, blend_mode="normal",
    )
    session.add(layer)
    session.commit()
    session.refresh(layer)
    session.refresh(layer, ["image_asset", "video_asset"])
    return _build_layer_editor(layer)


@router.patch("/{scene_id}/layers/{layer_id}")
def patch_layer(
    scene_id: UUID,
    layer_id: UUID,
    body: SceneLayerPatchIn,
    session: Session = Depends(get_session),
) -> LayerEditorOut:
    """Update a layer's asset and/or visual properties."""
    layer = session.get(SceneLayer, layer_id, options=[
        selectinload(SceneLayer.image_asset),
        selectinload(SceneLayer.video_asset),
    ])
    if not layer or layer.scene_id != scene_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Layer {layer_id} not found")

    fields = body.model_dump(exclude_unset=True)

    if "image_asset_id" in fields:
        raw_id = fields.pop("image_asset_id")
        image_id = UUID(raw_id) if raw_id else None
        if image_id and not session.get(ImageAsset, image_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ImageAsset not found")
        layer.image_asset_id = image_id
        layer.video_asset_id = None

    if "video_asset_id" in fields:
        raw_id = fields.pop("video_asset_id")
        video_id = UUID(raw_id) if raw_id else None
        if video_id and not session.get(VideoAsset, video_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="VideoAsset not found")
        layer.video_asset_id = video_id
        layer.image_asset_id = None

    for field, value in fields.items():
        setattr(layer, field, value)

    session.commit()
    session.refresh(layer)
    session.refresh(layer, ["image_asset", "video_asset"])
    return _build_layer_editor(layer)


@router.delete("/{scene_id}/layers/{layer_id}", status_code=204)
def delete_layer(
    scene_id: UUID,
    layer_id: UUID,
    session: Session = Depends(get_session),
) -> None:
    """Remove a layer from a scene."""
    layer = session.get(SceneLayer, layer_id)
    if not layer or layer.scene_id != scene_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Layer {layer_id} not found")
    session.delete(layer)
    session.commit()


@router.post("/{scene_id}/layers/reorder", status_code=204)
def reorder_layers(
    scene_id: UUID,
    body: SceneLayerReorderIn,
    session: Session = Depends(get_session),
) -> None:
    """Set layer_order for all layers in the scene based on the provided ordered list."""
    layers = {
        str(layer.id): layer
        for layer in session.scalars(select(SceneLayer).where(SceneLayer.scene_id == scene_id)).all()
    }
    for i, layer_id in enumerate(body.layer_ids):
        if layer_id in layers:
            layers[layer_id].layer_order = i
    session.commit()


# ---------------------------------------------------------------------------
# Category writes
# ---------------------------------------------------------------------------


@router.post("/categories")
def create_category(
    body: SceneCategoryCreateIn,
    session: Session = Depends(get_session),
) -> SceneCategoryOut:
    """Create a new scene category."""
    cat = SceneCategory(label=body.label, display_order=body.display_order)
    session.add(cat)
    session.commit()
    session.refresh(cat)
    session.refresh(cat, ["scenes"])
    return SceneCategoryOut(id=str(cat.id), label=cat.label, order=cat.display_order, scenes=[])


@router.patch("/categories/{category_id}")
def patch_category(
    category_id: UUID,
    body: SceneCategoryPatchIn,
    session: Session = Depends(get_session),
) -> SceneCategoryOut:
    """Update a scene category's label or display_order."""
    cat = session.get(SceneCategory, category_id, options=[selectinload(SceneCategory.scenes)])
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Category {category_id} not found")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(cat, field, value)

    session.commit()
    session.refresh(cat)
    return SceneCategoryOut(
        id=str(cat.id),
        label=cat.label,
        order=cat.display_order,
        scenes=[SceneCategoryEntryOut(id=str(s.id), label=s.label) for s in cat.scenes],
    )


@router.delete("/categories/{category_id}", status_code=204)
def delete_category(category_id: UUID, session: Session = Depends(get_session)) -> None:
    """Delete a scene category. Linked scenes are not deleted."""
    cat = session.get(SceneCategory, category_id)
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Category {category_id} not found")
    session.delete(cat)
    session.commit()


@router.post("/categories/{category_id}/scenes/{scene_id}", status_code=204)
def add_scene_to_category(
    category_id: UUID,
    scene_id: UUID,
    session: Session = Depends(get_session),
) -> None:
    """Add a scene to a category. No-ops if already linked."""
    if not session.get(SceneCategory, category_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Category {category_id} not found")
    if not session.get(Scene, scene_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Scene {scene_id} not found")

    existing = session.get(SceneCategoryLink, (category_id, scene_id))
    if not existing:
        session.add(SceneCategoryLink(category_id=category_id, scene_id=scene_id))
        session.commit()


@router.delete("/categories/{category_id}/scenes/{scene_id}", status_code=204)
def remove_scene_from_category(
    category_id: UUID,
    scene_id: UUID,
    session: Session = Depends(get_session),
) -> None:
    """Remove a scene from a category."""
    link = session.get(SceneCategoryLink, (category_id, scene_id))
    if link:
        session.delete(link)
        session.commit()
