import { apiUrl } from "./config";
import { ConnectError, parseApiError } from "./errors";

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string | null;
}

let accessTokenProvider: (() => string | null) | null = null;

export function setAccessTokenProvider(provider: () => string | null): void {
  accessTokenProvider = provider;
}

export async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, token } = options;

  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const bearer = token ?? accessTokenProvider?.() ?? null;
  if (bearer) {
    headers.Authorization = `Bearer ${bearer}`;
  }

  let response: Response;
  try {
    response = await fetch(apiUrl(path), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ConnectError("NETWORK_ERROR", "网络连接失败，请检查网络后重试");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  let payload: unknown = null;
  const text = await response.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    throw parseApiError(
      response.status,
      payload,
      response.statusText || "请求失败",
    );
  }

  return payload as T;
}

export function post<T>(path: string, body: unknown, token?: string | null): Promise<T> {
  return request<T>(path, { method: "POST", body, token });
}

export function get<T>(path: string, token?: string | null): Promise<T> {
  return request<T>(path, { method: "GET", token });
}

export function del<T>(path: string, token?: string | null): Promise<T> {
  return request<T>(path, { method: "DELETE", token });
}
