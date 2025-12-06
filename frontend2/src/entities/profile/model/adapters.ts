import { adaptCity } from "@/entities/reference/model/adapters";

import { type Profile, type ProfileDto } from "./types";

export const adaptProfile = (dto: ProfileDto): Profile => ({
  id: dto.id,
  email: dto.email,
  username: dto.username,
  avatarUrl: dto.avatar_url ?? null,
  bio: dto.bio ?? null,
  city: dto.city ? adaptCity(dto.city) : null,
  favoriteGenres: dto.favorite_genres.map((genre) => ({
    id: genre.id,
    name: genre.name,
  })),
  isOnboarded: dto.is_onboarded,
  createdAt: dto.created_at,
  banned: dto.banned,
});
