const refresh = document.getElementById("refresh");
const status = document.getElementById("status");

function setField(id, value) {
  document.getElementById(id).textContent = value;
}

async function load() {
  refresh.disabled = true;
  status.textContent = "Contacting Netlify server...";
  status.className = "";
  const { ok, data, error } = await window.hq.getTime();
  if (!ok) {
    status.textContent = "Error: " + error;
    status.className = "error";
    refresh.disabled = false;
    return;
  }
  setField("iso", data.iso);
  setField("unix", String(data.unix));
  setField("utc", data.utc);
  status.textContent = "Server time received.";
  status.className = "ok";
  refresh.disabled = false;
}

refresh.addEventListener("click", load);
load();