"""
Dixy UI - A/B Testing Microservice
Interactive shopping interface for testing UX flows and mission completion

Run:
    uvicorn main:app --reload --host 127.0.0.1 --port 8000

Visit:
    http://127.0.0.1:8000
"""

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
import os

from app.routes_catalog import router as catalog_router
from app.routes_missions import router as missions_router
from app.config import UI_CONFIG
from app.analytics import click_tracker

# Initialize FastAPI app
app = FastAPI(
    title="Dixy UI - A/B Testing",
    description="Interactive shopping interface for UX testing",
    version="2.0.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup templates and static files
template_dir = os.path.join(os.path.dirname(__file__), "templates")
templates = Jinja2Templates(directory=template_dir)

static_dir = os.path.join(os.path.dirname(__file__), "static")
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Include routers
app.include_router(catalog_router)
app.include_router(missions_router)


@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    """Main application page"""
    return templates.TemplateResponse(
        request=request,
        name="app.html",
        context={"config": UI_CONFIG},
    )


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "ok", "service": "dixy-ui"}


@app.post("/api/click-log")
async def log_click(data: dict):
    """Log user click interaction with A/B analytics"""
    # Extract known fields
    from_screen = data.get("from")
    to_screen = data.get("to")
    timestamp = data.get("timestamp")
    ab_group = data.get("ab_group")
    session_id = data.get("session_id")
    time_on_screen_ms = data.get("time_on_screen_ms")
    cart_value = data.get("cart_value")
    cart_count = data.get("cart_count")

    # Pass everything else as extra
    extra = {k: v for k, v in data.items() if k not in {
        "from", "to", "timestamp", "ab_group", "session_id",
        "time_on_screen_ms", "cart_value", "cart_count"
    }}

    click_data = click_tracker.log_click(
        from_screen=from_screen,
        to_screen=to_screen,
        timestamp=timestamp,
        ab_group=ab_group,
        session_id=session_id,
        time_on_screen_ms=time_on_screen_ms,
        cart_value=cart_value,
        cart_count=cart_count,
        extra=extra if extra else None,
    )
    return click_data


@app.get("/api/analytics/clicks")
async def get_click_stats():
    """Get click statistics"""
    return click_tracker.get_click_statistics()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)

