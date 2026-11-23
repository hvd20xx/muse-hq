import { createOfficeScene } from "./office3d.js";
import {
  ROSTER,
  ROSTER_BY_ID,
  DEMO_STATE,
  loadBusConfig,
  saveBusConfig,
  clearBusConfig,
  verifyBusConnection,
  fetchBusState,
  dispatchOrder,
} from "./github-bus.js";

const els = {
  canvas: document.getElementById("office-canvas"),
  nameplateLayer: document.getElementById("nameplates-layer"),
  modeBadge: document.getElementById("mode-badge"),
  metricActive: document.getElementById("metric-active"),
  metricOrders: document.getElementById("metric-orders"),
  metricAcks: document.getElementById("metric-acks"),
  metricSync: document.getElementById("metric-sync"),
  btnRefresh: document.getElementById("btn-refresh"),
  btnResetCam: document.getElementById("btn-reset-cam"),
  btnTogglePanel: document.getElementById("btn-toggle-panel"),
  btnConnect: document.getElementById("btn-connect"),
  panel: document.getElementById("hq-panel"),
  demoBanner: document.getElementById("demo-banner"),
  targetChips: document.getElementById("target-chips"),
  cmdInput: document.getElementById("cmd-input"),
  cmdPriority: document.getElementById("cmd-priority"),
  cmdStatus: document.getElementById("cmd-status"),
  btnSend: document.getElementById("btn-send"),
  feedList: document.getElementById("feed-list"),
  inspectorCard: document.getElementById("inspector-card"),
  modal: document.getElementById("connect-modal"),
  btnCloseModal: document.getElementById("btn-close-modal"),
  repoInput: document.getElementById("repo-input"),
  patInput: document.getElementById("pat-input"),
  modalError: document.getElementById("modal-error"),
  btnDisconnect: document.getElementById("btn-disconnect"),
  btnSaveBus: document.getElementById("btn-save-bus"),
};

let state = structuredClone(DEMO_STATE);
let selectedDesk = "muse-3";
let selectedTarget = "all";
let feedFilter = "all";
let pollTimer = null;

function esc(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function shortTime(iso) {
  if (!iso) return "--:--";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(11, 16) || "--:--";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const office = createOfficeScene({
  canvas: els.canvas,
  nameplateLayer: els.nameplateLayer,
  roster: ROSTER,
  onSelect: (id) => {
    selectedDesk = id;
    renderInspector();
    activateTab("inspector");
  },
});

function activateTab(tabName) {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    const active = btn.dataset.tab === tabName;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-selected", String(active));
  });
  document.querySelectorAll(".tab-pane").forEach((pane) => {
    pane.classList.toggle("active", pane.id === `tab-${tabName}`);
  });
}

