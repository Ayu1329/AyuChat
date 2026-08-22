# AyuChat 鉴权 API 文档

> 版本：v0.1  
> 状态：草案  
> 依据：[鉴权 PRD](auth_prd.md)  
> 适用范围：Server 实现、Connect 层、Desktop / Android 客户端

---

## 1. 概述

本文定义 AyuChat v1 鉴权相关 REST API，覆盖：

- 短信验证码发送与校验
- 用户注册
- 账号密码登录
- 密码重置
- 退出登录
- 访问令牌刷新

### 1.1 环境与 Base URL

| 环境 | Base URL |
|------|----------|
| 本地开发 | `http://localhost:8080` |
| API 前缀 | `/api/v1` |

完整路径示例：`POST http://localhost:8080/api/v1/auth/login`

### 1.2 通用约定

| 项 | 约定 |
|----|------|
| 协议 | 生产环境 HTTPS；本地开发 HTTP |
| 编码 | UTF-8 |
| Content-Type | `application/json` |
| 请求体 | JSON 对象，字段名 `snake_case` |
| 成功响应 | JSON 对象 |
| 失败响应 | 见 [§3 统一错误格式](#3-统一错误格式) |
| 鉴权方式 | `Authorization: Bearer <access_token>` |

### 1.3 鉴权要求

| 接口 | 是否需要 Bearer Token |
|------|----------------------|
| `POST /auth/sms/send` | 否 |
| `POST /auth/sms/verify` | 否 |
| `POST /auth/register` | 否 |
| `POST /auth/login` | 否 |
| `POST /auth/password/reset` | 否 |
| `POST /auth/token/refresh` | 否 |
| `POST /auth/logout` | **是** |

---

## 2. 公共数据模型

### 2.1 User（用户摘要）

登录、注册成功后返回的用户信息。

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 用户唯一标识（UUID） |
| `phone` | string | 11 位国内手机号，不含国家码 |
| `country_code` | string | 国家码，v1 固定 `+86` |
| `name` | string \| null | 用户昵称；未设置时为 `null` |

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "phone": "13800138000",
  "country_code": "+86",
  "name": "小明"
}
```

### 2.2 字段校验规则

#### 手机号

| 规则 | 值 |
|------|-----|
| 国家码 | 固定 `+86` |
| 手机号格式 | 11 位，`1[3-9]` 开头 |
| 正则 | `^1[3-9]\d{9}$` |

#### 密码

| 规则 | 值 |
|------|-----|
| 长度 | 8–32 位 |
| 字符集 | 必须同时包含字母和数字；允许常见符号 |
| 正则 | `^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]{8,32}$` |

#### 短信验证码

| 规则 | 值 |
|------|-----|
| 长度 | 6 位数字 |
| 有效期 | 300 秒（5 分钟，可配置） |
| 重发间隔 | 60 秒（可配置） |

#### 场景 `scene`

| 值 | 用途 |
|----|------|
| `register` | 注册发码 / 验码 |
| `reset_password` | 忘记密码发码 / 验码 |

#### 验码凭证 `verify_token`

- 由 `POST /auth/sms/verify` 成功后返回
- 用于 `POST /auth/register` 或 `POST /auth/password/reset`
- 单次有效，默认有效期 600 秒（10 分钟）
- **不写入客户端长期存储**，仅在注册/重置流程的内存状态中暂存

#### 访问凭证

| 字段 | 类型 | 说明 |
|------|------|------|
| `access_token` | string | JWT，用于后续受保护接口 |
| `expires_in` | number | access_token 有效期（秒），默认 604800（7 天） |
| `refresh_token` | string | 刷新令牌，默认有效期 2592000 秒（30 天） |

---

## 3. 统一错误格式

所有业务错误均返回如下结构：

```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "账号或密码错误"
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `error.code` | string | 机器可读错误码，客户端可据此分支处理 |
| `error.message` | string | 人类可读说明，可直接展示或映射为产品文案 |

### 3.1 错误码一览

