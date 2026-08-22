import { setBaseUrl, setWsProxyTarget } from "@ayuchat/connect";

/**
 * API 地址由 Vite mode 加载的 .env 决定：
 * - development：VITE_API_BASE_URL 留空 → HTTP 走 Vite 代理，WS 直连 VITE_API_PROXY_TARGET
 * - development.remote：代理/WS 目标为云服务器（pnpm dev:remote）
 * - production：VITE_API_BASE_URL 直连云服务器（打包安装包）
 */
const apiBase = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "";
setBaseUrl(apiBase);
setWsProxyTarget(import.meta.env.VITE_API_PROXY_TARGET as string | undefined);

import "./auth/session";
