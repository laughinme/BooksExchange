import { apiPrivate } from "@/shared/api/axiosInstance";

import {
  type BookDto,
  type BookFilters,
  type CreateBookPayload,
  type ReserveBookPayload,
  type UpdateBookPayload,
} from "@/entities/book/model/types";

const pickAllowedFilters = (params: BookFilters) => {
  const { query, limit, sort, genre, distance, rating } = params;
  const normalizedGenre = genre && genre !== "all" ? genre : undefined;
  const normalizedDistance =
    distance !== undefined && distance < 50 ? distance : undefined;
  const normalizedRating =
    rating !== undefined && rating > 1 ? rating : undefined;
  return {
    query: query ?? "",
    ...(limit !== undefined ? { limit } : {}),
    ...(sort ? { sort } : {}),
    ...(normalizedGenre ? { genre: normalizedGenre } : {}),
    ...(normalizedDistance !== undefined ? { distance: normalizedDistance } : {}),
    ...(normalizedRating !== undefined ? { rating: normalizedRating } : {}),
  };
};

export const bookApi = {
  getForYou: async (params: BookFilters) => {
    const { data } = await apiPrivate.get<BookDto[]>("/books/for_you", {
      params: pickAllowedFilters(params),
    });
    return data;
  },
  getAll: async (params?: BookFilters) => {
    const { data } = await apiPrivate.get<BookDto[]>("/books", {
      params: params ? pickAllowedFilters(params) : undefined,
    });
    return data;
  },
  getMine: async () => {
    const { data } = await apiPrivate.get<BookDto[]>("/books/my");
    return data;
  },
  getById: async (bookId: string) => {
    const { data } = await apiPrivate.get<BookDto>(`/books/${bookId}`);
    return data;
  },
  create: async (payload: CreateBookPayload) => {
    const { data } = await apiPrivate.post<BookDto>("/books/create", payload);
    return data;
  },
  update: async (bookId: string, payload: UpdateBookPayload) => {
    const { data } = await apiPrivate.patch<BookDto>(`/books/${bookId}`, payload);
    return data;
  },
  uploadPhotos: async (bookId: string, formData: FormData) => {
    const { data } = await apiPrivate.put<BookDto>(`/books/${bookId}/photos`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },
  toggleLike: async (bookId: string) => {
    await apiPrivate.post(`/books/${bookId}/like`);
  },
  reserve: async (bookId: string, payload: ReserveBookPayload) => {
    await apiPrivate.post(`/books/${bookId}/reserve`, payload);
  },
  recordClick: async (bookId: string) => {
    await apiPrivate.post(`/books/${bookId}/click`);
  },
};
