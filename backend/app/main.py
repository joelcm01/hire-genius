from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.database import engine, Base
from app.api import candidates, vacancies, evaluations, contacts, calendar, feedback, gdrive, reports


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables if they don't exist (development convenience)
    # In production, use alembic migrations instead
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="HireGenius API",
    description="AI-powered HR candidate selection and tracking platform",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(candidates.router, prefix="/api", tags=["candidates"])
app.include_router(vacancies.router, prefix="/api", tags=["vacancies"])
app.include_router(evaluations.router, prefix="/api", tags=["evaluations"])
app.include_router(contacts.router, prefix="/api", tags=["contacts"])
app.include_router(calendar.router, prefix="/api", tags=["calendar"])
app.include_router(feedback.router, prefix="/api", tags=["feedback"])
app.include_router(gdrive.router, prefix="/api", tags=["gdrive"])
app.include_router(reports.router, prefix="/api", tags=["reports"])


@app.get("/health")
def health_check():
    return {"status": "ok", "version": "1.0.0"}
