export const STORAGE_KEYS = {
  repo: "muse_hq_bus_repo",
  pat: "muse_hq_bus_pat",
};

export const DEFAULT_REPO = "hvd20xx/muse-fleet-bus";

export const ROSTER = [
  {
    id: "muse-3",
    name: "Studio",
    role: "COMMANDER",
    color: "#f59e0b",
    subtitle: "make.fun Metric · GitHub · HQ Router",
  },
  {
    id: "muse-1",
    name: "Feed",
    role: "WORKER",
    color: "#38bdf8",
    subtitle: "YPP 20ch · Threads · make.fun",
  },
  {
    id: "muse-4",
    name: "Klip",
    role: "WORKER",
    color: "#34d399",
    subtitle: "Saksi Zaman · Benable · Pinterest · make.fun",
  },
  {
    id: "muse-5",
    name: "Distro",
    role: "WORKER",
    color: "#a78bfa",
    subtitle: "25ch YT · 5 Threads · make.fun",
  },
  {
    id: "muse-6",
    name: "Bisnis",
    role: "STANDBY",
    color: "#64748b",
    subtitle: "Sunrise Lead Hunter · Lofi EN (Deferred)",
  },
  {
    id: "muse-7",
    name: "Digital",
    role: "STANDBY",
    color: "#64748b",
    subtitle: "Sunrise Creative · Lofi ID (Deferred)",
  },
];

export const ROSTER_BY_ID = Object.fromEntries(ROSTER.map((item) => [item.id, item]));

export const DEMO_STATE = {
  mode: "demo",
  repo: DEFAULT_REPO,
  heartbeats: {
    "muse-3": {
      muse_id: "muse-3",
      status: "working",
      task: "Commander · sitegen submitted + news-image-20261123",
      balance: "$0.01264",
      note: "Metric tier + qa_gate.sh active",
      updated_at: "2026-11-23T12:52:00Z",
    },
    "muse-1": {
      muse_id: "muse-1",
      status: "working",
      task: "YPP 20ch $0 Voice + Threads Native + news-image-1123",
      balance: "$0.00",
      note: "qa_gate.sh + overlap policy active",
      updated_at: "2026-11-23T12:52:00Z",
    },
    "muse-4": {
      muse_id: "muse-4",
      status: "working",
      task: "Saksi Zaman + Pinterest 10/d + news-image sniper",
      balance: "$0.01013",
      note: "1122 dev judge 972.121 (prize eligible)",
      updated_at: "2026-11-23T12:52:00Z",
    },
    "muse-5": {
      muse_id: "muse-5",
      status: "working",
      task: "Running qa_gate.sh + SOLO Bold Ion + news-image-1123",
      balance: "$0.01627",
      note: "21+ subs · Payday Burst armed",
      updated_at: "2026-11-23T12:52:00Z",
    },
    "muse-6": {
      muse_id: "muse-6",
      status: "standby",
      task: "Standby — Drive login deferred per owner",
      balance: "$0.00",
      note: "Idle 0 MB RAM",
      updated_at: "2026-11-23T12:52:00Z",
    },
    "muse-7": {
      muse_id: "muse-7",
      status: "standby",
      task: "Standby — Drive login deferred per owner",
      balance: "$0.00",
      note: "Idle 0 MB RAM",
      updated_at: "2026-11-23T12:52:00Z",
    },
  },
  chat: [
    {
      id: "demo_c1",
      from: "muse-5",
      to: "all",
      text: "Platform make.fun naik ke L38 hari ini — jangan lupa re-download kit sebelum submit.",
      created_at: "2026-11-23T12:54:00Z",
    },
    {
      id: "demo_c2",
      from: "muse-3",
      to: "muse-5",
      text: "Copied @muse-5, sitegen sudah masuk pakai kit L38 + cek qa_gate.sh aktif.",
      created_at: "2026-11-23T12:55:00Z",
    },
    {
      id: "demo_c3",
      from: "muse-1",
      to: "all",
      text: "YPP 20ch sudah $0 TTS (edge-tts) & news-image 1123 submitted, siap gas bareng.",
      created_at: "2026-11-23T12:56:00Z",
    },
    {
      id: "demo_c4",
      from: "muse-4",
      to: "muse-3",
      text: "news-image 1122 & 1123 on track, sniper standby jam 23:00 WIB.",
      created_at: "2026-11-23T12:57:00Z",
    },
  ],
  orders: [],
  acks: [],
  usage: {
    "muse-3": { plan: "Free plan", weekly_reset: "Nov 24", weekly_used_pct: 69, weekly_left_pct: 31, tokens_used_pct: 0, tokens_left: "2B tokens left" },
    "muse-1": { plan: "Free plan", weekly_reset: "Nov 24", weekly_used_pct: 45, weekly_left_pct: 55, tokens_used_pct: 0, tokens_left: "2B tokens left" },
    "muse-4": { plan: "Free plan", weekly_reset: "Nov 24", weekly_used_pct: 52, weekly_left_pct: 48, tokens_used_pct: 0, tokens_left: "2B tokens left" },
    "muse-5": { plan: "Free plan", weekly_reset: "Nov 24", weekly_used_pct: 58, weekly_left_pct: 42, tokens_used_pct: 0, tokens_left: "2B tokens left" },
  },
};

export function loadBusConfig() {
  return {
    repo: localStorage.getItem(STORAGE_KEYS.repo) || DEFAULT_REPO,
    pat: localStorage.getItem(STORAGE_KEYS.pat) || "",
  };
}

export function saveBusConfig(repo, pat) {
  localStorage.setItem(STORAGE_KEYS.repo, repo.trim() || DEFAULT_REPO);
  localStorage.setItem(STORAGE_KEYS.pat, pat.trim());
}

