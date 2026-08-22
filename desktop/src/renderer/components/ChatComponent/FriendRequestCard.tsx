import { useState } from "react";
import { Button, cn } from "@/ui";
import type { FriendRequest } from "./friendTypes";
import {
  avatarInitial,
  displayLabel,
  formatAccount,
  formatRequestTime,
} from "./friendTypes";

interface FriendRequestCardProps {
  request: FriendRequest;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}

/**
 * 单条好友申请：对方账号、附言、同意 / 拒绝。
 */
export default function FriendRequestCard({
  request,
  onAccept,
  onReject,
}: FriendRequestCardProps) {
  const [acting, setActing] = useState<"accept" | "reject" | null>(null);
  const { from_user: user, message } = request;

  async function handleAccept() {
    setActing("accept");
    try {
      await Promise.resolve(onAccept(request.id));
    } finally {
      setActing(null);
    }
  }

  async function handleReject() {
    setActing("reject");
    try {
      await Promise.resolve(onReject(request.id));
    } finally {
      setActing(null);
    }
  }

  const busy = acting !== null;

  return (
    <article
      className={cn(
        "rounded-xl border border-border bg-surface p-4 shadow-[0_1px_3px_rgb(0_0_0/0.04)]",
        "transition-opacity",
        busy && "opacity-70",
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className="grid size-11 shrink-0 place-items-center rounded-full bg-primary/15 text-sm font-semibold text-primary"
          aria-hidden
        >
          {avatarInitial(user)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-fg">
                {displayLabel(user)}
              </p>
              <p className="mt-0.5 truncate text-xs text-muted">
                {formatAccount(user)}
              </p>
            </div>
            <time
              className="shrink-0 text-xs text-muted"
              dateTime={request.created_at}
            >
              {formatRequestTime(request.created_at)}
            </time>
          </div>

          <div className="mt-3 rounded-lg bg-bg px-3 py-2.5">
            <p className="text-[11px] font-medium text-muted">验证消息</p>
            <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap text-fg">
              {message.trim() ? message : "对方未填写验证消息"}
            </p>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={busy}
              loading={acting === "reject"}
              loadingText="处理中…"
              onClick={handleReject}
            >
              拒绝
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={busy}
              loading={acting === "accept"}
              loadingText="处理中…"
              onClick={handleAccept}
            >
              同意
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
