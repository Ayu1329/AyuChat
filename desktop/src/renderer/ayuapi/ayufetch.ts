import {
  ConnectError,
  apiUrl,
  post,
  type LoginResponse,
  type OkResponse,
  type RegisterResponse,
  type SmsScene,
  type SmsSendResponse,
  type SmsVerifyResponse,
} from "@ayuchat/connect";

export interface AyuFetchCall<TBody = unknown> {
  /** 控制台展示的方法名，如 sendSms */
  name: string;
  /** API 路径，如 /auth/sms/send */
  path: string;
  body?: TBody;
  token?: string | null;
}

function sanitizeForLog(value: unknown): unknown {
  if (value == null || typeof value !== "object") return value;

  if (Array.isArray(value)) {
    return value.map(sanitizeForLog);
  }

  const input = value as Record<string, unknown>;
  const output: Record<string, unknown> = {};

  for (const [key, raw] of Object.entries(input)) {
    if (key === "password") {
      output[key] = "******";
      continue;
    }
    if (key === "refresh_token" || key === "verify_token" || key === "access_token") {
      output[key] = maskToken(String(raw));
      continue;
    }
    output[key] = sanitizeForLog(raw);
  }

  return output;
}

function maskToken(token: string): string {
  if (token.length <= 8) return "******";
  return `${token.slice(0, 4)}…${token.slice(-4)}`;
}

/**
 * Desktop 统一请求入口：封装 connect 层 POST，并在控制台打印入参与返回值。
 */
export async function ayufetch<TResponse, TBody = unknown>(
  call: AyuFetchCall<TBody>,
): Promise<TResponse> {
  const { name, path, body, token } = call;
  const url = apiUrl(path);
  const startedAt = performance.now();
  const params = body === undefined ? null : sanitizeForLog(body);

  console.groupCollapsed(`[AyuFetch] ${name} POST ${path}`);
  console.log("URL", url);
  console.log("Params", params);
  if (token) {
    console.log("Authorization", `Bearer ${maskToken(token)}`);
  }

  try {
    const response = await post<TResponse>(
      path,
      body === undefined ? {} : body,
      token,
    );
    console.log("Response", sanitizeForLog(response));
    console.log("Duration", `${Math.round(performance.now() - startedAt)}ms`);
    console.groupEnd();
    return response;
  } catch (error) {
    if (error instanceof ConnectError) {
      console.error("Error", {
        code: error.code,
        message: error.message,
        status: error.status,
      });
    } else {
      console.error("Error", error);
    }
    console.log("Duration", `${Math.round(performance.now() - startedAt)}ms`);
    console.groupEnd();
    throw error;
  }
}

export type {
  LoginResponse,
  OkResponse,
  RegisterResponse,
  SmsScene,
  SmsSendResponse,
  SmsVerifyResponse,
};
