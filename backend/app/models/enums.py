"""Shared enumerations for model fields."""

from enum import Enum


class BlendMode(str, Enum):
    """CSS blend mode values for scene layer compositing."""

    normal = "normal"
    multiply = "multiply"
    screen = "screen"
    overlay = "overlay"
    darken = "darken"
    lighten = "lighten"
    color_dodge = "color-dodge"
    color_burn = "color-burn"
    hard_light = "hard-light"
    soft_light = "soft-light"
    difference = "difference"
    exclusion = "exclusion"
    hue = "hue"
    saturation = "saturation"
    color = "color"
    luminosity = "luminosity"
