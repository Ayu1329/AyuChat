import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LogOut,
  Plus,
  Settings,
  UserPlus,
  Users,
} from "lucide-react";
import { Button, Input, cn } from "@/ui";
import {
  connectWs,
  disconnectWs,
  onWsEvent,
  onWsStateChange,
  type Friend,
  type Message,
} from "@ayuchat/connect";
import {
  acceptFriendRequest,
  deleteFriend,
  listConversations,
  listFriends,
  listIncomingFriendRequests,
  listMessages,
  logout as apiLogout,
  markConversationRead,
  openDirectConversation,
  rejectFriendRequest,
  sendFriendRequest,
  sendMessage,
} from "@/ayuapi";
import { clearSession, getSession } from "../../auth/session";
import ConversationList, {
  type ActiveSelection,
  type Conversation,
  type SidebarItem,
} from "./ConversationList";
import ChatMain from "./ChatMain";
import ConnectionBanner from "./ConnectionBanner";
import FriendRequestDetail from "./FriendRequestDetail";
import AddFriendForm from "./AddFriendForm";
import SidebarTabs, { type SidebarTab } from "./SidebarTabs";
import FriendList, { type FriendListItem } from "./FriendList";
import FriendDetail from "./FriendDetail";
import { toChatMessage, toConversationItem, upsertConversation } from "./chatMappers";
import type {
  ChatMessage,
  DraftsByConversation,
  MessagesByConversation,
} from "./types";
import type { FriendRequest } from "./friendTypes";
import {
  displayLabel,
  formatAccount,
  formatRequestTime,
  formatSince,
  friendRequestPreview,
} from "./friendTypes";

type HeaderMenu = "profile" | "add" | null;
type RightView = "chat" | "add-friend";

const menuPanelClass = cn(
  "absolute top-full z-20 mt-1 min-w-[140px] overflow-hidden",
  "rounded-lg border border-border bg-surface shadow-[0_4px_12px_rgb(0_0_0/0.1)]",
);

const menuItemClass =
  "flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-fg hover:bg-border/40";

function formatClock() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

/**
 * 会话页：左侧列表 + 右侧聊天区。
 */
