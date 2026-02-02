import type {
  Author,
  AuthorDto,
  ExchangeLocation,
  ExchangeLocationDto,
  Genre,
  GenreDto,
} from "@/entities/reference/model/types";

export type UserSummaryDto = {
  id: string;
  username: string;
  email?: string;
  avatar_url?: string | null;
};

export type UserSummary = {
  id: string;
  username: string;
  email?: string;
  avatarUrl?: string | null;
};

export type BookDto = {
  id: string;
  title: string;
  description?: string | null;
  extra_terms?: string | null;
  pages?: number | null;
  author: AuthorDto;
  genre: GenreDto;
  language_code: string;
  condition: string;
  approval_status?: string | null;
  is_available: boolean;
  is_liked_by_user: boolean;
  exchange_location: ExchangeLocationDto;
  photo_urls: string[];
  total_likes?: number;
  total_views?: number;
  total_reserves?: number;
  owner?: UserSummaryDto | null;
  created_at?: string;
};

export type Book = {
  id: string;
  title: string;
  description?: string | null;
  extraTerms?: string | null;
  pages?: number | null;
  author: Author;
  genre: Genre;
  languageCode: string;
  condition: string;
  approvalStatus?: string | null;
  isAvailable: boolean;
  isLiked: boolean;
  exchangeLocation: ExchangeLocation;
  photoUrls: string[];
  totalLikes?: number;
  totalViews?: number;
  totalReserves?: number;
  owner?: UserSummary | null;
  createdAt?: string;
};

export type BookFilters = {
  query?: string;
  sort?: string;
  genre?: string;
  distance?: number;
  rating?: number;
  limit?: number;
};

export type CreateBookPayload = {
  title: string;
  description?: string;
  author_id: number;
  genre_id: number;
  language_code: string;
  condition: string;
  exchange_location_id: number;
  extra_terms?: string;
  pages?: number;
};

export type UpdateBookPayload = Partial<CreateBookPayload>;

export type ReserveBookPayload = {
  comment?: string;
  meeting_time?: string;
};
