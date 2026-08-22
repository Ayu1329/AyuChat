import { setBaseUrl } from "@ayuchat/connect";

/**
 * 开发环境走 Vite 代理（同源 /api → localhost:8080），避免 CORS。
 * 生产包按实际部署地址配置。
 */
if (import.meta.env.DEV) {
  setBaseUrl("");
}
