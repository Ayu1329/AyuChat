import { contextBridge } from "electron";

contextBridge.exposeInMainWorld("ayuchat", {
  platform: process.platform,
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
  },
});
