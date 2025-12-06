import {
  adaptAuthor,
  adaptExchangeLocation,
  adaptGenre,
} from "@/entities/reference/model/adapters";

import { type Book, type BookDto, type UserSummary } from "./types";

const adaptUserSummary = (dto?: BookDto["owner"]): UserSummary | null => {
  if (!dto) return null;
  return {
    id: dto.id,
    username: dto.username,
    email: dto.email,
    avatarUrl: dto.avatar_url ?? null,
  };
};

export const adaptBook = (dto: BookDto): Book => ({
  id: dto.id,
  title: dto.title,
  description: dto.description ?? null,
  extraTerms: dto.extra_terms ?? null,
  pages: dto.pages ?? null,
  author: adaptAuthor(dto.author),
  genre: adaptGenre(dto.genre),
  languageCode: dto.language_code,
  condition: dto.condition,
  approvalStatus: dto.approval_status ?? null,
  isAvailable: dto.is_available,
  isLiked: dto.is_liked_by_user,
  exchangeLocation: adaptExchangeLocation(dto.exchange_location),
  photoUrls: dto.photo_urls ?? [],
  totalLikes: dto.total_likes ?? 0,
  totalViews: dto.total_views ?? 0,
  totalReserves: dto.total_reserves ?? 0,
  owner: adaptUserSummary(dto.owner),
  createdAt: dto.created_at,
});
