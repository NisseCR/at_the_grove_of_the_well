from pydantic import BaseModel


class AmbienceAsset(BaseModel):
    id: str
    src: str


class AmbienceConfig(BaseModel):
    id: str
    name: str
    ambiences: list[AmbienceAsset]
