import { Outlet } from "react-router-dom";

/**
 * 应用壳层：居中内容区与子路由出口。
 * @returns 页面布局
 */
export default function AppLayout() {
  return (
    <main className="grid min-h-full place-items-center p-8">
      <div className="w-full max-w-[560px] rounded-2xl border border-border bg-surface/90 p-9 backdrop-blur-md">
        <Outlet />
      </div>
    </main>
  );
}
