import os
from typing import final
from dotenv import load_dotenv

load_dotenv()
host = os.getenv("APIGW_HOST_ADDRESS", "127.0.0.1")
port = int(os.getenv("APIGW_PORT", 4000))

import uvicorn
from fastapi import FastAPI, openapi
from fastapi.openapi.utils import get_openapi
from .lib.logging import logger
from .routers import test_result_router
from .lib.database import engine
from .models import BaseORMModel
from .lib.plugin_store import PluginStore


# init db
BaseORMModel.metadata.create_all(bind=engine)

app = FastAPI()

# include routers
app.include_router(test_result_router.router)



# modify the openai schema 
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    # openapi_schema = app.openapi()
    openapi_schema = get_openapi(
        title="AI Verify API Gateway",
        description="AI Verify API Gateway",
        version="0.2.0",
        routes=app.routes,
    )

    try:
        paths = openapi_schema["paths"]
        components = openapi_schema["components"]
        upload_key = "/test_result/upload"
        if upload_key in paths:
            # add type of test_result field to "object". Is there a better way to force the type to object?
            path = paths[upload_key]["post"]
            component_ref = path["requestBody"]["content"]["multipart/form-data"]["schema"]["$ref"].split("/")[3]
            component = components["schemas"][component_ref]
            component["properties"]["test_result"]["type"] = "object"
    except Exception as e:
        logger.warn(f"Error updating openapi schema: {e}")

    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi



if __name__ == "__main__":
    PluginStore.check_plugin_registry()

    uvicorn.run(app, host=host, port=port)
