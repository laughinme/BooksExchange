from sqlalchemy import select, or_, func
from sqlalchemy.ext.asyncio import AsyncSession

from .languages_table import Language


class LanguagesInterface:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def search(self, q: str | None, limit: int) -> list[Language]:
        stmt = select(Language)

        if q:
            stmt = (
                stmt.where(
                    or_(
                        Language.name_ru.ilike(f"%{q}%"),
                        Language.name_en.ilike(f"%{q}%"),
                    )
                )
                .order_by(func.char_length(Language.name_ru))
            )

        stmt = stmt.limit(limit)

        languages = await self.session.scalars(stmt)
        return list(languages.all())
