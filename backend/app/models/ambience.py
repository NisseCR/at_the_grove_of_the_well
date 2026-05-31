from pydantic import BaseModel


class AmbienceAsset(BaseModel):
    id: str
    src: str


class AmbienceConfig(BaseModel):
    id: str
    ambiences: list[AmbienceAsset]


class AmbienceCategory(BaseModel):
    id: str
    src: str
    order: int
    ambience_ids: list[str]
