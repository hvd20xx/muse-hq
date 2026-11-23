const WORLD_W = 960;
const WORLD_H = 560;

const ACTIVE_PEERS = ["muse-1", "muse-3", "muse-4", "muse-5"];
const STATUS_COLORS = {
  working: "#22c55e",
  online: "#0ea5e9",
  idle: "#0ea5e9",
  standby: "#94a3b8",
  error: "#ef4444",
};

const COWORKER_LOOK = {
  "muse-3": { x: 144, y: 82, shirt: "#f59e0b", hair: "#475569", hat: "beret", badge: "#d97706" },
  "muse-1": { x: 222, y: 242, shirt: "#3b82f6", hair: "#1e293b", hat: "headphones", badge: "#2563eb" },
  "muse-4": { x: 368, y: 232, shirt: "#10b981", hair: "#3f2e21", hat: "glasses", badge: "#059669" },
  "muse-5": { x: 462, y: 342, shirt: "#8b5cf6", hair: "#0f766e", hat: "cap", badge: "#7c3aed" },
  "muse-6": { x: 256, y: 492, shirt: "#64748b", hair: "#78350f", hat: "none", badge: "#64748b" },
  "muse-7": { x: 742, y: 494, shirt: "#64748b", hair: "#312e81", hat: "none", badge: "#64748b" },
};

function pxRect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function pillRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawPlant(ctx, x, y) {
  pxRect(ctx, x - 7, y + 6, 14, 10, "#9a5b3c");
  pxRect(ctx, x - 9, y + 4, 18, 4, "#b46e4b");
  pxRect(ctx, x - 10, y - 6, 8, 10, "#22c55e");
  pxRect(ctx, x + 2, y - 8, 8, 10, "#16a34a");
  pxRect(ctx, x - 5, y - 12, 10, 10, "#4ade80");
}

function drawWindow(ctx, x, y) {
  pxRect(ctx, x, y, 48, 22, "#6d4c3d");
  pxRect(ctx, x + 3, y + 3, 20, 16, "#7dd3fc");
  pxRect(ctx, x + 25, y + 3, 20, 16, "#93c5fd");
  pxRect(ctx, x + 6, y + 5, 6, 4, "#e0f2fe");
  pxRect(ctx, x + 28, y + 5, 6, 4, "#e0f2fe");
}

function drawClock(ctx, x, y) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, 11, 0, Math.PI * 2);
  ctx.fillStyle = "#f8fafc";
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = "#3b312a";
  ctx.stroke();
  pxRect(ctx, x - 1, y - 6, 2, 7, "#3b312a");
  pxRect(ctx, x, y - 1, 5, 2, "#ef4444");
  ctx.restore();
}

function drawChair(ctx, x, y) {
  pxRect(ctx, x - 11, y - 4, 22, 10, "#475569");
  pxRect(ctx, x - 9, y - 12, 18, 9, "#64748b");
}

function drawDesk(ctx, x, y, accentColor, isActive) {
  pxRect(ctx, x - 34, y + 4, 70, 32, "rgba(59, 49, 42, 0.14)");
  pxRect(ctx, x - 34, y, 68, 30, "#c4884d");
  pxRect(ctx, x - 34, y + 26, 68, 6, "#9c6633");
  pxRect(ctx, x - 32, y + 2, 64, 22, "#d49b62");
  pxRect(ctx, x - 14, y - 6, 28, 20, "#334155");
  pxRect(ctx, x - 12, y - 4, 24, 15, isActive ? accentColor : "#1e293b");
  pxRect(ctx, x - 4, y + 14, 8, 4, "#475569");
  pxRect(ctx, x - 28, y + 8, 10, 12, "#f8fafc");
  pxRect(ctx, x - 26, y + 11, 6, 2, "#cbd5e1");
  pxRect(ctx, x + 18, y + 6, 8, 8, "#fde047");
  pxRect(ctx, x + 20, y + 18, 7, 7, "#ef4444");
}

function drawCounterDesk(ctx, x, y) {
  pxRect(ctx, x - 42, y + 4, 84, 26, "rgba(59, 49, 42, 0.16)");
  pxRect(ctx, x - 42, y, 84, 24, "#94a3b8");
  pxRect(ctx, x - 40, y + 2, 80, 14, "#cbd5e1");
  pxRect(ctx, x - 14, y - 4, 28, 16, "#334155");
  pxRect(ctx, x - 12, y - 2, 24, 12, "#fbbf24");
}

