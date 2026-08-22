const DEFAULT_BASE_URL = "http://localhost:8080";
const API_PREFIX = "/api/v1";

export const COUNTRY_CODE = "+86" as const;

let baseUrl = DEFAULT_BASE_URL;

export function getBaseUrl(): string {
  return baseUrl;
}

export function setBaseUrl(url: string): void {
  baseUrl = url.replace(/\/$/, "");
}

export function apiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const origin = baseUrl.replace(/\/$/, "");
  if (!origin) {
    return `${API_PREFIX}${normalized}`;
  }
  return `${origin}${API_PREFIX}${normalized}`;
}
