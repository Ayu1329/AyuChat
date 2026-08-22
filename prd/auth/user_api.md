# AyuChat 用户 API 文档

> 版本：v0.1  
> 状态：与当前代码一致  
> 适用范围：Server 实现、Connect 层、Desktop / Android 客户端

---

## 1. 概述

用户资料相关 REST API，当前支持：

- 获取当前用户资料
- 更新昵称（`name`）

### 1.1 Base URL

与鉴权 API 相同：`/api/v1`

### 1.2 鉴权

所有接口均需 `Authorization: Bearer <access_token>`。

---

## 2. 数据模型

### 2.1 User

与登录响应中的 `user` 字段一致，见 [auth_api.md §2.1](auth_api.md#21-user用户摘要)。

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 用户 ID |
| `phone` | string | 手机号 |
| `country_code` | string | 国家码 |
| `name` | string \| null | 昵称；未设置时为 `null` |

对外展示名（好友列表、会话中的 `display_name`）规则：有昵称则用昵称，否则为掩码手机号（如 `138****8000`）。

### 2.2 UpdateProfileRequest

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string \| null | 否 | 昵称；传空字符串或 `null` 表示清除昵称 |

校验：`name` 最长 32 字符（trim 后）。

---

## 3. 接口

### 3.1 获取当前用户

`GET /users/me`

**响应**：`User`

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "phone": "13800138000",
  "country_code": "+86",
  "name": "小明"
}
```

### 3.2 更新资料

`PATCH /users/me`

**请求体**：

```json
{
  "name": "新昵称"
}
```

**响应**：更新后的 `User`

---

## 4. 修订记录

| 版本 | 日期 | 说明 |
|------|------|------|
| v0.1 | 2026-08-23 | 初稿：获取 / 更新昵称 |
