import logging

from pathlib import Path
from pydantic import SecretStr

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR  = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    """
    Project dependencies config
    """
    model_config = SettingsConfigDict(
        env_file=f'{BASE_DIR}/.env',
        extra='ignore'
    )
    
    STAGE: str = 'dev'
    
    @property
    def ECHO_MODE(self) -> bool:
        return self.STAGE == 'dev'
    
    @property
    def DEBUG_MODE(self) -> bool:
        return self.STAGE == 'dev'
    
    # API settings
    API_PORT: int = 8080
    API_HOST: str = '0.0.0.0'
    
    # Site data (url, paths)
    SITE_URL: str = ''
    MEDIA_DIR: str = 'media'
    
    # Auth Settings    
    JWT_PRIVATE_KEY: str
    JWT_PUBLIC_KEY: str
    JWT_ALGO: str = 'RS256'
    ACCESS_TTL: int = 60 * 15
    REFRESH_TTL: int = 60 * 60 * 24 * 7
    CSRF_HMAC_KEY: bytes
    
    # Database settings
    DATABASE_URL: str
    REDIS_URL: str
    
config = Settings() # pyright: ignore[reportCallIssue]


def configure_logging():
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s [%(filename)s:%(lineno)d] %(message)s",
    )
