# AyuChat 鉴权 PRD — 注册 / 登录 / 忘记密码

> 版本：v0.1  
> 状态：草案  
> 适用范围：Desktop（先行）→ Android → Server / Connect

---

## 1. 文档目的

定义 AyuChat 账号体系在 **v1** 阶段的行为与接口，覆盖：

- 手机号 + 密码 **登录**
- 手机号 + 短信验证码 **注册**
- 手机号 + 短信验证码 **忘记密码 / 重置密码**

本文与桌面端已实现的 UI 流程对齐；后端与 `connect` 层按本文契约实现，前端在编排层（`Register.tsx` / `ForgetPassword.tsx` / `PwdLogin.tsx`）替换 mock 即可。

---

## 2. 范围

### 2.1 v1 包含

| 能力 | 说明 |
|------|------|
| 登录 | 手机号 + 密码，成功后下发访问凭证 |
| 注册 | +86 手机号 → 短信验证码 → 设置密码 → 完成注册 |
| 忘记密码 | +86 手机号 → 短信验证码 → 设置新密码 → 完成重置 |
| 会话 | 客户端保存 token，未登录不可进入聊天主界面 |
| 退出登录 | 客户端清除本地凭证 |

### 2.2 v1 不包含

- 邮箱 / 第三方 OAuth 登录
- 多国家区号（仅 +86）
- 图形验证码、人机验证（可二期加在发码前）
- 设备管理、多端踢下线细粒度策略
- 登录态下的「修改密码」（走忘记密码或设置页二期）

---

## 3. 账号与凭证模型

### 3.1 账号标识

| 字段 | 规则 |
|------|------|
| 国家码 | 固定 `+86`，客户端展示不可改 |
| 手机号 | 中国大陆 11 位，`1[3-9]` 开头，存库建议 `country_code` + `phone` 或归一化 `+86138...` |
| 密码 | 服务端仅存哈希，不回传明文 |

### 3.2 密码规则（客户端与服务端一致校验）

| 规则 | 说明 |
|------|------|
| 长度 | 8–32 位 |
| 字符集 | 字母 + 数字必含；允许常见符号（与桌面端 `PasswordSetting` 一致） |
| 确认 | 注册 / 重置时两次输入须一致（客户端校验；服务端仅收一份 `password`） |

### 3.3 短信验证码

| 字段 | 规则 |
|------|------|
| 长度 | 6 位数字 |
| 有效期 | 建议 5 分钟（可配置） |
| 重发间隔 | 60 秒（与桌面端倒计时一致） |
| 场景 `scene` | `register` \| `reset_password`，不同场景独立计数与校验 |

### 3.4 访问凭证（建议）

| 项 | 建议 |
|----|------|
| 类型 | Bearer JWT 或 opaque access_token + refresh_token |
| 登录响应 | `access_token`、`expires_in`、可选 `refresh_token`、用户摘要 `user` |
| 客户端存储 | Desktop：`sessionStorage` 或安全存储；须含 `token` 与 `account`/`user_id` |
| 路由守卫 | 无有效 token → 跳转 `/login` |

---

## 4. 用户流程

### 4.1 登录

```
打开应用 → /login
  → 输入账号（手机号）、密码
  → 点击「登录」
  → 成功：写入 session，进入 /chat
  → 失败：展示接口错误（账号不存在 / 密码错误等）
```

**入口**：应用默认未登录进登录页；已登录访问 `/login` 重定向 `/chat`。

**页面元素**（已实现）：

- 账号、密码输入框；空值本地校验
- 主按钮「登录」
- 底部左「注册账号」→ `/register`
- 底部右「忘记密码」→ `/forget-password`

### 4.2 注册

```
/login → 注册账号 → /register
  Step 1 短信验证（SmsVerify）
    → 输入 +86 手机号
    → 点击「获取验证码」（handleSendCode → scene=register）
    → 展示 6 位 OTP 输入框
    → 点击「注册」（handleVerify → 验码成功进入 Step 2）
  Step 2 设置密码（PasswordSetting）
    → 密码 + 确认密码
    → 点击「设置密码」（handleOk → 注册接口）
    → 成功：跳转 /login（可带 registeredPhone 供预填）
```

**业务规则**：

- 已注册手机号：发码或注册接口返回明确错误，提示去登录或忘记密码
- 验码通过后进入设密；**验码凭证**建议服务端返回短期 `verify_token`，设密时提交，避免重复传 OTP

### 4.3 忘记密码

