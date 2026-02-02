from typing import Annotated
from fastapi import Depends

from database.relational_db import (
    UoW,
    get_uow,
    UserInterface,
    RolesInterface,
)
from .credentials_service import CredentialsService
from ..tokens import TokenService, get_token_service


async def get_credentials_service(
    uow: Annotated[UoW, Depends(get_uow)],
    token_service: Annotated[TokenService, Depends(get_token_service)],
) -> CredentialsService:
    user_repo = UserInterface(uow.session)
    role_repo = RolesInterface(uow.session)
    
    return CredentialsService(
        uow, user_repo, role_repo, token_service
    )
