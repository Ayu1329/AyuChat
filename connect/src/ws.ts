import { wsUrl } from "./config";
import type { WsConnectionState, WsEnvelope, WsEventType } from "./types";

type WsEventHandler<T extends WsEventType = WsEventType> = (
  envelope: WsEnvelope<T>,
) => void;

const PING_INTERVAL_MS = 30_000;
const PONG_TIMEOUT_MS = 10_000;
const MAX_RECONNECT_DELAY_MS = 30_000;

let accessTokenProvider: (() => string | null) | null = null;

export function setWsAccessTokenProvider(provider: () => string | null): void {
  accessTokenProvider = provider;
}

class AyuWsClient {
  private socket: WebSocket | null = null;
  private state: WsConnectionState = "disconnected";
  private listeners = new Map<WsEventType | "*", Set<WsEventHandler>>();
  private stateListeners = new Set<(state: WsConnectionState) => void>();
  private intentionalClose = false;
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private pongTimer: ReturnType<typeof setTimeout> | null = null;

  connect(): void {
    const token = accessTokenProvider?.() ?? null;
    if (!token) {
      this.setState("disconnected");
      return;
    }

    this.intentionalClose = false;
    this.clearReconnectTimer();
    this.closeSocket();

    const url = `${wsUrl()}?token=${encodeURIComponent(token)}`;
    this.setState("connecting");

    const socket = new WebSocket(url);
    this.socket = socket;

    socket.onopen = () => {
      this.reconnectAttempt = 0;
      this.startHeartbeat();
    };

    socket.onmessage = (event) => {
      this.handleMessage(event.data);
    };

    socket.onclose = () => {
      this.cleanupSocket();
      if (!this.intentionalClose) {
        this.scheduleReconnect();
      } else {
        this.setState("disconnected");
      }
    };

    socket.onerror = () => {
      socket.close();
    };
  }

  disconnect(): void {
    this.intentionalClose = true;
    this.clearReconnectTimer();
    this.stopHeartbeat();
    this.closeSocket();
    this.setState("disconnected");
  }

  getState(): WsConnectionState {
    return this.state;
  }

  on<T extends WsEventType>(
    type: T | "*",
    handler: WsEventHandler<T>,
  ): () => void {
    const handlers = this.listeners.get(type) ?? new Set();
    handlers.add(handler as WsEventHandler);
    this.listeners.set(type, handlers);
    return () => {
      handlers.delete(handler as WsEventHandler);
    };
  }

  onStateChange(listener: (state: WsConnectionState) => void): () => void {
    this.stateListeners.add(listener);
    listener(this.state);
    return () => {
      this.stateListeners.delete(listener);
    };
  }

  private handleMessage(raw: string): void {
    let envelope: WsEnvelope;
    try {
      envelope = JSON.parse(raw) as WsEnvelope;
    } catch {
      return;
    }

    if (envelope.type === "auth.ok") {
      this.setState("connected");
    }

    if (envelope.type === "pong") {
      this.clearPongTimer();
      return;
    }

    const handlers = this.listeners.get(envelope.type);
    handlers?.forEach((handler) => handler(envelope));

    const wildcard = this.listeners.get("*");
    wildcard?.forEach((handler) => handler(envelope));
  }

  private setState(next: WsConnectionState): void {
    if (this.state === next) return;
    this.state = next;
    this.stateListeners.forEach((listener) => listener(next));
  }

  private scheduleReconnect(): void {
    this.setState("disconnected");
    const delay = Math.min(
      1000 * 2 ** this.reconnectAttempt,
      MAX_RECONNECT_DELAY_MS,
    );
    this.reconnectAttempt += 1;
    this.clearReconnectTimer();
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.pingTimer = setInterval(() => {
      if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
        return;
      }
      this.socket.send(JSON.stringify({ type: "ping" }));
      this.clearPongTimer();
      this.pongTimer = setTimeout(() => {
        this.socket?.close();
      }, PONG_TIMEOUT_MS);
    }, PING_INTERVAL_MS);
  }

  private stopHeartbeat(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
    this.clearPongTimer();
  }

  private clearPongTimer(): void {
    if (this.pongTimer) {
      clearTimeout(this.pongTimer);
      this.pongTimer = null;
    }
  }

  private cleanupSocket(): void {
    this.stopHeartbeat();
    this.socket = null;
  }

  private closeSocket(): void {
    if (!this.socket) return;
    const socket = this.socket;
    socket.onopen = null;
    socket.onmessage = null;
    socket.onclose = null;
    socket.onerror = null;
    if (
      socket.readyState === WebSocket.OPEN ||
      socket.readyState === WebSocket.CONNECTING
    ) {
      socket.close();
    }
    this.socket = null;
  }
}

export const wsClient = new AyuWsClient();

export function connectWs(): void {
  wsClient.connect();
}

export function disconnectWs(): void {
  wsClient.disconnect();
}

export function onWsEvent<T extends WsEventType>(
  type: T | "*",
  handler: WsEventHandler<T>,
): () => void {
  return wsClient.on(type, handler);
}

export function onWsStateChange(
  listener: (state: WsConnectionState) => void,
): () => void {
  return wsClient.onStateChange(listener);
}

export function getWsState(): WsConnectionState {
  return wsClient.getState();
}
