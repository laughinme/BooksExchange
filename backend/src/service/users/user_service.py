import aiofiles
import shutil
from datetime import date, datetime

from uuid import UUID, uuid4
from pathlib import Path
from fastapi import UploadFile, status, HTTPException

from core.config import Settings
from domain.users import UserPatch, Gender
from domain.roles import RoleModel
from database.relational_db import (
    UoW,
    UserInterface, 
    User, 
    UserGenreInterface,
    GenresInterface,
    CitiesInterface,
    LanguagesInterface,
    RolesInterface,
    Role
)
from .exceptions import IncorrectGenreId, IncorrectCityId

settings = Settings() # type: ignore

class UserService:
    def __init__(
        self,
        uow: UoW,
        user_repo: UserInterface,
        ug_repo: UserGenreInterface,
        genres_repo: GenresInterface,
        cities_repo: CitiesInterface,
        lang_repo: LanguagesInterface,
        role_repo: RolesInterface,
        
    ):
        self.uow = uow
        self.user_repo = user_repo
        self.ug_repo = ug_repo
        self.genres_repo = genres_repo
        self.cities_repo = cities_repo
        self.lang_repo = lang_repo
        self.role_repo = role_repo
        
    async def get_user(self, user_id: UUID | str) -> User | None:
        return await self.user_repo.get_by_id(user_id)
        
    async def patch_user(self, payload: UserPatch, user: User):
        data = payload.model_dump(exclude_none=True)
        
        city_id = data.get('city_id')
        if city_id is not None:
            if await self.cities_repo.get_by_id(city_id) is None:
                raise IncorrectCityId
        
        if (genres := data.pop('favorite_genres', None)) is not None:
            await self.set_genres(genres, user)
        
        for field, value in data.items():
            setattr(user, field, value)

        if not user.is_onboarded:
            user.is_onboarded = True
            
        await self.uow.commit()
            
        await self.uow.session.refresh(user)
            
    async def set_genres(self, new_ids: set[int], user: User):
        genres = await self.genres_repo.get_by_ids(new_ids)
        if len(genres) != len(new_ids):
            raise IncorrectGenreId
        
        current_ids = [pair.genre_id for pair in await self.ug_repo.list_ids(user.id)]
        if current_ids and current_ids != list(new_ids):
            raise HTTPException(400, detail='IDs cannot be changed after being set.')
        
        await self.ug_repo.bulk_add(new_ids, user.id)
        
        await self.uow.session.refresh(user)
        
    async def list_languages(self, q: str, limit: int):
        return await self.lang_repo.search(q, limit)

    async def add_picture(
        self,
        file: UploadFile,
        user: User
    ) -> None:
        folder = Path(settings.MEDIA_DIR, "users", str(user.id))
        if folder.exists():
            shutil.rmtree(folder)
        folder.mkdir(parents=True, exist_ok=True)

        if file.content_type not in ("image/jpeg", "image/png"):
            raise HTTPException(
                status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail="Only jpg / png allowed"
            )

        ext  = ".jpg" if file.content_type == "image/jpeg" else ".png"
        name = f"{uuid4()}{ext}"

        async with aiofiles.open(folder / name, "wb") as out:
            while chunk := await file.read(1024 * 1024):
                await out.write(chunk)

        url = f"{settings.SITE_URL}/{settings.MEDIA_DIR}/users/{user.id}/{name}"

        user.avatar_url = url

    async def nearby(self, user: User, radius_km: int):
        lat, lon = user.latitude, user.longitude
        if lat is None or lon is None:
            raise HTTPException(412, detail='You should set your coordinates first')
        
        return await self.user_repo.nearby_users(lat, lon, radius_km)

    async def admin_list_users(
        self,
        *,
        city_id: int | None = None,
        banned: bool | None = None,
        gender: Gender | None = None,
        min_age: int | None = None,
        max_age: int | None = None,
        search: str | None = None,
        limit: int = 50,
        cursor: str | None = None,
    ) -> tuple[list[User], str | None]:
        # Convert age range to birth_date range
        min_birth_date = None
        max_birth_date = None
        today = date.today()
        if min_age is not None:
            # min_age -> born on or before today - min_age years
            min_birth_date = date(today.year - min_age, today.month, today.day)
        if max_age is not None:
            # max_age -> born on or after today - max_age years
            max_birth_date = date(today.year - max_age, today.month, today.day)

        cursor_created_at = None
        cursor_id = None
        if cursor:
            try:
                ts_str, id_str = cursor.split("_", 1)
                cursor_created_at = datetime.fromisoformat(ts_str)
                cursor_id = UUID(id_str)
            except Exception:
                raise HTTPException(400, detail='Invalid cursor')

        users = await self.user_repo.admin_list_users(
            city_id=city_id,
            banned=banned,
            gender=gender,
            min_birth_date=max_birth_date,  # Note: older age -> earlier birth_date
            max_birth_date=min_birth_date,
            search=search,
            limit=limit,
            cursor_created_at=cursor_created_at,
            cursor_id=cursor_id,
        )

        next_cursor = None
        if len(users) == limit:
            last = users[-1]
            if last.created_at is None:
                next_cursor = None
            else:
                next_cursor = f"{last.created_at.isoformat()}_{last.id}"

        return users, next_cursor

    async def admin_set_ban(self, target: User, banned: bool) -> User:
        target.banned = banned
        await self.uow.commit()
        await self.uow.session.refresh(target)
        return target
    
    
    async def admin_assign_roles(
        self,
        target: User,
        role_slugs: list[str],
    ) -> User:
        unique_slugs = list(dict.fromkeys(role_slugs))
        roles = await self.role_repo.get_by_slugs(unique_slugs)
        found_slugs = {role.slug for role in roles}
        missing = [slug for slug in unique_slugs if slug not in found_slugs]
        if missing:
            missing_sorted = ", ".join(sorted(missing))
            raise HTTPException(
                status.HTTP_404_NOT_FOUND,
                detail=f"Unknown roles: {missing_sorted}",
            )

        previous_version = target.auth_version
        await self.user_repo.assign_roles(target, roles)
        target.bump_auth_version()
        await self.uow.commit()
        await self.uow.session.refresh(target)

        # await self._invalidate_permissions_cache(target.id, previous_version)
        return target

    async def list_roles(
        self,
        *,
        search: str | None = None,
        limit: int = 20,
    ) -> list[Role]:
        return await self.role_repo.list_roles(search=search, limit=limit)

    async def get_role(self, role_id: UUID) -> Role | None:
        return await self.role_repo.get_by_id(role_id)
