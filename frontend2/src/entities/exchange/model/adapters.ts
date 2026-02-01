import { adaptBook } from "@/entities/book/model/adapters";
import { type UserSummary, type UserSummaryDto } from "@/entities/book/model/types";

import { type Exchange, type ExchangeDto } from "./types";

const adaptUser = (dto: UserSummaryDto): UserSummary => ({
  id: dto.id,
  username: dto.username,
  email: dto.email,
  avatarUrl: dto.avatar_url ?? null,
});

export const adaptExchange = (dto: ExchangeDto): Exchange => ({
  id: dto.id,
  book: adaptBook(dto.book),
  owner: adaptUser(dto.owner),
  requester: adaptUser(dto.requester),
  progress: dto.progress,
  createdAt: dto.created_at,
  cancelReason: dto.cancel_reason ?? null,
});
