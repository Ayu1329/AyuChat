import { Navigate, createHashRouter } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import Login from "./pages/Login";
import Chat from "./pages/Chat";

/**
 * Hash 路由表：仅登录页与会话页。
 */
export const router = createHashRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/login" replace /> },
      { path: "login", element: <Login /> },
      { path: "chat", element: <Chat /> },
    ],
  },
]);
