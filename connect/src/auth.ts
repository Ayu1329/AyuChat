import { post } from "./client";
import { COUNTRY_CODE } from "./config";
import type {
  LoginRequest,
  LoginResponse,
  OkResponse,
  RefreshTokenRequest,
  RegisterRequest,
  RegisterResponse,
  ResetPasswordRequest,
  SmsScene,
  SmsSendResponse,
  SmsVerifyResponse,
} from "./types";

export function sendSms(phone: string, scene: SmsScene): Promise<SmsSendResponse> {
  return post<SmsSendResponse>("/auth/sms/send", {
    country_code: COUNTRY_CODE,
    phone,
    scene,
  });
}

export function verifySms(
  phone: string,
  scene: SmsScene,
  code: string,
): Promise<SmsVerifyResponse> {
  return post<SmsVerifyResponse>("/auth/sms/verify", {
    country_code: COUNTRY_CODE,
    phone,
    scene,
    code,
  });
}

export function register(
  phone: string,
  verifyToken: string,
  password: string,
): Promise<RegisterResponse> {
  const body: RegisterRequest = {
    country_code: COUNTRY_CODE,
    phone,
    verify_token: verifyToken,
    password,
  };
  return post<RegisterResponse>("/auth/register", body);
}

export function login(phone: string, password: string): Promise<LoginResponse> {
  const body: LoginRequest = {
    country_code: COUNTRY_CODE,
    phone,
    password,
  };
  return post<LoginResponse>("/auth/login", body);
}

export function resetPassword(
  phone: string,
  verifyToken: string,
  password: string,
): Promise<OkResponse> {
  const body: ResetPasswordRequest = {
    country_code: COUNTRY_CODE,
    phone,
    verify_token: verifyToken,
    password,
  };
  return post<OkResponse>("/auth/password/reset", body);
}

export function logout(accessToken: string): Promise<OkResponse> {
  return post<OkResponse>("/auth/logout", {}, accessToken);
}

export function refreshToken(refreshToken: string): Promise<LoginResponse> {
  const body: RefreshTokenRequest = { refresh_token: refreshToken };
  return post<LoginResponse>("/auth/token/refresh", body);
}
