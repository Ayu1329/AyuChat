import {
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { X } from "lucide-react";
import { cn } from "./cn";

export type DialogSize = "sm" | "md" | "lg";

export interface DialogProps {
  /** 是否展示 */
  open: boolean;
  /** 关闭回调（遮罩点击、Esc、关闭按钮） */
  onClose: () => void;
  /** 标题 */
  title?: ReactNode;
  /** 是否展示标题栏关闭按钮 */
  showClose?: boolean;
  /** 面板尺寸 */
  size?: DialogSize;
  /** 面板额外 class */
  className?: string;
  /** 内容 */
  children: ReactNode;
}

const sizeClass: Record<DialogSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-2xl",
};

/**
 * 通用弹窗：遮罩 + 居中面板，支持 Esc 关闭与焦点管理。
 */
export function Dialog({
  open,
  onClose,
  title,
  showClose = true,
  size = "md",
  className,
  children,
}: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-fg/40 backdrop-blur-[1px]"
        aria-label="关闭弹窗"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "dialog-title" : undefined}
        className={cn(
          "relative z-10 flex w-full flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-[0_4px_12px_rgb(0_0_0/0.1)]",
          sizeClass[size],
          className,
        )}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {title != null && title !== false ? (
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
            <h2
              id="dialog-title"
              className="text-base font-semibold tracking-tight text-fg"
            >
              {title}
            </h2>
            {showClose ? (
              <button
                type="button"
                className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-lg text-muted transition-colors hover:bg-border/40 hover:text-fg"
                aria-label="关闭"
                onClick={onClose}
              >
                <X className="size-4" />
              </button>
            ) : null}
          </div>
        ) : null}
        {children}
      </div>
    </div>
  );
}

Dialog.displayName = "Dialog";
