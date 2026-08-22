import { useEffect, useRef } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/ui";
import type { Conversation } from "./ConversationList";
import type { ChatMessage } from "./types";
import Composer from "./Composer";

interface ChatMainProps {
  conversation: Conversation;
  messages: ChatMessage[];
  draft: string;
  loading: boolean;
  connected: boolean;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  onRetry: (messageId: string) => void;
}

function MessageSkeleton() {
  return (
    <div
      className="flex flex-1 flex-col gap-3 px-4 py-4"
      aria-busy
      aria-label="加载消息中"
    >
      <div className="h-10 w-[45%] animate-pulse rounded-2xl rounded-tl-md bg-border/60" />
      <div className="h-10 w-[55%] animate-pulse self-end rounded-2xl rounded-tr-md bg-primary/20" />
      <div className="h-10 w-[40%] animate-pulse rounded-2xl rounded-tl-md bg-border/60" />
    </div>
  );
}

function MessageStatusIcon({
  message,
  onRetry,
}: {
  message: ChatMessage;
  onRetry: (id: string) => void;
}) {
  if (!message.self || !message.status || message.status === "sent") return null;

  if (message.status === "sending") {
    return (
      <Loader2
        className="mt-1 size-3.5 shrink-0 animate-spin text-muted"
        aria-label="发送中"
      />
    );
  }

  return (
    <button
      type="button"
      className="mt-0.5 shrink-0 cursor-pointer rounded-full text-danger hover:bg-danger/10"
      aria-label="发送失败，点击重试"
      title="发送失败，点击重试"
      onClick={() => onRetry(message.id)}
    >
      <AlertCircle className="size-4" />
    </button>
  );
}

/**
 * 右侧聊天区：顶栏 + 消息流 + 输入区。
 */
export default function ChatMain({
  conversation,
  messages,
  draft,
  loading,
  connected,
  onDraftChange,
  onSend,
  onRetry,
}: ChatMainProps) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (loading) return;
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [conversation.id, messages, loading]);

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-surface/70 px-4">
        <span className="grid size-9 place-items-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
          {conversation.name.slice(0, 1)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-fg">
            {conversation.name}
          </p>
          <p className="text-xs text-muted">
            {connected ? "在线" : "连接已断开"}
          </p>
        </div>
      </header>

      {loading ? (
        <MessageSkeleton />
      ) : messages.length === 0 ? (
        <div className="grid flex-1 place-items-center px-6 text-center">
          <div>
            <p className="text-sm font-medium text-fg">打个招呼吧</p>
            <p className="mt-1 text-xs text-muted">发送第一条消息开始对话</p>
          </div>
        </div>
      ) : (
        <div
          ref={listRef}
          className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4"
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex max-w-[70%] items-end gap-1.5",
                msg.self ? "self-end" : "self-start",
              )}
            >
              {msg.self ? (
                <MessageStatusIcon message={msg} onRetry={onRetry} />
              ) : null}
              <div
                className={cn(
                  "rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap break-words",
                  msg.self
                    ? "rounded-tr-md bg-bubble-self text-white"
                    : "rounded-tl-md bg-bubble-other text-fg",
                  msg.status === "failed" && "opacity-80",
                )}
              >
                {msg.text}
              </div>
            </div>
          ))}
        </div>
      )}

      <Composer
        value={draft}
        connected={connected}
        onChange={onDraftChange}
        onSend={onSend}
      />
    </>
  );
}
