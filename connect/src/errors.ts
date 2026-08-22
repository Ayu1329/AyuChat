export type AuthErrorCode =
  | "INVALID_PHONE"
  | "INVALID_SCENE"
  | "INVALID_CODE"
  | "INVALID_PASSWORD"
  | "INVALID_VERIFY_TOKEN"
  | "INVALID_CREDENTIALS"
  | "PHONE_ALREADY_REGISTERED"
  | "PHONE_NOT_FOUND"
  | "SMS_RATE_LIMIT"
  | "VERIFY_RATE_LIMIT"
  | "ACCOUNT_DISABLED"
  | "UNAUTHORIZED"
  | "USER_NOT_FOUND"
  | "CANNOT_ADD_SELF"
  | "ALREADY_FRIENDS"
  | "FRIEND_REQUEST_PENDING"
  | "FRIEND_REQUEST_NOT_FOUND"
  | "FORBIDDEN"
  | "INVALID_MESSAGE"
  | "NETWORK_ERROR"
  | "UNKNOWN";

export class ConnectError extends Error {
  readonly code: AuthErrorCode;
  readonly status: number;

  constructor(code: AuthErrorCode, message: string, status = 0) {
    super(message);
    this.name = "ConnectError";
    this.code = code;
    this.status = status;
  }
}

interface ApiErrorBody {
  error?: {
    code?: string;
    message?: string;
  };
}

export function parseApiError(
  status: number,
  body: unknown,
  fallbackMessage: string,
): ConnectError {
  const payload = body as ApiErrorBody;
  const code = (payload?.error?.code ?? "UNKNOWN") as AuthErrorCode;
  const message = payload?.error?.message ?? fallbackMessage;
  return new ConnectError(code, message, status);
}
