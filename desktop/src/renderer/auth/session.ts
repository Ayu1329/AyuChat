import {
  setAccessTokenProvider,
  setWsAccessTokenProvider,
  type LoginResponse,
  type User,
} from "@ayuchat/connect";
import { refreshToken as apiRefreshToken } from "@/ayuapi";

const SESSION_KEY = "ayuchat.session";

export interface Session {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: User;
}

setAccessTokenProvider(() => getSession()?.accessToken ?? null);
setWsAccessTokenProvider(() => getSession()?.accessToken ?? null);

export function getSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Session;
    if (!parsed?.accessToken || !parsed?.user?.phone) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function setSession(session: Session) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function setSessionFromLogin(res: LoginResponse) {
  setSession({
    accessToken: res.access_token,
    refreshToken: res.refresh_token,
    expiresAt: Date.now() + res.expires_in * 1000,
    user: res.user,
  });
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

export function updateSessionUser(user: User) {
  const current = getSession();
  if (!current) return;
  setSession({ ...current, user });
}

export function isLoggedIn() {
  return getSession() != null;
}

export function getAccount(): string {
  return getSession()?.user.phone ?? "";
}

export async function tryRefreshSession(): Promise<Session | null> {
  const current = getSession();
  if (!current?.refreshToken) return null;

  try {
    const res = await apiRefreshToken(current.refreshToken);
    setSessionFromLogin(res);
    return getSession();
  } catch {
    clearSession();
    return null;
  }
}
