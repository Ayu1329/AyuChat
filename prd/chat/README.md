# 聊天模块文档

> 本目录描述 AyuChat **好友单聊、文本消息收发** 的产品需求与接口约定，供 Desktop / Android / Server / Connect 对齐实现。

## 文档索引

| 文档 | 说明 |
|------|------|
| [聊天 PRD（单聊 / 文本消息）](chat_prd.md) | 流程、领域模型、可扩展性设计、分期与验收 |
| [聊天 API 文档](chat_api.md) | REST + WebSocket 契约：好友、会话、消息、推送事件 |

## 与前端实现对应

| 桌面端组件 | 说明 |
|------------|------|
| `ChatComponent/index.tsx` | 会话页编排：列表、消息、发送、断线重试（当前为 mock） |
| `ChatComponent/ConversationList.tsx` | 左侧会话列表 |
| `ChatComponent/ChatMain.tsx` | 右侧聊天区：消息流 + 输入 |
| `ChatComponent/Composer.tsx` | 文本输入与发送 |
| `ChatComponent/types.ts` | 客户端消息类型（v1 仅文本，需与 connect 对齐） |
| `ChatComponent/mockData.ts` | 开发期 mock，接入后移除或仅用于 Storybook |

## 前置依赖

- [鉴权 PRD](../auth/auth_prd.md)：用户登录态、JWT、`user.id`
- [UI 总方案](../Fronted_part/UI/ui_setting.md)：双栏布局、气泡、消息状态展示

## 修订记录

| 版本 | 日期 | 说明 |
|------|------|------|
| v0.1 | 2026-08-22 | 初稿：好友单聊 + 纯文本消息 + 可扩展消息模型 |
