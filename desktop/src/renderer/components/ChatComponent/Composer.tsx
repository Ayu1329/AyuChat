import {
  useEffect,
  useLayoutEffect,
  useRef,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { Paperclip, Smile } from "lucide-react";
import { Button, cn } from "@/ui";

interface ComposerProps {
  value: string;
  connected: boolean;
  disabled?: boolean;
  onChange: (value: string) => void;
  onSend: () => void;
}

const MIN_ROWS = 1;
const MAX_ROWS = 6;
const LINE_HEIGHT_PX = 22;
const VERTICAL_PAD_PX = 20; // py-2.5 ≈ 10+10

/**
 * 输入区：附件/表情占位 + 多行自适应 + 发送。
 * Enter 发送，Shift+Enter 换行。
 */
export default function Composer({
  value,
  connected,
  disabled = false,
  onChange,
  onSend,
}: ComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const canSend = Boolean(value.trim()) && connected && !disabled;

  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const maxHeight = LINE_HEIGHT_PX * MAX_ROWS + VERTICAL_PAD_PX;
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
  }, [value]);

  useEffect(() => {
    if (!connected) return;
    textareaRef.current?.focus();
  }, [connected]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSend) return;
    onSend();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!canSend) return;
      onSend();
    }
  }

  return (
    <form
      className="flex shrink-0 items-end gap-1.5 border-t border-border bg-surface/70 px-3 py-3"
      onSubmit={handleSubmit}
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="mb-0.5 shrink-0 px-2"
        disabled={!connected || disabled}
        aria-label="添加附件（即将支持）"
        title="附件（即将支持）"
      >
        <Paperclip className="size-4" />
      </Button>

      <div className="relative min-w-0 flex-1">
        <textarea
          ref={textareaRef}
          rows={MIN_ROWS}
          value={value}
          disabled={!connected || disabled}
          placeholder={
            connected
              ? "输入消息，Enter 发送，Shift+Enter 换行"
              : "网络断开，无法发送"
          }
          aria-label="消息输入"
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className={cn(
            "block w-full resize-none overflow-y-auto border bg-surface text-sm text-fg outline-none transition-[border-color,box-shadow]",
            "rounded-lg px-3 py-2.5 leading-[22px]",
            "placeholder:text-muted/70",
            "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/35",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "border-border",
          )}
          style={{
            maxHeight: LINE_HEIGHT_PX * MAX_ROWS + VERTICAL_PAD_PX,
          }}
        />
      </div>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="mb-0.5 shrink-0 px-2"
        disabled={!connected || disabled}
        aria-label="表情（即将支持）"
        title="表情（即将支持）"
      >
        <Smile className="size-4" />
      </Button>

      <Button type="submit" className="mb-0.5 shrink-0" disabled={!canSend}>
        发送
      </Button>
    </form>
  );
}
