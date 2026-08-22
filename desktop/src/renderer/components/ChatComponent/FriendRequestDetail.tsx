import FriendRequestCard from "./FriendRequestCard";
import type { FriendRequest } from "./friendTypes";
import { displayLabel, formatAccount } from "./friendTypes";

interface FriendRequestDetailProps {
  request: FriendRequest;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}

/**
 * 右侧好友申请详情（对应列表选中项）。
 */
export default function FriendRequestDetail({
  request,
  onAccept,
  onReject,
}: FriendRequestDetailProps) {
  const user = request.from_user;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex shrink-0 items-center gap-3 border-b border-border bg-surface/80 px-4 py-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
          {displayLabel(user).slice(0, 1)}
        </span>
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold tracking-tight text-fg">
            {displayLabel(user)}
          </h2>
          <p className="truncate text-xs text-muted">{formatAccount(user)}</p>
        </div>
      </header>

      <div className="flex flex-1 flex-col overflow-y-auto p-4">
        <FriendRequestCard
          request={request}
          onAccept={onAccept}
          onReject={onReject}
        />
      </div>
    </div>
  );
}
