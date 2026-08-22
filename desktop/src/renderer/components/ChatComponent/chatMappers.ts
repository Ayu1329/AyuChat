import type { ChatConversation, Message } from "@ayuchat/connect";
import type { Conversation } from "./ConversationList";
import type { ChatMessage } from "./types";
import { displayLabel, formatRequestTime } from "./friendTypes";

export function toConversationItem(conversation: ChatConversation): Conversation {
  const preview = conversation.last_message?.content.text?.trim() ?? "";
  return {
    kind: "conversation",
    id: conversation.id,
    name: displayLabel(conversation.peer),
    preview: preview || "暂无消息",
    time: formatRequestTime(conversation.updated_at),
    unread: conversation.unread_count,
  };
}

export function toChatMessage(message: Message, currentUserId: string): ChatMessage {
  const self = message.sender_id === currentUserId;
  return {
    id: message.id,
    text: message.content.text,
    self,
    status: self ? "sent" : undefined,
    clientMsgId: message.client_msg_id,
    seq: message.seq,
  };
}

export function upsertConversation(
  items: Conversation[],
  conversation: ChatConversation,
): Conversation[] {
  const nextItem = toConversationItem(conversation);
  const rest = items.filter((item) => item.id !== nextItem.id);
  return [nextItem, ...rest];
}
