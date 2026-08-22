import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "./cn";

export type InputSize = "sm" | "md" | "lg";

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  /** 标签文案 */
  label?: ReactNode;
  /** 错误信息；有值时进入错误态 */
  error?: ReactNode;
  /** 辅助说明（无 error 时展示） */
  hint?: ReactNode;
  /** 尺寸 */
  size?: InputSize;
  /** 占满容器宽度 */
  fullWidth?: boolean;
  /** 包裹层额外 class */
  wrapperClassName?: string;
}

const sizeClass: Record<InputSize, string> = {
  sm: "rounded-lg px-2.5 py-1.5 text-[13px]",
  md: "rounded-lg px-3 py-2.5 text-sm",
  lg: "rounded-lg px-3.5 py-3 text-base",
};

/**
 * 全局输入框：支持 label / hint / error，兼容原生 input 属性。
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    className,
    wrapperClassName,
    label,
    error,
    hint,
    size = "md",
    fullWidth = true,
    id,
    disabled,
    ...props
  },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const describedById = error
    ? `${inputId}-error`
    : hint
      ? `${inputId}-hint`
      : undefined;
  const hasError = Boolean(error);

  return (
    <div className={cn("flex flex-col gap-1.5", fullWidth && "w-full", wrapperClassName)}>
      {label != null && label !== false && (
        <label
          htmlFor={inputId}
          className="text-[13px] font-medium text-fg"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        disabled={disabled}
        aria-invalid={hasError || undefined}
        aria-describedby={describedById}
        className={cn(
          "border bg-surface text-fg outline-none transition-[border-color,box-shadow]",
          "placeholder:text-muted/70",
          "focus-visible:ring-2 focus-visible:ring-primary/35",
          "disabled:cursor-not-allowed disabled:opacity-50",
          hasError
            ? "border-danger focus-visible:border-danger focus-visible:ring-danger/30"
            : "border-border focus-visible:border-primary",
          sizeClass[size],
          fullWidth && "w-full",
          className,
        )}
        {...props}
      />
      {hasError ? (
        <p id={describedById} className="text-xs text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={describedById} className="text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

Input.displayName = "Input";
