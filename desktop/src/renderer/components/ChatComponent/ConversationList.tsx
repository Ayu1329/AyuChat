import { UserPlus } from "lucide-react";
import { cn } from "@/ui";

export interface Conversation {
  kind: "conversation";
  id: string;
  name: string;
  preview: string;
  time: string;
  unread: number;
}

export interface FriendRequestListItem {
  kind: "friend-request";
  id: string;
  name: string;
  preview: string;
  time: string;
}

export type SidebarItem = Conversation | FriendRequestListItem;

export type ActiveSelection =
  | { kind: "conversation"; id: string }
  | { kind: "friend-request"; id: string };

interface ConversationListProps {
  items: SidebarItem[];
  active: ActiveSelection | null;
  onSelect: (item: SidebarItem) => void;
}

function isActive(item: SidebarItem, active: ActiveSelection | null) {
  return active?.kind === item.kind && active.id === item.id;
}

/**
 * 左侧列表：会话 + 好友申请。
 */
export default function ConversationList({
  items,
  active,
  onSelect,
}: ConversationListProps) {
  if (items.length === 0) {
    return (
      <div className="grid flex-1 place-items-center px-4 text-sm text-muted">
        暂无会话
      </div>
    );
  }

  return (
    <ul className="flex-1 overflow-y-auto py-1">
      {items.map((item) => {
        const selected = isActive(item, active);
        const isFriendRequest = item.kind === "friend-request";

        return (
          <li key={`${item.kind}:${item.id}`}>
            <button
              type="button"
              onClick={() => onSelect(item)}
              className={cn(
                "flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left transition-colors",
                selected ? "bg-primary/10" : "hover:bg-border/40",
              )}
            >
              <span
                className={cn(
                  "relative grid size-10 shrink-0 place-items-center rounded-full text-sm font-semibold",
                  isFriendRequest
                    ? "bg-primary/20 text-primary"
                    : "bg-primary/15 text-primary",
                )}
              >
                {isFriendRequest ? (
                  <UserPlus className="size-4" aria-hidden />
                ) : (
                  item.name.slice(0, 1)
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-medium text-fg">
                    {item.name}
                  </span>
                  <span className="shrink-0 text-xs text-muted">{item.time}</span>
                </span>
                <span className="mt-0.5 flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "truncate text-[13px]",
                      isFriendRequest ? "text-primary" : "text-muted",
                    )}
                  >
                    {item.preview}
                  </span>
                  {!isFriendRequest && item.unread > 0 ? (
                    <span className="grid min-w-[1.125rem] shrink-0 place-items-center rounded-full bg-danger px-1.5 text-[11px] leading-4 text-white">
                      {item.unread}
                    </span>
                  ) : null}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
