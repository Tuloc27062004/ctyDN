import Axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";
import { apiBaseURL } from "./consts";
import { getToken } from "./auth-storage";

export const AUTH_UNAUTHORIZED_EVENT = "auth:unauthorized";

const IS_SERVER = typeof window === "undefined";

const shouldIgnoreUnauthorizedEvent = (url?: string): boolean => {
  if (!url) return false;

  return [
    "/auth/sign-in",
    "/auth/sign-up",
    "/auth/request-password-reset",
    "/auth/reset-password",
    "/auth/verify",
    "/auth/resend-verification",
  ].some((path) => url.includes(path));
};

const emitUnauthorizedEvent = (error: AxiosError) => {
  if (IS_SERVER) return;
  if (error.response?.status !== 401) return;
  if (shouldIgnoreUnauthorizedEvent(error.config?.url)) return;

  // Only treat as a session-expired event if the request actually carried
  // a bearer token. A 401 on an unauthenticated request (e.g. the initial
  // /auth/me probe before sign-in) is expected — firing the event there
  // would race with a fresh sign-in and wipe the just-stored token.
  const sentAuth = Boolean(
    (error.config?.headers as Record<string, unknown> | undefined)?.["Authorization"],
  );
  if (!sentAuth) return;

  window.dispatchEvent(
    new CustomEvent(AUTH_UNAUTHORIZED_EVENT, {
      detail: {
        url: error.config?.url ?? null,
        status: error.response?.status ?? null,
      },
    }),
  );
};

const apiInstance: AxiosInstance = Axios.create({
  baseURL: apiBaseURL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false,
  timeout: 30000,
});

apiInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (!IS_SERVER) {
      const token = getToken();
      if (token) {
        config.headers.set("Authorization", `Bearer ${token}`);
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

apiInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    emitUnauthorizedEvent(error);
    return Promise.reject(error);
  },
);

type SuccessResult<T> = readonly [T, null, string];
type ErrorResult<E = Error> = readonly [null, E, string];
type SafeExecResult<T, E = Error> = SuccessResult<T> | ErrorResult<E>;

async function safeExec<T, E extends Error = Error>(
  config: AxiosRequestConfig,
  mapper: (data: any) => T = (data) => data as T,
): Promise<SafeExecResult<T, E>> {
  try {
    const response = await apiInstance.request(config);
    return [
      mapper(response.data),
      null,
      response.data?.message || "Operation completed successfully.",
    ] as const;
  } catch (error: any) {
    if (error.response) {
      const { status = 400, data } = error.response;
      const errorMessage =
        data?.message || `Request failed with status code ${status}`;
      return [null, new Error(errorMessage) as E, errorMessage] as const;
    }

    const errorMessage =
      error.message || "Network error: Please check your connection";
    return [null, new Error(errorMessage) as E, errorMessage] as const;
  }
}

const api = Object.assign(apiInstance, { safeExec });

export default api;