export default function ChatComponent() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messagesById, setMessagesById] = useState<MessagesByConversation>({});
  const [draftsById, setDraftsById] = useState<DraftsByConversation>({});
  const [active, setActive] = useState<ActiveSelection | null>(null);
  const [query, setQuery] = useState("");
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("conversations");
  const [openMenu, setOpenMenu] = useState<HeaderMenu>(null);
  const [rightView, setRightView] = useState<RightView>("chat");
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<FriendListItem[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [activeFriendId, setActiveFriendId] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [startingChat, setStartingChat] = useState(false);
  const [deletingFriend, setDeletingFriend] = useState(false);
  const loadedIds = useRef(new Set<string>());
  const connectedRef = useRef(connected);
  const activeRef = useRef<ActiveSelection | null>(null);
  const messagesByIdRef = useRef<MessagesByConversation>({});
  const hasConnectedOnceRef = useRef(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const addRef = useRef<HTMLDivElement>(null);

  connectedRef.current = connected;
  activeRef.current = active;
  messagesByIdRef.current = messagesById;

  const pendingFriendRequests = friendRequests.filter(
    (item) => item.status === "pending",
  );

  const friendRequestItems: SidebarItem[] = pendingFriendRequests.map(
    (request) => ({
      kind: "friend-request" as const,
      id: request.id,
      name: displayLabel(request.from_user),
      preview: friendRequestPreview(request.message),
      time: formatRequestTime(request.created_at),
    }),
  );

  const conversationItems: SidebarItem[] = conversations;
  const sidebarItems =
    sidebarTab === "conversations"
      ? [...friendRequestItems, ...conversationItems]
      : [];

  const normalizedQuery = query.trim().toLowerCase();
  const filteredConversations = sidebarItems.filter((item) => {
    if (!normalizedQuery) return true;
    return (
      item.name.toLowerCase().includes(normalizedQuery) ||
      item.preview.toLowerCase().includes(normalizedQuery)
    );
  });

  const filteredFriends = friends.filter((item) => {
    if (!normalizedQuery) return true;
    return (
      item.name.toLowerCase().includes(normalizedQuery) ||
      item.account.toLowerCase().includes(normalizedQuery)
    );
  });

  const activeConversation =
    active?.kind === "conversation"
      ? (conversations.find((item) => item.id === active.id) ?? null)
      : null;
  const activeFriendRequest =
    active?.kind === "friend-request"
      ? (pendingFriendRequests.find((item) => item.id === active.id) ?? null)
      : null;
  const activeMessages =
    active?.kind === "conversation" && active.id
      ? (messagesById[active.id] ?? [])
      : [];
  const activeDraft =
    active?.kind === "conversation" && active.id
      ? (draftsById[active.id] ?? "")
      : "";
  const isLoading = Boolean(
    active?.kind === "conversation" && active.id && loadingId === active.id,
  );
  const activeFriend =
    activeFriendId != null
      ? (friends.find((item) => item.id === activeFriendId) ?? null)
      : null;

  function openAddFriend() {
    setRightView("add-friend");
    closeMenu();
  }

  function backToChat() {
    setRightView("chat");
  }

  async function refreshConversations() {
    try {
      const response = await listConversations();
      setConversations(response.items.map(toConversationItem));
    } catch {
      // 保持当前列表
    }
  }

  async function syncActiveConversationMessages() {
    const currentActive = activeRef.current;
    const currentUserId = getSession()?.user.id;
    if (
      currentActive?.kind !== "conversation" ||
      !currentActive.id ||
      !currentUserId
    ) {
      return;
    }

    const conversationId = currentActive.id;
    const existing = messagesByIdRef.current[conversationId] ?? [];
    const maxSeq = existing.reduce(
      (max, item) => Math.max(max, item.seq ?? 0),
      0,
    );

    try {
      const response = await listMessages(conversationId, {
        after_seq: maxSeq,
      });
      if (response.items.length === 0) return;

      setMessagesById((prev) => {
        const list = prev[conversationId] ?? [];
        const knownIds = new Set(list.map((item) => item.id));
        const knownClientIds = new Set(
          list.map((item) => item.clientMsgId).filter(Boolean),
        );
        const incoming = response.items
          .filter(
            (item) =>
              !knownIds.has(item.id) && !knownClientIds.has(item.client_msg_id),
          )
          .map((item) => toChatMessage(item, currentUserId));
        if (incoming.length === 0) return prev;
        return { ...prev, [conversationId]: [...list, ...incoming] };
      });
      loadedIds.current.add(conversationId);
    } catch {
      // 保持当前消息列表
    }
  }

  function markSendingMessagesFailed() {
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

  function handleIncomingMessage(message: Message) {
    const currentUserId = getSession()?.user.id;
    if (!currentUserId) return;

    const conversationId = message.conversation_id;
    const chatMessage = toChatMessage(message, currentUserId);
    const isActive =
      activeRef.current?.kind === "conversation" &&
      activeRef.current.id === conversationId;

    setMessagesById((prev) => {
      const list = prev[conversationId] ?? [];
      if (
        list.some(
          (item) =>
            item.id === message.id ||
            (item.clientMsgId != null &&
              item.clientMsgId === message.client_msg_id),
        )
      ) {
        return prev;
      }
      return {
        ...prev,
        [conversationId]: [...list, chatMessage],
      };
    });
    loadedIds.current.add(conversationId);

    const preview = message.content.text;
    setConversations((prev) => {
      const index = prev.findIndex((item) => item.id === conversationId);
      if (index < 0) {
        void refreshConversations();
        return prev;
      }
      const next = [...prev];
      const current = next[index];
      next[index] = {
        ...current,
        preview,
        time: formatClock(),
        unread: isActive ? 0 : current.unread + 1,
      };
      if (index > 0) {
        const [item] = next.splice(index, 1);
        return [item, ...next];
      }
      return next;
    });

    if (isActive) {
      void markConversationRead(conversationId, message.seq);
    }
  }

  function handleIncomingFriendRequest(request: FriendRequest) {
    if (request.status !== "pending") return;
    setFriendRequests((prev) => {
      if (prev.some((item) => item.id === request.id)) return prev;
      return [request, ...prev];
    });
  }

  function handleFriendAccepted(friend: Friend) {
    setFriendRequests((prev) =>
      prev.filter((item) => item.from_user.id !== friend.user.id),
    );
    setFriends((prev) => {
      if (prev.some((item) => item.id === friend.user.id)) return prev;
      return [
        {
          id: friend.user.id,
          name: displayLabel(friend.user),
          phone: friend.user.phone,
          account: formatAccount(friend.user),
          sinceLabel: formatSince(friend.since),
        },
        ...prev,
      ];
    });
  }

  function handleFriendDeleted(userId: string) {
    setFriends((prev) => prev.filter((item) => item.id !== userId));
    setActiveFriendId((current) => (current === userId ? null : current));
  }

  async function refreshIncomingRequests() {
    try {
      const response = await listIncomingFriendRequests();
      setFriendRequests(response.items);
    } catch {
      // 保持当前列表
    }
  }

  async function refreshFriends() {
    setFriendsLoading(true);
    try {
      const response = await listFriends();
      setFriends(
        response.items.map((item) => ({
          id: item.user.id,
          name: displayLabel(item.user),
          phone: item.user.phone,
          account: formatAccount(item.user),
          sinceLabel: formatSince(item.since),
        })),
      );
    } catch {
      setFriends([]);
    } finally {
      setFriendsLoading(false);
    }
  }

  function clearActiveIfFriendRequest(id: string) {
    setActive((current) =>
      current?.kind === "friend-request" && current.id === id ? null : current,
    );
  }

  async function handleAcceptFriendRequest(id: string) {
    await acceptFriendRequest(id);
    setFriendRequests((prev) => prev.filter((item) => item.id !== id));
    clearActiveIfFriendRequest(id);
    void refreshFriends();
  }

  async function handleRejectFriendRequest(id: string) {
    await rejectFriendRequest(id);
    setFriendRequests((prev) => prev.filter((item) => item.id !== id));
    clearActiveIfFriendRequest(id);
  }

  async function handleDeleteFriend(friendId: string) {
    if (!window.confirm("确定删除该好友吗？删除后将无法继续聊天。")) {
      return;
    }

    setDeletingFriend(true);
    try {
      await deleteFriend(friendId);
      handleFriendDeleted(friendId);
    } catch {
      // 保持当前列表
    } finally {
      setDeletingFriend(false);
    }
  }

  async function handleSendFriendRequest(phone: string, message: string) {
    await sendFriendRequest(phone, message);
  }

  async function handleStartChatFromFriend(friendId: string) {
    if (startingChat) return;
    setStartingChat(true);
    try {
      const conversation = await openDirectConversation(friendId);
      setConversations((prev) => upsertConversation(prev, conversation));
      loadedIds.current.delete(conversation.id);
      setSidebarTab("conversations");
      setActive({ kind: "conversation", id: conversation.id });
      setActiveFriendId(null);
      setRightView("chat");
      void markConversationRead(conversation.id);
    } catch {
      // 保持好友详情页
    } finally {
      setStartingChat(false);
    }
  }

  useEffect(() => {
    void refreshIncomingRequests();
    void refreshConversations();
    connectWs();

    const unsubscribeState = onWsStateChange((state) => {
      const isConnected = state === "connected";
      setConnected(isConnected);

      if (isConnected && hasConnectedOnceRef.current) {
        void refreshConversations();
        void refreshIncomingRequests();
        void syncActiveConversationMessages();
      }
      if (isConnected) {
        hasConnectedOnceRef.current = true;
      }
      if (!isConnected && state === "disconnected") {
        markSendingMessagesFailed();
      }
    });

    const unsubscribeMessage = onWsEvent("message.new", (event) => {
      const message = event.payload?.message;
      if (message) {
        handleIncomingMessage(message);
      }
    });

    const unsubscribeFriendRequest = onWsEvent("friend.request", (event) => {
      const request = event.payload?.request;
      if (request) {
        handleIncomingFriendRequest(request);
      }
    });

    const unsubscribeFriendAccepted = onWsEvent("friend.accepted", (event) => {
      const friend = event.payload?.friend;
      if (friend) {
        handleFriendAccepted(friend);
      }
    });

    const unsubscribeFriendDeleted = onWsEvent("friend.deleted", (event) => {
      const userId = event.payload?.user_id;
      if (userId) {
        handleFriendDeleted(userId);
      }
    });

    return () => {
      unsubscribeState();
      unsubscribeMessage();
      unsubscribeFriendRequest();
      unsubscribeFriendAccepted();
      unsubscribeFriendDeleted();
      disconnectWs();
    };
  }, []);

  useEffect(() => {
    if (sidebarTab !== "friends") return;
    void refreshFriends();
  }, [sidebarTab]);

  useEffect(() => {
    if (active?.kind !== "conversation" || !active.id) {
      setLoadingId(null);
      return;
    }
    if (loadedIds.current.has(active.id)) {
      setLoadingId(null);
      return;
    }

    const conversationId = active.id;
    const currentUserId = getSession()?.user.id;
    if (!currentUserId) {
      setLoadingId(null);
      return;
    }

    setLoadingId(conversationId);
    void (async () => {
      try {
        const response = await listMessages(conversationId);
        setMessagesById((prev) => ({
          ...prev,
          [conversationId]: response.items.map((item) =>
            toChatMessage(item, currentUserId),
          ),
        }));
        loadedIds.current.add(conversationId);
        void markConversationRead(conversationId);
      } catch {
        // 保持空列表
      } finally {
        setLoadingId((current) => (current === conversationId ? null : current));
      }
    })();
  }, [active]);

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

  async function handleSend() {
    if (active?.kind !== "conversation" || !active.id || !connectedRef.current) {
      return;
    }
    const conversationId = active.id;
    const text = (draftsById[conversationId] ?? "").trim();
    if (!text) return;

    const clientMsgId = crypto.randomUUID();
    const message: ChatMessage = {
      id: clientMsgId,
      text,
      self: true,
      status: "sending",
      clientMsgId,
    };

    setMessagesById((prev) => ({
      ...prev,
      [conversationId]: [...(prev[conversationId] ?? []), message],
    }));
    setDraftsById((prev) => ({ ...prev, [conversationId]: "" }));
    touchConversation(conversationId, text);

    try {
      const sent = await sendMessage(conversationId, {
        type: "text",
        content: { text },
        client_msg_id: clientMsgId,
      });
      patchMessage(conversationId, clientMsgId, {
        id: sent.id,
        status: "sent",
        clientMsgId: sent.client_msg_id,
        seq: sent.seq,
      });
    } catch {
      patchMessage(conversationId, clientMsgId, { status: "failed" });
    }
  }

  async function handleRetry(messageId: string) {
    if (active?.kind !== "conversation" || !active.id) return;
    const conversationId = active.id;
    const message = (messagesById[conversationId] ?? []).find(
      (item) => item.id === messageId,
    );
    if (!message || message.status !== "failed") return;

    const clientMsgId = message.clientMsgId ?? message.id;
    patchMessage(conversationId, messageId, { status: "sending" });

    try {
      const sent = await sendMessage(conversationId, {
        type: "text",
        content: { text: message.text },
        client_msg_id: clientMsgId,
      });
      patchMessage(conversationId, messageId, {
        id: sent.id,
        status: "sent",
        clientMsgId: sent.client_msg_id,
        seq: sent.seq,
      });
      touchConversation(conversationId, message.text);
    } catch {
      patchMessage(conversationId, messageId, { status: "failed" });
    }
  }

  function handleReconnect() {
    connectWs();
  }

  function handleDraftChange(value: string) {
    if (active?.kind !== "conversation" || !active.id) return;
    setDraftsById((prev) => ({ ...prev, [active.id]: value }));
  }

  function handleSelect(item: SidebarItem) {
    setActive({ kind: item.kind, id: item.id });
    setActiveFriendId(null);
    setRightView("chat");
    if (item.kind === "conversation") {
      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.id === item.id
            ? { ...conversation, unread: 0 }
            : conversation,
        ),
      );
      void markConversationRead(item.id);
    }
  }

  function handleSelectFriend(id: string) {
    setActiveFriendId(id);
    setActive(null);
    setRightView("chat");
  }

  function handleSidebarTabChange(tab: SidebarTab) {
    setSidebarTab(tab);
    setQuery("");
    if (tab === "friends") {
      setActive(null);
    }
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
                    void (async () => {
                      const session = getSession();
                      if (session?.accessToken) {
                        try {
                          await apiLogout(session.accessToken);
                        } catch {
                          // 无论接口是否成功，都清除本地凭证
                        }
                      }
                      disconnectWs();
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
              <div className={cn(menuPanelClass, "right-0 min-w-[168px]")} role="menu">
                <button
                  type="button"
                  role="menuitem"
                  className={menuItemClass}
                  onClick={openAddFriend}
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

        <SidebarTabs
          active={sidebarTab}
          friendRequestCount={pendingFriendRequests.length}
          onChange={handleSidebarTabChange}
        />

        <div className="border-b border-border px-3 py-2.5">
          <Input
            size="sm"
            placeholder={sidebarTab === "conversations" ? "搜索会话" : "搜索好友"}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label={sidebarTab === "conversations" ? "搜索会话" : "搜索好友"}
          />
        </div>

        {sidebarTab === "conversations" ? (
          <ConversationList
            items={filteredConversations}
            active={active}
            onSelect={handleSelect}
          />
        ) : (
          <FriendList
            items={filteredFriends}
            loading={friendsLoading}
            activeId={activeFriendId}
            onSelect={handleSelectFriend}
          />
        )}
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        {!connected ? (
          <ConnectionBanner onReconnect={handleReconnect} />
        ) : null}
        {rightView === "add-friend" ? (
          <AddFriendForm onBack={backToChat} onSubmit={handleSendFriendRequest} />
        ) : activeFriendRequest ? (
          <FriendRequestDetail
            request={activeFriendRequest}
            onAccept={handleAcceptFriendRequest}
            onReject={handleRejectFriendRequest}
          />
        ) : activeFriend ? (
          <FriendDetail
            friend={activeFriend}
            starting={startingChat}
            deleting={deletingFriend}
            onStartChat={() => void handleStartChatFromFriend(activeFriend.id)}
            onDelete={() => void handleDeleteFriend(activeFriend.id)}
          />
        ) : activeConversation ? (
          <ChatMain
            conversation={activeConversation}
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
