import { adaptCity } from "@/entities/reference/model/adapters";

import { type Profile, type ProfileDto, type NearbyUser } from "./types";

export const adaptProfile = (dto: ProfileDto): Profile => ({
  id: dto.id,
  email: dto.email,
  username: dto.username,
  avatarUrl: dto.avatar_url ?? null,
  bio: dto.bio ?? null,
  birthDate: dto.birth_date ?? null,
  gender: dto.gender ?? null,
  languageCode: dto.language_code ?? null,
  public: dto.public ?? undefined,
  latitude: dto.latitude ?? null,
  longitude: dto.longitude ?? null,
  city: dto.city ? adaptCity(dto.city) : null,
  favoriteGenres: dto.favorite_genres.map((genre) => ({
    id: genre.id,
    name: genre.name,
  })),
  roles: dto.roles ?? dto.role_slugs ?? [],
  isOnboarded: dto.is_onboarded,
  createdAt: dto.created_at,
  banned: dto.banned,
});

export const adaptNearbyUser = (dto: ProfileDto & { distance: number }): NearbyUser => ({
  id: dto.id,
  username: dto.username ?? null,
  avatarUrl: dto.avatar_url ?? null,
  bio: dto.bio ?? null,
  age: dto.age ?? null,
  gender: dto.gender ?? null,
  languageCode: dto.language_code ?? null,
  favoriteGenres: dto.favorite_genres.map((g) => ({ id: g.id, name: g.name })),
  city: dto.city ? adaptCity(dto.city) : null,
  distance: dto.distance ?? 0,
});
