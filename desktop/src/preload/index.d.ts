export interface AyuChatApi {
  platform: string;
  versions: {
    electron: string;
    chrome: string;
    node: string;
  };
}

declare global {
  interface Window {
    ayuchat: AyuChatApi;
  }
}

export {};
