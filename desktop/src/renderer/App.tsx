import { RouterProvider } from "react-router-dom";
import { router } from "./router";

/**
 * 应用根组件，挂载 Hash 路由。
 * @returns 路由提供者
 */
export default function App() {
  return <RouterProvider router={router} />;
}
