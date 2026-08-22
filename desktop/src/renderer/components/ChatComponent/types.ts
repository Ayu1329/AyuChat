export type MessageStatus = "sending" | "sent" | "failed";

export interface ChatMessage {
  id: string;
  text: string;
  self: boolean;
  /** 仅己方消息有状态 */
  status?: MessageStatus;
}

export type MessagesByConversation = Record<string, ChatMessage[]>;
export type DraftsByConversation = Record<string, string>;
