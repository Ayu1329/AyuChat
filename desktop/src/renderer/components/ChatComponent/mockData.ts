import type { Conversation } from "./ConversationList";
import type { MessagesByConversation } from "./types";

export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: "1",
    name: "阿宇",
    preview: "你好，这是对方消息气泡。",
    time: "14:20",
    unread: 2,
  },
  {
    id: "2",
    name: "设计协作",
    preview: "今晚把稿发一下",
    time: "昨天",
    unread: 0,
  },
  {
    id: "3",
    name: "测试号",
    preview: "收到",
    time: "周一",
    unread: 0,
  },
];

/** 按会话隔离的初始消息；会话 3 为空，用于空态演示 */
export const SEED_MESSAGES: MessagesByConversation = {
  "1": [
    { id: "1-m1", text: "你好，这是对方消息气泡。", self: false },
    {
      id: "1-m2",
      text: "这是己方消息，主色 #2F5D66。",
      self: true,
      status: "sent",
    },
  ],
  "2": [
    { id: "2-m1", text: "今晚把稿发一下", self: false },
    {
      id: "2-m2",
      text: "好的，我整理好了发你。",
      self: true,
      status: "sent",
    },
  ],
  "3": [],
};
