import type { FriendRequest as ApiFriendRequest, UserSummary } from "@ayuchat/connect";

export type FriendRequest = ApiFriendRequest;
export type { UserSummary };

export function maskPhone(phone: string): string {
  if (phone.length !== 11) return phone;
  return `${phone.slice(0, 3)}****${phone.slice(7)}`;
}

export function formatAccount(user: UserSummary): string {
  return `${user.country_code} ${user.phone}`;
}

export function displayLabel(user: UserSummary): string {
  return user.display_name || maskPhone(user.phone);
}

export function avatarInitial(user: UserSummary): string {
  const label = user.display_name || user.phone;
  return label.slice(0, 1);
}

export function friendRequestPreview(message: string): string {
  const text = message.trim() || "请求添加你为好友";
  const truncated = text.length > 28 ? `${text.slice(0, 28)}…` : text;
  return `[好友申请] ${truncated}`;
}

export function formatSince(iso: string): string {
  return formatRequestTime(iso);
}

export function formatRequestTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (isToday) {
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  }

  return `${date.getMonth() + 1}月${date.getDate()}日`;
}
