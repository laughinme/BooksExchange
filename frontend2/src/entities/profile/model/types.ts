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
  birth_date?: string | null;
  gender?: "male" | "female" | "unknown" | null;
  language_code?: string | null;
  public?: boolean;
  latitude?: number | null;
  longitude?: number | null;
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
  birthDate?: string | null;
  gender?: "male" | "female" | "unknown" | null;
  languageCode?: string | null;
  public?: boolean;
  latitude?: number | null;
  longitude?: number | null;
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
  birth_date?: string;
  gender?: "male" | "female" | "unknown" | null;
  language_code?: string;
  public?: boolean;
  latitude?: number;
  longitude?: number;
};

export type NearbyUser = {
  id: number;
  username: string | null;
  avatarUrl: string | null;
  bio: string | null;
  age: number | null;
  gender: "male" | "female" | "unknown" | null;
  languageCode: string | null;
  favoriteGenres: Genre[];
  city: City | null;
  distance: number;
};
