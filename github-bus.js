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
    position: [0, 0.35, -3.2],
    rotationY: 0,
  },
  {
    id: "muse-1",
    name: "Feed",
    role: "WORKER",
    color: "#38bdf8",
    subtitle: "YPP 20ch · Threads · make.fun",
    position: [-5.2, 0, 1.5],
    rotationY: 0.36,
  },
  {
    id: "muse-4",
    name: "Klip",
    role: "WORKER",
    color: "#34d399",
    subtitle: "Saksi Zaman · Benable · Pinterest · make.fun",
    position: [0, 0, 2.3],
    rotationY: 0,
  },
  {
    id: "muse-5",
    name: "Distro",
    role: "WORKER",
    color: "#a78bfa",
    subtitle: "25ch YT · 5 Threads · make.fun",
    position: [5.2, 0, 1.5],
    rotationY: -0.36,
  },
  {
    id: "muse-6",
    name: "Bisnis",
    role: "STANDBY",
    color: "#64748b",
    subtitle: "Sunrise Lead Hunter · Lofi EN (Deferred)",
    position: [-6.8, 0, -2.7],
    rotationY: 0.55,
  },
  {
    id: "muse-7",
    name: "Digital",
    role: "STANDBY",
    color: "#64748b",
    subtitle: "Sunrise Creative · Lofi ID (Deferred)",
    position: [6.8, 0, -2.7],
    rotationY: -0.55,
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
      task: "Commander · news-image-20261123 + sitegen submitted",
      balance: "$0.01264",
      note: "Metric specialization + qa_gate.sh active",
      updated_at: "2026-11-23T12:24:00Z",
    },
    "muse-1": {
      muse_id: "muse-1",
      status: "working",
      task: "YPP 20ch $0 Voice + Threads Native + news-image-1123",
      balance: "$0.00",
      note: "qa_gate.sh + overlap policy active",
      updated_at: "2026-11-23T12:22:00Z",
    },
    "muse-4": {
      muse_id: "muse-4",
      status: "working",
      task: "Saksi Zaman + Pinterest 10/d + news-image sniper",
      balance: "$0.01013",
      note: "1122 dev judge 972.121 (prize eligible)",
      updated_at: "2026-11-23T12:22:00Z",
    },
    "muse-5": {
      muse_id: "muse-5",
      status: "working",
      task: "Running qa_gate.sh + SOLO Bold Ion + news-image-1123",
      balance: "$0.01627",
      note: "21+ subs · Payday Burst armed",
      updated_at: "2026-11-23T12:23:00Z",
    },
    "muse-6": {
      muse_id: "muse-6",
      status: "standby",
      task: "Standby — Drive login deferred per owner",
      balance: "$0.00",
      note: "Idle 0 MB RAM",
      updated_at: "2026-11-23T11:00:00Z",
    },
    "muse-7": {
      muse_id: "muse-7",
      status: "standby",
      task: "Standby — Drive login deferred per owner",
      balance: "$0.00",
      note: "Idle 0 MB RAM",
      updated_at: "2026-11-23T11:00:00Z",
    },
  },
  orders: [
    {
      id: "demo_order_1",
      target: "all",
      from: "muse-3",
      priority: "high",
      message: "Overlap kontes $0 + qa_gate.sh benchmark ratchet aktif di semua worker.",
      created_at: "2026-11-23T12:20:00Z",
    },
  ],
  acks: [
    {
      order_id: "demo_order_1",
      muse_id: "muse-5",
      status: "running",
      summary: "Menjalankan qa_gate.sh & evaluasi build make.fun.",
      updated_at: "2026-11-23T12:21:00Z",
    },
  ],
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

  return {
    mode: "live",
    repo: config.repo,
    heartbeats,
    orders,
    acks,
  };
}

function makeOrderId() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const stamp = `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
  const rand = Math.random().toString(16).slice(2, 10);
  return `${stamp}_${rand}`;
}

export async function dispatchOrder(config, { target, message, from = "muse-3", priority = "normal" }) {
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
