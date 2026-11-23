import { createOffice2DScene } from "./office2d.js";
import {
  ROSTER,
  ROSTER_BY_ID,
  DEMO_STATE,
  loadBusConfig,
  saveBusConfig,
  clearBusConfig,
  verifyBusConnection,
  fetchBusState,
  sendChatMessage,
} from "./github-bus.js";

const STATUS_DOT = {
  working: "#22c55e",
  online: "#0ea5e9",
  idle: "#0ea5e9",
  standby: "#94a3b8",
  error: "#ef4444",
};

const els = {
  canvas: document.getElementById("office-canvas"),
  clockNow: document.getElementById("clock-now"),
  rosterPills: document.getElementById("roster-pills"),
  btnRefresh: document.getElementById("btn-refresh"),
  btnRefreshMob: document.getElementById("btn-refresh-mob"),
  btnConnect: document.getElementById("btn-connect"),
  btnConnectMob: document.getElementById("btn-connect-mob"),
  btnZoomIn: document.getElementById("btn-zoom-in"),
  btnZoomOut: document.getElementById("btn-zoom-out"),
  btnZoomFit: document.getElementById("btn-zoom-fit"),
  btnTogglePanel: document.getElementById("btn-toggle-panel"),
  btnCloseDrawer: document.getElementById("btn-close-drawer"),
  chatCountPill: document.getElementById("chat-count-pill"),
  panel: document.getElementById("hq-panel"),
  demoBanner: document.getElementById("demo-banner"),
  chatList: document.getElementById("chat-list"),
  crewList: document.getElementById("crew-list"),
  targetChips: document.getElementById("target-chips"),
  chkOrder: document.getElementById("chk-order"),
  cmdInput: document.getElementById("cmd-input"),
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
const seenChatIds = new Set();

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

function displayName(id) {
  if (id === "owner") return "OWNER";
  if (id === "all") return "ALL";
  const m = ROSTER_BY_ID[id];
  return m ? `Muse-${m.name}` : id;
}

function openDrawer(tabName = null) {
  els.panel.classList.remove("collapsed");
  els.panel.setAttribute("aria-hidden", "false");
  if (tabName) activateTab(tabName);
}

function closeDrawer() {
  els.panel.classList.add("collapsed");
  els.panel.setAttribute("aria-hidden", "true");
}

const office = createOffice2DScene({
  canvas: els.canvas,
  roster: ROSTER,
  onSelect: (id) => {
    selectedDesk = id;
    office.focusDesk(id);
    renderAll();
    openDrawer("inspector");
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

function senderColor(fromId) {
  if (fromId === "owner") return "#e11d48";
  return ROSTER_BY_ID[fromId]?.color || "#2563eb";
}

function updateClock() {
  els.clockNow.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
updateClock();
setInterval(updateClock, 15000);

function renderStatusBar() {
  const isLive = state.mode === "live";
  els.btnConnect.textContent = isLive ? "LIVE BUS" : "DEMO PREVIEW";
  els.btnConnect.className = `bar-btn bar-btn-mode ${isLive ? "live" : "demo"}`;
  els.btnConnectMob.textContent = isLive ? "LIVE" : "DEMO";
  els.btnConnectMob.className = `bar-btn bar-btn-mode ${isLive ? "live" : "demo"}`;
  els.demoBanner.classList.toggle("hidden", isLive);
  els.chatCountPill.textContent = String(state.chat?.length || 0);

  const active = ROSTER.filter((r) => r.role !== "STANDBY");
  const standby = ROSTER.filter((r) => r.role === "STANDBY");

  els.rosterPills.innerHTML =
    active
      .map((m) => {
        const st = state.heartbeats?.[m.id]?.status || "online";
        const col = STATUS_DOT[st] || "#0ea5e9";
        const sel = m.id === selectedDesk ? "selected" : "";
        return `<button type="button" class="roster-pill ${sel}" data-pick="${esc(m.id)}">
          <i class="dot" style="background:${col}"></i>
          <strong>${esc(displayName(m.id))}</strong> · ${esc(st)}
        </button>`;
      })
      .join("") +
    `<button type="button" class="roster-pill" data-pick="muse-6">
      <i class="dot" style="background:#94a3b8"></i> ${standby.length} standby
    </button>`;

  els.rosterPills.querySelectorAll("[data-pick]").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedDesk = btn.dataset.pick;
      office.focusDesk(selectedDesk);
      renderAll();
    });
  });
}

function renderCrew() {
  els.crewList.innerHTML = ROSTER.map((m) => {
    const hb = state.heartbeats?.[m.id] || {};
    const status = hb.status || (m.role === "STANDBY" ? "standby" : "online");
    const col = STATUS_DOT[status] || "#0ea5e9";
    const sel = m.id === selectedDesk ? "selected" : "";
    return `
      <div class="crew-card ${sel}" style="--crew-color:${m.color}" data-crew="${esc(m.id)}">
        <div class="crew-top">
          <div class="crew-title">
            <i class="dot" style="background:${col}"></i>
            <span>${esc(displayName(m.id))}${m.role === "COMMANDER" ? " ★" : ""}</span>
          </div>
          <span class="crew-meta">${esc(status.toUpperCase())} · ${esc(hb.balance || "$0.00")}</span>
        </div>
        <div class="crew-task">${esc(hb.task || m.subtitle)}</div>
        <div class="crew-actions">
          <span class="crew-meta">${esc(hb.updated_at ? shortTime(hb.updated_at) : "sync")}</span>
          <div>
            <button type="button" class="mini-btn" data-focus="${esc(m.id)}">Locate</button>
            <button type="button" class="mini-btn" data-chat="${esc(m.id)}">@Chat</button>
          </div>
        </div>
      </div>`;
  }).join("");

  els.crewList.querySelectorAll("[data-focus]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      selectedDesk = btn.dataset.focus;
      office.focusDesk(selectedDesk);
      renderAll();
    });
  });

  els.crewList.querySelectorAll("[data-chat]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      setTarget(btn.dataset.chat);
      activateTab("chat");
      els.cmdInput.focus();
    });
  });

  els.crewList.querySelectorAll("[data-crew]").forEach((card) => {
    card.addEventListener("click", () => {
      selectedDesk = card.dataset.crew;
      office.focusDesk(selectedDesk);
      renderAll();
      activateTab("inspector");
    });
  });
}

