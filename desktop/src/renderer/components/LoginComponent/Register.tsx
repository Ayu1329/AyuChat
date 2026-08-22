import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { register, sendSms, verifySms } from "@/ayuapi";
import { getErrorMessage } from "../../auth/errors";
import ApiErrorBanner from "./ApiErrorBanner";
import AuthCard from "./AuthCard";
import SmsVerify from "./components/SmsVerify";
import PasswordSetting from "./components/PasswordSetting";

type RegisterStep = "sms" | "password";

const STEP_META: Record<RegisterStep, { title: string; subtitle: string }> = {
  sms: {
    title: "注册",
    subtitle: "使用手机号创建 AyuChat 账号",
  },
  password: {
    title: "设置密码",
    subtitle: "设置登录密码以完成注册",
  },
};

/**
 * 注册流程：编排 step，短信 / 设密接口对接 connect 层。
 */
export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState<RegisterStep>("sms");
  const [phone, setPhone] = useState("");
  const [verifyToken, setVerifyToken] = useState("");
  const [apiError, setApiError] = useState<string | null>(null);

  const meta = STEP_META[step];

  async function handleSendCode(nextPhone: string) {
    setApiError(null);
    try {
      await sendSms(nextPhone, "register");
    } catch (err) {
      setApiError(getErrorMessage(err));
      throw err;
    }
  }

  async function handleVerify(nextPhone: string, otp: string) {
    setApiError(null);
    try {
      const res = await verifySms(nextPhone, "register", otp);
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
      await register(phone, verifyToken, password);
      navigate("/login", {
        replace: true,
        state: { registeredPhone: phone },
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
          verifyLabel="注册"
        />
      ) : (
        <PasswordSetting
          phone={phone}
          onOk={handleOk}
          submitLabel="设置密码"
        />
      )}
    </AuthCard>
  );
}
