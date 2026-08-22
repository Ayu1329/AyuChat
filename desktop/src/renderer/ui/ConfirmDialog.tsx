import type { ReactNode } from "react";
import { Button } from "./Button";
import { Dialog, type DialogSize } from "./Dialog";
import { cn } from "./cn";

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: ReactNode;
  description?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: "primary" | "danger";
  loading?: boolean;
  size?: DialogSize;
}

/**
 * 二次确认弹窗：标题 + 说明 + 取消 / 确认。
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "确认",
  cancelText = "取消",
  confirmVariant = "primary",
  loading = false,
  size = "sm",
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title={title} size={size}>
      <div className="px-4 py-4">
        {description ? (
          <p className="text-sm text-muted">{description}</p>
        ) : null}
        <div
          className={cn(
            "flex justify-end gap-2",
            description ? "mt-4" : "mt-0",
          )}
        >
          <Button variant="secondary" size="sm" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button
            variant={confirmVariant}
            size="sm"
            loading={loading}
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

ConfirmDialog.displayName = "ConfirmDialog";
