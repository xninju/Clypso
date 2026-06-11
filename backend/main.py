from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.youtube import router as yt_router
from routes.instagram import router as ig_router

app = FastAPI(title="Clypso API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://clypso.vercel.app",
        "https://clypso.qzz.io",
    ],
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
