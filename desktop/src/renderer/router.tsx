import { Navigate, createHashRouter } from "react-router-dom";
import { GuestOnly, RequireAuth } from "./auth/guards";
import AppLayout from "./layouts/AppLayout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgetPassword from "./pages/ForgetPassword";
import Chat from "./pages/Chat";

/**
 * Hash 路由表：登录 / 注册 / 忘记密码（访客）与会话页（需登录）。
 */
export const router = createHashRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/chat" replace /> },
      {
        element: <GuestOnly />,
        children: [
          { path: "login", element: <Login /> },
          { path: "register", element: <Register /> },
          { path: "forget-password", element: <ForgetPassword /> },
        ],
      },
      {
        element: <RequireAuth />,
        children: [{ path: "chat", element: <Chat /> }],
      },
    ],
  },
]);
