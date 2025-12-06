import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  exchangeApi,
  type ExchangeActionPayload,
} from "@/shared/api/exchanges";
import { adaptExchange } from "./adapters";
import { type Exchange } from "./types";

export const exchangeKeys = {
  root: ["exchanges"] as const,
  list: (type: "owned" | "requested") =>
    ["exchanges", type] as const,
};

export const useExchangesQuery = (type: "owned" | "requested") =>
  useQuery<Exchange[]>({
    queryKey: exchangeKeys.list(type),
    queryFn: async () => {
      const requester =
        type === "owned" ? exchangeApi.getOwned : exchangeApi.getRequested;
      const data = await requester({ only_active: false });
      return data.map(adaptExchange);
    },
  });

export const useExchangeAction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      action,
      exchangeId,
      payload,
    }: {
      action: "accept" | "decline" | "cancel" | "finish";
      exchangeId: number;
      payload?: ExchangeActionPayload;
    }) => {
      switch (action) {
        case "accept":
          return exchangeApi.accept(exchangeId);
        case "decline":
          return exchangeApi.decline(exchangeId, payload);
        case "cancel":
          return exchangeApi.cancel(exchangeId, payload);
        case "finish":
          return exchangeApi.finish(exchangeId);
        default:
          return Promise.reject(new Error("Unknown action"));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: exchangeKeys.root });
    },
  });
};
