# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from auth import auth_middleware

# Import route modules directly
from routes.auth_routes import router as auth_router
from routes.work_item_routes import router as work_item_router
from routes.project_routes import router as project_router
from routes.quickbooks_routes import router as quickbooks_router

app = FastAPI()

# Add middleware
app.middleware("http")(auth_middleware)
# main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Be specific with the origin
    allow_credentials=True,  # This is critical for cookies
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Type", "X-CSRFToken"],  # Add any custom headers here
)

# Include routers directly
app.include_router(auth_router)
app.include_router(work_item_router)
app.include_router(project_router)
app.include_router(quickbooks_router)