function drawCoworker(ctx, x, y, look, status, t, pokeOffset, isSelected) {
  const isWorking = status === "working";
  const ringCol = STATUS_COLORS[status] || "#94a3b8";
  const bob = isWorking ? Math.sin(t * 7 + x) * 1.3 : status === "standby" ? 0 : Math.sin(t * 2 + x) * 0.8;
  const cy = Math.round(y + bob - pokeOffset);

  ctx.save();
  ctx.beginPath();
  ctx.ellipse(x, y + 20, isSelected ? 24 : 20, isSelected ? 9 : 7, 0, 0, Math.PI * 2);
  ctx.strokeStyle = ringCol;
  ctx.lineWidth = isSelected ? 3.5 : 2.5;
  ctx.stroke();
  if (isSelected) {
    ctx.fillStyle = "rgba(245, 158, 11, 0.18)";
    ctx.fill();
  }
  ctx.restore();

  pxRect(ctx, x - 8, cy + 12, 6, 6, "#1e293b");
  pxRect(ctx, x + 2, cy + 12, 6, 6, "#1e293b");
  pxRect(ctx, x - 8, cy + 6, 7, 7, "#334155");
  pxRect(ctx, x + 1, cy + 6, 7, 7, "#334155");

  pxRect(ctx, x - 12, cy - 8, 24, 16, "#29201b");
  pxRect(ctx, x - 10, cy - 6, 20, 13, look.shirt);

  const armY = isWorking ? Math.round(Math.sin(t * 14 + x) * 2) : 0;
  pxRect(ctx, x - 14, cy - 5 + armY, 5, 10, look.shirt);
  pxRect(ctx, x + 9, cy - 5 - armY, 5, 10, look.shirt);
  pxRect(ctx, x - 14, cy + 3 + armY, 4, 4, "#fde68a");
  pxRect(ctx, x + 10, cy + 3 - armY, 4, 4, "#fde68a");

  pxRect(ctx, x - 10, cy - 26, 20, 18, "#29201b");
  pxRect(ctx, x - 8, cy - 24, 16, 15, "#fde68a");
  pxRect(ctx, x - 5, cy - 17, 3, 3, "#1e293b");
  pxRect(ctx, x + 2, cy - 17, 3, 3, "#1e293b");

  pxRect(ctx, x - 9, cy - 27, 18, 7, look.hair);
  if (look.hat === "beret") {
    pxRect(ctx, x - 10, cy - 30, 18, 6, "#f59e0b");
    pxRect(ctx, x - 2, cy - 32, 4, 3, "#d97706");
  } else if (look.hat === "headphones") {
    pxRect(ctx, x - 11, cy - 22, 3, 8, "#0284c7");
    pxRect(ctx, x + 8, cy - 22, 3, 8, "#0284c7");
    pxRect(ctx, x - 8, cy - 29, 16, 3, "#38bdf8");
  } else if (look.hat === "glasses") {
    pxRect(ctx, x - 7, cy - 18, 6, 4, "#0f172a");
    pxRect(ctx, x + 1, cy - 18, 6, 4, "#0f172a");
    pxRect(ctx, x - 1, cy - 17, 2, 2, "#0f172a");
  } else if (look.hat === "cap") {
    pxRect(ctx, x - 10, cy - 29, 20, 6, "#a855f7");
    pxRect(ctx, x - 6, cy - 25, 16, 3, "#6d28d9");
  }
}

function drawBadge(ctx, x, y, label, bgColor, isSelected) {
  ctx.save();
  ctx.font = "700 11px Inter, system-ui, sans-serif";
  const w = Math.max(76, ctx.measureText(label).width + 18);
  const h = 21;
  const bx = Math.round(x - w / 2);
  const by = Math.round(y);

  pillRect(ctx, bx, by, w, h, 10);
  ctx.fillStyle = bgColor;
  ctx.fill();
  ctx.lineWidth = isSelected ? 2.2 : 1.2;
  ctx.strokeStyle = isSelected ? "#1e293b" : "#fff7ed";
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x, by + h / 2 + 0.5);
  ctx.restore();
}

