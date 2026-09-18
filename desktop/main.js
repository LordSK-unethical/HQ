const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");

function loadConfig() {
  const configPath = path.join(__dirname, "config.json");
  const file = JSON.parse(fs.readFileSync(configPath, "utf8"));
  return { serverUrl: process.env.HQ_SERVER_URL || file.serverUrl };
}

const config = loadConfig();

async function fetchTime() {
  const res = await fetch(`${config.serverUrl.replace(/\/$/, "")}/.netlify/functions/time`);
  if (!res.ok) {
    throw new Error(`Server responded ${res.status}`);
  }
  return res.json();
}

ipcMain.handle("get-time", async () => {
  try {
    return { ok: true, data: await fetchTime() };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

function createWindow() {
  const win = new BrowserWindow({
    width: 480,
    height: 520,
    title: "HQ Time Client",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.setMenuBarVisibility(false);
  win.loadFile(path.join(__dirname, "renderer", "index.html"));
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});