import { useState, type FormEvent } from "react";
import { Button, Input } from "@/ui";

const PASSWORD_RULE =
  /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?~`]{8,32}$/;

function validatePassword(password: string): string | null {
  if (!password) return "请输入密码";
  if (password.length < 8 || password.length > 32) {
    return "密码长度为 8–32 位";
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return "密码需同时包含字母和数字";
  }
  if (!PASSWORD_RULE.test(password)) {
    return "密码包含不支持的字符";
  }
  return null;
}

export interface PasswordSettingProps {
  phone: string;
  /** 校验通过后交给父层（注册 / 重置接口） */
  onOk: (password: string) => void | Promise<void>;
  /** 主按钮文案 */
  submitLabel?: string;
}

/**
 * 设置密码 UI：规则校验在本地，提交交给父层。
 */
export default function PasswordSetting({
  phone,
  onOk,
  submitLabel = "设置密码",
}: PasswordSettingProps) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const pwdErr = validatePassword(password);
    setPasswordError(pwdErr);

    let confirmErr: string | null = null;
    if (!confirm) confirmErr = "请再次输入密码";
    else if (password !== confirm) confirmErr = "两次输入的密码不一致";
    setConfirmError(confirmErr);

    if (pwdErr || confirmErr) return;

    setSubmitting(true);
    try {
      await onOk(password);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="flex flex-col gap-3" onSubmit={handleSubmit} noValidate>
      <p className="text-sm text-muted">
        账号 <span className="font-medium text-fg">+86 {phone}</span>
      </p>
      <Input
        label="密码"
        name="password"
        type="password"
        autoComplete="new-password"
        placeholder="请输入密码"
        value={password}
        error={passwordError}
        onChange={(e) => {
          setPassword(e.target.value);
          if (passwordError) setPasswordError(null);
        }}
      />
      <Input
        label="确认密码"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        placeholder="请再次输入密码"
        value={confirm}
        error={confirmError}
        onChange={(e) => {
          setConfirm(e.target.value);
          if (confirmError) setConfirmError(null);
        }}
      />

      <ul className="space-y-1 rounded-lg bg-border/30 px-3 py-2.5 text-xs leading-relaxed text-muted">
        <li>· 长度为 8–32 位</li>
        <li>· 需同时包含字母和数字</li>
        <li>· 两次输入须一致</li>
      </ul>

      <Button
        type="submit"
        fullWidth
        loading={submitting}
        loadingText="提交中…"
      >
        {submitLabel}
      </Button>
    </form>
  );
}
