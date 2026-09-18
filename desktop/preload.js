"use strict";

const { contextBridge, ipcRenderer } = require("electron");

const on = (channel) => (callback) => {
  const listener = (_event, payload) => callback(payload);
  ipcRenderer.on(channel, listener);
  return () => ipcRenderer.removeListener(channel, listener);
};

contextBridge.exposeInMainWorld("hq", {
  load: () => ipcRenderer.invoke("hq:load"),
  save: (text) => ipcRenderer.invoke("hq:save", text),
  previewStart: (text) => ipcRenderer.invoke("hq:preview:start", text),
  previewStop: () => ipcRenderer.invoke("hq:preview:stop"),
  previewCall: (req) => ipcRenderer.invoke("hq:preview:call", req),
  listRoutes: () => ipcRenderer.invoke("hq:routes:list"),
  exportServer: (payload) => ipcRenderer.invoke("hq:export", payload),
  deploy: (payload) => ipcRenderer.invoke("hq:deploy", payload),
  monitor: (payload) => ipcRenderer.invoke("hq:monitor", payload),
  onPreviewLog: on("hq:preview:log"),
  onPreviewStopped: on("hq:preview:stopped"),
  onDeployLog: on("hq:deploy:log"),
  onDeployDone: on("hq:deploy:done"),
});