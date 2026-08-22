import {

  ConnectError,

  apiUrl,

  del,

  get,

  patch,

  post,

  type LoginResponse,

  type OkResponse,

  type RegisterResponse,

  type SmsScene,

  type SmsSendResponse,

  type SmsVerifyResponse,

} from "@ayuchat/connect";

import { getSession } from "../auth/session";



export interface AyuFetchCall<TBody = unknown> {

  name: string;

  path: string;

  method?: "GET" | "POST" | "PATCH" | "DELETE";

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



function resolveToken(path: string, explicit?: string | null): string | null {

  if (explicit != null) return explicit;

  if (path.startsWith("/auth/")) return null;

  return getSession()?.accessToken ?? null;

}



export async function ayufetch<TResponse, TBody = unknown>(

  call: AyuFetchCall<TBody>,

): Promise<TResponse> {

  const { name, path, method = "POST", body, token: explicitToken } = call;

  const token = resolveToken(path, explicitToken);

  const url = apiUrl(path);

  const startedAt = performance.now();

  const params = body === undefined ? null : sanitizeForLog(body);



  console.groupCollapsed(`[AyuFetch] ${name} ${method} ${path}`);

  console.log("URL", url);

  console.log("Params", params);

  if (token) {

    console.log("Authorization", `Bearer ${maskToken(token)}`);

  } else if (!path.startsWith("/auth/")) {

    console.warn("Authorization", "missing — 未登录或 session 无效");

  }



  try {

    const response =
      method === "GET"
        ? await get<TResponse>(path, token)
        : method === "DELETE"
          ? await del<TResponse>(path, token)
          : method === "PATCH"
            ? await patch<TResponse>(
                path,
                body === undefined ? {} : body,
                token,
              )
            : await post<TResponse>(
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


