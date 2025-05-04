# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from auth import auth_middleware

# Import route modules directly
from routes.auth_routes import router as auth_router
from routes.order_routes import router as order_router
from routes.task_routes import router as task_router
from routes.quickbooks_routes import router as quickbooks_router

app = FastAPI()

# Add middleware
app.middleware("http")(auth_middleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://msd-admin.netlify.app",
    ],  # Be specific with the origin
    allow_credentials=True,  # This is critical for cookies
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Type", "X-CSRFToken"],  # Add any custom headers here
)

# Include routers directly
app.include_router(auth_router)
app.include_router(order_router)
app.include_router(task_router)
app.include_router(quickbooks_router)


@app.get("/")
async def root():
    return {
        "message": "Construction CRM API - Welcome to the updated version with orders and tasks!"
    }
