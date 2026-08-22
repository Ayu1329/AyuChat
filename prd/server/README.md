# 服务端文档

> 本目录描述 AyuChat **后端** 的持久化、部署与数据模型，与 `server/` 代码对齐。

## 文档索引

| 文档 | 说明 |
|------|------|
| [数据库表结构与管理](database_schema.md) | 全表字段、关系图、变更流程、与 JPA 实体对应 |
| [鉴权 API](../auth/auth_api.md) | 注册 / 登录 REST 契约 |
| [聊天 API](../chat/chat_api.md) | 好友 / 会话 / 消息 REST + WebSocket 契约 |

## 代码对应

| 文档概念 | 代码位置 |
|----------|----------|
| JPA 实体 | `server/src/main/java/com/ayuchat/domain/` |
| 数据访问 | `server/src/main/java/com/ayuchat/repository/` |
| 连接配置 | `server/src/main/resources/application.yml` |
| H2 数据文件 | `server/data/ayuchat.mv.db`（开发，相对运行目录） |

## 修订记录

| 版本 | 日期 | 说明 |
|------|------|------|
| v0.1 | 2026-08-22 | 初稿：服务端文档目录 + 数据库 schema 文档 |
