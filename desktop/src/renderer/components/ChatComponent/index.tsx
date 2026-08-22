import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LogOut,
  Plus,
  Settings,
  UserPlus,
  Users,
  WifiOff,
} from "lucide-react";
import { Button, Input, cn } from "@/ui";
import { logout as apiLogout } from "@/ayuapi";
import { clearSession, getSession } from "../../auth/session";
import ConversationList from "./ConversationList";
import ChatMain from "./ChatMain";
import ConnectionBanner from "./ConnectionBanner";
import { MOCK_CONVERSATIONS, SEED_MESSAGES } from "./mockData";
import type {
  ChatMessage,
  DraftsByConversation,
  MessagesByConversation,
} from "./types";

type HeaderMenu = "profile" | "add" | null;

const menuPanelClass = cn(
  "absolute top-full z-20 mt-1 min-w-[140px] overflow-hidden",
  "rounded-lg border border-border bg-surface shadow-[0_4px_12px_rgb(0_0_0/0.1)]",
);

const menuItemClass =
  "flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-fg hover:bg-border/40";

const LOAD_MS = 280;
const SEND_MS = 550;

/** 文案含「失败」时 mock 发送失败，便于演示重试 */
function shouldMockFail(text: string) {
  return /失败|fail/i.test(text);
}

function formatClock() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

/**
 * 会话页：左侧列表 + 右侧聊天区。
 */