function drawSpeechBubble(ctx, x, y, text, borderColor) {
  const clean = (text || "").trim();
  if (!clean) return;
  const shown = clean.length > 36 ? `${clean.slice(0, 34)}…` : clean;
  ctx.save();
  ctx.font = "500 10.5px Inter, system-ui, sans-serif";
  const w = Math.min(202, Math.max(66, ctx.measureText(shown).width + 16));
  const h = 22;
  const bx = Math.round(Math.max(14, Math.min(WORLD_W - w - 14, x - w / 2)));
  const by = Math.round(Math.max(12, y));

  pillRect(ctx, bx, by, w, h, 6);
  ctx.fillStyle = "#fffdf7";
  ctx.fill();
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = borderColor || "#3b312a";
  ctx.stroke();

  ctx.fillStyle = "#29201b";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(shown, bx + 8, by + h / 2 + 0.5, w - 16);
  ctx.restore();
}

export function createOffice2DScene({ canvas, roster, onSelect }) {
  const ctx = canvas.getContext("2d");
  const rosterById = Object.fromEntries(roster.map((r) => [r.id, r]));
  let selectedId = "muse-3";
  let stateSnapshot = { heartbeats: {}, chat: [] };
  const packets = [];
  const pokeTimers = new Map();
  let starSpring = 0;

  let viewW = 800;
  let viewH = 500;
  let baseScale = 1;
  let cam = { x: WORLD_W / 2, y: WORLD_H / 2, zoom: 1 };
  let camGoal = { x: WORLD_W / 2, y: WORLD_H / 2, zoom: 1 };
  let userMoved = false;

  function applyDefaultView(force = false) {
    const isNarrow = viewW < 760;
    if (!force && userMoved) return;
    if (isNarrow) {
      camGoal = { x: 315, y: 215, zoom: 1.78 };
    } else {
      camGoal = { x: WORLD_W / 2, y: WORLD_H / 2, zoom: 1.0 };
    }
    if (force || !userMoved) {
      cam.x = camGoal.x;
      cam.y = camGoal.y;
      cam.zoom = camGoal.zoom;
    }
  }

  function resize() {
    const parent = canvas.parentElement;
    if (!parent) return;
    const w = parent.clientWidth;
    const h = parent.clientHeight;
    if (!w || !h) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;

    viewW = w;
    viewH = h;
    const pad = w < 760 ? 8 : 18;
    baseScale = Math.min((w - pad * 2) / WORLD_W, (h - pad * 2) / WORLD_H);
    applyDefaultView(false);
  }

  window.addEventListener("resize", resize);
  if (typeof ResizeObserver !== "undefined" && canvas.parentElement) {
    new ResizeObserver(resize).observe(canvas.parentElement);
  }
  resize();
  applyDefaultView(true);

  function clampCamera(target) {
    return {
      x: Math.max(90, Math.min(WORLD_W - 90, target.x)),
      y: Math.max(70, Math.min(WORLD_H - 70, target.y)),
      zoom: Math.max(0.85, Math.min(3.2, target.zoom)),
    };
  }

  function screenToWorld(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const sx = clientX - rect.left;
    const sy = clientY - rect.top;
    const s = baseScale * cam.zoom;
    return {
      x: (sx - viewW / 2) / s + cam.x,
      y: (sy - viewH / 2) / s + cam.y,
    };
  }

  // Pan & Click/Tap handling
  let dragState = null;

  canvas.addEventListener("pointerdown", (ev) => {
    canvas.setPointerCapture?.(ev.pointerId);
    dragState = {
      pointerId: ev.pointerId,
      startX: ev.clientX,
      startY: ev.clientY,
      lastX: ev.clientX,
      lastY: ev.clientY,
      moved: false,
    };
  });

  canvas.addEventListener("pointermove", (ev) => {
    if (!dragState || ev.pointerId !== dragState.pointerId) return;
    const dx = ev.clientX - dragState.lastX;
    const dy = ev.clientY - dragState.lastY;
    dragState.lastX = ev.clientX;
    dragState.lastY = ev.clientY;
    if (Math.hypot(ev.clientX - dragState.startX, ev.clientY - dragState.startY) > 6) {
      dragState.moved = true;
      userMoved = true;
    }
    if (dragState.moved) {
      const s = baseScale * cam.zoom;
      camGoal = clampCamera({
        x: camGoal.x - dx / s,
        y: camGoal.y - dy / s,
        zoom: camGoal.zoom,
      });
      cam.x = camGoal.x;
      cam.y = camGoal.y;
    }
  });

  canvas.addEventListener("pointerup", (ev) => {
    if (!dragState || ev.pointerId !== dragState.pointerId) return;
    const wasDrag = dragState.moved;
    dragState = null;
    if (wasDrag) return;

    const pt = screenToWorld(ev.clientX, ev.clientY);
    if (Math.hypot(pt.x - 210, pt.y - 498) <= 24) {
      starSpring = 1;
      return;
    }

    for (const meta of roster) {
      const look = COWORKER_LOOK[meta.id];
      if (!look) continue;
      if (Math.abs(pt.x - look.x) <= 44 && Math.abs(pt.y - look.y) <= 42) {
        selectedId = meta.id;
        pokeTimers.set(meta.id, performance.now());
        onSelect?.(meta.id);
        return;
      }
    }
  });

  canvas.addEventListener(
    "wheel",
    (ev) => {
      ev.preventDefault();
      userMoved = true;
      const factor = ev.deltaY > 0 ? 0.9 : 1.1;
      camGoal = clampCamera({ x: camGoal.x, y: camGoal.y, zoom: camGoal.zoom * factor });
    },
    { passive: false }
  );

  function triggerPacket(fromId, toId, colorHex = "#f59e0b") {
    const fromPt = fromId === "owner" ? { x: 144, y: 126 } : COWORKER_LOOK[fromId];
    if (!fromPt) return;
    const targets = toId === "all" ? ACTIVE_PEERS.filter((id) => id !== fromId) : [toId];
    for (const tid of targets) {
      const toPt = COWORKER_LOOK[tid];
      if (!toPt) continue;
      packets.push({
        ax: fromPt.x,
        ay: fromPt.y - 10,
        bx: toPt.x,
        by: toPt.y - 10,
        color: colorHex,
        t: 0,
        speed: 0.72 + Math.random() * 0.25,
      });
    }
  }

  function updateState(nextState) {
    stateSnapshot = nextState || { heartbeats: {}, chat: [] };
  }

  function focusDesk(id) {
    const look = COWORKER_LOOK[id];
    if (!look) return;
    selectedId = id;
    pokeTimers.set(id, performance.now());
    userMoved = true;
    const minZoom = viewW < 760 ? 1.85 : Math.max(1.15, camGoal.zoom);
    camGoal = clampCamera({ x: look.x, y: look.y - 24, zoom: Math.max(camGoal.zoom, minZoom) });
  }

  function zoomBy(factor) {
    userMoved = true;
    camGoal = clampCamera({ x: camGoal.x, y: camGoal.y, zoom: camGoal.zoom * factor });
  }

  function fitView() {
    userMoved = true;
    camGoal = { x: WORLD_W / 2, y: WORLD_H / 2, zoom: 1.0 };
  }

  function resetCamera() {
    userMoved = false;
    applyDefaultView(true);
  }

  function latestBubbleFor(id) {
    const msgs = stateSnapshot.chat || [];
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].from === id && msgs[i].text) return msgs[i].text;
    }
    if (id === selectedId) {
      return stateSnapshot.heartbeats?.[id]?.task || rosterById[id]?.subtitle || "";
    }
    return "";
  }

  function drawScene(nowMs) {
    const t = nowMs * 0.001;
    cam.x += (camGoal.x - cam.x) * 0.14;
    cam.y += (camGoal.y - cam.y) * 0.14;
    cam.zoom += (camGoal.zoom - cam.zoom) * 0.14;

    const totalScale = baseScale * cam.zoom;
    ctx.clearRect(0, 0, viewW, viewH);
    ctx.save();
    ctx.translate(viewW / 2, viewH / 2);
    ctx.scale(totalScale, totalScale);
    ctx.translate(-cam.x, -cam.y);

    // Outer architectural office wall
    pxRect(ctx, 0, 0, WORLD_W, WORLD_H, "#3b312a");

    // 1. Top Reception / Command Room
    pxRect(ctx, 8, 8, 670, 128, "#d7c5a5");
    for (let gx = 8; gx < 678; gx += 32) pxRect(ctx, gx, 8, 1, 128, "rgba(139,115,85,0.16)");
    for (let gy = 8; gy < 136; gy += 32) pxRect(ctx, 8, gy, 670, 1, "rgba(139,115,85,0.16)");

    // 2. Main Engineering & Ops Floor
    pxRect(ctx, 8, 144, 670, 276, "#e4d4b7");
    for (let gx = 8; gx < 678; gx += 32) pxRect(ctx, gx, 144, 1, 276, "rgba(139,115,85,0.13)");
    for (let gy = 144; gy < 420; gy += 32) pxRect(ctx, 8, gy, 670, 1, "rgba(139,115,85,0.13)");

    // 3. Right Meeting & Lounge Wing
    pxRect(ctx, 686, 8, 266, 412, "#8e93b2");
    pxRect(ctx, 704, 66, 230, 164, "#797ea1");

    // 4. Bottom-Left Cafe Lounge
    pxRect(ctx, 8, 428, 492, 124, "#a3b89b");
    pxRect(ctx, 56, 444, 240, 102, "#88a27f");

    // 5. Bottom-Right Research Library & Server Rack
    pxRect(ctx, 508, 428, 444, 124, "#9295b4");

    // Doorways
    pxRect(ctx, 118, 134, 52, 12, "#d7c5a5");
    pxRect(ctx, 118, 122, 52, 14, "#cbb794");
    ctx.font = "700 8px 'JetBrains Mono', monospace";
    ctx.fillStyle = "#786650";
    ctx.textAlign = "center";
    ctx.fillText("WELCOME", 144, 131);

    pxRect(ctx, 212, 418, 52, 12, "#a3b89b");
    pxRect(ctx, 312, 418, 52, 12, "#a3b89b");
    pxRect(ctx, 676, 166, 12, 46, "#8e93b2");

    for (const wx of [44, 160, 290, 420, 560, 720, 816]) {
      drawWindow(ctx, wx, 14);
    }

    // Reception props
    pxRect(ctx, 250, 46, 56, 36, "#8c5a2b");
    pxRect(ctx, 254, 50, 48, 28, "#d4a373");
    pxRect(ctx, 258, 54, 10, 8, "#fde047");
    pxRect(ctx, 272, 54, 10, 8, "#f472b6");
    pxRect(ctx, 258, 65, 18, 10, "#93c5fd");
    pxRect(ctx, 280, 65, 16, 10, "#f8fafc");

    pxRect(ctx, 434, 44, 4, 34, "#6d4c3d");
    pxRect(ctx, 426, 76, 20, 4, "#6d4c3d");
    pxRect(ctx, 428, 50, 16, 3, "#6d4c3d");

    pxRect(ctx, 646, 48, 14, 18, "#f8fafc");
    pxRect(ctx, 648, 36, 10, 12, "#7dd3fc");

    drawPlant(ctx, 204, 42);
    drawPlant(ctx, 618, 42);
    drawPlant(ctx, 706, 48);
    drawPlant(ctx, 26, 376);
    drawPlant(ctx, 654, 392);
    drawPlant(ctx, 712, 362);
    drawPlant(ctx, 926, 342);

    // Main Floor props
    pxRect(ctx, 24, 176, 70, 46, "#f8fafc");
    pxRect(ctx, 26, 178, 66, 42, "#f1f5f9");
    ctx.font = "700 10px 'JetBrains Mono', monospace";
    ctx.fillStyle = "#64748b";
    ctx.fillText("SHIP IT", 59, 195);
    ctx.font = "500 8.5px Inter, sans-serif";
    ctx.fillText("everyday", 59, 208);

    pxRect(ctx, 144, 150, 84, 52, "#e2e8f0");
    pxRect(ctx, 144, 150, 84, 12, "#6366f1");
    ctx.font = "700 8px 'JetBrains Mono', monospace";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("SPRINT", 186, 158);
    ctx.fillStyle = "#64748b";
    ctx.font = "600 6.5px 'JetBrains Mono', monospace";
    ctx.fillText("TODO  DOING  DONE", 186, 169);
    pxRect(ctx, 150, 174, 18, 10, "#cbd5e1");
    pxRect(ctx, 176, 174, 18, 10, "#fde047");
    pxRect(ctx, 202, 174, 18, 10, "#86efac");
    pxRect(ctx, 176, 188, 18, 8, "#93c5fd");

    ctx.font = "700 8px 'JetBrains Mono', monospace";
    ctx.fillStyle = "#8d7b63";
    ctx.fillText("COMMAND & PEER MESH", 435, 166);
    ctx.fillText("OPERATIONS", 435, 314);
    ctx.fillText("RESEARCH", 740, 444);
    ctx.fillText("LOUNGE", 142, 442);

    pxRect(ctx, 592, 312, 66, 44, "#94a3b8");
    pxRect(ctx, 595, 315, 60, 38, "#f8fafc");
    pxRect(ctx, 602, 323, 30, 3, "#3b82f6");
    pxRect(ctx, 602, 331, 18, 12, "#10b981");
    pxRect(ctx, 626, 331, 18, 12, "#6366f1");
    pxRect(ctx, 648, 318, 12, 8, "#f472b6");

    drawClock(ctx, 646, 146);
    drawClock(ctx, 672, 286);

    // Meeting Room Furniture
    pxRect(ctx, 764, 124, 108, 62, "#c4884d");
    pxRect(ctx, 768, 128, 100, 54, "#d49b62");
    for (const cx of [788, 818, 848]) {
      pxRect(ctx, cx - 8, 108, 16, 12, "#475569");
      pxRect(ctx, cx - 8, 190, 16, 12, "#475569");
    }
    pxRect(ctx, 754, 290, 108, 32, "#9a5b3c");
    pxRect(ctx, 762, 298, 92, 20, "#b46e4b");
    ctx.beginPath();
    ctx.arc(808, 356, 22, 0, Math.PI * 2);
    ctx.fillStyle = "#c4884d";
    ctx.fill();

    // Cafe Lounge Furniture
    pxRect(ctx, 20, 456, 20, 24, "#1e293b");
    pxRect(ctx, 23, 459, 14, 7, "#ef4444");
    pxRect(ctx, 44, 462, 12, 16, "#e0f2fe");
    pxRect(ctx, 74, 444, 96, 28, "#8c5a3b");
    pxRect(ctx, 82, 450, 80, 16, "#a46d49");

    ctx.beginPath();
    ctx.arc(210, 498, 25, 0, Math.PI * 2);
    ctx.fillStyle = "#c4884d";
    ctx.fill();
    if (starSpring > 0) starSpring = Math.max(0, starSpring - 0.04);
    const sScale = 1 + Math.sin(starSpring * Math.PI * 4) * starSpring * 0.25;
    ctx.save();
    ctx.translate(210, 498);
    ctx.scale(sScale, sScale);
    ctx.fillStyle = "#fde047";
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a1 = -Math.PI / 2 + (i * Math.PI * 2) / 5;
      const a2 = a1 + Math.PI / 5;
      if (i === 0) ctx.moveTo(Math.cos(a1) * 14, Math.sin(a1) * 14);
      else ctx.lineTo(Math.cos(a1) * 14, Math.sin(a1) * 14);
      ctx.lineTo(Math.cos(a2) * 6, Math.sin(a2) * 6);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    pxRect(ctx, 134, 514, 18, 10, "#94a3b8");
    pxRect(ctx, 148, 512, 8, 8, "#94a3b8");
    pxRect(ctx, 126, 518, 9, 4, "#64748b");

    pxRect(ctx, 374, 452, 104, 82, "#d1d5db");
    pxRect(ctx, 378, 456, 96, 74, "#e2e8f0");
    pxRect(ctx, 434, 464, 24, 14, "#f8fafc");
    ctx.font = "700 8px 'JetBrains Mono', monospace";
    ctx.fillStyle = "#64748b";
    ctx.fillText("WC", 424, 488);

    // Research Library
    for (const bx of [522, 686, 800]) {
      pxRect(ctx, bx, 452, 84, 34, "#8c5a2b");
      pxRect(ctx, bx + 4, 456, 76, 11, "#6d4c3d");
      pxRect(ctx, bx + 4, 470, 76, 11, "#6d4c3d");
      const bookCols = ["#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#a855f7"];
      for (let b = 0; b < 7; b++) {
        pxRect(ctx, bx + 7 + b * 10, 457, 7, 10, bookCols[b % bookCols.length]);
        pxRect(ctx, bx + 9 + b * 10, 471, 7, 10, bookCols[(b + 2) % bookCols.length]);
      }
    }
    pxRect(ctx, 648, 498, 22, 16, "#f8fafc");
    pxRect(ctx, 846, 484, 42, 48, "#6366f1");
    ctx.fillStyle = "#e0e7ff";
    ctx.fillText("PHONE", 867, 496);
    pxRect(ctx, 860, 504, 14, 18, "#334155");

    pxRect(ctx, 900, 444, 36, 74, "#0f172a");
    for (let i = 0; i < 6; i++) {
      pxRect(ctx, 906, 452 + i * 11, 24, 4, Math.sin(t * 4 + i) > 0 ? "#22c55e" : "#38bdf8");
    }

    // P2P Mesh dashed floor lines
    ctx.save();
    ctx.setLineDash([5, 6]);
    ctx.lineDashOffset = -t * 14;
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(59, 130, 246, 0.25)";
    for (let i = 0; i < ACTIVE_PEERS.length; i++) {
      for (let j = i + 1; j < ACTIVE_PEERS.length; j++) {
        const a = COWORKER_LOOK[ACTIVE_PEERS[i]];
        const b = COWORKER_LOOK[ACTIVE_PEERS[j]];
        ctx.beginPath();
        ctx.moveTo(a.x, a.y + 8);
        ctx.lineTo(b.x, b.y + 8);
        ctx.stroke();
      }
    }
    ctx.restore();

    drawCounterDesk(ctx, 144, 62);
    for (const id of ["muse-1", "muse-4", "muse-5"]) {
      const look = COWORKER_LOOK[id];
      const meta = rosterById[id];
      const st = stateSnapshot.heartbeats?.[id]?.status || "online";
      drawChair(ctx, look.x, look.y + 8);
      drawDesk(ctx, look.x, look.y - 34, meta?.color || "#38bdf8", st !== "standby");
    }

    for (const meta of roster) {
      const look = COWORKER_LOOK[meta.id];
      if (!look) continue;
      const hb = stateSnapshot.heartbeats?.[meta.id] || {};
      const status = hb.status || (meta.role === "STANDBY" ? "standby" : "online");
      const pokeStart = pokeTimers.get(meta.id);
      let pokeOffset = 0;
      if (pokeStart) {
        const elapsed = (nowMs - pokeStart) / 1000;
        if (elapsed < 0.45) {
          pokeOffset = Math.sin((elapsed / 0.45) * Math.PI) * 10;
        } else {
          pokeTimers.delete(meta.id);
        }
      }

      drawCoworker(ctx, look.x, look.y, look, status, t, pokeOffset, meta.id === selectedId);
      const cleanName = `Muse-${meta.name}`;
      const badgeLabel = meta.role === "COMMANDER" ? `${cleanName} ★` : cleanName;
      drawBadge(ctx, look.x, look.y - 54 - pokeOffset, badgeLabel, look.badge, meta.id === selectedId);

      const bubble = latestBubbleFor(meta.id);
      if (bubble) {
        drawSpeechBubble(ctx, look.x, look.y - 80 - pokeOffset, bubble, look.badge);
      }
    }

    for (let i = packets.length - 1; i >= 0; i--) {
      const p = packets[i];
      p.t += 0.015 * p.speed;
      if (p.t >= 1) {
        packets.splice(i, 1);
        continue;
      }
      const ex = p.ax + (p.bx - p.ax) * p.t;
      const ey = p.ay + (p.by - p.ay) * p.t - Math.sin(p.t * Math.PI) * 18;
      pxRect(ctx, ex - 8, ey - 6, 16, 12, "#fffdf7");
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 1.6;
      ctx.strokeRect(ex - 8, ey - 6, 16, 12);
      ctx.beginPath();
      ctx.moveTo(ex - 8, ey - 6);
      ctx.lineTo(ex, ey + 1);
      ctx.lineTo(ex + 8, ey - 6);
      ctx.stroke();
    }

    ctx.restore();
  }

  function animate(now) {
    requestAnimationFrame(animate);
    drawScene(now);
  }
  requestAnimationFrame(animate);

  return {
    focusDesk,
    fitView,
    zoomBy,
    resetCamera,
    resize,
    triggerPacket,
    updateState,
  };
}
