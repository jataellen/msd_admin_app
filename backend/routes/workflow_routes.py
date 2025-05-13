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
    workflow_type: str, current_user: dict = Depends(get_current_user)
):
    """Get workflow stages for a specific workflow type"""
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        if workflow_type not in ["MATERIALS_ONLY", "MATERIALS_AND_INSTALLATION"]:
            raise HTTPException(
                status_code=400,
                detail="Invalid workflow type. Must be MATERIALS_ONLY or MATERIALS_AND_INSTALLATION",
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
        raise HTTPException(
            status_code=500, detail=f"Error fetching workflow stages: {str(e)}"
        )


@router.get("/statuses/{workflow_type}")
async def get_workflow_statuses_endpoint(
    workflow_type: str, current_user: dict = Depends(get_current_user)
):
    """Get all statuses for a specific workflow type"""
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        if workflow_type not in ["MATERIALS_ONLY", "MATERIALS_AND_INSTALLATION"]:
            raise HTTPException(
                status_code=400,
                detail="Invalid workflow type. Must be MATERIALS_ONLY or MATERIALS_AND_INSTALLATION",
            )

        stages = get_workflow_stages(workflow_type)
        statuses = get_all_stages(stages)

        return {"statuses": statuses}
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error fetching workflow statuses: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error fetching workflow statuses: {str(e)}"
        )


@router.get("/next-status/{workflow_type}/{current_status}")
async def get_next_status_endpoint(
    workflow_type: str,
    current_status: str,
    current_user: dict = Depends(get_current_user),
):
    """Get the next status in the workflow after the current status"""
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        if workflow_type not in ["MATERIALS_ONLY", "MATERIALS_AND_INSTALLATION"]:
            raise HTTPException(
                status_code=400,
                detail="Invalid workflow type. Must be MATERIALS_ONLY or MATERIALS_AND_INSTALLATION",
            )

        stages = get_workflow_stages(workflow_type)

        # Find the current status in all stages
        all_statuses = []
        for stage in stages:
            for status in stage["statuses"]:
                all_statuses.append(status["id"])

        if current_status not in all_statuses:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status '{current_status}' for workflow type {workflow_type}",
            )

        # Find the next status
        current_index = all_statuses.index(current_status)
        if current_index < len(all_statuses) - 1:
            next_status = all_statuses[current_index + 1]
            return {"next_status": next_status}
        else:
            return {
                "next_status": None,
                "message": "This is the final status in the workflow",
            }

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error finding next status: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error finding next status: {str(e)}"
        )


@router.get("/full-workflow/{workflow_type}")
async def get_full_workflow_endpoint(
    workflow_type: str, current_user: dict = Depends(get_current_user)
):
    """Get the full workflow with stages and statuses for a specific workflow type"""
    try:
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        if workflow_type not in ["MATERIALS_ONLY", "MATERIALS_AND_INSTALLATION"]:
            raise HTTPException(
                status_code=400,
                detail="Invalid workflow type. Must be MATERIALS_ONLY or MATERIALS_AND_INSTALLATION",
            )

        stages = get_workflow_stages(workflow_type)

        # Return the complete workflow structure
        return {
            "workflow_type": workflow_type,
            "stages": stages,
            "total_stages": len(stages),
            "total_statuses": len(stages),
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error fetching full workflow: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error fetching full workflow: {str(e)}"
        )