| code | HTTP 状态码 | 说明 | 常见触发场景 |
|------|-------------|------|--------------|
| `INVALID_PHONE` | 400 | 手机号格式错误 | 非 +86、非 11 位合法手机号 |
| `INVALID_SCENE` | 400 | scene 非法 | scene 不是 `register` 或 `reset_password` |
| `INVALID_CODE` | 400 | 验证码错误或过期 | OTP 不匹配或超过有效期 |
| `INVALID_PASSWORD` | 400 | 密码不符合规则 | 长度、字符集校验失败 |
| `INVALID_VERIFY_TOKEN` | 400 | 验码凭证无效或过期 | token 不存在、已使用或超时 |
| `INVALID_CREDENTIALS` | 401 | 账号或密码错误 | 登录失败（不区分具体原因） |
| `UNAUTHORIZED` | 401 | 未授权 | token 缺失、无效或过期 |
| `ACCOUNT_DISABLED` | 403 | 账号已禁用 | 用户被禁用 |
| `PHONE_NOT_FOUND` | 404 | 手机号未注册 | 重置密码时手机号不存在 |
| `PHONE_ALREADY_REGISTERED` | 409 | 手机号已注册 | 注册时手机号已存在 |
| `SMS_RATE_LIMIT` | 429 | 短信发送过于频繁 | 60 秒内重复发码 |
| `VERIFY_RATE_LIMIT` | 429 | 验码尝试过多 | 短时间内多次错误验码 |

---

## 4. 接口详情

### 4.1 发送短信验证码

向指定手机号发送 6 位短信验证码。

```
POST /api/v1/auth/sms/send
```

**是否需要鉴权**：否

#### 请求体