```
/login → 忘记密码 → /forget-password
  Step 1 短信验证（SmsVerify，verifyLabel=「下一步」）
    → 同注册：发码 scene=reset_password
    → handleVerify 验码成功后进入 Step 2
  Step 2 重置密码（PasswordSetting，submitLabel=「完成重置」）
    → handleOk → 重置密码接口
    → 成功：跳转 /login
```

**业务规则**：

- 未注册手机号：发码或验码失败，提示检查手机号或去注册
- 重置成功后旧 token 全部失效（建议）

### 4.4 流程对比

| 步骤 | 注册 | 忘记密码 |
|------|------|----------|
| 发码 `scene` | `register` | `reset_password` |
| Step1 主按钮 | 注册 | 下一步 |
| Step2 主按钮 | 设置密码 | 完成重置 |
| 最终接口 | `POST /auth/register` | `POST /auth/password/reset` |
| 成功后 | 回登录页 | 回登录页 |

Step1 / Step2 **UI 组件相同**，差异仅在编排层接口与文案。

---

## 5. 客户端架构约定

### 5.1 UI 与业务分离（已实现）

| 组件 | 职责 |
|------|------|
| `SmsVerify` | 手机号 / OTP 本地格式校验；`onSendCode(phone)`、`onVerify(phone, otp)` |
| `PasswordSetting` | 密码规则与二次确认；`onOk(password)` |
| `Register` / `ForgetPassword` | `step` 状态、`phone`、调用 connect/API |

**错误展示**：编排层 catch 接口错误后，通过 props 扩展或全局 toast 展示（v1 可在 `SmsVerify` / `PasswordSetting` 增加 `error` prop，二期统一）。

### 5.2 connect 层职责

- 统一 `baseURL`、请求头、`Authorization`
- 将 HTTP 错误映射为 `ConnectError { code, message }`
- 不直接在 UI 组件内 `fetch`

---

## 6. API 契约（草案）

> Base path 建议：`/api/v1`  
> Content-Type：`application/json`  
> 鉴权：除登录、注册、发码、验码、重置外，其余接口需 `Authorization: Bearer <access_token>`

### 6.1 发送短信验证码

`POST /auth/sms/send`

**请求**

```json
{
  "country_code": "+86",
  "phone": "13800138000",
  "scene": "register"
}
```

| 字段 | 必填 | 说明 |
|------|------|------|
| `country_code` | 是 | v1 仅允许 `+86` |
| `phone` | 是 | 11 位国内手机号 |
| `scene` | 是 | `register` \| `reset_password` |

**成功** `200`

```json
{
  "ok": true,
  "retry_after": 60
}
```

**失败示例**

| HTTP | code | 说明 |
|------|------|------|
| 400 | `INVALID_PHONE` | 手机号格式错误 |
| 400 | `INVALID_SCENE` | scene 非法 |
| 409 | `PHONE_ALREADY_REGISTERED` | scene=register 且已注册 |
| 404 | `PHONE_NOT_FOUND` | scene=reset_password 且未注册 |
| 429 | `SMS_RATE_LIMIT` | 发送过于频繁 |

### 6.2 校验短信验证码

`POST /auth/sms/verify`

**请求**

```json
{
  "country_code": "+86",
  "phone": "13800138000",
  "scene": "register",
  "code": "123456"
}
```

**成功** `200`

```json
{
  "verify_token": "vt_xxx",
  "expires_in": 600
}
```

`verify_token` 用于下一步注册或重置，单次有效、短期过期。

**失败**

| HTTP | code | 说明 |
|------|------|------|
| 400 | `INVALID_CODE` | 验证码错误或过期 |
| 429 | `VERIFY_RATE_LIMIT` | 尝试次数过多 |

### 6.3 注册

`POST /auth/register`

**请求**

```json
{
  "country_code": "+86",
  "phone": "13800138000",
  "verify_token": "vt_xxx",
  "password": "abc12345"
}
```

**成功** `201`

```json
{
  "user": {
    "id": "u_xxx",
    "phone": "13800138000",
    "country_code": "+86"
  }
}
```

**失败**

| HTTP | code | 说明 |
|------|------|------|
| 400 | `INVALID_PASSWORD` | 密码不符合规则 |
| 400 | `INVALID_VERIFY_TOKEN` | token 无效或过期 |
| 409 | `PHONE_ALREADY_REGISTERED` | 已注册 |

### 6.4 登录

`POST /auth/login`

**请求**

```json
{
  "country_code": "+86",
  "phone": "13800138000",
  "password": "abc12345"
}
```

**成功** `200`

