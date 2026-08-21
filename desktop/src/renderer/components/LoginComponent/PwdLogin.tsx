import { useNavigate } from "react-router-dom";

export default function PwdLogin() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        className="cursor-pointer rounded-lg bg-primary px-4 py-2.5 font-semibold text-white transition-colors hover:bg-primary-hover active:bg-primary-active"
        onClick={() => navigate("/chat")}
      >
        登录
      </button>
    </div>
  );
}
