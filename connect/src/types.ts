export type SmsScene = "register" | "reset_password";

export interface User {
  id: string;
  phone: string;
  country_code: string;
}

export interface SmsSendRequest {
  country_code: string;
  phone: string;
  scene: SmsScene;
}

export interface SmsSendResponse {
  ok: boolean;
  retry_after: number;
}

export interface SmsVerifyRequest {
  country_code: string;
  phone: string;
  scene: SmsScene;
  code: string;
}

export interface SmsVerifyResponse {
  verify_token: string;
  expires_in: number;
}

export interface RegisterRequest {
  country_code: string;
  phone: string;
  verify_token: string;
  password: string;
}

export interface RegisterResponse {
  user: User;
}

export interface LoginRequest {
  country_code: string;
  phone: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  user: User;
}

export interface ResetPasswordRequest {
  country_code: string;
  phone: string;
  verify_token: string;
  password: string;
}

export interface OkResponse {
  ok: boolean;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}