```json
{
  "access_token": "eyJ...",
  "expires_in": 604800,
  "refresh_token": "rt_xxx",
  "user": {
    "id": "u_xxx",
    "phone": "13800138000",
    "country_code": "+86"
  }
}
```

**失败**

| HTTP | code | 说明 |
|------|------|------|
| 401 | `INVALID_CREDENTIALS` | 账号或密码错误（不区分具体项，防枚举） |
| 403 | `ACCOUNT_DISABLED` | 账号被封禁 |

### 6.5 重置密码

`POST /auth/password/reset`

**请求**

```json
{
  "country_code": "+86",
  "phone": "13800138000",
  "verify_token": "vt_xxx",
  "password": "newpass123"
}
```

**成功** `200`

```json
{
  "ok": true
}
```

**失败**：同注册（`INVALID_PASSWORD`、`INVALID_VERIFY_TOKEN`）；`PHONE_NOT_FOUND`。

### 6.6 退出登录（可选 v1）

`POST /auth/logout`

Header：`Authorization: Bearer <token>`

**成功** `200`：`{ "ok": true }`  
服务端使 refresh_token / session 失效；客户端无论接口是否成功都应清本地 token。

### 6.7 刷新令牌（建议 v1 一并实现）

`POST /auth/token/refresh`

```json
{
  "refresh_token": "rt_xxx"
}
```

返回新的 `access_token`、`expires_in`，可选轮转 `refresh_token`。

---

## 7. 统一错误响应格式

```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "账号或密码错误"
  }
}
```

| 字段 | 说明 |
|------|------|
| `code` | 机器可读，客户端可做分支 |
| `message` | 人类可读，可直接展示或映射文案 |

---

## 8. 安全与风控（v1 基线）

| 项 | 要求 |
|----|------|
| 密码存储 | bcrypt / argon2 等强哈希 + 盐 |
| 传输 | 生产环境 HTTPS |
| 验证码 | 限制有效期、错误次数、单手机号日发送上限 |
| 登录 | 连续失败可临时锁定（阈值服务端配置） |
| Token | access 短有效期 + refresh；重置密码后吊销旧 token |
| 日志 | 不记录密码、完整验证码 |

---

## 9. 状态与边界

### 9.1 发码倒计时

- 客户端 60s 内禁用「获取验证码」
- 服务端 `retry_after` 与客户端对齐；若服务端返回 429，展示 `SMS_RATE_LIMIT` 文案

### 9.2 注册 / 重置中途离开

- 刷新 `/register` 或 `/forget-password`：回到 Step1（不持久化 OTP）
- `verify_token` 仅服务端短期有效，不写入本地长期存储

### 9.3 登录态

| 场景 | 行为 |
|------|------|
| 未登录访问 `/chat` | 重定向 `/login`，保留 `from` |
| 已登录访问 `/login` | 重定向 `/chat` |
| Token 过期 | connect 尝试 refresh；失败则清 session 并跳转登录 |

---

## 10. 验收标准（v1）

- [ ] 未注册手机号可完成：发码 → 验码 → 设密 → 登录
- [ ] 已注册手机号注册流程被拒绝并提示合理文案
- [ ] 正确账号密码可登录并进入聊天页
- [ ] 错误密码提示明确且不泄露账号是否存在（与 `INVALID_CREDENTIALS` 策略一致）
- [ ] 忘记密码流程可重置密码，旧密码失效
- [ ] 未注册手机号无法走重置流程
- [ ] 退出登录后无法访问 `/chat`
- [ ] 密码规则、手机号规则前后端一致
- [ ] 发码 60s 内不可重复发送（前后端一致）

---

## 11. 实现分期建议

| 阶段 | 内容 |
|------|------|
| P0 | 本文 API + 桌面 connect 接入；mock 短信（开发环境固定码如 `123456`） |
| P1 | 真实短信通道；refresh token；错误文案产品化 |
| P2 | 图形验证码、设备管理、修改密码页 |

---

## 12. 待定项（TBD）

- [ ] access_token 有效期具体数值
- [ ] 是否 v1 强制 refresh_token
- [ ] 用户 `id` 与对外 `account` 展示字段（昵称、头像默认值）
- [ ] 短信服务商与模板文案审核
- [ ] Android 与 Desktop 凭证存储差异（Keychain / Keystore）

---

## 13. 修订记录

| 版本 | 日期 | 说明 |
|------|------|------|
| v0.1 | 2026-08-22 | 初稿：三流程、API 草案、与桌面 UI 对齐 |
