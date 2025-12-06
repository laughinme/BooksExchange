import axios, {
  AxiosHeaders,
  type AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";

import { clearCookie, getCsrfToken } from "@/shared/lib/cookies";

const BASE_URL = import.meta.env.DEV
  ? "/api/v1"
  : "https://hackathon-backend.fly.dev/api/v1";

export const apiPublic = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "X-Client": "web",
  },
  withCredentials: true,
});

let accessToken: string | null = null;
const tokenSubscribers = new Set<(token: string | null) => void>();

export const subscribeAccessToken = (listener: (token: string | null) => void) => {
  tokenSubscribers.add(listener);
  return () => {
    tokenSubscribers.delete(listener);
  };
};

export const setAccessToken = (token: string | null) => {
  accessToken = token;
  tokenSubscribers.forEach((listener) => listener(token));
};

export const getAccessToken = () => accessToken;

const apiPrivate = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

const injectCsrfHeader = (config: InternalAxiosRequestConfig) => {
  const csrfToken = getCsrfToken();
  if (csrfToken) {
    config.headers["x-csrf-token"] = csrfToken;
  }
  return config;
};

apiPublic.interceptors.request.use(injectCsrfHeader);
apiPrivate.interceptors.request.use(injectCsrfHeader);

apiPrivate.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

apiPrivate.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status;

    if (
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      originalRequest.url !== "/auth/refresh"
    ) {
      originalRequest._retry = true;

      try {
        const csrfToken = getCsrfToken();
        if (!csrfToken) {
          throw new Error("Missing CSRF token");
        }

        const refreshResponse = await apiPublic.post<{ access_token: string }>(
          "/auth/refresh",
          {},
          {
            headers: { "x-csrf-token": csrfToken },
            withCredentials: true,
          },
        );

        const newToken = refreshResponse.data.access_token;
        setAccessToken(newToken);

        if (!originalRequest.headers) {
          originalRequest.headers = new AxiosHeaders();
        }
        (originalRequest.headers as AxiosHeaders).set(
          "Authorization",
          `Bearer ${newToken}`,
        );

        return apiPrivate(originalRequest);
      } catch (refreshError) {
        setAccessToken(null);
        clearCookie("refresh_token");
        clearCookie("fastapi-csrf-token");
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export { apiPrivate };
