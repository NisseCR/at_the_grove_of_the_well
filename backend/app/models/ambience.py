from pydantic import BaseModel


class AmbienceAsset(BaseModel):
    id: str
    src: str


class AmbienceConfig(BaseModel):
    id: str
    ambiences: list[AmbienceAsset]


class AmbienceCategoryEntry(BaseModel):
    id: str
    label: str


class AmbienceCategory(BaseModel):
    id: str
    src: str
    order: int
    ambiences: list[AmbienceCategoryEntry]
