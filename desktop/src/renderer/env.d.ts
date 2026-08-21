/// <reference types="vite/client" />

interface AyuChatApi {
  platform: string;
  versions: {
    electron: string;
    chrome: string;
    node: string;
  };
}

interface Window {
  ayuchat: AyuChatApi;
}
