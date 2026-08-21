# @ayuchat/desktop

AyuChat 桌面客户端：**Electron + React + Vite**（electron-vite）。

## 开发

在仓库根目录：

```bash
pnpm install
pnpm desktop:dev
```

或在本目录：

```bash
pnpm install
pnpm dev
```

## 目录

```
desktop/
├── electron.vite.config.ts
├── src/
│   ├── main/          # Electron 主进程
│   ├── preload/       # 预加载桥（contextBridge）
│   └── renderer/      # React 渲染进程
└── package.json
```

## 后续

- 接入 `@ayuchat/ui` 组件库
- 接入 connect 层与后端通信
