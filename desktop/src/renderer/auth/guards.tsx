import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isLoggedIn } from "./session";

/**
 * 需登录：未登录则跳转登录页，并带上来源路径。
 */
export function RequireAuth() {
  const location = useLocation();
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}

/**
 * 仅访客：已登录则进聊天页。
 */
export function GuestOnly() {
  if (isLoggedIn()) {
    return <Navigate to="/chat" replace />;
  }
  return <Outlet />;
}
