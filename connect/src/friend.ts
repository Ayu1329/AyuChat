import { COUNTRY_CODE } from "./config";
import { del, get, post } from "./client";
import type {
  AcceptFriendResponse,
  FriendListResponse,
  FriendRequestListResponse,
  SendFriendRequestResponse,
  UserSummary,
} from "./types";

export function sendFriendRequest(
  phone: string,
  message?: string,
): Promise<SendFriendRequestResponse> {
  return post<SendFriendRequestResponse>("/friends/requests", {
    country_code: COUNTRY_CODE,
    phone,
    message: message ?? "",
  });
}

export function listIncomingFriendRequests(): Promise<FriendRequestListResponse> {
  return get<FriendRequestListResponse>("/friends/requests/incoming");
}

export function acceptFriendRequest(
  requestId: string,
): Promise<AcceptFriendResponse> {
  return post<AcceptFriendResponse>(
    `/friends/requests/${requestId}/accept`,
    {},
  );
}

export function rejectFriendRequest(requestId: string): Promise<{ ok: boolean }> {
  return post<{ ok: boolean }>(`/friends/requests/${requestId}/reject`, {});
}

export function listFriends(): Promise<FriendListResponse> {
  return get<FriendListResponse>("/friends");
}

export function deleteFriend(friendUserId: string): Promise<{ ok: boolean }> {
  return del<{ ok: boolean }>(`/friends/${friendUserId}`);
}

export function lookupUser(phone: string): Promise<UserSummary> {
  const params = new URLSearchParams({
    country_code: COUNTRY_CODE,
    phone,
  });
  return get<UserSummary>(`/users/lookup?${params.toString()}`);
}
