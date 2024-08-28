import os
from dotenv import load_dotenv

load_dotenv()
host = os.getenv("APIGW_HOST_ADDRESS", "127.0.0.1")
port = int(os.getenv("APIGW_PORT", 4000))

import uvicorn
from fastapi import FastAPI
from .routers import test_result_router
from .lib.database import init_db
from .lib.plugin_store import PluginStore

app = FastAPI(
    title="AI Verify API Gateway",
    description="AI Verify API Gateway",
    version="0.2.0",
)

# include routers
app.include_router(test_result_router.router)

if __name__ == "__main__":
    # init db
    init_db()
    PluginStore.check_plugin_registry()

    uvicorn.run(app, host=host, port=port)
