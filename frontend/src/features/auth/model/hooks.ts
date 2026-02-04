import { useMutation, useQueryClient } from "@tanstack/react-query";

import { profileQueryKey, profileQueryOptions } from "@/entities/profile/model/hooks";
import { setAccessToken } from "@/shared/api/axiosInstance";

import {
  loginRequest,
  registerRequest,
  type LoginPayload,
  type RegisterPayload,
} from "@/shared/api/auth";

export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LoginPayload) => loginRequest(payload),
    onSuccess: async (data) => {
      setAccessToken(data.access_token);
      await queryClient.invalidateQueries({ queryKey: profileQueryKey });
      await queryClient.ensureQueryData(profileQueryOptions());
      return data;
    },
  });
};

export const useRegister = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RegisterPayload) => registerRequest(payload),
    onSuccess: async (data) => {
      setAccessToken(data.access_token);
      await queryClient.invalidateQueries({ queryKey: profileQueryKey });
      await queryClient.ensureQueryData(profileQueryOptions());
      return data;
    },
  });
};