```json
{
  "country_code": "+86",
  "phone": "13800138000",
  "scene": "register"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `country_code` | string | 是 | 固定 `+86` |
| `phone` | string | 是 | 11 位国内手机号 |
| `scene` | string | 是 | `register` \| `reset_password` |

#### 成功响应 `200 OK`

```json
{
  "ok": true,
  "retry_after": 60
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `ok` | boolean | 固定 `true` |
| `retry_after` | number | 下次可发码间隔（秒），客户端倒计时应与此对齐 |

#### 业务规则

| scene | 前置校验 |
|-------|----------|
| `register` | 手机号**不得**已注册，否则返回 `PHONE_ALREADY_REGISTERED` |
| `reset_password` | 手机号**必须**已注册，否则返回 `PHONE_NOT_FOUND` |

#### 错误响应

| HTTP | code | message 示例 |
|------|------|--------------|
| 400 | `INVALID_PHONE` | 请输入有效的中国大陆手机号 |
| 400 | `INVALID_SCENE` | scene 非法 |
| 404 | `PHONE_NOT_FOUND` | 该手机号尚未注册 |
| 409 | `PHONE_ALREADY_REGISTERED` | 该手机号已注册，请直接登录 |
| 429 | `SMS_RATE_LIMIT` | 发送过于频繁，请稍后再试 |

#### 调用示例

```bash
curl -X POST http://localhost:8080/api/v1/auth/sms/send \
  -H "Content-Type: application/json" \
  -d '{"country_code":"+86","phone":"13800138000","scene":"register"}'
```

---

### 4.2 校验短信验证码

校验 OTP，成功后返回短期 `verify_token`，供注册或重置密码使用。

```
POST /api/v1/auth/sms/verify
```

**是否需要鉴权**：否

#### 请求体

```json
{
  "country_code": "+86",
  "phone": "13800138000",
  "scene": "register",
  "code": "123456"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `country_code` | string | 是 | 固定 `+86` |
| `phone` | string | 是 | 与发码时一致 |
| `scene` | string | 是 | 与发码时一致 |
| `code` | string | 是 | 6 位数字验证码 |

#### 成功响应 `200 OK`

```json
{
  "verify_token": "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456",
  "expires_in": 600
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `verify_token` | string | 验码凭证，下一步注册/重置时提交 |
| `expires_in` | number | 凭证有效期（秒） |

#### 错误响应

| HTTP | code | message 示例 |
|------|------|--------------|
| 400 | `INVALID_PHONE` | 请输入有效的中国大陆手机号 |
| 400 | `INVALID_CODE` | 验证码错误或已过期 |
| 429 | `VERIFY_RATE_LIMIT` | 验证尝试次数过多，请稍后再试 |

#### 调用示例

```bash
curl -X POST http://localhost:8080/api/v1/auth/sms/verify \
  -H "Content-Type: application/json" \
  -d '{"country_code":"+86","phone":"13800138000","scene":"register","code":"123456"}'
```

---

### 4.3 注册

使用验码凭证完成注册，创建新用户。

```
POST /api/v1/auth/register
```

**是否需要鉴权**：否

#### 请求体

```json
{
  "country_code": "+86",
  "phone": "13800138000",
  "verify_token": "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456",
  "password": "abc12345"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `country_code` | string | 是 | 固定 `+86` |
| `phone` | string | 是 | 与验码时一致 |
| `verify_token` | string | 是 | `POST /auth/sms/verify` 返回的凭证 |
| `password` | string | 是 | 符合密码规则的明文（传输层 HTTPS 保护） |

#### 成功响应 `201 Created`

```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "phone": "13800138000",
    "country_code": "+86"
  }
}
```

> 注册成功后**不自动登录**，客户端应跳转登录页，由用户手动登录。

#### 错误响应

| HTTP | code | message 示例 |
|------|------|--------------|
| 400 | `INVALID_PASSWORD` | 密码长度为 8–32 位，且需同时包含字母和数字 |
| 400 | `INVALID_VERIFY_TOKEN` | 验证凭证无效或已过期 |
| 409 | `PHONE_ALREADY_REGISTERED` | 该手机号已注册 |

#### 调用示例

```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"country_code":"+86","phone":"13800138000","verify_token":"<verify_token>","password":"abc12345"}'
```

---

### 4.4 登录

使用手机号 + 密码登录，成功后下发访问凭证。

```
POST /api/v1/auth/login
```

**是否需要鉴权**：否

#### 请求体

```json
{
  "country_code": "+86",
  "phone": "13800138000",
  "password": "abc12345"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `country_code` | string | 是 | 固定 `+86` |
| `phone` | string | 是 | 11 位国内手机号 |
| `password` | string | 是 | 登录密码 |

#### 成功响应 `200 OK`

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiJ9...",
  "expires_in": 604800,
  "refresh_token": "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "phone": "13800138000",
    "country_code": "+86"
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `access_token` | string | JWT，后续请求放入 `Authorization` 头 |
| `expires_in` | number | access_token 有效期（秒） |
| `refresh_token` | string | 用于刷新 access_token |
| `user` | User | 当前登录用户摘要 |

#### 错误响应

| HTTP | code | message 示例 |
|------|------|--------------|
| 401 | `INVALID_CREDENTIALS` | 账号或密码错误 |
| 403 | `ACCOUNT_DISABLED` | 账号已被禁用 |

> 登录失败时**不区分**「账号不存在」与「密码错误」，统一返回 `INVALID_CREDENTIALS`，防止账号枚举。

#### 调用示例

```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"country_code":"+86","phone":"13800138000","password":"abc12345"}'
```

---

### 4.5 重置密码

使用验码凭证设置新密码。成功后该用户所有 refresh_token 失效。

```
POST /api/v1/auth/password/reset
```

**是否需要鉴权**：否

#### 请求体

```json
{
  "country_code": "+86",
  "phone": "13800138000",
  "verify_token": "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456",
  "password": "newpass123"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `country_code` | string | 是 | 固定 `+86` |
| `phone` | string | 是 | 与验码时一致 |
| `verify_token` | string | 是 | scene=`reset_password` 验码后获得 |
| `password` | string | 是 | 新密码，符合密码规则 |

#### 成功响应 `200 OK`

```json
{
  "ok": true
}
```

#### 错误响应

| HTTP | code | message 示例 |
|------|------|--------------|
| 400 | `INVALID_PASSWORD` | 密码长度为 8–32 位，且需同时包含字母和数字 |
| 400 | `INVALID_VERIFY_TOKEN` | 验证凭证无效或已过期 |
| 404 | `PHONE_NOT_FOUND` | 该手机号尚未注册 |

#### 调用示例

```bash
curl -X POST http://localhost:8080/api/v1/auth/password/reset \
  -H "Content-Type: application/json" \
  -d '{"country_code":"+86","phone":"13800138000","verify_token":"<verify_token>","password":"newpass123"}'
```

---

### 4.6 退出登录

吊销当前用户的 refresh_token。客户端无论接口是否成功，都应清除本地凭证。

```
POST /api/v1/auth/logout
```

**是否需要鉴权**：是

#### 请求头

```
Authorization: Bearer <access_token>
```

#### 请求体

无

#### 成功响应 `200 OK`

```json
{
  "ok": true
}
```

#### 错误响应

| HTTP | code | 说明 |
|------|------|------|
| 401 | `UNAUTHORIZED` | token 缺失、无效或过期 |

#### 调用示例

```bash
curl -X POST http://localhost:8080/api/v1/auth/logout \
  -H "Authorization: Bearer <access_token>"
```

---

### 4.7 刷新访问令牌

使用 refresh_token 获取新的 access_token（及可选的新 refresh_token）。

```
POST /api/v1/auth/token/refresh
```

**是否需要鉴权**：否（凭 refresh_token 本身鉴权）

#### 请求体

```json
{
  "refresh_token": "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `refresh_token` | string | 是 | 登录时下发的 refresh_token |

#### 成功响应 `200 OK`

响应结构与 [§4.4 登录](#44-登录) 相同：

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiJ9...",
  "expires_in": 604800,
  "refresh_token": "新的refresh_token",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "phone": "13800138000",
    "country_code": "+86"
  }
}
```

#### 错误响应

| HTTP | code | 说明 |
|------|------|------|
| 401 | `UNAUTHORIZED` | refresh_token 无效、已吊销或过期 |

#### 调用示例

```bash
curl -X POST http://localhost:8080/api/v1/auth/token/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token":"<refresh_token>"}'
```

---

## 5. 业务流程与接口调用顺序

### 5.1 注册

```
POST /auth/sms/send      scene=register
        ↓
POST /auth/sms/verify    scene=register  → 获得 verify_token
        ↓
POST /auth/register      提交 verify_token + password
        ↓
POST /auth/login         用户手动登录
```

### 5.2 忘记密码

```
POST /auth/sms/send      scene=reset_password
        ↓
POST /auth/sms/verify    scene=reset_password  → 获得 verify_token
        ↓
POST /auth/password/reset  提交 verify_token + password
        ↓
POST /auth/login         使用新密码登录
```

### 5.3 登录与会话维护

```
POST /auth/login         → 保存 access_token + refresh_token
        ↓
（access_token 过期时）
POST /auth/token/refresh → 更新 token
        ↓
（用户主动退出）
POST /auth/logout        → 清除本地凭证
```

### 5.4 流程对比

| 步骤 | 注册 | 忘记密码 |
|------|------|----------|
| 发码 scene | `register` | `reset_password` |
| 验码 scene | `register` | `reset_password` |
| 最终接口 | `POST /auth/register` | `POST /auth/password/reset` |
| 成功后 | 跳转登录页 | 跳转登录页 |

---

## 6. 开发环境说明

本地开发 profile（`dev`）下启用 mock 短信：

| 配置项 | 值 | 说明 |
|--------|-----|------|
| `ayuchat.sms.mock-enabled` | `true` | 不调用真实短信通道 |
| `ayuchat.sms.mock-code` | `123456` | 固定验证码，发码/验码均使用此值 |

完整注册 → 登录调试流程：

```bash
# 1. 发码
curl -X POST http://localhost:8080/api/v1/auth/sms/send \
  -H "Content-Type: application/json" \
  -d '{"country_code":"+86","phone":"13800138000","scene":"register"}'

# 2. 验码（开发环境 code 固定 123456）
curl -X POST http://localhost:8080/api/v1/auth/sms/verify \
  -H "Content-Type: application/json" \
  -d '{"country_code":"+86","phone":"13800138000","scene":"register","code":"123456"}'

# 3. 注册（将上一步返回的 verify_token 填入）
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"country_code":"+86","phone":"13800138000","verify_token":"<verify_token>","password":"abc12345"}'

