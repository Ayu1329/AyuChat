import { MessageCircle, UserMinus } from "lucide-react";
import { Button } from "@/ui";
import type { FriendListItem } from "./FriendList";

interface FriendDetailProps {
  friend: FriendListItem;
  starting?: boolean;
  deleting?: boolean;
  onStartChat: () => void;
  onDelete: () => void;
}

export default function FriendDetail({
  friend,
  starting = false,
  deleting = false,
  onStartChat,
  onDelete,
}: FriendDetailProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex shrink-0 items-center gap-3 border-b border-border bg-surface/80 px-4 py-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
          {friend.name.slice(0, 1)}
        </span>
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold tracking-tight text-fg">
            {friend.name}
          </h2>
          <p className="truncate text-xs text-muted">好友</p>
        </div>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <span className="grid size-24 place-items-center rounded-full bg-primary/15 text-3xl font-semibold text-primary">
          {friend.name.slice(0, 1)}
        </span>
        <h3 className="mt-5 text-lg font-semibold tracking-tight text-fg">
          {friend.name}
        </h3>
        <p className="mt-2 text-sm text-muted">{friend.phone}</p>
        <div className="mt-8 flex flex-col gap-3">
          <Button
            className="min-w-[140px]"
            onClick={onStartChat}
            disabled={starting || deleting}
          >
            <MessageCircle className="size-4" />
            {starting ? "进入中…" : "发消息"}
          </Button>
          <Button
            className="min-w-[140px]"
            variant="danger"
            onClick={onDelete}
            disabled={starting || deleting}
            loading={deleting}
            loadingText="删除中…"
          >
            <UserMinus className="size-4" />
            删除好友
          </Button>
        </div>
      </div>
    </div>
  );
}
