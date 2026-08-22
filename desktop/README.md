# @ayuchat/desktop

AyuChat 桌面客户端：**Electron + React + Vite**（electron-vite）。

通过 [`@ayuchat/connect`](../connect/) 与后端通信（REST + WebSocket）。

## 环境要求

- Node.js 18+
- pnpm 9+（仓库根目录 `pnpm install`）

本地开发连本机后端时，还需在仓库根目录启动 Java 服务：`pnpm server:dev`（JDK 17+）。

## 开发

在仓库根目录：

```bash
pnpm install
```

### 连本地后端（默认）

```bash
# 终端 1：启动后端
pnpm server:dev

# 终端 2：启动桌面端
pnpm desktop:dev
```

或在本目录：`pnpm dev`

HTTP 走 Vite 代理 `/api/v1` → `http://localhost:8080`；WebSocket 直连本地 8080。

### 连云服务器

无需本地后端，直接连已部署的远端：

```bash
pnpm desktop:dev:remote
```

HTTP 走 Vite 代理到云端；WebSocket 直连云端地址（见 `.env.development.remote`）。

## 环境配置

| 文件 | 用途 | 命令 |
|------|------|------|
| `.env.development` | 本地后端 | `pnpm dev` / `pnpm desktop:dev` |
| `.env.development.remote` | 云端后端 | `pnpm dev:remote` / `pnpm desktop:dev:remote` |
| `.env.production` | 打包安装包 | `pnpm desktop:build` |

模板见 [`.env.example`](.env.example)。

**约定：**

- `VITE_API_BASE_URL` 留空 → dev 模式走 Vite 代理（避免 CORS）
- `VITE_API_PROXY_TARGET` → 代理 / WS 的目标后端地址
- 打包后 `VITE_API_BASE_URL` 填云服务器地址，客户端直连

修改 `.env.*` 后需重启 dev 进程。

## 打包

```bash
# 仓库根目录
pnpm desktop:build

# 或本目录
pnpm build
```

安装包输出在 `desktop/dist/`。打包前确认 `.env.production` 中的 `VITE_API_BASE_URL` 指向正确的云服务器。

仅生成未安装目录（调试安装包结构）：

```bash
pnpm build:dir
```

## 部署服务端

桌面端连云端前，需先部署后端（仓库根目录）：

```bash
pnpm deploy:server
```

详见根目录 [`deploy.config.json`](../deploy.config.json) 与 [`scripts/deploy-server.mjs`](../scripts/deploy-server.mjs)。部署后服务端由 systemd 托管，开机自启。

## 目录

```
desktop/
├── electron.vite.config.ts   # Electron / Vite 配置（含 dev 代理）
├── .env.development          # 本地 dev
├── .env.development.remote   # 云端 dev
├── .env.production           # 打包 prod
├── src/
│   ├── main/                 # Electron 主进程
│   ├── preload/              # 预加载桥（contextBridge）
│   └── renderer/             # React 渲染进程
│       ├── ayuapi/           # API 封装（带日志）
│       ├── auth/             # 登录态 session
│       ├── ui/               # 可复用 UI 组件（Button、Dialog、Avatar 等）
│       └── components/       # 页面与功能组件（Chat、Settings 等）
└── package.json
```

## 常见问题

**登录报 500 / `http proxy error` / `ECONNREFUSED`**

`pnpm desktop:dev` 需要本机 `pnpm server:dev` 在跑；或改用 `pnpm desktop:dev:remote` 连云服务器。

**dev 模式直连云地址报 CORS**

不要给 `.env.development` 填 `VITE_API_BASE_URL`，应使用 `VITE_API_PROXY_TARGET` + 留空 baseUrl，或直接用 `dev:remote`。

**本地与云端账号不互通**

两套独立数据库，换环境需重新注册（云端 dev profile 验证码固定 `123456`）。
