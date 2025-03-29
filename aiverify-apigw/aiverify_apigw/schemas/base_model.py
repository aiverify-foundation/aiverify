from pydantic import BaseModel, ConfigDict


class MyBaseModel(BaseModel):
    model_config = ConfigDict(strict=True)
