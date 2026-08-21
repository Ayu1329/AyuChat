# AyuChat 产品文档

欢迎阅读 AyuChat 产品与设计文档。本目录下的 **Markdown 文件是唯一源码**，Git 照常提交；本地通过 Docsify 渲染后在浏览器中 review。

## 快速开始

在项目根目录执行：

```bash
pnpm install
pnpm docs:dev
```

浏览器会自动打开 `http://localhost:3000`，左侧导航可点击跳转各篇文档。

## 文档索引

| 文档 | 说明 |
|------|------|
| [UI 总方案](Fronted_part/UI/ui_setting.md) | 前端 UI 布局、组件、Design Tokens、分期路线 |
| [Docsify 文档方案](docs-workflow.md) | 本地预览、新增文档、Git 协作流程 |

## 目录约定

```
prd/
├── README.md              ← 文档站首页（本页）
├── _sidebar.md            ← 左侧导航（新增文档时需同步更新）
├── index.html             ← Docsify 入口（勿删）
├── docs-workflow.md       ← 文档工作流说明
└── Fronted_part/          ← 前端相关 PRD
    └── UI/
        └── ui_setting.md
```

后续可在 `prd/` 下按模块扩展，例如 `Server/`、`Connect/` 等，无需改变 MD 存放方式。
