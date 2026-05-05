function __validateEnvVariable(variable: string | undefined, name: string): string {
  if (!variable) throw new Error(`Environment variable ${name} is not defined.`);

  return variable;
}

function normalizeApiBaseURL(url: string): string {
  const trimmedUrl = url.replace(/\/+$/, "");

  return trimmedUrl.endsWith("/api") ? trimmedUrl : `${trimmedUrl}/api`;
}

export const apiBaseURL = normalizeApiBaseURL(
  __validateEnvVariable(
    process.env.NEXT_PUBLIC_API_BASE_URL,
    "NEXT_PUBLIC_API_BASE_URL",
  ),
);
