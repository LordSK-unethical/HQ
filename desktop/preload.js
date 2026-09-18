const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("hq", {
  getTime: () => ipcRenderer.invoke("get-time"),
});