# AyuChat 聊天 API 文档

> 版本：v0.1  
> 状态：草案  
> 依据：[聊天 PRD](chat_prd.md)  
> 适用范围：Server 实现、Connect 层、Desktop / Android 客户端

---

## 1. 概述

本文定义 AyuChat v1 **聊天相关** REST API 与 WebSocket 事件，覆盖：

- 好友申请、接受、列表
- 单聊会话列表与详情
- 文本消息发送与历史拉取
- 实时消息推送

### 1.1 环境与 Base URL

| 环境 | REST Base URL | WebSocket |
|------|---------------|-----------|
| 本地开发 | `http://localhost:8080` | `ws://localhost:8080` |
| API 前缀 | `/api/v1` | `/api/v1/ws` |

完整路径示例：`GET http://localhost:8080/api/v1/conversations`

### 1.2 通用约定

与 [鉴权 API](../auth/auth_api.md#12-通用约定) 一致：

| 项 | 约定 |
|----|------|
| 编码 | UTF-8 |
| Content-Type | `application/json` |
| 字段名 | `snake_case` |
| 鉴权 | `Authorization: Bearer <access_token>`（**本节所有 REST 接口均需**） |
| 错误格式 | 见 [§2 统一错误格式](#2-统一错误格式) |

### 1.3 时间格式

所有 `*_at` 字段使用 **ISO 8601 UTC**，例如：`2026-08-22T06:30:00.000Z`。

---

## 2. 统一错误格式

```json
{
  "error": {
    "code": "NOT_FRIENDS",
    "message": "仅好友之间可以发送消息"
  }
}
```

### 2.1 聊天模块错误码

| HTTP | code | 说明 |
|------|------|------|
| 400 | `INVALID_PHONE` | 手机号格式错误 |
| 400 | `INVALID_MESSAGE_CONTENT` | 消息 content 与 type 不匹配 |
| 400 | `MESSAGE_TOO_LONG` | 文本超过长度上限 |
| 400 | `CANNOT_ADD_SELF` | 不能添加自己为好友 |
| 403 | `NOT_FRIENDS` | 非好友，禁止发消息或建会话 |
| 403 | `FORBIDDEN` | 无权访问该会话 / 资源 |
| 404 | `USER_NOT_FOUND` | 用户不存在 |
| 404 | `CONVERSATION_NOT_FOUND` | 会话不存在 |
| 404 | `FRIEND_REQUEST_NOT_FOUND` | 好友申请不存在 |
| 409 | `ALREADY_FRIENDS` | 已是好友 |
| 409 | `FRIEND_REQUEST_PENDING` | 已有待处理申请 |
| 409 | `DUPLICATE_CLIENT_MSG_ID` | 幂等冲突（通常应返回原消息 200） |

---

## 3. 公共数据模型

### 3.1 UserSummary（用户摘要）

好友、会话对等场景复用。

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 用户 UUID |
| `phone` | string | 11 位手机号（展示时可掩码） |
| `country_code` | string | v1 固定 `+86` |
| `display_name` | string | 展示名，v1 可缺省，默认手机号掩码 |

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "phone": "13800138000",
  "country_code": "+86",
  "display_name": "138****8000"
}
```

### 3.2 Message（消息）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 服务端消息 ID |
| `conversation_id` | string | 是 | 会话 ID |
| `sender_id` | string | 是 | 发送者 ID |
| `type` | string | 是 | v1 仅 `text` |
| `content` | object | 是 | 见下表 |
| `client_msg_id` | string | 是 | 客户端幂等键 |
| `seq` | number | 是 | 会话内单调递增序号 |
| `created_at` | string | 是 | 创建时间 |

**v1 `type = text` 时 `content`**：

```json
{
  "text": "你好"
}
```

**完整示例**：

```json
{
  "id": "msg_01hxyz",
  "conversation_id": "conv_01habc",
  "sender_id": "550e8400-e29b-41d4-a716-446655440000",
  "type": "text",
  "content": {
    "text": "你好"
  },
  "client_msg_id": "c8f3c2e1-7b4a-4d9e-8f1a-2c3d4e5f6a7b",
  "seq": 42,
  "created_at": "2026-08-22T06:30:00.000Z"
}
```

### 3.3 MessagePreview（消息摘要）

用于会话列表 `last_message`。

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 消息 ID |
| `type` | string | 消息类型 |
| `content` | object | 与 Message 相同 |
| `sender_id` | string | 发送者 |
| `created_at` | string | 时间 |

### 3.4 Conversation（会话）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 会话 ID |
| `type` | string | v1 固定 `direct` |
| `peer` | UserSummary | 对方用户（单聊） |
| `last_message` | MessagePreview \| null | 最后一条消息 |
| `unread_count` | number | 未读数 |
| `updated_at` | string | 最后活跃时间 |

```json
{
  "id": "conv_01habc",
  "type": "direct",
  "peer": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "phone": "13900139000",
    "country_code": "+86",
    "display_name": "阿宇"
  },
  "last_message": {
    "id": "msg_01hxyz",
    "type": "text",
    "content": { "text": "你好" },
    "sender_id": "660e8400-e29b-41d4-a716-446655440001",
    "created_at": "2026-08-22T06:30:00.000Z"
  },
  "unread_count": 2,
  "updated_at": "2026-08-22T06:30:00.000Z"
}
```

### 3.5 FriendRequest（好友申请）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 申请 ID |
| `from_user` | UserSummary | 发起人 |
| `to_user` | UserSummary | 接收人 |
| `status` | string | `pending` \| `accepted` \| `rejected` |
| `created_at` | string | 申请时间 |

---

## 4. 好友接口

### 4.1 发送好友申请

`POST /friends/requests`

**请求**

```json
{
  "country_code": "+86",
  "phone": "13900139000"
}
```

| 字段 | 必填 | 说明 |
|------|------|------|
| `country_code` | 是 | v1 仅 `+86` |
| `phone` | 是 | 对方手机号 |

**成功** `201`

```json
{
  "request": {
    "id": "fr_01hreq",
    "from_user": { "id": "...", "phone": "13800138000", "country_code": "+86", "display_name": "我" },
    "to_user": { "id": "...", "phone": "13900139000", "country_code": "+86", "display_name": "阿宇" },
    "status": "pending",
    "created_at": "2026-08-22T06:00:00.000Z"
  }
}
```

### 4.2 待处理好友申请列表

`GET /friends/requests/incoming`

**Query**

| 参数 | 说明 |
|------|------|
| `limit` | 可选，默认 20，最大 50 |
| `cursor` | 可选，分页游标 |

**成功** `200`

```json
{
  "items": [
    {
      "id": "fr_01hreq",
      "from_user": { "id": "...", "phone": "13900139000", "country_code": "+86", "display_name": "阿宇" },
      "to_user": { "id": "...", "phone": "13800138000", "country_code": "+86", "display_name": "我" },
      "status": "pending",
      "created_at": "2026-08-22T06:00:00.000Z"
    }
  ],
  "next_cursor": null
}
```

### 4.3 接受好友申请

`POST /friends/requests/{request_id}/accept`

**成功** `200`

```json
{
  "ok": true,
  "friend": {
    "user": {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "phone": "13900139000",
      "country_code": "+86",
      "display_name": "阿宇"
    },
    "since": "2026-08-22T06:05:00.000Z"
  }
}
```

### 4.4 好友列表

`GET /friends`

**成功** `200`

```json
{
  "items": [
    {
      "user": {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "phone": "13900139000",
        "country_code": "+86",
        "display_name": "阿宇"
      },
      "since": "2026-08-22T06:05:00.000Z"
    }
  ]
}
```

### 4.5 按用户 ID 查询（发起聊天前）

`GET /users/lookup?country_code=+86&phone=13900139000`

**成功** `200`：返回 `UserSummary`（不含敏感字段）

**失败** `404`：`USER_NOT_FOUND`

---

## 5. 会话接口

### 5.1 会话列表

`GET /conversations`

**Query**

| 参数 | 说明 |
|------|------|
| `limit` | 可选，默认 30 |
| `cursor` | 可选，按 `updated_at` 分页 |

**成功** `200`

```json
{
  "items": [
    {
      "id": "conv_01habc",
      "type": "direct",
      "peer": { "id": "...", "phone": "13900139000", "country_code": "+86", "display_name": "阿宇" },
      "last_message": {
        "id": "msg_01hxyz",
        "type": "text",
        "content": { "text": "你好" },
        "sender_id": "...",
        "created_at": "2026-08-22T06:30:00.000Z"
      },
      "unread_count": 2,
      "updated_at": "2026-08-22T06:30:00.000Z"
    }
  ],
  "next_cursor": null
}
```

### 5.2 打开与好友的会话（懒创建）

`POST /conversations/direct`

**请求**

```json
{
  "peer_id": "660e8400-e29b-41d4-a716-446655440001"
}
```

| 字段 | 说明 |
|------|------|
| `peer_id` | 对方用户 ID，须为互为好友 |

**成功** `200` 或 `201`：返回完整 `Conversation` 对象（无消息时 `last_message` 为 `null`）

**失败** `403`：`NOT_FRIENDS`

### 5.3 标记会话已读

`POST /conversations/{conversation_id}/read`

**请求**（可选，传最后已读序号）

```json
{
  "read_seq": 42
}
```

**成功** `200`：`{ "ok": true }`

进入会话时客户端调用，将 `unread_count` 置 0。

---

## 6. 消息接口

### 6.1 发送消息

`POST /conversations/{conversation_id}/messages`

**请求**

```json
{
  "type": "text",
  "content": {
    "text": "你好，这是普通文本消息。"
  },
  "client_msg_id": "c8f3c2e1-7b4a-4d9e-8f1a-2c3d4e5f6a7b"
}
```

| 字段 | 必填 | 说明 |
|------|------|------|
| `type` | 是 | v1 仅允许 `text` |
| `content` | 是 | 与 type 匹配 |
| `client_msg_id` | 是 | 客户端 UUID，幂等键 |

**成功** `201`：返回完整 `Message` 对象

**幂等**：相同 `conversation_id` + `client_msg_id` 重复提交 → 返回 `200` 与原消息，不重复入库

**失败**

| HTTP | code | 说明 |
|------|------|------|
| 400 | `INVALID_MESSAGE_CONTENT` | content 非法 |
| 400 | `MESSAGE_TOO_LONG` | 超长 |
| 403 | `NOT_FRIENDS` | 好友关系已失效 |
| 403 | `FORBIDDEN` | 非会话成员 |

### 6.2 拉取历史消息

`GET /conversations/{conversation_id}/messages`

**Query**

| 参数 | 说明 |
|------|------|
| `limit` | 可选，默认 30，最大 100 |
| `before_seq` | 可选，加载比该 seq 更早的消息（向上翻页） |
| `after_seq` | 可选，增量同步比该 seq 更新的消息（重连补拉） |

**成功** `200`

```json
{
  "items": [
    {
      "id": "msg_01hxyz",
      "conversation_id": "conv_01habc",
      "sender_id": "550e8400-e29b-41d4-a716-446655440000",
      "type": "text",
      "content": { "text": "你好" },
      "client_msg_id": "c8f3c2e1-7b4a-4d9e-8f1a-2c3d4e5f6a7b",
      "seq": 42,
      "created_at": "2026-08-22T06:30:00.000Z"
    }
  ],
  "has_more": true
}
```

**排序**：`items` 按 `seq` **升序**返回（旧 → 新），便于客户端直接 append。

---

## 7. WebSocket 协议

### 7.1 连接

```
ws://localhost:8080/api/v1/ws?token=<access_token>
```

或使用首包鉴权（TBD，二选一实现）：

```json
{ "type": "auth", "token": "<access_token>" }
```

鉴权成功后服务端回复：

```json
{ "type": "auth.ok" }
```

### 7.2 信封格式

所有下行（及未来上行）消息统一信封：

```json
{
  "type": "message.new",
  "payload": { }
}
```

| 字段 | 说明 |
|------|------|
| `type` | 事件类型 |
| `payload` | 事件载荷 |

### 7.3 服务端 → 客户端事件

#### `message.new`

新消息到达。

```json
{
  "type": "message.new",
  "payload": {
    "message": {
      "id": "msg_01hxyz",
      "conversation_id": "conv_01habc",
      "sender_id": "660e8400-e29b-41d4-a716-446655440001",
      "type": "text",
      "content": { "text": "你好" },
      "client_msg_id": "d9e4d3c2-8c5b-4e0a-9f2b-3d4e5f6a7b8c",
      "seq": 43,
      "created_at": "2026-08-22T06:31:00.000Z"
    }
  }
}
```

客户端处理：

1. 若 `conversation_id` 已在缓存：append 消息（按 `client_msg_id` 去重）
2. 更新会话列表预览与未读
3. 若当前正在该会话：调用 `read` 接口

#### `conversation.updated`（可选 P1）

```json
{
  "type": "conversation.updated",
  "payload": {
    "conversation": { }
  }
}
```

#### `friend.request`（可选 P1）

```json
{
  "type": "friend.request",
  "payload": {
    "request": { }
  }
}
```

#### `friend.accepted`（可选 P1）

```json
{
  "type": "friend.accepted",
  "payload": {
    "friend": {
      "user": { },
      "since": "2026-08-22T06:05:00.000Z"
    }
  }
}
```

### 7.4 心跳

建议：

- 客户端每 30s 发送 `{ "type": "ping" }`
- 服务端回复 `{ "type": "pong" }`
- 超时未 pong 则客户端重连

---

## 8. Connect 层对接约定

### 8.1 建议模块划分

```
connect/src/
├── types.ts          # 扩展 Friend、Conversation、Message、WsEvent
├── friend.ts         # 好友相关 REST
├── conversation.ts   # 会话 REST
├── message.ts        # 消息 REST
└── ws.ts             # WebSocket 客户端
```

### 8.2 TypeScript 类型草案

```typescript
export type MessageType = "text" | "image" | "file" | "audio" | "system";

