import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.youtube import router as yt_router
from routes.instagram import router as ig_router
from utils.extractor import init_cookies

app = FastAPI(title="Clypso API", version="1.0.0")


@app.on_event("startup")
async def startup_event():
    init_cookies()


default_origins = [
    "https://clypso.vercel.app",
    "https://clypso.qzz.io",
]
env_origins = os.getenv("ALLOWED_ORIGINS", "")
extra_origins = [o.strip() for o in env_origins.split(",") if o.strip()]
allowed_origins = list(set(default_origins + extra_origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(yt_router, prefix="/youtube", tags=["YouTube"])
app.include_router(ig_router, prefix="/instagram", tags=["Instagram"])


@app.get("/")
def root():
    return {"status": "Clypso API is running"}


@app.get("/health")
def health():
    return {"status": "ok"}
