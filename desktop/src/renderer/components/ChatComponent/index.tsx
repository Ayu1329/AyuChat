import { useState } from "react";
import SettingsPanel from "./SettingsPanel";
import { useNavigate } from "react-router-dom";

/**
 * 会话组件：主聊天区，设置等为页内组件。
 * @returns 会话页内容
 */
export default function ChatComponent() {
  const [showSettings, setShowSettings] = useState(false);
  const navigate = useNavigate();
  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between gap-4">
        <h1 className="m-0 text-2xl font-semibold tracking-tight">会话</h1>
        <button
          type="button"
          className="cursor-pointer rounded-lg border border-border bg-transparent px-3 py-1.5 text-[13px] text-muted hover:bg-border/50 hover:text-fg"
          onClick={() => setShowSettings((open) => !open)}
        >
          {showSettings ? "返回会话" : "设置"}
        </button>
        <button
          type="button"
          className="cursor-pointer rounded-lg border border-border bg-transparent px-3 py-1.5 text-[13px] text-muted hover:bg-border/50 hover:text-fg"
          onClick={() => navigate("/login")}
        >
          退出登录
        </button>
      </div>
      {showSettings ? (
        <SettingsPanel />
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          <p className="mb-1 leading-relaxed text-muted">
            聊天界面占位，后续接入消息与连接层。
          </p>
          <div className="max-w-[80%] self-start rounded-2xl rounded-tl-md bg-bubble-other px-3.5 py-2.5 text-sm text-fg">
            你好，这是对方消息气泡。
          </div>
          <div className="max-w-[80%] self-end rounded-2xl rounded-tr-md bg-bubble-self px-3.5 py-2.5 text-sm text-white">
            这是己方消息，主色 #2F5D66。
          </div>
        </div>
      )}
    </div>
  );
}
