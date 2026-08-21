# AyuChat

自研 IM 聊天软件（Desktop / Android / Server）。

## 文档

产品与设计文档位于 [`prd/`](prd/)，**源码为 Markdown**，Git 照常维护。

```bash
pnpm install
pnpm docs:dev
```

浏览器打开 <http://localhost:3000>；详见 [Docsify 文档方案](prd/docs-workflow.md)。

## Desktop（Electron + React）

```bash
pnpm install
pnpm desktop:dev
```

详见 [`desktop/README.md`](desktop/README.md)。

## 目录

```
AyuChat/
├── packages/     # 跨端共享：ui-tokens、ui-contracts、ui
├── prd/          # 产品文档
├── desktop/      # Electron + React 桌面客户端
├── android/      # Android 客户端
├── server/       # 服务端
└── connect/      # 连接层
```