export default function ChatComponent() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState(MOCK_CONVERSATIONS);
  const [messagesById, setMessagesById] =
    useState<MessagesByConversation>(SEED_MESSAGES);
  const [draftsById, setDraftsById] = useState<DraftsByConversation>({});
  const [activeId, setActiveId] = useState<string | null>(
    MOCK_CONVERSATIONS[0]?.id ?? null,
  );
  const [query, setQuery] = useState("");
  const [openMenu, setOpenMenu] = useState<HeaderMenu>(null);
  const [connected, setConnected] = useState(true);
  const [loadingId, setLoadingId] = useState<string | null>(
    MOCK_CONVERSATIONS[0]?.id ?? null,
  );
  const loadedIds = useRef(new Set<string>());
  const connectedRef = useRef(connected);
  const profileRef = useRef<HTMLDivElement>(null);
  const addRef = useRef<HTMLDivElement>(null);
  const sendTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  connectedRef.current = connected;

  const filtered = conversations.filter((item) =>
    item.name.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const active = filtered.find((item) => item.id === activeId) ?? null;
  const activeMessages = activeId ? (messagesById[activeId] ?? []) : [];
  const activeDraft = activeId ? (draftsById[activeId] ?? "") : "";
  const isLoading = Boolean(activeId && loadingId === activeId);

  useEffect(() => {
    if (!activeId || loadedIds.current.has(activeId)) {
      setLoadingId(null);
      return;
    }

    setLoadingId(activeId);
    const timer = setTimeout(() => {
      loadedIds.current.add(activeId);
      setLoadingId((current) => (current === activeId ? null : current));
    }, LOAD_MS);

    return () => clearTimeout(timer);
  }, [activeId]);

  useEffect(() => {
    if (!openMenu) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      const inProfile = profileRef.current?.contains(target);
      const inAdd = addRef.current?.contains(target);
      if (!inProfile && !inAdd) setOpenMenu(null);
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [openMenu]);

  useEffect(() => {
    const timers = sendTimers.current;
    return () => {
      for (const timer of timers.values()) clearTimeout(timer);
      timers.clear();
    };
  }, []);

  function closeMenu() {
    setOpenMenu(null);
  }

  function patchMessage(
    conversationId: string,
    messageId: string,
    patch: Partial<ChatMessage>,
  ) {
    setMessagesById((prev) => {
      const list = prev[conversationId] ?? [];
      return {
        ...prev,
        [conversationId]: list.map((item) =>
          item.id === messageId ? { ...item, ...patch } : item,
        ),
      };
    });
  }

  function touchConversation(conversationId: string, preview: string) {
    setConversations((prev) => {
      const next = prev.map((item) =>
        item.id === conversationId
          ? { ...item, preview, time: formatClock(), unread: 0 }
          : item,
      );
      const index = next.findIndex((item) => item.id === conversationId);
      if (index <= 0) return next;
      const [item] = next.splice(index, 1);
      return [item, ...next];
    });
  }

  function finalizeSend(
    conversationId: string,
    messageId: string,
    text: string,
  ) {
    sendTimers.current.delete(messageId);

    if (!connectedRef.current || shouldMockFail(text)) {
      patchMessage(conversationId, messageId, { status: "failed" });
      return;
    }

    patchMessage(conversationId, messageId, { status: "sent" });
    touchConversation(conversationId, text);
  }

  function queueSend(conversationId: string, messageId: string, text: string) {
    const existing = sendTimers.current.get(messageId);
    if (existing) clearTimeout(existing);

    if (!connectedRef.current) {
      patchMessage(conversationId, messageId, { status: "failed" });
      return;
    }

    const timer = setTimeout(() => {
      finalizeSend(conversationId, messageId, text);
    }, SEND_MS);
    sendTimers.current.set(messageId, timer);
  }

  function setConnection(next: boolean) {
    setConnected(next);
    if (next) return;

    for (const timer of sendTimers.current.values()) clearTimeout(timer);
    sendTimers.current.clear();
    setMessagesById((prev) => {
      const nextMap: MessagesByConversation = {};
      for (const [id, list] of Object.entries(prev)) {
        nextMap[id] = list.map((item) =>
          item.self && item.status === "sending"
            ? { ...item, status: "failed" as const }
            : item,
        );
      }
      return nextMap;
    });
  }

  function handleSend() {
    if (!activeId || !connectedRef.current) return;
    const text = (draftsById[activeId] ?? "").trim();
    if (!text) return;

    const messageId = `m-${Date.now()}`;
    const message: ChatMessage = {
      id: messageId,
      text,
      self: true,
      status: "sending",
    };

    setMessagesById((prev) => ({
      ...prev,
      [activeId]: [...(prev[activeId] ?? []), message],
    }));
    setDraftsById((prev) => ({ ...prev, [activeId]: "" }));
    touchConversation(activeId, text);
    queueSend(activeId, messageId, text);
  }

  function handleRetry(messageId: string) {
    if (!activeId) return;
    const message = (messagesById[activeId] ?? []).find(
      (item) => item.id === messageId,
    );
    if (!message || message.status !== "failed") return;

    patchMessage(activeId, messageId, { status: "sending" });
    queueSend(activeId, messageId, message.text);
  }

  function handleDraftChange(value: string) {
    if (!activeId) return;
    setDraftsById((prev) => ({ ...prev, [activeId]: value }));
  }

  function handleSelect(id: string) {
    setActiveId(id);
    setConversations((prev) =>
      prev.map((item) => (item.id === id ? { ...item, unread: 0 } : item)),
    );
  }

  return (
    <div className="flex h-full w-full overflow-hidden bg-bg">
      <aside className="flex w-[300px] shrink-0 flex-col border-r border-border bg-surface/80">
        <div className="relative flex items-center justify-between border-b border-border px-3 py-3">
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-full bg-primary/15 text-xs font-semibold text-primary transition-colors hover:bg-primary/25"
              aria-label="个人中心"
              aria-expanded={openMenu === "profile"}
              onClick={() =>
                setOpenMenu((current) =>
                  current === "profile" ? null : "profile",
                )
              }
            >
              我
            </button>
            {openMenu === "profile" ? (
              <div className={cn(menuPanelClass, "left-0")} role="menu">
                <button
                  type="button"
                  role="menuitem"
                  className={menuItemClass}
                  onClick={closeMenu}
                >
                  <Settings className="size-4 shrink-0 text-muted" />
                  设置
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className={menuItemClass}
                  onClick={() => {
                    setConnection(!connectedRef.current);
                    closeMenu();
                  }}
                >
                  <WifiOff className="size-4 shrink-0 text-muted" />
                  {connected ? "模拟断线" : "恢复连接"}
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className={menuItemClass}
                  onClick={() => {
                    void (async () => {
                      const session = getSession();
                      if (session?.accessToken) {
                        try {
                          await apiLogout(session.accessToken);
                        } catch {
                          // 无论接口是否成功，都清除本地凭证
                        }
                      }
                      clearSession();
                      closeMenu();
                      navigate("/login", { replace: true });
                    })();
                  }}
                >
                  <LogOut className="size-4 shrink-0 text-muted" />
                  退出登录
                </button>
              </div>
            ) : null}
          </div>

          <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-base font-semibold tracking-tight text-primary">
            消息
          </span>

          <div className="relative" ref={addRef}>
            <Button
              variant="ghost"
              size="sm"
              className="px-2"
              aria-label="打开菜单"
              aria-expanded={openMenu === "add"}
              onClick={() =>
                setOpenMenu((current) => (current === "add" ? null : "add"))
              }
            >
              <Plus className="size-4" />
            </Button>
            {openMenu === "add" ? (
              <div className={cn(menuPanelClass, "right-0")} role="menu">
                <button
                  type="button"
                  role="menuitem"
                  className={menuItemClass}
                  onClick={closeMenu}
                >
                  <UserPlus className="size-4 shrink-0 text-muted" />
                  新增好友
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className={menuItemClass}
                  onClick={closeMenu}
                >
                  <Users className="size-4 shrink-0 text-muted" />
                  新建群组
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="border-b border-border px-3 py-2.5">
          <Input
            size="sm"
            placeholder="搜索会话"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="搜索会话"
          />
        </div>

        <ConversationList
          items={filtered}
          activeId={activeId}
          onSelect={handleSelect}
        />
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        {!connected ? (
          <ConnectionBanner onReconnect={() => setConnection(true)} />
        ) : null}
        {active ? (
          <ChatMain
            conversation={active}
            messages={activeMessages}
            draft={activeDraft}
            loading={isLoading}
            connected={connected}
            onDraftChange={handleDraftChange}
            onSend={handleSend}
            onRetry={handleRetry}
          />
        ) : (
          <div className="grid flex-1 place-items-center px-6 text-center">
            <div>
              <p className="text-base font-semibold tracking-tight text-primary">
                AyuChat
              </p>
              <p className="mt-2 text-sm text-muted">选择或开始聊天</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
