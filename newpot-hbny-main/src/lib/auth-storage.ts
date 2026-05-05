export const TOKEN_KEY = "access_token";
export const SESSION_COOKIE = "has_session";
const SESSION_MAX_AGE = 7 * 24 * 60 * 60;

const IS_BROWSER = typeof window !== "undefined";

export const getToken = (): string | null => {
  if (!IS_BROWSER) return null;
  return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token: string): void => {
  if (!IS_BROWSER) return;
  localStorage.setItem(TOKEN_KEY, token);
  // Non-sensitive presence flag so edge middleware can see "logged in".
  // The real token stays in localStorage and is sent via Authorization header.
  document.cookie = `${SESSION_COOKIE}=1; Path=/; Max-Age=${SESSION_MAX_AGE}; SameSite=Lax`;
};

export const clearToken = (): void => {
  if (!IS_BROWSER) return;
  localStorage.removeItem(TOKEN_KEY);
  document.cookie = `${SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
};