export interface TextContent {
  text: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  type: MessageType;
  content: TextContent; // v1；二期改为联合类型
  client_msg_id: string;
  seq: number;
  created_at: string;
}

export type ConversationType = "direct" | "group";

export interface Conversation {
  id: string;
  type: ConversationType;
  peer: UserSummary;
  last_message: MessagePreview | null;
  unread_count: number;
  updated_at: string;
}
```

### 8.3 客户端发送流程

```typescript
// 1. 生成幂等键（重试时复用）
const clientMsgId = crypto.randomUUID();

// 2. 乐观 UI
addLocalMessage({ clientMsgId, text, status: "sending" });

// 3. REST 发送
try {
  const msg = await sendMessage(conversationId, {
    type: "text",
    content: { text },
    client_msg_id: clientMsgId,
  });
  patchLocalMessage(clientMsgId, { id: msg.id, status: "sent" });
} catch {
  patchLocalMessage(clientMsgId, { status: "failed" });
}
```

### 8.4 列表预览文案

| `last_message.type` | 预览 |
|---------------------|------|
| `text` | `content.text`，超长截断 |
| `image`（预留） | `[图片]` |
| `file`（预留） | `[文件] name` |

---

## 9. 调用示例

### 9.1 完整单聊流程（curl）

```bash
# 假设已有 TOKEN
export TOKEN="eyJ..."

# 1. 发送好友申请
curl -s -X POST http://localhost:8080/api/v1/friends/requests \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"country_code":"+86","phone":"13900139000"}'

# 2. 对方接受后，打开会话
curl -s -X POST http://localhost:8080/api/v1/conversations/direct \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"peer_id":"660e8400-e29b-41d4-a716-446655440001"}'

# 3. 发消息
curl -s -X POST http://localhost:8080/api/v1/conversations/conv_01habc/messages \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "text",
    "content": {"text": "你好"},
    "client_msg_id": "c8f3c2e1-7b4a-4d9e-8f1a-2c3d4e5f6a7b"
  }'

# 4. 拉历史
curl -s "http://localhost:8080/api/v1/conversations/conv_01habc/messages?limit=30" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 10. 修订记录

| 版本 | 日期 | 说明 |
|------|------|------|
| v0.1 | 2026-08-22 | 初稿：好友、会话、消息 REST + WS 推送 |
