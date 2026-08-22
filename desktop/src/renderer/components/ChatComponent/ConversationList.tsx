import { cn } from "@/ui";

export interface Conversation {
  id: string;
  name: string;
  preview: string;
  time: string;
  unread: number;
}

interface ConversationListProps {
  items: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
}

/**
 * 左侧会话列表。
 */
export default function ConversationList({
  items,
  activeId,
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
        const active = item.id === activeId;
        return (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onSelect(item.id)}
              className={cn(
                "flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left transition-colors",
                active ? "bg-primary/10" : "hover:bg-border/40",
              )}
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                {item.name.slice(0, 1)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-medium text-fg">
                    {item.name}
                  </span>
                  <span className="shrink-0 text-xs text-muted">{item.time}</span>
                </span>
                <span className="mt-0.5 flex items-center justify-between gap-2">
                  <span className="truncate text-[13px] text-muted">
                    {item.preview}
                  </span>
                  {item.unread > 0 ? (
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
