"""API routes for missions and quests"""
from fastapi import APIRouter, HTTPException
from app.missions import mission_generator
from app.models import MissionStats

router = APIRouter(prefix="/api", tags=["missions"])


@router.get("/mission/new")
async def create_mission(ab_group: str = "A"):
    """Generate a new mission (respects UI version so summer missions don't appear in conversion UI)"""
    mission = mission_generator.generate_mission(ab_group=ab_group)
    return mission


@router.get("/mission/{mission_id}")
async def get_mission(mission_id: str):
    """Get mission by ID"""
    mission = mission_generator.get_mission(mission_id)
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found")
    return mission


@router.post("/mission/{mission_id}/progress")
async def update_mission_progress(mission_id: str, progress: dict):
    """Update mission progress"""
    mission = mission_generator.update_mission_progress(mission_id, progress)
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found")
    return mission


@router.post("/mission/{mission_id}/complete")
async def complete_mission(mission_id: str, stats: dict):
    """Complete mission and get statistics"""
    mission_stats = mission_generator.complete_mission(mission_id, stats)
    if not mission_stats:
        raise HTTPException(status_code=404, detail="Mission not found")
    return mission_stats.model_dump()

