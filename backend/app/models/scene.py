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


class BackgroundConfig(BaseModel):
    src: str
    type: FileType
    opacity: float = 1.0
    brightness: float = 1.0
    grayscale: float = 0.0
    blur: float = 0.0
    flip: bool = False
    blend_mode: BlendMode = "normal"


class LayerConfig(BaseModel):
    id: str
    src: str
    type: FileType
    loop: bool = True
    visible: bool = True
    order: int
    opacity: float = 1.0
    brightness: float = 1.0
    grayscale: float = 0.0
    blur: float = 0.0
    flip: bool = False
    blend_mode: BlendMode = "normal"


class SceneConfig(BaseModel):
    id: str
    name: str
    background: BackgroundConfig
    layers: list[LayerConfig]
