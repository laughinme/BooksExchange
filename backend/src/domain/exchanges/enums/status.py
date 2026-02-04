from enum import Enum


class ExchangeProgress(Enum):
    """Represents the stage of a book exchange process"""
    CREATED = "created"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    FINISHED = "finished"
    CANCELED = "canceled"

active_statuses = (
    ExchangeProgress.CREATED,
    ExchangeProgress.ACCEPTED,
)
