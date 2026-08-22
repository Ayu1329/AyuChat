import {
  forwardRef,
  useId,
  useRef,
  type ClipboardEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { cn } from "./cn";

export interface OtpInputProps {
  /** 当前验证码（数字字符串） */
  value: string;
  /** 位数，默认 6 */
  length?: number;
  /** 变化回调 */
  onChange: (value: string) => void;
  /** 标签 */
  label?: ReactNode;
  /** 错误信息 */
  error?: ReactNode;
  /** 禁用 */
  disabled?: boolean;
  /** 额外 class */
  className?: string;
  /** 输入完成时回调 */
  onComplete?: (value: string) => void;
}

/**
 * OTP 验证码分格输入。
 */
export const OtpInput = forwardRef<HTMLDivElement, OtpInputProps>(
  function OtpInput(
    {
      value,
      length = 6,
      onChange,
      label,
      error,
      disabled = false,
      className,
      onComplete,
    },
    ref,
  ) {
    const autoId = useId();
    const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
    const digits = value.replace(/\D/g, "").slice(0, length).split("");
    const cells = Array.from({ length }, (_, i) => digits[i] ?? "");
    const hasError = Boolean(error);
    const describedById = hasError ? `${autoId}-error` : undefined;

    function focusAt(index: number) {
      const el = inputsRef.current[index];
      if (!el) return;
      el.focus();
      el.select();
    }

    function commit(nextDigits: string[]) {
      const next = nextDigits.join("").slice(0, length);
      onChange(next);
      if (next.length === length) onComplete?.(next);
    }

    function handleChange(index: number, raw: string) {
      const char = raw.replace(/\D/g, "").slice(-1);
      const next = [...cells];
      next[index] = char;
      // normalize empty slots when deleting mid-way
      const compact = next.map((d) => d || "");
      commit(compact);
      if (char && index < length - 1) focusAt(index + 1);
    }

    function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
      if (event.key === "Backspace") {
        event.preventDefault();
        if (cells[index]) {
          const next = [...cells];
          next[index] = "";
          commit(next);
          return;
        }
        if (index > 0) {
          const next = [...cells];
          next[index - 1] = "";
          commit(next);
          focusAt(index - 1);
        }
        return;
      }

      if (event.key === "ArrowLeft" && index > 0) {
        event.preventDefault();
        focusAt(index - 1);
      }
      if (event.key === "ArrowRight" && index < length - 1) {
        event.preventDefault();
        focusAt(index + 1);
      }
    }

    function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
      event.preventDefault();
      const pasted = event.clipboardData
        .getData("text")
        .replace(/\D/g, "")
        .slice(0, length);
      if (!pasted) return;
      const next = Array.from({ length }, (_, i) => pasted[i] ?? "");
      commit(next);
      focusAt(Math.min(pasted.length, length - 1));
    }

    return (
      <div ref={ref} className={cn("flex flex-col gap-1.5", className)}>
        {label != null && label !== false ? (
          <span className="text-[13px] font-medium text-fg" id={`${autoId}-label`}>
            {label}
          </span>
        ) : null}
        <div
          className="flex gap-2"
          role="group"
          aria-labelledby={label != null && label !== false ? `${autoId}-label` : undefined}
          aria-describedby={describedById}
        >
          {cells.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputsRef.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              autoComplete={index === 0 ? "one-time-code" : "off"}
              maxLength={1}
              disabled={disabled}
              value={digit}
              aria-label={`验证码第 ${index + 1} 位`}
              aria-invalid={hasError || undefined}
              className={cn(
                "h-11 w-10 rounded-lg border bg-surface text-center text-base font-semibold text-fg outline-none transition-[border-color,box-shadow]",
                "focus-visible:ring-2 focus-visible:ring-primary/35",
                "disabled:cursor-not-allowed disabled:opacity-50",
                hasError
                  ? "border-danger focus-visible:border-danger focus-visible:ring-danger/30"
                  : "border-border focus-visible:border-primary",
              )}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              onFocus={(e) => e.target.select()}
            />
          ))}
        </div>
        {hasError ? (
          <p id={describedById} className="text-xs text-danger" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);

OtpInput.displayName = "OtpInput";
