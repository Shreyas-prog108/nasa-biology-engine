"""Main FastAPI application with MongoDB and GitHub OAuth."""
import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import the existing API app
from logic.api import app as existing_app

# Import OAuth router
from auth_oauth import router as oauth_router

# Load environment variables
load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    # Startup
    print("🚀 Starting up...")
    yield
    # Shutdown
    print("🛑 Shutting down...")
    from db import close_db_connection
    await close_db_connection()


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title="Space Biology Knowledge Engine",
        description="AI-powered NASA space biology research platform with GitHub OAuth",
        version="2.0.0",
        lifespan=lifespan
    )
    
    # Add CORS middleware - configure for production
    allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:3001").split(",")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
        allow_headers=["Authorization", "Content-Type"],
    )
    
    # Include OAuth routes
    app.include_router(oauth_router)
    
    # Mount existing app routes
    for route in existing_app.routes:
        app.routes.append(route)
    
    @app.get("/health")
    async def health_check():
        """Health check endpoint."""
        return {
            "status": "healthy",
            "version": "2.0.0",
            "features": {
                "search": True,
                "qa": True,
                "knowledge_graph": True,
                "github_oauth": True
            }
        }
    
    return app


app = create_app()

if __name__ == "__main__":
    import uvicorn
    # reload=True is only for development
    reload_mode = os.getenv("DEBUG", "false").lower() == "true"
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=reload_mode)
