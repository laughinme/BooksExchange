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
  return {
    query: query ?? "",
    ...(limit !== undefined ? { limit } : {}),
    ...(sort ? { sort } : {}),
    ...(genre ? { genre } : {}),
    ...(distance ? { distance } : {}),
    ...(rating ? { rating } : {}),
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
    const { data } = await apiPrivate.get<BookDto[]>("/books/", {
      params: params ? pickAllowedFilters(params) : undefined,
    });
    return data;
  },
  getMine: async () => {
    const { data } = await apiPrivate.get<BookDto[]>("/books/my");
    return data;
  },
  getById: async (bookId: string | number) => {
    const { data } = await apiPrivate.get<BookDto>(`/books/${bookId}/`);
    return data;
  },
  create: async (payload: CreateBookPayload) => {
    const { data } = await apiPrivate.post<BookDto>("/books/create", payload);
    return data;
  },
  update: async (bookId: string | number, payload: UpdateBookPayload) => {
    const { data } = await apiPrivate.patch<BookDto>(`/books/${bookId}/`, payload);
    return data;
  },
  uploadPhotos: async (bookId: string | number, formData: FormData) => {
    const { data } = await apiPrivate.put<BookDto>(`/books/${bookId}/photos`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },
  toggleLike: async (bookId: string | number) => {
    await apiPrivate.post(`/books/${bookId}/like`);
  },
  reserve: async (bookId: string | number, payload: ReserveBookPayload) => {
    await apiPrivate.post(`/books/${bookId}/reserve`, payload);
  },
  recordClick: async (bookId: string | number) => {
    await apiPrivate.post(`/books/${bookId}/click`);
  },
};
