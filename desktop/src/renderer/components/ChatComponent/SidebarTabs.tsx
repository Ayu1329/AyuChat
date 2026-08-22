import { cn } from "@/ui";

export type SidebarTab = "conversations" | "friends";

interface SidebarTabsProps {
  active: SidebarTab;
  friendRequestCount: number;
  onChange: (tab: SidebarTab) => void;
}

const tabClass =
  "relative flex-1 cursor-pointer rounded-lg px-2 py-1.5 text-center text-[13px] font-medium transition-colors";

export default function SidebarTabs({
  active,
  friendRequestCount,
  onChange,
}: SidebarTabsProps) {
  return (
    <div
      className="mx-3 mb-2 grid grid-cols-2 gap-1 rounded-lg bg-bg p-1"
      role="tablist"
      aria-label="列表切换"
    >
      <button
        type="button"
        role="tab"
        aria-selected={active === "conversations"}
        className={cn(
          tabClass,
          active === "conversations"
            ? "bg-surface text-primary shadow-sm"
            : "text-muted hover:text-fg",
        )}
        onClick={() => onChange("conversations")}
      >
        会话
        {friendRequestCount > 0 ? (
          <span className="absolute -top-1 -right-0.5 grid min-w-[1rem] place-items-center rounded-full bg-danger px-1 text-[10px] leading-4 text-white">
            {friendRequestCount}
          </span>
        ) : null}
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={active === "friends"}
        className={cn(
          tabClass,
          active === "friends"
            ? "bg-surface text-primary shadow-sm"
            : "text-muted hover:text-fg",
        )}
        onClick={() => onChange("friends")}
      >
        好友
      </button>
    </div>
  );
}
