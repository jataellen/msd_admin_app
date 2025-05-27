# main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from auth import auth_middleware

# Import route modules
from routes.auth_routes import router as auth_router
from routes.order_routes import router as order_router
from routes.order_events import router as order_events_router
from routes.task_routes import router as task_router

# from routes.quickbooks_routes import router as quickbooks_mock_router
from routes.quickbooks_api_routes import router as quickbooks_api_router
from routes.workflow_routes import router as workflow_router
from routes.employee_routes import router as employee_router
from routes.work_item_routes import router as work_item_router
# Debug routes removed during cleanup

app = FastAPI()

# Add middleware
app.middleware("http")(auth_middleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Be specific with the origin
    allow_credentials=True,  # This is critical for cookies
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Type", "X-CSRFToken"],  # Add any custom headers here
)

# Include routers
app.include_router(auth_router)
app.include_router(order_router)
app.include_router(order_events_router)
app.include_router(task_router)
# app.include_router(
#     quickbooks_mock_router
# )  # Keep the mock routes for backward compatibility
app.include_router(quickbooks_api_router)  # Add the new real QuickBooks API routes
app.include_router(workflow_router)
app.include_router(employee_router)
app.include_router(work_item_router)
# Debug router removed during cleanup


@app.get("/")
async def root():
    return {
        "message": "MSD CRM API - Welcome to the updated version with QuickBooks Integration!"
    }
