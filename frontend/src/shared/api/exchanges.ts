import { apiPrivate } from "@/shared/api/axiosInstance";

import { type ExchangeDto } from "@/entities/exchange/model/types";

export type ExchangeActionPayload = {
  cancel_reason?: string | null;
};

export const exchangeApi = {
  getAll: async (params?: { only_active?: boolean }) => {
    const { data } = await apiPrivate.get<ExchangeDto[]>("/exchanges/", { params });
    return data;
  },
  getOwned: async (params?: { only_active?: boolean }) => {
    const { data } = await apiPrivate.get<ExchangeDto[]>("/exchanges/owned", { params });
    return data;
  },
  getRequested: async (params?: { only_active?: boolean }) => {
    const { data } = await apiPrivate.get<ExchangeDto[]>("/exchanges/requested", { params });
    return data;
  },
  getById: async (exchangeId: string) => {
    const { data } = await apiPrivate.get<ExchangeDto>(`/exchanges/${exchangeId}/`);
    return data;
  },
  edit: async (exchangeId: string, payload: { meeting_time?: string | null }) => {
    const { data } = await apiPrivate.patch<ExchangeDto>(
      `/exchanges/${exchangeId}/`,
      payload,
    );
    return data;
  },
  accept: async (exchangeId: string) => {
    const { data } = await apiPrivate.patch<ExchangeDto>(`/exchanges/${exchangeId}/accept`);
    return data;
  },
  decline: async (exchangeId: string, payload?: ExchangeActionPayload) => {
    const { data } = await apiPrivate.patch<ExchangeDto>(
      `/exchanges/${exchangeId}/decline`,
      payload,
    );
    return data;
  },
  cancel: async (exchangeId: string, payload?: ExchangeActionPayload) => {
    const { data } = await apiPrivate.patch<ExchangeDto>(
      `/exchanges/${exchangeId}/cancel`,
      payload,
    );
    return data;
  },
  finish: async (exchangeId: string) => {
    const { data } = await apiPrivate.patch<ExchangeDto>(`/exchanges/${exchangeId}/finish`);
    return data;
  },
};
