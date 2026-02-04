from abc import ABC, abstractmethod

from database.relational_db import UoW


class BaseSeeder(ABC):
    name: str = "base"

    @abstractmethod
    async def run(self, uow: UoW) -> int:
        """Run seeding logic and return number of inserted records."""
        
        raise NotImplementedError


SEEDERS: list[type[BaseSeeder]] = []


def register(cls: type[BaseSeeder]) -> type[BaseSeeder]:
    if cls not in SEEDERS:
        SEEDERS.append(cls)
    return cls
