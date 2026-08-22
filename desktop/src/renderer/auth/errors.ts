import { ConnectError } from "@ayuchat/connect";

export function getErrorMessage(err: unknown): string {
  if (err instanceof ConnectError) return err.message;
  if (err instanceof Error) return err.message;
  return "操作失败，请稍后重试";
}
