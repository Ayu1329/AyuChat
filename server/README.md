# AyuChat Server（Java / Spring Boot）

标准分层后端，当前实现 **鉴权** 与 **聊天（好友 / 会话 / 消息）**。

- 表结构说明：[prd/server/database_schema.md](../prd/server/database_schema.md)
- 改表或改 API 时请同步更新该文档与对应 `*_api.md`。

## 技术栈

| 层 | 选型 |
|----|------|
| 框架 | Spring Boot 3.3 |
| 语言 | Java 17 |
| 构建 | Maven |
| 数据 | Spring Data JPA + H2（文件库，可换 PostgreSQL） |
| 安全 | Spring Security + JWT + BCrypt |

## 目录结构

```
server/
├── pom.xml
├── src/main/java/com/ayuchat/
│   ├── AyuChatApplication.java      # 启动类
│   ├── config/                      # 配置、Security、CORS
│   ├── controller/                  # REST 接口
│   ├── dto/                         # 请求 / 响应体
│   ├── domain/                      # JPA 实体
│   ├── repository/                  # 数据访问
│   ├── service/                     # 业务逻辑
│   ├── security/                    # JWT
│   ├── support/                     # 校验工具
│   └── exception/                   # 统一错误
└── src/main/resources/
    ├── application.yml
    └── application-dev.yml          # 开发：固定验证码 123456
```

## 环境要求

- **JDK 17+**（未安装可用 `winget install Microsoft.OpenJDK.17`）
- **无需单独安装 Maven**：使用项目内 `mvnw.cmd` / `mvnw`

## 启动

```bash
# 仓库根目录
pnpm server:dev

# 或在 server 目录
mvnw.cmd spring-boot:run
```

默认 `http://localhost:8080`，开发 profile 下短信验证码固定 **`123456`**。

## API（Base: `/api/v1`）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/auth/sms/send` | 发送验证码 |
| POST | `/auth/sms/verify` | 校验验证码 → `verify_token` |
| POST | `/auth/register` | 注册 |
| POST | `/auth/login` | 登录 → JWT |
| POST | `/auth/password/reset` | 重置密码 |
| POST | `/auth/logout` | 退出（需 Bearer token） |
| POST | `/auth/token/refresh` | 刷新 token |

错误响应格式见鉴权 PRD。

## 本地调试示例

```bash
# 发码（注册场景）
curl -X POST http://localhost:8080/api/v1/auth/sms/send \
  -H "Content-Type: application/json" \
  -d '{"country_code":"+86","phone":"13800138000","scene":"register"}'

# 验码
curl -X POST http://localhost:8080/api/v1/auth/sms/verify \
  -H "Content-Type: application/json" \
  -d '{"country_code":"+86","phone":"13800138000","scene":"register","code":"123456"}'

# 注册
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"country_code":"+86","phone":"13800138000","verify_token":"vt_xxx","password":"abc12345"}'

# 登录
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"country_code":"+86","phone":"13800138000","password":"abc12345"}'
```

## 数据

- H2 文件库：`server/data/ayuchat`
- 控制台：<http://localhost:8080/h2-console>（JDBC URL 见 `application.yml`）

## 下一步

- 桌面 `connect` 层对接上述接口
- 聊天消息 API + WebSocket
- 生产环境换 PostgreSQL、真短信、强 JWT secret
