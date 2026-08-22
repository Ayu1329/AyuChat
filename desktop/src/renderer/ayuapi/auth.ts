import { COUNTRY_CODE } from "@ayuchat/connect";
import { ayufetch } from "./ayufetch";
import type {
  LoginResponse,
  OkResponse,
  RegisterResponse,
  SmsScene,
  SmsSendResponse,
  SmsVerifyResponse,
} from "./ayufetch";

export const sendSms = (phone: string, scene: SmsScene) =>
  ayufetch<SmsSendResponse>({
    name: "sendSms",
    path: "/auth/sms/send",
    body: {
      country_code: COUNTRY_CODE,
      phone,
      scene,
    },
  });

export const verifySms = (phone: string, scene: SmsScene, code: string) =>
  ayufetch<SmsVerifyResponse>({
    name: "verifySms",
    path: "/auth/sms/verify",
    body: {
      country_code: COUNTRY_CODE,
      phone,
      scene,
      code,
    },
  });

export const register = (
  phone: string,
  verifyToken: string,
  password: string,
) =>
  ayufetch<RegisterResponse>({
    name: "register",
    path: "/auth/register",
    body: {
      country_code: COUNTRY_CODE,
      phone,
      verify_token: verifyToken,
      password,
    },
  });

export const login = (phone: string, password: string) =>
  ayufetch<LoginResponse>({
    name: "login",
    path: "/auth/login",
    body: {
      country_code: COUNTRY_CODE,
      phone,
      password,
    },
  });

export const resetPassword = (
  phone: string,
  verifyToken: string,
  password: string,
) =>
  ayufetch<OkResponse>({
    name: "resetPassword",
    path: "/auth/password/reset",
    body: {
      country_code: COUNTRY_CODE,
      phone,
      verify_token: verifyToken,
      password,
    },
  });

export const logout = (accessToken: string) =>
  ayufetch<OkResponse>({
    name: "logout",
    path: "/auth/logout",
    body: {},
    token: accessToken,
  });

export const refreshToken = (refreshTokenValue: string) =>
  ayufetch<LoginResponse>({
    name: "refreshToken",
    path: "/auth/token/refresh",
    body: {
      refresh_token: refreshTokenValue,
    },
  });
