import {
  forwardRef,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "./cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** 视觉变体 */
  variant?: ButtonVariant;
  /** 尺寸 */
  size?: ButtonSize;
  /** 占满容器宽度 */
  fullWidth?: boolean;
  /** 加载中：禁用并展示 loading 文案/内容 */
  loading?: boolean;
  /** 加载态展示内容，默认「加载中…」 */
  loadingText?: ReactNode;
}

const variantClass: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-white hover:bg-primary-hover active:bg-primary-active",
  secondary:
    "border border-border bg-transparent text-muted hover:bg-border/50 hover:text-fg",
  ghost: "bg-transparent text-muted hover:bg-border/40 hover:text-fg",
  danger:
    "bg-danger text-white hover:bg-danger-hover active:bg-danger-active",
};

const sizeClass: Record<ButtonSize, string> = {
  sm: "rounded-lg px-3 py-1.5 text-[13px]",
  md: "rounded-lg px-4 py-2.5 text-sm",
  lg: "rounded-lg px-5 py-3 text-base",
};

/**
 * 全局按钮：主操作 / 次要 / 幽灵 / 危险。
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      className,
      variant = "primary",
      size = "md",
      fullWidth = false,
      loading = false,
      loadingText = "加载中…",
      disabled,
      type = "button",
      children,
      ...props
    },
    ref,
  ) {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-semibold transition-colors",
          "cursor-pointer select-none",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
          "disabled:pointer-events-none disabled:opacity-50",
          variantClass[variant],
          sizeClass[size],
          fullWidth && "w-full",
          className,
        )}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? loadingText : children}
      </button>
    );
  },
);

Button.displayName = "Button";
