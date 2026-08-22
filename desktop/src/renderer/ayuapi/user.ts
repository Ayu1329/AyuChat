import { ayufetch } from "./ayufetch";
import type { UpdateProfileRequest, User } from "@ayuchat/connect";

export const getProfile = () =>
  ayufetch<User>({
    name: "getProfile",
    path: "/users/me",
    method: "GET",
  });

export const updateProfile = (body: UpdateProfileRequest) =>
  ayufetch<User>({
    name: "updateProfile",
    path: "/users/me",
    method: "PATCH",
    body,
  });
