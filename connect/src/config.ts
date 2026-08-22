const DEFAULT_BASE_URL = "http://localhost:8080";
const API_PREFIX = "/api/v1";

export const COUNTRY_CODE = "+86" as const;

let baseUrl = DEFAULT_BASE_URL;
let wsProxyTarget: string | undefined;

export function getBaseUrl(): string {
  return baseUrl;
}

export function setBaseUrl(url: string): void {
  baseUrl = url.replace(/\/$/, "");
}

/** dev 模式下 HTTP 走 Vite 代理，WS 需直连此后端地址 */
export function setWsProxyTarget(url: string | undefined): void {
  wsProxyTarget = url?.replace(/\/$/, "");
}

export function apiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const origin = baseUrl.replace(/\/$/, "");
  if (!origin) {
    return `${API_PREFIX}${normalized}`;
  }
  return `${origin}${API_PREFIX}${normalized}`;
}

export function wsUrl(path = "/ws"): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const fullPath = `${API_PREFIX}${normalized}`;
  const origin = baseUrl.replace(/\/$/, "");
  if (!origin) {
    // dev：HTTP 走 Vite 代理，WS 直连后端（Electron 下 Vite WS 代理不可靠）
    if (wsProxyTarget) {
      const wsOrigin = wsProxyTarget.replace(/^http/, "ws");
      return `${wsOrigin}${fullPath}`;
    }
    if (typeof window !== "undefined") {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      return `${protocol}//${window.location.host}${fullPath}`;
    }
    return `ws://localhost:8080${fullPath}`;
  }
  const wsOrigin = origin.replace(/^http/, "ws");
  return `${wsOrigin}${fullPath}`;
}