function renderMetrics() {
  const isLive = state.mode === "live";
  els.modeBadge.textContent = isLive ? "LIVE BUS" : "DEMO PREVIEW";
  els.modeBadge.className = `badge ${isLive ? "badge-live" : "badge-demo"}`;
  els.demoBanner.classList.toggle("hidden", isLive);
  els.btnConnect.textContent = isLive ? "Bus Settings" : "Connect Private Bus";

  const activeCount = ROSTER.filter((r) => {
    const s = state.heartbeats?.[r.id]?.status || (r.role === "STANDBY" ? "standby" : "online");
    return s !== "standby";
  }).length;
  els.metricActive.textContent = `${activeCount}/${ROSTER.length}`;
  els.metricOrders.textContent = String(state.orders?.length || 0);
  els.metricAcks.textContent = String(state.acks?.length || 0);
  els.metricSync.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function renderFeed() {
  const items = [];
  for (const o of state.orders || []) {
    items.push({ kind: "order", ts: o.created_at || "", item: o });
  }
  for (const a of state.acks || []) {
    items.push({ kind: "ack", ts: a.updated_at || "", item: a });
  }
  items.sort((a, b) => b.ts.localeCompare(a.ts));

  const visible = items.filter((x) => feedFilter === "all" || x.kind === feedFilter);
  if (visible.length === 0) {
    els.feedList.innerHTML = `<div class="feed-card"><div class="feed-body">Belum ada event order/ack.</div></div>`;
    return;
  }

  els.feedList.innerHTML = visible
    .slice(0, 30)
    .map((entry) => {
      if (entry.kind === "order") {
        const o = entry.item;
        return `
          <div class="feed-card">
            <div class="feed-meta">
              <span class="feed-tag order">ORDER → ${esc(o.target)}</span>
              <span>from ${esc(o.from || "muse-3")} · ${esc(shortTime(o.created_at))}</span>
            </div>
            <div class="feed-body">${esc(o.message)}</div>
          </div>`;
      }
      const a = entry.item;
      return `
        <div class="feed-card">
          <div class="feed-meta">
            <span class="feed-tag ack">ACK ${esc(a.muse_id)} (${esc(a.status)})</span>
            <span>${esc(shortTime(a.updated_at))}</span>
          </div>
          <div class="feed-body">${esc(a.summary)}</div>
        </div>`;
    })
    .join("");
}

function renderInspector() {
  const meta = ROSTER_BY_ID[selectedDesk] || ROSTER[0];
  const hb = state.heartbeats?.[meta.id] || {};
  const status = hb.status || (meta.role === "STANDBY" ? "standby" : "online");
  els.inspectorCard.innerHTML = `
    <div class="inspector-head">
      <div class="inspector-title">
        <h2>${esc(meta.id)} · ${esc(meta.name)}</h2>
        <span class="np-role ${meta.role === "COMMANDER" ? "commander" : ""}">${esc(meta.role)}</span>
      </div>
      <p class="inspector-sub">${esc(meta.subtitle)}</p>
    </div>
    <div class="kv-list">
      <div class="kv-row">
        <div class="kv-k">Status</div>
        <div class="kv-v">${esc(status.toUpperCase())}</div>
      </div>
      <div class="kv-row">
        <div class="kv-k">Current Task</div>
        <div class="kv-v">${esc(hb.task || meta.subtitle)}</div>
      </div>
      <div class="kv-row">
        <div class="kv-k">make.fun Balance</div>
        <div class="kv-v">${esc(hb.balance || "$0.00")}</div>
      </div>
      <div class="kv-row">
        <div class="kv-k">Note</div>
        <div class="kv-v">${esc(hb.note || "-")}</div>
      </div>
      <div class="kv-row">
        <div class="kv-k">Last Heartbeat</div>
        <div class="kv-v">${esc(hb.updated_at || "Demo snapshot")}</div>
      </div>
    </div>
    <button id="btn-inspect-cmd" type="button" class="btn btn-primary">Send Direct Command to ${esc(meta.id)}</button>
  `;

  document.getElementById("btn-inspect-cmd")?.addEventListener("click", () => {
    setTarget(meta.id);
    activateTab("command");
    els.cmdInput.focus();
  });
}

function renderAll() {
  office.updateStationVisuals(state.heartbeats);
  renderMetrics();
  renderFeed();
  renderInspector();
}

function setTarget(target) {
  selectedTarget = target;
  els.targetChips.querySelectorAll(".chip").forEach((c) => {
    c.classList.toggle("active", c.dataset.target === target);
  });
}

async function syncNow() {
  const cfg = loadBusConfig();
  if (!cfg.pat) {
    state = structuredClone(DEMO_STATE);
    renderAll();
    return;
  }
  els.btnRefresh.disabled = true;
  els.btnRefresh.textContent = "Syncing...";
  try {
    state = await fetchBusState(cfg);
    renderAll();
  } catch (err) {
    els.cmdStatus.textContent = `Sync error: ${err.message}`;
  } finally {
    els.btnRefresh.disabled = false;
    els.btnRefresh.textContent = "Sync";
  }
}

function startPolling() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(() => {
    if (loadBusConfig().pat) syncNow();
  }, 30000);
}

// Event bindings
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => activateTab(btn.dataset.tab));
});

