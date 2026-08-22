import { useEffect, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { login } from "@/ayuapi";
import { getErrorMessage } from "../../auth/errors";
import { setSessionFromLogin } from "../../auth/session";
import { Button, Input } from "@/ui";
import ApiErrorBanner from "./ApiErrorBanner";

export default function PwdLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [accountError, setAccountError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const state = location.state as {
      registeredPhone?: string;
      resetPhone?: string;
    } | null;
    const prefill = state?.registeredPhone ?? state?.resetPhone;
    if (prefill) setAccount(prefill);
  }, [location.state]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextAccount = account.trim();
    const nextPassword = password;
    const accountMsg = nextAccount ? null : "请输入账号";
    const passwordMsg = nextPassword ? null : "请输入密码";

    setAccountError(accountMsg);
    setPasswordError(passwordMsg);
    setApiError(null);
    if (accountMsg || passwordMsg) return;

    setSubmitting(true);
    try {
      const res = await login(nextAccount, nextPassword);
      setSessionFromLogin(res);
      const from = (location.state as { from?: { pathname?: string } } | null)
        ?.from?.pathname;
      navigate(from && from !== "/login" ? from : "/chat", { replace: true });
    } catch (err) {
      setApiError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="flex flex-col gap-3" onSubmit={handleSubmit} noValidate>
      <ApiErrorBanner message={apiError} />
      <Input
        label="账号"
        name="account"
        autoComplete="username"
        placeholder="请输入手机号"
        value={account}
        error={accountError}
        onChange={(e) => {
          setAccount(e.target.value);
          if (accountError) setAccountError(null);
        }}
      />
      <Input
        label="密码"
        name="password"
        type="password"
        autoComplete="current-password"
        placeholder="请输入密码"
        value={password}
        error={passwordError}
        onChange={(e) => {
          setPassword(e.target.value);
          if (passwordError) setPasswordError(null);
        }}
      />
      <Button type="submit" fullWidth loading={submitting} loadingText="登录中…">
        登录
      </Button>
    </form>
  );
}
