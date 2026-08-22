# 鉴权模块文档

> 本目录描述 AyuChat **注册、登录、忘记密码** 的产品需求与接口约定，供 Desktop / Android / Server / Connect 对齐实现。

## 文档索引

| 文档 | 说明 |
|------|------|
| [鉴权 PRD（注册 / 登录 / 忘记密码）](auth_prd.md) | 流程、规则、接口、错误码、安全与分期 |
| [鉴权 API 文档](auth_api.md) | REST 接口契约：请求/响应、错误码、调用示例、Connect 对接约定 |

## 与前端实现对应

| 桌面端组件 | 说明 |
|------------|------|
| `LoginComponent/index.tsx` | 登录入口 |
| `LoginComponent/PwdLogin.tsx` | 账号密码登录 |
| `LoginComponent/Register.tsx` | 注册编排（`handleSendCode` / `handleVerify` / `handleOk`） |
| `LoginComponent/ForgetPassword.tsx` | 忘记密码编排（同上，接口场景不同） |
| `LoginComponent/components/SmsVerify.tsx` | 短信验证 UI（纯展示，回调上提） |
| `LoginComponent/components/PasswordSetting.tsx` | 设密 UI（纯展示，回调上提） |

## 修订记录

| 版本 | 日期 | 说明 |
|------|------|------|
| v0.1 | 2026-08-22 | 初稿：三流程 + API 草案 |
