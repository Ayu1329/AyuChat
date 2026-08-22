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
| [鉴权 PRD](auth/auth_prd.md) | 注册、登录、忘记密码流程与 API 契约 |
| [聊天 PRD](chat/chat_prd.md) | 好友单聊、纯文本消息、可扩展消息模型 |
| [数据库表结构](server/database_schema.md) | 全表字段、关系、变更流程（改表 / 改接口须同步更新） |
| [Docsify 文档方案](docs-workflow.md) | 本地预览、新增文档、Git 协作流程 |

## 目录约定

```
prd/
├── README.md              ← 文档站首页（本页）
├── _sidebar.md            ← 左侧导航（新增文档时需同步更新）
├── index.html             ← Docsify 入口（勿删）
├── docs-workflow.md       ← 文档工作流说明
├── Fronted_part/          ← 前端相关 PRD
│   └── UI/
│       └── ui_setting.md
├── auth/                  ← 鉴权（注册 / 登录 / 忘记密码）
│   ├── README.md
│   ├── auth_prd.md
│   └── auth_api.md
├── chat/                  ← 聊天（好友单聊 / 文本消息）
│   ├── README.md
│   ├── chat_prd.md
│   └── chat_api.md
└── server/                ← 后端（数据库、部署）
    ├── README.md
    └── database_schema.md
```

后续可在 `prd/` 下按模块扩展，例如 `Connect/` 等，无需改变 MD 存放方式。
