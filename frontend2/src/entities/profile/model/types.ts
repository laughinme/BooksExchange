import type {
  City,
  CityDto,
  Genre,
  GenreDto,
} from "@/entities/reference/model/types";

export type ProfileDto = {
  id: number;
  email: string;
  username: string;
  avatar_url?: string | null;
  bio?: string | null;
  city?: CityDto | null;
  favorite_genres: GenreDto[];
  is_onboarded: boolean;
  created_at: string;
  banned?: boolean;
};

export type Profile = {
  id: number;
  email: string;
  username: string;
  avatarUrl?: string | null;
  bio?: string | null;
  city?: City | null;
  favoriteGenres: Genre[];
  isOnboarded: boolean;
  createdAt: string;
  banned?: boolean;
};

export type UpdateProfilePayload = {
  username?: string;
  bio?: string;
  city_id?: number;
};
