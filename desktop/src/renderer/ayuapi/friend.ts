import { COUNTRY_CODE } from "@ayuchat/connect";
import { ayufetch } from "./ayufetch";
import type {
  AcceptFriendResponse,
  FriendListResponse,
  FriendRequestListResponse,
  SendFriendRequestResponse,
  UserSummary,
} from "@ayuchat/connect";

export const sendFriendRequest = (phone: string, message?: string) =>
  ayufetch<SendFriendRequestResponse>({
    name: "sendFriendRequest",
    path: "/friends/requests",
    body: {
      country_code: COUNTRY_CODE,
      phone,
      message: message ?? "",
    },
  });

export const listIncomingFriendRequests = () =>
  ayufetch<FriendRequestListResponse>({
    name: "listIncomingFriendRequests",
    path: "/friends/requests/incoming",
    method: "GET",
  });

export const acceptFriendRequest = (requestId: string) =>
  ayufetch<AcceptFriendResponse>({
    name: "acceptFriendRequest",
    path: `/friends/requests/${requestId}/accept`,
    body: {},
  });

export const rejectFriendRequest = (requestId: string) =>
  ayufetch<{ ok: boolean }>({
    name: "rejectFriendRequest",
    path: `/friends/requests/${requestId}/reject`,
    body: {},
  });

export const listFriends = () =>
  ayufetch<FriendListResponse>({
    name: "listFriends",
    path: "/friends",
    method: "GET",
  });

export const deleteFriend = (friendUserId: string) =>
  ayufetch<{ ok: boolean }>({
    name: "deleteFriend",
    path: `/friends/${friendUserId}`,
    method: "DELETE",
  });

export const lookupUser = (phone: string) =>
  ayufetch<UserSummary>({
    name: "lookupUser",
    path: `/users/lookup?country_code=${encodeURIComponent(COUNTRY_CODE)}&phone=${encodeURIComponent(phone)}`,
    method: "GET",
  });
