import { ChevronLeft } from "lucide-react";
import { cn } from "@/ui";

interface FriendPanelHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  className?: string;
}

/**
 * 好友相关右侧面板顶栏。
 */
export default function FriendPanelHeader({
  title,
  subtitle,
  onBack,
  className,
}: FriendPanelHeaderProps) {
  return (
    <header
      className={cn(
        "flex shrink-0 items-center gap-2 border-b border-border bg-surface/80 px-3 py-3",
        className,
      )}
    >
      {onBack ? (
        <button
          type="button"
          className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-lg text-muted transition-colors hover:bg-border/40 hover:text-fg"
          aria-label="返回"
          onClick={onBack}
        >
          <ChevronLeft className="size-5" />
        </button>
      ) : null}
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-base font-semibold tracking-tight text-fg">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-0.5 truncate text-xs text-muted">{subtitle}</p>
        ) : null}
      </div>
    </header>
  );
}
