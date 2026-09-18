"use strict";

const hq = window.hq;

const $ = (id) => document.getElementById(id);
const tabButtons = Array.from(document.querySelectorAll(".tab"));
const hqfileEl = $("hqfile");
const previewStatus = $("preview-status");

function switchTab(name) {
  tabButtons.forEach((b) => b.classList.toggle("active", b.dataset.tab === name));
  document.querySelectorAll(".panel").forEach((p) => {
    p.classList.toggle("active", p.id === "tab-" + name);
  });
}

tabButtons.forEach((b) => b.addEventListener("click", () => switchTab(b.dataset.tab)));

let hqfileText = "";

async function load() {
  const { ok, text } = await hq.load();
  if (ok) {
    hqfileText = text;
    hqfileEl.value = text;
  }
}

$("save").addEventListener("click", async () => {
  hqfileText = hqfileEl.value;
  await hq.save(hqfileText);
  flash($("save"), "Saved");
});

function flash(btn, text) {
  const old = btn.textContent;
  btn.textContent = text;
  setTimeout(() => (btn.textContent = old), 1200);
}

// ---------- Preview ----------

let previewRunning = false;

$("preview-start").addEventListener("click", async () => {
  await hq.save(hqfileEl.value);
  previewStatus.textContent = "starting...";
  previewStatus.className = "error";
  const { ok } = await hq.previewStart(hqfileEl.value);
  if (!ok) return;
  previewRunning = true;
  statusRunning();
  refreshRoutes();
});

$("preview-stop").addEventListener("click", async () => {
  await hq.previewStop();
  setPreviewStopped();
});

hq.onPreviewStopped(() => setPreviewStopped());
hq.onPreviewLog((line) => {
  const log = $("preview-log");
  log.textContent += line;
  log.scrollTop = log.scrollHeight;
});

function statusRunning() {
  previewStatus.textContent = "running on port 4099";
  previewStatus.className = "running";
}

function setPreviewStopped() {
  previewRunning = false;
  previewStatus.textContent = "stopped";
  previewStatus.className = "idle";
  $("routes-list").innerHTML = "";
}

async function refreshRoutes() {
  const res = await hq.listRoutes();
  if (!res.ok) return;
  let list = {};
  try {
    list = JSON.parse(res.body);
  } catch (err) {
    return;
  }
  $("routes-list").innerHTML = Object.entries(list)
    .map(([p, m]) => `<span class="route-chip">${m.join("|")} ${p}</span>`)
    .join("");
}

$("preview-call").addEventListener("click", async () => {
  let body;
  try {
    body = $("req-body").value.trim() ? JSON.parse($("req-body").value) : undefined;
  } catch (err) {
    $("preview-output").textContent = "Invalid JSON body";
    return;
  }
  const out = $("preview-output");
  out.textContent = "…";
  const res = await hq.previewCall({
    path: $("req-path").value || "/",
    method: $("req-method").value,
    body,
  });
  out.textContent = res.ok
    ? "HTTP " + res.status + "\n" + pretty(res.body)
    : "Error: " + res.error;
});

// ---------- Publish ----------

$("export").addEventListener("click", async () => {
  const dir = $("out-dir").value.trim();
  if (!dir) { $("deploy-log").textContent = "Set an output directory first."; return; }
  const log = $("deploy-log");
  log.textContent = "Exporting…";
  const res = await hq.exportServer({ text: hqfileEl.value, dir });
  log.textContent = res.ok
    ? "Exported to " + res.dir + "\n\nDeploy with netlify-cli:\ncd " + res.dir + "\nNETLIFY_AUTH_TOKEN=<token> netlify deploy --build --prod"
    : "Error: " + res.error;
});

$("deploy").addEventListener("click", async () => {
  const token = $("netlify-token").value.trim();
  const siteId = $("site-id").value.trim();
  const dir = $("out-dir").value.trim() || "";
  const log = $("deploy-log");
  log.textContent = "";
  if (!token) { log.textContent = "Enter a Netlify auth token first."; return; }
  const res = await hq.exportServer({ text: hqfileEl.value, dir });
  if (!res.ok) { log.textContent = "Export failed: " + res.error; return; }
  log.textContent += "Exported to " + res.dir + "\nDeploying…\n";
  await hq.deploy({ token, dir, siteId });
});

hq.onDeployLog((line) => {
  const log = $("deploy-log");
  log.textContent += line;
  log.scrollTop = log.scrollHeight;
});

hq.onDeployDone(({ code, message }) => {
  const log = $("deploy-log");
  log.textContent += "\n" + (code === 0 ? "✓ Deploy complete — site is live." : "✗ Deploy failed (code " + code + (message ? " — " + message : "") + ")");
});

// ---------- Monitor ----------

$("monitor-call").addEventListener("click", async () => {
  const url = $("monitor-url").value.trim();
  const path = $("monitor-path").value.trim() || "/";
  const out = $("monitor-output");
  if (!url) { out.textContent = "Enter the server URL."; return; }
  out.textContent = "…";
  const res = await hq.monitor({ url, path });
  out.textContent = res.ok
    ? "HTTP " + res.status + "\n" + pretty(res.body)
    : "Error: " + res.error;
});

function pretty(json) {
  try {
    return JSON.stringify(JSON.parse(json), null, 2);
  } catch (err) {
    return json;
  }
}

load();