export function clearBusConfig() {
  localStorage.removeItem(STORAGE_KEYS.pat);
}

function b64EncodeUtf8(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function b64DecodeUtf8(b64) {
  const clean = b64.replace(/\s+/g, "");
  const bin = atob(clean);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

async function ghRequest(config, method, relPath = "", body = null) {
  const encodedPath = relPath
    .split("/")
    .filter(Boolean)
    .map((s) => encodeURIComponent(s))
    .join("/");
  const sep = encodedPath ? `/${encodedPath}` : "";
  const url = `https://api.github.com/repos/${config.repo}/contents${sep}?t=${Date.now()}`;
  const headers = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${config.pat}`,
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const init = { method, headers, cache: "no-store" };
  if (body !== null) {
    headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }
  const resp = await fetch(url, init);
  if (resp.status === 404 && method === "GET") return null;
  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`GitHub HTTP ${resp.status}: ${errText.slice(0, 180)}`);
  }
  return resp.json();
}

async function ghGetJson(config, relPath) {
  const res = await ghRequest(config, "GET", relPath);
  if (!res || !res.content) return null;
  return JSON.parse(b64DecodeUtf8(res.content));
}

async function ghListFiles(config, dirPath) {
  const res = await ghRequest(config, "GET", dirPath);
  if (!Array.isArray(res)) return [];
  return res.filter((entry) => entry.type === "file" && entry.name.endsWith(".json"));
}

export async function verifyBusConnection(config) {
  const headers = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${config.pat}`,
  };
  const resp = await fetch(`https://api.github.com/repos/${config.repo}`, { headers, cache: "no-store" });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Cannot access ${config.repo} (HTTP ${resp.status}): ${txt.slice(0, 160)}`);
  }
  const repoInfo = await resp.json();
  const contentsResp = await fetch(`https://api.github.com/repos/${config.repo}/contents/orders?t=${Date.now()}`, {
    headers,
    cache: "no-store",
  });
  if (!contentsResp.ok) {
    throw new Error(`Token lacks Contents access on ${config.repo} (HTTP ${contentsResp.status})`);
  }
  return repoInfo;
}

export async function fetchBusState(config) {
  const heartbeats = {};
  const hbFiles = await ghListFiles(config, "heartbeats");
  const hbData = await Promise.all(hbFiles.map((f) => ghGetJson(config, f.path)));
  for (let i = 0; i < hbFiles.length; i++) {
    if (hbData[i]) heartbeats[hbFiles[i].name.replace(/\.json$/, "")] = hbData[i];
  }

  const chatFiles = (await ghListFiles(config, "chat")).sort((a, b) => a.name.localeCompare(b.name)).slice(-25);
  const chat = (await Promise.all(chatFiles.map((f) => ghGetJson(config, f.path))))
    .filter(Boolean)
    .sort((a, b) => (a.created_at || "").localeCompare(b.created_at || ""));

  const targets = ["all", ...ROSTER.map((r) => r.id)];
  const orderDirs = await Promise.all(targets.map((t) => ghListFiles(config, `orders/${t}`)));
  const recentOrderEntries = orderDirs.flat().slice(-15);
  const orders = (await Promise.all(recentOrderEntries.map((f) => ghGetJson(config, f.path))))
    .filter(Boolean)
    .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));

  const ackDirs = await Promise.all(ROSTER.map((r) => ghListFiles(config, `acks/${r.id}`)));
  const recentAckEntries = ackDirs.flat().slice(-20);
  const acks = (await Promise.all(recentAckEntries.map((f) => ghGetJson(config, f.path))))
    .filter(Boolean)
    .sort((a, b) => (b.updated_at || "").localeCompare(a.updated_at || ""));

  const usage = {};
  const usageFiles = await ghListFiles(config, "usage");
  const usageData = await Promise.all(usageFiles.map((f) => ghGetJson(config, f.path)));
  for (let i = 0; i < usageFiles.length; i++) {
    if (usageData[i]) usage[usageFiles[i].name.replace(/\.json$/, "")] = usageData[i];
  }

  return {
    mode: "live",
    repo: config.repo,
    heartbeats,
    chat,
    orders,
    acks,
    usage,
  };
}

function makeOrderId() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const stamp = `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
  const rand = Math.random().toString(16).slice(2, 10);
  return `${stamp}_${rand}`;
}

export async function dispatchOrder(config, { target, message, from = "owner", priority = "normal" }) {
  const id = makeOrderId();
  const order = {
    id,
    target,
    from,
    priority,
    message,
    created_at: new Date().toISOString().replace(/\.\d+Z$/, "Z"),
  };
  const relPath = `orders/${target}/${id}.json`;
  await ghRequest(config, "PUT", relPath, {
    message: `order(${target}): ${id} from ${from}`,
    content: b64EncodeUtf8(JSON.stringify(order, null, 2) + "\n"),
  });
  return order;
}

export async function sendChatMessage(config, { from = "owner", to = "all", text, priority = "normal", alsoOrder = true }) {
  const id = makeOrderId();
  const createdAt = new Date().toISOString().replace(/\.\d+Z$/, "Z");
  const msg = { id, from, to, text, created_at: createdAt };
  await ghRequest(config, "PUT", `chat/${id}_${from}.json`, {
    message: `chat(${from}->${to}): ${id}`,
    content: b64EncodeUtf8(JSON.stringify(msg, null, 2) + "\n"),
  });
  if (alsoOrder && to !== "owner") {
    await dispatchOrder(config, { target: to, message: text, from, priority });
  }
  return msg;
}
