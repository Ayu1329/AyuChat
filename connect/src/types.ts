export type SmsScene = "register" | "reset_password";

export interface User {
  id: string;
  phone: string;
  country_code: string;
  name?: string | null;
}

export interface UpdateProfileRequest {
  name?: string | null;
}

export interface SmsSendRequest {
  country_code: string;
  phone: string;
  scene: SmsScene;
}

export interface SmsSendResponse {
  ok: boolean;
  retry_after: number;
}

export interface SmsVerifyRequest {
  country_code: string;
  phone: string;
  scene: SmsScene;
  code: string;
}

export interface SmsVerifyResponse {
  verify_token: string;
  expires_in: number;
}

export interface RegisterRequest {
  country_code: string;
  phone: string;
  verify_token: string;
  password: string;
}

export interface RegisterResponse {
  user: User;
}

export interface LoginRequest {
  country_code: string;
  phone: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  user: User;
}

export interface ResetPasswordRequest {
  country_code: string;
  phone: string;
  verify_token: string;
  password: string;
}

export interface OkResponse {
  ok: boolean;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface UserSummary {
  id: string;
  phone: string;
  country_code: string;
  display_name?: string;
}

export type FriendRequestStatus = "pending" | "accepted" | "rejected";

export interface FriendRequest {
  id: string;
  from_user: UserSummary;
  to_user: UserSummary;
  message: string;
  status: FriendRequestStatus;
  created_at: string;
}

export interface SendFriendRequestResponse {
  request: FriendRequest;
}

export interface FriendRequestListResponse {
  items: FriendRequest[];
  next_cursor: string | null;
}

export interface Friend {
  user: UserSummary;
  since: string;
}

export interface FriendListResponse {
  items: Friend[];
}

export interface AcceptFriendResponse {
  ok: boolean;
  friend: Friend;
}

export interface TextMessageContent {
  text: string;
}

export interface MessagePreview {
  id: string;
  type: string;
  content: TextMessageContent;
  sender_id: string;
  created_at: string;
}

export interface ChatConversation {
  id: string;
  type: string;
  peer: UserSummary;
  last_message: MessagePreview | null;
  unread_count: number;
  updated_at: string;
}

export interface ConversationListResponse {
  items: ChatConversation[];
  next_cursor: string | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  type: string;
  content: TextMessageContent;
  client_msg_id: string;
  seq: number;
  created_at: string;
}

export interface MessageListResponse {
  items: Message[];
  has_more: boolean;
}

export interface SendMessageRequest {
  type: "text";
  content: TextMessageContent;
  client_msg_id: string;
}

export type WsEventType =
  | "auth.ok"
  | "pong"
  | "message.new"
  | "conversation.updated"
  | "friend.request"
  | "friend.accepted"
  | "friend.deleted";

export interface WsMessageNewPayload {
  message: Message;
}

export interface WsConversationUpdatedPayload {
  conversation: ChatConversation;
}

export interface WsFriendRequestPayload {
  request: FriendRequest;
}

export interface WsFriendAcceptedPayload {
  friend: Friend;
}

export interface WsFriendDeletedPayload {
  user_id: string;
}

export type WsEventPayloadMap = {
  "auth.ok": undefined;
  pong: undefined;
  "message.new": WsMessageNewPayload;
  "conversation.updated": WsConversationUpdatedPayload;
  "friend.request": WsFriendRequestPayload;
  "friend.accepted": WsFriendAcceptedPayload;
  "friend.deleted": WsFriendDeletedPayload;
};

export interface WsEnvelope<T extends WsEventType = WsEventType> {
  type: T;
  payload?: WsEventPayloadMap[T];
}

export type WsConnectionState = "connecting" | "connected" | "disconnected";

export interface ListMessagesOptions {
  limit?: number;
  before_seq?: number;
  after_seq?: number;
}
