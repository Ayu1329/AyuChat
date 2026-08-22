import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Button, OtpInput } from "@/ui";

const CN_MOBILE = /^1[3-9]\d{9}$/;
const OTP_LENGTH = 6;
const COUNTDOWN_SEC = 60;

function validatePhone(phone: string): string | null {
  if (!phone.trim()) return "请输入手机号";
  if (!CN_MOBILE.test(phone.trim())) return "请输入有效的中国大陆手机号";
  return null;
}

export interface SmsVerifyProps {
  /** 受控手机号 */
  phone: string;
  onPhoneChange: (phone: string) => void;
  /** 获取验证码（父层调接口） */
  onSendCode: (phone: string) => void | Promise<void>;
  /** 校验验证码（父层调接口 / 切下一步） */
  onVerify: (phone: string, otp: string) => void | Promise<void>;
  /** 主按钮文案，如「注册」「下一步」 */
  verifyLabel?: string;
}

/**
 * 短信验证 UI：字段校验在本地，发码 / 验证交给父层。
 */
export default function SmsVerify({
  phone,
  onPhoneChange,
  onSendCode,
  onVerify,
  verifyLabel = "下一步",
}: SmsVerifyProps) {
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [codeSent, setCodeSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  function handlePhoneChange(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    onPhoneChange(digits);
    if (phoneError) setPhoneError(null);
  }

  async function handleSendCode() {
    const err = validatePhone(phone);
    setPhoneError(err);
    if (err) return;

    setSending(true);
    try {
      await onSendCode(phone.trim());
      setCodeSent(true);
      setCountdown(COUNTDOWN_SEC);
      setOtp("");
      setOtpError(null);
    } finally {
      setSending(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const phoneErr = validatePhone(phone);
    setPhoneError(phoneErr);
    if (phoneErr) return;

    if (!codeSent) {
      setOtpError("请先获取验证码");
      return;
    }

    if (otp.length !== OTP_LENGTH) {
      setOtpError(`请输入 ${OTP_LENGTH} 位验证码`);
      return;
    }

    setVerifying(true);
    try {
      await onVerify(phone.trim(), otp);
    } finally {
      setVerifying(false);
    }
  }

  return (
    <form className="flex flex-col gap-3" onSubmit={handleSubmit} noValidate>
      <div className="flex flex-col gap-1.5">
        <span className="text-[13px] font-medium text-fg">手机号</span>
        <div className="flex items-start gap-2">
          <div
            className="flex h-[42px] shrink-0 items-center rounded-lg border border-border bg-surface px-3 text-sm font-medium text-fg"
            aria-label="国家区号，仅支持中国大陆 +86"
          >
            +86
          </div>
          <input
            name="phone"
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder="请输入手机号"
            value={phone}
            aria-label="手机号"
            aria-invalid={Boolean(phoneError) || undefined}
            aria-describedby={phoneError ? "phone-error" : undefined}
            className={`h-[42px] min-w-0 flex-1 rounded-lg border bg-surface px-3 text-sm text-fg outline-none transition-[border-color,box-shadow] placeholder:text-muted/70 focus-visible:ring-2 focus-visible:ring-primary/35 ${
              phoneError
                ? "border-danger focus-visible:border-danger focus-visible:ring-danger/30"
                : "border-border focus-visible:border-primary"
            }`}
            onChange={(e) => handlePhoneChange(e.target.value)}
          />
        </div>
        {phoneError ? (
          <p id="phone-error" className="text-xs text-danger" role="alert">
            {phoneError}
          </p>
        ) : (
          <p className="text-xs text-muted">仅支持中国大陆手机号（+86）</p>
        )}
      </div>

      <Button
        type="button"
        variant="secondary"
        fullWidth
        loading={sending}
        loadingText="发送中…"
        disabled={countdown > 0}
        onClick={() => void handleSendCode()}
      >
        {countdown > 0 ? `${countdown}s 后可重发` : "获取验证码"}
      </Button>

      {codeSent ? (
        <OtpInput
          label="验证码"
          value={otp}
          length={OTP_LENGTH}
          error={otpError}
          onChange={(next) => {
            setOtp(next);
            if (otpError) setOtpError(null);
          }}
        />
      ) : null}

      <Button
        type="submit"
        fullWidth
        disabled={!codeSent}
        loading={verifying}
        loadingText="验证中…"
      >
        {verifyLabel}
      </Button>

      <p className="text-center text-sm text-muted">
        已有账号？{" "}
        <Link
          to="/login"
          className="font-medium text-primary hover:text-primary-hover"
        >
          返回登录
        </Link>
      </p>
    </form>
  );
}