function renderChat() {
  const msgs = state.chat || [];
  if (msgs.length === 0) {
    els.chatList.innerHTML = `<div class="chat-msg"><div class="chat-text">Belum ada pesan di Office Chat. Kirim pesan pertama di bawah!</div></div>`;
    return;
  }
  els.chatList.innerHTML = msgs
    .map((m) => {
      const col = senderColor(m.from);
      return `
        <div class="chat-msg" style="--sender-color: ${col}">
          <div class="chat-msg-head">
            <span class="chat-sender">${esc(displayName(m.from))} → ${esc(displayName(m.to))}</span>
            <span class="chat-time">${esc(shortTime(m.created_at))}</span>
          </div>
          <div class="chat-text">${esc(m.text)}</div>
        </div>`;
    })
    .join("");
  els.chatList.scrollTop = els.chatList.scrollHeight;
}

function renderFeed() {
  const items = [];
  for (const o of state.orders || []) items.push({ kind: "order", ts: o.created_at || "", item: o });
  for (const a of state.acks || []) items.push({ kind: "ack", ts: a.updated_at || "", item: a });
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
              <span class="feed-tag order">ORDER → ${esc(displayName(o.target))}</span>
              <span>from ${esc(displayName(o.from || "muse-3"))} · ${esc(shortTime(o.created_at))}</span>
            </div>
            <div class="feed-body">${esc(o.message)}</div>
          </div>`;
      }
      const a = entry.item;
      return `
        <div class="feed-card">
          <div class="feed-meta">
            <span class="feed-tag ack">ACK ${esc(displayName(a.muse_id))} (${esc(a.status)})</span>
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
        <h2>${esc(displayName(meta.id))}</h2>
        <span class="np-role ${meta.role === "COMMANDER" ? "commander" : ""}">${esc(meta.role)}</span>
      </div>
      <p class="inspector-sub">${esc(meta.subtitle)} (${esc(meta.id)})</p>
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
    <button id="btn-inspect-cmd" type="button" class="btn btn-primary">Message ${esc(displayName(meta.id))} in Chat</button>
  `;

  document.getElementById("btn-inspect-cmd")?.addEventListener("click", () => {
    setTarget(meta.id);
    activateTab("chat");
    els.cmdInput.focus();
  });
}

function renderAll() {
  office.updateState(state);
  renderStatusBar();
  renderCrew();
  renderChat();
  renderFeed();
  renderInspector();
}

function setTarget(target) {
  selectedTarget = target;
  els.targetChips.querySelectorAll(".chip").forEach((c) => {
    c.classList.toggle("active", c.dataset.target === target);
  });
}

function animateNewChat(msgs) {
  for (const m of msgs || []) {
    if (!seenChatIds.has(m.id)) {
      seenChatIds.add(m.id);
      office.triggerPacket(m.from || "owner", m.to || "all", senderColor(m.from));
    }
  }
}

async function syncNow() {
  const cfg = loadBusConfig();
  if (!cfg.pat) {
    state = structuredClone(DEMO_STATE);
    animateNewChat(state.chat);
    renderAll();
    return;
  }
  els.btnRefresh.disabled = true;
  els.btnRefreshMob.disabled = true;
  els.btnRefresh.textContent = "↻ ...";
  els.btnRefreshMob.textContent = "↻ ...";
  try {
    state = await fetchBusState(cfg);
    animateNewChat(state.chat);
    renderAll();
  } catch (err) {
    els.cmdStatus.textContent = `Sync error: ${err.message}`;
  } finally {
    els.btnRefresh.disabled = false;
    els.btnRefreshMob.disabled = false;
    els.btnRefresh.textContent = "↻ Sync";
    els.btnRefreshMob.textContent = "↻ Sync";
  }
}

function startPolling() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(() => {
    if (loadBusConfig().pat) syncNow();
  }, 30000);
}

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

async function handleSend() {
  const text = els.cmdInput.value.trim();
  if (!text) {
    els.cmdStatus.textContent = "Isi pesan dulu.";
    return;
  }
  const alsoOrder = els.chkOrder.checked;
  const cfg = loadBusConfig();

  els.btnSend.disabled = true;
  els.btnSend.textContent = "...";
  try {
    if (!cfg.pat) {
      const msg = {
        id: `demo_${Date.now()}`,
        from: "owner",
        to: selectedTarget,
        text,
        created_at: new Date().toISOString(),
      };
      state.chat = [...(state.chat || []), msg];
      seenChatIds.add(msg.id);
      office.triggerPacket("owner", selectedTarget, "#e11d48");
      els.cmdInput.value = "";
      els.cmdStatus.textContent = `Demo → ${displayName(selectedTarget)}`;
      renderAll();
    } else {
      const msg = await sendChatMessage(cfg, { from: "owner", to: selectedTarget, text, alsoOrder });
      seenChatIds.add(msg.id);
      office.triggerPacket("owner", selectedTarget, "#e11d48");
      els.cmdInput.value = "";
      els.cmdStatus.textContent = `Sent → ${displayName(selectedTarget)}`;
      await syncNow();
    }
  } catch (err) {
    els.cmdStatus.textContent = `Error: ${err.message}`;
  } finally {
    els.btnSend.disabled = false;
    els.btnSend.textContent = "Send";
  }
}

els.btnSend.addEventListener("click", handleSend);
els.cmdInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
});

els.btnRefresh.addEventListener("click", syncNow);
els.btnRefreshMob.addEventListener("click", syncNow);
els.btnZoomIn.addEventListener("click", () => office.zoomBy(1.22));
els.btnZoomOut.addEventListener("click", () => office.zoomBy(0.82));
els.btnZoomFit.addEventListener("click", () => office.fitView());

els.btnTogglePanel.addEventListener("click", () => {
  if (els.panel.classList.contains("collapsed")) {
    openDrawer();
  } else {
    closeDrawer();
  }
});
els.btnCloseDrawer.addEventListener("click", closeDrawer);

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
els.btnConnectMob.addEventListener("click", openModal);
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