els.targetChips.querySelectorAll(".chip").forEach((chip) => {
  chip.addEventListener("click", () => setTarget(chip.dataset.target));
});

document.querySelectorAll(".preset-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    els.cmdInput.value = btn.dataset.msg || "";
    els.cmdInput.focus();
  });
});

document.querySelectorAll("[data-feed]").forEach((btn) => {
  btn.addEventListener("click", () => {
    feedFilter = btn.dataset.feed;
    document.querySelectorAll("[data-feed]").forEach((b) => b.classList.toggle("active", b === btn));
    renderFeed();
  });
});

els.btnSend.addEventListener("click", async () => {
  const message = els.cmdInput.value.trim();
  if (!message) {
    els.cmdStatus.textContent = "Isi pesan perintah dulu.";
    return;
  }
  const priority = els.cmdPriority.checked ? "high" : "normal";
  const cfg = loadBusConfig();

  els.btnSend.disabled = true;
  els.btnSend.textContent = "Sending...";
  try {
    if (!cfg.pat) {
      const demoOrder = {
        id: `demo_${Date.now()}`,
        target: selectedTarget,
        from: "muse-3",
        priority,
        message,
        created_at: new Date().toISOString(),
      };
      state.orders = [demoOrder, ...(state.orders || [])];
      office.triggerPacket(selectedTarget, priority === "high" ? "#fb7185" : "#fbbf24");
      els.cmdInput.value = "";
      els.cmdStatus.textContent = `Demo order → ${selectedTarget}`;
      renderAll();
    } else {
      const order = await dispatchOrder(cfg, { target: selectedTarget, message, priority });
      office.triggerPacket(selectedTarget, priority === "high" ? "#fb7185" : "#34d399");
      els.cmdInput.value = "";
      els.cmdStatus.textContent = `Dispatched ${order.id} → ${selectedTarget}`;
      await syncNow();
    }
  } catch (err) {
    els.cmdStatus.textContent = `Error: ${err.message}`;
  } finally {
    els.btnSend.disabled = false;
    els.btnSend.textContent = "Dispatch Order";
  }
});

els.btnRefresh.addEventListener("click", syncNow);
els.btnResetCam.addEventListener("click", () => office.resetCamera());
els.btnTogglePanel.addEventListener("click", () => {
  els.panel.classList.toggle("collapsed");
  setTimeout(() => office.resize(), 240);
});

function openModal() {
  const cfg = loadBusConfig();
  els.repoInput.value = cfg.repo;
  els.patInput.value = cfg.pat;
  els.modalError.classList.add("hidden");
  els.modal.classList.remove("hidden");
}

function closeModal() {
  els.modal.classList.add("hidden");
}

els.btnConnect.addEventListener("click", openModal);
els.btnCloseModal.addEventListener("click", closeModal);
els.modal.querySelector(".modal-backdrop").addEventListener("click", closeModal);
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !els.modal.classList.contains("hidden")) closeModal();
});

els.btnDisconnect.addEventListener("click", () => {
  clearBusConfig();
  closeModal();
  syncNow();
});

els.btnSaveBus.addEventListener("click", async () => {
  const repo = els.repoInput.value.trim();
  const pat = els.patInput.value.trim();
  if (!repo || !pat) {
    els.modalError.textContent = "Repo dan PAT harus diisi.";
    els.modalError.classList.remove("hidden");
    return;
  }
  els.btnSaveBus.disabled = true;
  els.btnSaveBus.textContent = "Verifying...";
  try {
    await verifyBusConnection({ repo, pat });
    saveBusConfig(repo, pat);
    closeModal();
    await syncNow();
    office.triggerPacket("all", "#34d399");
  } catch (err) {
    els.modalError.textContent = err.message;
    els.modalError.classList.remove("hidden");
  } finally {
    els.btnSaveBus.disabled = false;
    els.btnSaveBus.textContent = "Verify & Connect";
  }
});

renderAll();
syncNow();
startPolling();
