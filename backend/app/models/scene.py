from pydantic import BaseModel
from typing import Literal

BlendMode = Literal[
    "normal",
    "multiply",
    "screen",
    "overlay",
    "darken",
    "lighten",
    "color-dodge",
    "color-burn",
    "hard-light",
    "soft-light",
    "difference",
    "exclusion",
    "hue",
    "saturation",
    "color",
    "luminosity",
]

FileType = Literal["image", "video"]


class SceneAsset(BaseModel):
    id: str
    src: str
    type: FileType
    loop: bool = True
    opacity: float = 1.0
    brightness: float = 1.0
    grayscale: float = 0.0
    blur: float = 0.0
    flip: bool = False
    blend_mode: BlendMode = "normal"


class BackgroundAsset(SceneAsset):
    pass


class LayerAsset(SceneAsset):
    order: int


class SceneConfig(BaseModel):
    id: str
    background: BackgroundAsset
    layers: list[LayerAsset]
