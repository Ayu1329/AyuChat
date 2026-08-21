import PwdLogin from "./PwdLogin";

/**
 * 登录组件：点击登录进入会话页。
 * @returns 登录页内容
 */
export default function LoginComponent() {
  return (
    <div className="w-full">
      <p className="mb-3 text-[28px] font-bold tracking-tight text-primary">
        AyuChat
      </p>
      <p className="mb-6 leading-relaxed text-muted">欢迎使用 AyuChat</p>
      <PwdLogin />
    </div>
  );
}
