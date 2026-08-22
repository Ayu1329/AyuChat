import { ayufetch } from "./ayufetch";
import type {
  ChatConversation,
  ConversationListResponse,
  ListMessagesOptions,
  Message,
  MessageListResponse,
  SendMessageRequest,
} from "@ayuchat/connect";

export const listConversations = () =>
  ayufetch<ConversationListResponse>({
    name: "listConversations",
    path: "/conversations",
    method: "GET",
  });

export const openDirectConversation = (peerId: string) =>
  ayufetch<ChatConversation>({
    name: "openDirectConversation",
    path: "/conversations/direct",
    body: { peer_id: peerId },
  });

export const markConversationRead = (conversationId: string, readSeq?: number) =>
  ayufetch<{ ok: boolean }>({
    name: "markConversationRead",
    path: `/conversations/${conversationId}/read`,
    body: { read_seq: readSeq },
  });

export const sendMessage = (conversationId: string, request: SendMessageRequest) =>
  ayufetch<Message>({
    name: "sendMessage",
    path: `/conversations/${conversationId}/messages`,
    body: request,
  });

export const listMessages = (
  conversationId: string,
  options?: ListMessagesOptions,
) => {
  const params = new URLSearchParams();
  if (options?.limit != null) params.set("limit", String(options.limit));
  if (options?.before_seq != null) {
    params.set("before_seq", String(options.before_seq));
  }
  if (options?.after_seq != null) {
    params.set("after_seq", String(options.after_seq));
  }
  const query = params.toString();
  return ayufetch<MessageListResponse>({
    name: "listMessages",
    path: `/conversations/${conversationId}/messages${
      query ? `?${query}` : ""
    }`,
    method: "GET",
  });
};
