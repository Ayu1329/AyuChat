import { useState, type FormEvent } from "react";
import { Input, Button, cn } from "@/ui";
import { getErrorMessage } from "../../auth/errors";
import FriendPanelHeader from "./FriendPanelHeader";

const PHONE_RE = /^1[3-9]\d{9}$/;
const MESSAGE_MAX = 100;

interface AddFriendFormProps {
  onBack: () => void;
  onSubmit: (phone: string, message: string) => void | Promise<void>;
}

/**
 * 发送好友申请：对方手机号 + 验证消息。
 */
export default function AddFriendForm({ onBack, onSubmit }: AddFriendFormProps) {
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function validatePhone(value: string) {
    if (!value.trim()) return "请输入手机号";
    if (!PHONE_RE.test(value.trim())) return "请输入有效的 11 位手机号";
    return null;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    setSuccess(false);

    const nextPhoneError = validatePhone(phone);
    setPhoneError(nextPhoneError);
    if (nextPhoneError) return;

    setLoading(true);
    try {
      await onSubmit(phone.trim(), message.trim());
      setSuccess(true);
      setPhone("");
      setMessage("");
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <FriendPanelHeader
        title="新增好友"
        subtitle="通过手机号搜索并发送好友申请"
        onBack={onBack}
      />

      <form
        className="flex flex-1 flex-col overflow-y-auto p-6"
        onSubmit={(event) => void handleSubmit(event)}
      >
        <div className="mx-auto w-full max-w-md space-y-5">
          <Input
            label="对方手机号"
            size="md"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="11 位手机号"
            value={phone}
            error={phoneError}
            hint="仅支持中国大陆 +86 手机号"
            onChange={(event) => {
              setPhone(event.target.value.replace(/\D/g, "").slice(0, 11));
              if (phoneError) setPhoneError(null);
              if (success) setSuccess(false);
            }}
          />

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="friend-request-message"
              className="text-[13px] font-medium text-fg"
            >
              验证消息
            </label>
            <textarea
              id="friend-request-message"
              rows={4}
              maxLength={MESSAGE_MAX}
              value={message}
              placeholder="介绍一下自己，方便对方确认身份（选填）"
              onChange={(event) => {
                setMessage(event.target.value.slice(0, MESSAGE_MAX));
                if (success) setSuccess(false);
              }}
              className={cn(
                "w-full resize-none rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-fg outline-none transition-[border-color,box-shadow]",
                "placeholder:text-muted/70",
                "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/35",
              )}
            />
            <p className="text-right text-xs text-muted">
              {message.length}/{MESSAGE_MAX}
            </p>
          </div>

          {formError ? (
            <p className="text-sm text-danger" role="alert">
              {formError}
            </p>
          ) : null}

          {success ? (
            <p
              className="rounded-lg border border-primary/25 bg-primary/10 px-3 py-2.5 text-sm text-primary"
              role="status"
            >
              好友申请已发送，等待对方确认
            </p>
          ) : null}

          <Button type="submit" fullWidth loading={loading} loadingText="发送中…">
            发送申请
          </Button>
        </div>
      </form>
    </div>
  );
}
