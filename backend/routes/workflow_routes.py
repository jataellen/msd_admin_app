# backend/routes/workflow_routes.py
from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from auth import get_current_user
import logging
from resources.workflow_constants import get_workflow_stages, get_all_statuses

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/workflow", tags=["workflow"])

@router.get("/stages/{workflow_type}")
async def get_workflow_stages_endpoint(
    workflow_type: str,
    current_user: dict = Depends(get_current_user)
):
    """Get workflow stages for a specific workflow type"""
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")
            
        if workflow_type not in ["MATERIALS_ONLY", "MATERIALS_AND_INSTALLATION"]:
            raise HTTPException(
                status_code=400,
                detail="Invalid workflow type. Must be MATERIALS_ONLY or MATERIALS_AND_INSTALLATION"
            )
            
        stages = get_workflow_stages(workflow_type)
        
        # Extract just the stage names for the frontend
        stage_names = []
        for stage in stages:
            stage_names.append(stage["name"])
            
        return {"stages": stage_names}
        
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error fetching workflow stages: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching workflow stages: {str(e)}")
        
@router.get("/statuses/{workflow_type}")
async def get_workflow_statuses_endpoint(
    workflow_type: str,
    current_user: dict = Depends(get_current_user)
):
    """Get all statuses for a specific workflow type"""
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")
            
        if workflow_type not in ["MATERIALS_ONLY", "MATERIALS_AND_INSTALLATION"]:
            raise HTTPException(
                status_code=400,
                detail="Invalid workflow type. Must be MATERIALS_ONLY or MATERIALS_AND_INSTALLATION"
            )
            
        stages = get_workflow_stages(workflow_type)
        statuses = get_all_statuses(stages)
        
        return {"statuses": statuses}