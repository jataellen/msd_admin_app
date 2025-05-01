# main.py
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from auth import auth_middleware
from routes import employee_routes, auth_routes
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()


# # Mount the static files directory
# app.mount("/static", StaticFiles(directory="./employee_repo/static"), name="static")

# # Set up templates
# templates = Jinja2Templates(directory="./employee_repo/templates")

# Add middleware
app.middleware("http")(auth_middleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://msd-admin.netlify.app/",
    ],  # Allow frontend requests
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Include routers
# app.include_router(employee_routes.router)
app.include_router(auth_routes.router)
