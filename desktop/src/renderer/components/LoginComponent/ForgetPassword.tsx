import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { resetPassword, sendSms, verifySms } from "@/ayuapi";
import { getErrorMessage } from "../../auth/errors";
import ApiErrorBanner from "./ApiErrorBanner";
import AuthCard from "./AuthCard";
import SmsVerify from "./components/SmsVerify";
import PasswordSetting from "./components/PasswordSetting";

type ResetStep = "sms" | "password";

const STEP_META: Record<ResetStep, { title: string; subtitle: string }> = {
  sms: {
    title: "忘记密码",
    subtitle: "验证手机号以重置密码",
  },
  password: {
    title: "重置密码",
    subtitle: "设置新的登录密码",
  },
};

/**
 * 忘记密码流程：与注册共用 UI，接口对接 connect 层。
 */
export default function ForgetPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<ResetStep>("sms");
  const [phone, setPhone] = useState("");
  const [verifyToken, setVerifyToken] = useState("");
  const [apiError, setApiError] = useState<string | null>(null);

  const meta = STEP_META[step];

  async function handleSendCode(nextPhone: string) {
    setApiError(null);
    try {
      await sendSms(nextPhone, "reset_password");
    } catch (err) {
      setApiError(getErrorMessage(err));
      throw err;
    }
  }

  async function handleVerify(nextPhone: string, otp: string) {
    setApiError(null);
    try {
      const res = await verifySms(nextPhone, "reset_password", otp);
      setPhone(nextPhone);
      setVerifyToken(res.verify_token);
      setStep("password");
    } catch (err) {
      setApiError(getErrorMessage(err));
      throw err;
    }
  }

  async function handleOk(password: string) {
    setApiError(null);
    try {
      await resetPassword(phone, verifyToken, password);
      navigate("/login", {
        replace: true,
        state: { resetPhone: phone },
      });
    } catch (err) {
      setApiError(getErrorMessage(err));
      throw err;
    }
  }

  return (
    <AuthCard title={meta.title} subtitle={meta.subtitle}>
      <ApiErrorBanner message={apiError} />
      {step === "sms" ? (
        <SmsVerify
          phone={phone}
          onPhoneChange={setPhone}
          onSendCode={handleSendCode}
          onVerify={handleVerify}
          verifyLabel="下一步"
        />
      ) : (
        <PasswordSetting
          phone={phone}
          onOk={handleOk}
          submitLabel="完成重置"
        />
      )}
    </AuthCard>
  );
}
