import { Outlet } from "react-router-dom";

/**
 * 根布局：仅提供全高路由出口，页面各自决定布局。
 */
export default function AppLayout() {
  return (
    <div className="h-full">
      <Outlet />
    </div>
  );
}