# 4. 登录
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"country_code":"+86","phone":"13800138000","password":"abc12345"}'
```

---

## 7. Connect 层对接约定

Connect 层（`connect/`）应按本文档封装 HTTP 调用，UI 组件不直接 `fetch`。

### 7.1 职责

- 统一 `baseURL`、请求头、`Content-Type`
- 自动附加 `Authorization: Bearer <access_token>`
- 将 HTTP 错误解析为 `ConnectError { code, message }`
- access_token 过期时尝试 `POST /auth/token/refresh`，失败则清除会话

### 7.2 建议模块划分

| 模块 | 导出 |
|------|------|
| `client` | 底层 HTTP 请求、错误解析 |
| `auth` | `sendSms`、`verifySms`、`register`、`login`、`resetPassword`、`logout`、`refreshToken` |
| `types` | 请求/响应 TypeScript 类型 |
| `errors` | `ConnectError`、错误码枚举 |

### 7.3 客户端会话存储

登录成功后，客户端应持久化：

| 字段 | 说明 |
|------|------|
| `access_token` | 访问凭证 |
| `refresh_token` | 刷新凭证 |
| `expires_in` | 用于判断是否需要 preemptive refresh |
| `user` | 用户摘要（`id`、`phone`、`country_code`） |

Desktop v1 使用 `sessionStorage`；`verify_token` 仅在注册/重置流程的组件 state 中暂存，不写入长期存储。

---

## 8. 安全要求（v1 基线）

| 项 | 要求 |
|----|------|
| 密码存储 | BCrypt 哈希 + 盐，不回传明文 |
| 传输 | 生产环境强制 HTTPS |
| 验证码 | 有效期限制、错误次数限制、单日发送上限 |
| 登录 | 连续失败可临时锁定（阈值服务端配置） |
| Token | access 短有效期 + refresh；重置密码后吊销旧 refresh_token |
| 日志 | 不记录密码、完整验证码 |

---

## 9. 修订记录

| 版本 | 日期 | 说明 |
|------|------|------|
| v0.1 | 2026-08-22 | 初稿：依据鉴权 PRD 整理为独立 API 文档 |
