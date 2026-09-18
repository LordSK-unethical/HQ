"use strict";

const { app, BrowserWindow, ipcMain } = require("electron");
const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawn } = require("child_process");
const { HqServer } = require("../lib/index.js");

function expandHome(p) {
  if (typeof p === "string" && p.startsWith("~")) {
    return p.replace("~", os.homedir());
  }
  return p;
}

const WORK_DIR = path.join(__dirname, ".hq");
const HQFILE = path.join(WORK_DIR, "hqfile.js");
const PREVIEW_PORT = 4099;

let previewProcess = null;

function ensureWorkDir() {
  fs.mkdirSync(WORK_DIR, { recursive: true });
}

function loadConfigModule() {
  const resolved = require.resolve(HQFILE);
  delete require.cache[resolved];
  return require(HQFILE);
}

function readExample() {
  return fs.readFileSync(path.join(__dirname, "..", "lib", "hqfile.example.js"), "utf8");
}

function spawnNode(args, opts) {
  return spawn(process.execPath, args, {
    ...opts,
    env: { ...process.env, ELECTRON_RUN_AS_NODE: "1", ...(opts.env || {}) },
  });
}

ipcMain.handle("hq:load", () => {
  try {
    return { ok: true, text: fs.readFileSync(HQFILE, "utf8") };
  } catch (err) {
    return { ok: true, text: readExample() };
  }
});

ipcMain.handle("hq:save", (event, text) => {
  ensureWorkDir();
  fs.writeFileSync(HQFILE, text);
  return { ok: true };
});

ipcMain.handle("hq:preview:start", (event, text) => {
  ensureWorkDir();
  fs.writeFileSync(HQFILE, text);
  if (previewProcess) {
    previewProcess.kill();
    previewProcess = null;
  }
  const child = spawnNode(
    [path.join(__dirname, "preview-server.js"), String(PREVIEW_PORT), HQFILE],
    { cwd: __dirname }
  );
  child.stdout.on("data", (d) => event.sender.send("hq:preview:log", d.toString()));
  child.stderr.on("data", (d) => event.sender.send("hq:preview:log", d.toString()));
  child.on("exit", () => {
    previewProcess = null;
    event.sender.send("hq:preview:stopped");
  });
  previewProcess = child;
  return { ok: true, port: PREVIEW_PORT };
});

ipcMain.handle("hq:preview:stop", () => {
  if (previewProcess) {
    previewProcess.kill();
    previewProcess = null;
  }
  return { ok: true };
});

function httpCall(reqOpts, body) {
  return new Promise((resolve) => {
    const payload = body ? JSON.stringify(body) : undefined;
    const req = http.request(
      {
        host: "127.0.0.1",
        port: PREVIEW_PORT,
        path: reqOpts.path || "/",
        method: reqOpts.method || "GET",
        headers: payload ? { "content-type": "application/json" } : {},
        timeout: 10000,
      },
      (res) => {
        let buf = "";
        res.on("data", (c) => (buf += c));
        res.on("end", () =>
          resolve({ ok: true, status: res.statusCode, body: buf })
        );
      }
    );
    req.on("timeout", () => {
      req.destroy();
      resolve({ ok: false, error: "Preview server timed out" });
    });
    req.on("error", (err) => resolve({ ok: false, error: err.message }));
    if (payload) req.write(payload);
    req.end();
  });
}

ipcMain.handle("hq:preview:call", (event, req) => httpCall(req, req.body));

ipcMain.handle("hq:routes:list", () => httpCall({ path: "/_hq/routes" }));

ipcMain.handle("hq:export", (event, { text, dir }) => {
  ensureWorkDir();
  fs.writeFileSync(HQFILE, text);
  let out;
  try {
    out = new HqServer(loadConfigModule()).exportNetlify(expandHome(dir));
  } catch (err) {
    return { ok: false, error: err.message };
  }
  return { ok: true, dir: out };
});

ipcMain.handle("hq:deploy", (event, { token, dir, siteId }) => {
  if (!token) return { ok: false, error: "A Netlify auth token is required" };
  const run = require.resolve("netlify-cli/bin/run.js");
  const args = [run, "deploy", "--build", "--prod"];
  if (siteId) args.push("--site", siteId);
  const env = { NETLIFY_AUTH_TOKEN: token };
  const child = spawnNode(args, { cwd: dir, env });
  child.stdout.on("data", (d) => event.sender.send("hq:deploy:log", d.toString()));
  child.stderr.on("data", (d) => event.sender.send("hq:deploy:log", d.toString()));
  child.on("error", (err) => event.sender.send("hq:deploy:done", { code: "err", message: err.message }));
  child.on("exit", (code) => event.sender.send("hq:deploy:done", { code }));
  return { ok: true };
});

ipcMain.handle("hq:monitor", async (event, { url, path: p, method, body }) => {
  const base = url.replace(/\/+$/, "");
  const payload = body ? JSON.stringify(body) : undefined;
  try {
    const res = await fetch(base + p, {
      method: method || "GET",
      headers: payload ? { "content-type": "application/json" } : {},
      body: payload,
    });
    return { ok: true, status: res.status, body: await res.text() };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

function createWindow() {
  const win = new BrowserWindow({
    width: 980,
    height: 720,
    title: "HQ Factory",
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