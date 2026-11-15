import os
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    AstroHealth Backend Configuration.
    Loads settings from environment variables or .env file without hardcoding credentials.
    Supports MySQL (via PyMySQL) with automatic safe fallback to local SQLite for zero-config demos.
    """

    APP_NAME: str = "AstroHealth API"
    APP_VERSION: str = "1.2.0"
    ENVIRONMENT: str = "development"

    # Database Configuration (MySQL compatible)
    DB_ENGINE: str = "sqlite"  # Set to "mysql" in .env when connecting to a MySQL server
    MYSQL_USER: Optional[str] = None
    MYSQL_PASSWORD: Optional[str] = None
    MYSQL_HOST: str = "127.0.0.1"
    MYSQL_PORT: int = 3306
    MYSQL_DATABASE: str = "astrohealth"
    DATABASE_URL: Optional[str] = None

    # NASA Open Science Data Repository (OSDR) & NASA API Configuration
    NASA_OSDR_BASE_URL: str = "https://osdr.nasa.gov/osdr/data"
    NASA_API_KEY: str = "DEMO_KEY"
    NASA_TIMEOUT_SECONDS: float = 6.0

    # Optional Server-Side AI Provider Configuration (Never exposed to frontend)
    AI_PROVIDER: str = "rule_based"  # "rule_based" (default)
    ASTROHEALTH_AI_API_KEY: Optional[str] = None

    # CORS Origins
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    def get_mysql_url(self) -> Optional[str]:
        if self.DATABASE_URL:
            return self.DATABASE_URL
        if self.DB_ENGINE.lower() == "mysql" and self.MYSQL_USER:
            password_part = f":{self.MYSQL_PASSWORD}" if self.MYSQL_PASSWORD else ""
            return (
                f"mysql+pymysql://{self.MYSQL_USER}{password_part}"
                f"@{self.MYSQL_HOST}:{self.MYSQL_PORT}/{self.MYSQL_DATABASE}"
            )
        return None


settings = Settings()
