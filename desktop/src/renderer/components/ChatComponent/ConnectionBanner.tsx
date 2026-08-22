import { WifiOff } from "lucide-react";
import { Button } from "@/ui";

interface ConnectionBannerProps {
  onReconnect: () => void;
}

/**
 * 断线提示条：顶部 banner + 重试。
 */
export default function ConnectionBanner({ onReconnect }: ConnectionBannerProps) {
  return (
    <div
      className="flex shrink-0 items-center justify-center gap-3 border-b border-danger/25 bg-danger/10 px-4 py-2 text-sm text-danger"
      role="status"
    >
      <WifiOff className="size-4 shrink-0" aria-hidden />
      <span>实时连接已断开，消息可能无法及时送达</span>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-danger hover:bg-danger/15 hover:text-danger"
        onClick={onReconnect}
      >
        重试连接
      </Button>
    </div>
  );
}
