from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from starlette.middleware.cors import CORSMiddleware

from api import get_api_routers
from webhooks import get_webhooks
from core.config import Settings, configure_logging
from scheduler import init_scheduler


config = Settings() # pyright: ignore[reportCallIssue]
configure_logging()

@asynccontextmanager
async def lifespan(app: FastAPI):    
    yield


app = FastAPI(
    lifespan=lifespan,
    title='Books Exchange',
    description='Books Exchange is a platform for book exchange',
    debug=config.DEBUG if config.DEBUG is not None else config.APP_STAGE == "dev",
)

# Mount static
app.mount('/media', StaticFiles(directory=config.MEDIA_DIR, check_dir=False), 'media')

# Including routers
app.include_router(get_api_routers())
app.include_router(get_webhooks())

@app.get('/')
@app.get('/ping')
async def ping():
    return {'status': 'operating'}

# Adding middlewares

# Optional CORS; enable only when calling API directly, without proxy
# def _parse_csv(value: str) -> list[str]:
#     if not value:
#         return []
#     return [item.strip() for item in value.split(",") if item.strip()]

# allowed_origins = _parse_csv(config.CORS_ALLOW_ORIGINS)
# allow_origin_regex = config.CORS_ALLOW_ORIGIN_REGEX or None

# if allowed_origins or allow_origin_regex:
#     app.add_middleware(
#         CORSMiddleware,
#         allow_origins=allowed_origins,
#         allow_origin_regex=allow_origin_regex,
#         allow_methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
#         allow_headers=['X-CSRF-Token', 'X-Requested-With', 'Accept', 'Content-Type', 'Authorization', 'X-Client'],
#         allow_credentials=True,
#     )

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host=config.API_HOST, port=config.API_PORT)
