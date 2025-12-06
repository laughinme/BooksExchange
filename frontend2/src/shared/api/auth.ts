import { apiPrivate, apiPublic } from "@/shared/api/axiosInstance";
import { getCookie } from "@/shared/lib/cookies";

export type AuthResponseDto = {
  access_token: string;
  token_type?: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  username: string;
  email: string;
  password: string;
};

export const loginRequest = (payload: LoginPayload) =>
  apiPublic.post<AuthResponseDto>("/auth/login", payload).then((res) => res.data);

export const registerRequest = (payload: RegisterPayload) =>
  apiPublic.post<AuthResponseDto>("/auth/register", payload).then((res) => res.data);

export const refreshSession = () => {
  const csrfToken = getCookie("fastapi-csrf-token");

  return apiPublic
    .post<AuthResponseDto>(
      "/auth/refresh",
      {},
      {
        headers: csrfToken ? { "x-csrf-token": csrfToken } : undefined,
        withCredentials: true,
      },
    )
    .then((res) => res.data);
};

export const logoutRequest = () => apiPrivate.post("/auth/logout").then((res) => res.data);
