import { Link } from "react-router-dom";
import AuthCard from "./AuthCard";
import PwdLogin from "./PwdLogin";

/**
 * 登录组件：居中卡片表单；下方左注册、右忘记密码。
 */
export default function LoginComponent() {
  return (
    <AuthCard subtitle="欢迎使用 AyuChat">
      <PwdLogin />
      <div className="mt-4 flex items-center justify-between text-sm">
        <Link
          to="/register"
          className="font-medium text-muted hover:text-fg"
        >
          注册账号
        </Link>
        <Link
          to="/forget-password"
          className="font-medium text-muted hover:text-fg"
        >
          忘记密码
        </Link>
      </div>
    </AuthCard>
  );
}
