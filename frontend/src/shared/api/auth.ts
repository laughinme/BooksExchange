import { apiPrivate, apiPublic, refreshAccessToken } from "@/shared/api/axiosInstance";

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

export const refreshSession = () => refreshAccessToken();

export const logoutRequest = () => apiPrivate.post("/auth/logout").then((res) => res.data);
