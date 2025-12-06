import type { BookDto } from "@/entities/book/model/types";
import type { ExchangeDto } from "@/entities/exchange/model/types";
import type { ProfileDto } from "@/entities/profile/model/types";
import { apiPrivate } from "@/shared/api/axiosInstance";

import {
  type AdminBookStatsPoint,
  type CursorPage,
} from "@/entities/admin/model/types";

export type AdminListBooksParams = { status?: string; limit?: number };
export type AdminListUsersParams = {
  limit?: number;
  cursor?: string | null;
  search?: string;
  banned?: boolean;
};

export const adminApi = {
  listBooks: (params: AdminListBooksParams) =>
    apiPrivate.get<BookDto[]>("/admins/books/", { params }).then((res) => res.data),
  acceptBook: (bookId: number) =>
    apiPrivate.post(`/admins/books/${bookId}/accept`).then((res) => res.data),
  rejectBook: (bookId: number, reason?: string) =>
    apiPrivate.post(`/admins/books/${bookId}/reject`, { reason }).then((res) => res.data),

  listUsers: (params: AdminListUsersParams) =>
    apiPrivate.get<CursorPage<ProfileDto>>("/admins/users/", { params }).then((res) => res.data),
  setUserBan: (userId: number, banned: boolean) =>
    apiPrivate.post<ProfileDto>(`/admins/users/${userId}/ban`, { banned }).then((res) => res.data),

  statsActiveUsers: (days = 30) =>
    apiPrivate.get("/admins/stats/active-users", { params: { days } }).then((res) => res.data),
  statsRegistrations: (days = 30) =>
    apiPrivate.get("/admins/stats/registrations", { params: { days } }).then((res) => res.data),
  statsBooks: (days = 30) =>
    apiPrivate
      .get<AdminBookStatsPoint[]>("/admins/stats/books/stats", {
        params: { days },
      })
      .then((res) => res.data),
  statsBookById: (bookId: number, days = 30) =>
    apiPrivate
      .get<AdminBookStatsPoint[]>(`/admins/stats/books/${bookId}/stats`, { params: { days } })
      .then((res) => res.data),

  listExchanges: (params?: Record<string, unknown>) =>
    apiPrivate
      .get<CursorPage<ExchangeDto>>("/admins/exchanges/", { params })
      .then((res) => res.data),
  getExchange: (exchangeId: number) =>
    apiPrivate.get<ExchangeDto>(`/admins/exchanges/${exchangeId}/`).then((res) => res.data),
  forceFinishExchange: (exchangeId: number) =>
    apiPrivate.post(`/admins/exchanges/${exchangeId}/force-finish`).then((res) => res.data),
  forceCancelExchange: (exchangeId: number) =>
    apiPrivate.post(`/admins/exchanges/${exchangeId}/force-cancel`).then((res) => res.data),
};
