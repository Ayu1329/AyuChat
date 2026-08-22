import { get, post } from "./client";
import type {
  ChatConversation,
  ConversationListResponse,
  ListMessagesOptions,
  Message,
  MessageListResponse,
  SendMessageRequest,
} from "./types";

export function listConversations(): Promise<ConversationListResponse> {
  return get<ConversationListResponse>("/conversations");
}

export function openDirectConversation(peerId: string): Promise<ChatConversation> {
  return post<ChatConversation>("/conversations/direct", { peer_id: peerId });
}

export function markConversationRead(
  conversationId: string,
  readSeq?: number,
): Promise<{ ok: boolean }> {
  return post<{ ok: boolean }>(`/conversations/${conversationId}/read`, {
    read_seq: readSeq,
  });
}

export function sendMessage(
  conversationId: string,
  request: SendMessageRequest,
): Promise<Message> {
  return post<Message>(`/conversations/${conversationId}/messages`, request);
}

export function listMessages(
  conversationId: string,
  options: ListMessagesOptions = {},
): Promise<MessageListResponse> {
  const params = new URLSearchParams();
  if (options.limit != null) params.set("limit", String(options.limit));
  if (options.before_seq != null) {
    params.set("before_seq", String(options.before_seq));
  }
  if (options.after_seq != null) {
    params.set("after_seq", String(options.after_seq));
  }
  const query = params.toString();
  const path = `/conversations/${conversationId}/messages${
    query ? `?${query}` : ""
  }`;
  return get<MessageListResponse>(path);
}
