const WORLD_W = 1120;
const WORLD_H = 720;

const ACTIVE_PEERS = ["muse-1", "muse-3", "muse-4", "muse-5"];
const STATUS_COLORS = {
  working: "#34d399",
  online: "#38bdf8",
  idle: "#38bdf8",
  standby: "#64748b",
  error: "#fb7185",
};

const DESK_COORDS = {
  "muse-3": { x: 560, y: 155, facing: "down" },
  "muse-6": { x: 185, y: 215, facing: "down" },
  "muse-7": { x: 935, y: 215, facing: "down" },
  "muse-1": { x: 240, y: 525, facing: "up" },
  "muse-4": { x: 560, y: 545, facing: "up" },
  "muse-5": { x: 880, y: 525, facing: "up" },
};

const MESH_EDGES = [
  ["muse-3", "muse-1"],
  ["muse-3", "muse-4"],
  ["muse-3", "muse-5"],
  ["muse-1", "muse-4"],
  ["muse-4", "muse-5"],
  ["muse-1", "muse-5"],
  ["muse-3", "muse-6"],
  ["muse-3", "muse-7"],
];

function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawPlant(ctx, x, y, radius = 22) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.beginPath();
  ctx.arc(3, 4, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#1e293b";
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.62, 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3 + 0.2;
    ctx.save();
    ctx.rotate(a);
    ctx.fillStyle = i % 2 === 0 ? "#15803d" : "#166534";
    ctx.beginPath();
    ctx.ellipse(radius * 0.55, 0, radius * 0.48, radius * 0.23, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

function drawBubble(ctx, x, y, text, accentColor, isRight) {
  const clean = (text || "").trim();
  if (!clean) return;
  const shown = clean.length > 44 ? `${clean.slice(0, 42)}…` : clean;
  ctx.save();
  ctx.font = "500 11.5px Inter, system-ui, sans-serif";
  const textW = Math.min(230, Math.max(82, ctx.measureText(shown).width + 20));
  const boxH = 26;
  const bx = Math.max(16, Math.min(WORLD_W - textW - 16, isRight ? x - textW * 0.25 : x - textW * 0.5));
  const by = y;

  roundedRect(ctx, bx, by, textW, boxH, 8);
  ctx.fillStyle = "rgba(10, 16, 29, 0.94)";
  ctx.fill();
  ctx.lineWidth = 1.25;
  ctx.strokeStyle = accentColor;
  ctx.stroke();

  ctx.fillStyle = "#e2e8f0";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(shown, bx + 10, by + boxH / 2 + 0.5, textW - 20);
  ctx.restore();
}

export function createOffice2DScene({ canvas, roster, onSelect }) {
  const ctx = canvas.getContext("2d");
  const rosterById = Object.fromEntries(roster.map((r) => [r.id, r]));
  let selectedId = "muse-3";
  let stateSnapshot = { heartbeats: {}, chat: [] };
  const packets = [];
  let transform = { scale: 1, offX: 0, offY: 0, width: 800, height: 600 };

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

    const pad = 20;
    const scale = Math.min((w - pad * 2) / WORLD_W, (h - pad * 2) / WORLD_H);
    const offX = (w - WORLD_W * scale) / 2;
    const offY = (h - WORLD_H * scale) / 2;
    transform = { scale, offX, offY, width: w, height: h };
  }

  window.addEventListener("resize", resize);
  if (typeof ResizeObserver !== "undefined" && canvas.parentElement) {
    new ResizeObserver(resize).observe(canvas.parentElement);
  }
  resize();

  function triggerPacket(fromId, toId, colorHex = "#38bdf8") {
    const fromPt = fromId === "owner" ? { x: 560, y: 42 } : DESK_COORDS[fromId];
    if (!fromPt) return;
    const targets = toId === "all" ? ACTIVE_PEERS.filter((id) => id !== fromId) : [toId];
    for (const tid of targets) {
      const toPt = DESK_COORDS[tid];
      if (!toPt) continue;
      packets.push({
        ax: fromPt.x,
        ay: fromPt.y,
        bx: toPt.x,
        by: toPt.y,
        color: colorHex,
        t: 0,
        speed: 0.95 + Math.random() * 0.25,
      });
    }
  }

  function updateState(nextState) {
    stateSnapshot = nextState || { heartbeats: {}, chat: [] };
  }

  function focusDesk(id) {
    if (DESK_COORDS[id]) selectedId = id;
  }

  function resetCamera() {
    resize();
  }

  canvas.addEventListener("click", (ev) => {
    const rect = canvas.getBoundingClientRect();
    const wx = (ev.clientX - rect.left - transform.offX) / transform.scale;
    const wy = (ev.clientY - rect.top - transform.offY) / transform.scale;
    for (const meta of roster) {
      const pos = DESK_COORDS[meta.id];
      if (!pos) continue;
      if (Math.abs(wx - pos.x) <= 78 && Math.abs(wy - pos.y) <= 58) {
        selectedId = meta.id;
        onSelect?.(meta.id);
        return;
      }
    }
  });

  function latestBubbleFor(id) {
    const msgs = stateSnapshot.chat || [];
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].from === id && msgs[i].text) {
        return msgs[i].text;
      }
    }
    return stateSnapshot.heartbeats?.[id]?.task || rosterById[id]?.subtitle || "";
  }

  function drawFloorplan(t) {
    ctx.clearRect(0, 0, transform.width, transform.height);
    ctx.save();
    ctx.translate(transform.offX, transform.offY);
    ctx.scale(transform.scale, transform.scale);

    // Outer architectural studio slab
    roundedRect(ctx, 24, 24, WORLD_W - 48, WORLD_H - 48, 22);
    ctx.fillStyle = "#0b1220";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(148, 163, 184, 0.22)";
    ctx.stroke();

    // Subtle tile grid
    ctx.save();
    ctx.beginPath();
    roundedRect(ctx, 24, 24, WORLD_W - 48, WORLD_H - 48, 22);
    ctx.clip();
    ctx.strokeStyle = "rgba(38, 53, 79, 0.35)";
    ctx.lineWidth = 1;
    for (let x = 64; x < WORLD_W - 24; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, 24);
      ctx.lineTo(x, WORLD_H - 24);
      ctx.stroke();
    }
    for (let y = 64; y < WORLD_H - 24; y += 48) {
      ctx.beginPath();
      ctx.moveTo(24, y);
      ctx.lineTo(WORLD_W - 24, y);
      ctx.stroke();
    }

    // Top Owner Doorway & Zone labels
    ctx.fillStyle = "rgba(56, 189, 248, 0.14)";
    ctx.fillRect(495, 24, 130, 10);
    ctx.font = "600 10px 'JetBrains Mono', monospace";
    ctx.fillStyle = "#64748b";
    ctx.textAlign = "center";
    ctx.fillText("OWNER / HQ GATEWAY", 560, 48);
    ctx.textAlign = "left";
    ctx.fillText("COMMAND & PEER MESH", 52, 54);
    ctx.fillText("OPERATIONS FLOOR", 52, 682);
    ctx.restore();

    // Commander dais zone under muse-3
    roundedRect(ctx, 415, 72, 290, 166, 18);
    ctx.fillStyle = "rgba(245, 158, 11, 0.06)";
    ctx.fill();
    ctx.setLineDash([6, 5]);
    ctx.strokeStyle = "rgba(245, 158, 11, 0.32)";
    ctx.stroke();
    ctx.setLineDash([]);

    // Central round collaboration table
    ctx.save();
    ctx.translate(560, 355);
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.arc(4, 6, 56, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#162238";
    ctx.beginPath();
    ctx.arc(0, 0, 56, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(56, 189, 248, 0.28)";
    ctx.stroke();

    ctx.fillStyle = "rgba(56, 189, 248, 0.12)";
    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = "700 11px 'JetBrains Mono', monospace";
    ctx.fillStyle = "#94a3b8";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("P2P MESH", 0, -6);
    ctx.font = "500 10px 'JetBrains Mono', monospace";
    ctx.fillStyle = "#64748b";
    ctx.fillText("LIVE BUS", 0, 9);
    ctx.restore();

    // Server rack (top-left inner wall) & studio plants
    roundedRect(ctx, 64, 72, 48, 92, 8);
    ctx.fillStyle = "#111827";
    ctx.fill();
    ctx.strokeStyle = "rgba(148, 163, 184, 0.28)";
    ctx.stroke();
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = Math.sin(t * 4 + i) > 0 ? "#34d399" : "#38bdf8";
      ctx.fillRect(74, 84 + i * 15, 28, 5);
    }

    drawPlant(ctx, 72, 650, 22);
    drawPlant(ctx, 1048, 650, 22);
    drawPlant(ctx, 1046, 98, 22);

    // Full P2P Mesh floor cables
    for (const [aId, bId] of MESH_EDGES) {
      const a = DESK_COORDS[aId];
      const b = DESK_COORDS[bId];
      const isStandby = aId === "muse-6" || aId === "muse-7" || bId === "muse-6" || bId === "muse-7";
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.lineWidth = isStandby ? 1.2 : 2;
      ctx.setLineDash([8, 8]);
      ctx.lineDashOffset = isStandby ? 0 : -t * 16;
      ctx.strokeStyle = isStandby ? "rgba(100, 116, 139, 0.22)" : "rgba(56, 189, 248, 0.26)";
      ctx.stroke();
      ctx.restore();
    }

    // Workstations (6 named top-down desks)
    for (const meta of roster) {
      const pos = DESK_COORDS[meta.id];
      if (!pos) continue;
      const hb = stateSnapshot.heartbeats?.[meta.id] || {};
      const status = hb.status || (meta.role === "STANDBY" ? "standby" : "online");
      const statusCol = STATUS_COLORS[status] || meta.color;
      const isCmd = meta.role === "COMMANDER";
      const isSelected = meta.id === selectedId;
      const isWorking = status === "working";
      const facingDown = pos.facing === "down";

      ctx.save();
      ctx.translate(pos.x, pos.y);

      // Floor halo / selection ring
      ctx.beginPath();
      ctx.arc(0, 0, isCmd ? 74 : 62, 0, Math.PI * 2);
      ctx.fillStyle = isSelected ? "rgba(245, 158, 11, 0.10)" : "rgba(15, 23, 42, 0.45)";
      ctx.fill();
      ctx.lineWidth = isSelected ? 2.5 : 1.3;
      ctx.strokeStyle = isSelected ? meta.color : statusCol;
      ctx.globalAlpha = isSelected ? 0.95 : 0.45;
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Desk surface
      const dw = isCmd ? 128 : 108;
      const dh = 52;
      const deskY = facingDown ? -10 : -42;
      roundedRect(ctx, -dw / 2, deskY, dw, dh, 10);
      ctx.fillStyle = "#182338";
      ctx.fill();
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = meta.color;
      ctx.stroke();

      // Monitor(s) on desk
      const monY = facingDown ? deskY + 34 : deskY + 8;
      const monOffsets = isCmd ? [-28, 28] : [0];
      for (const mx of monOffsets) {
        roundedRect(ctx, mx - 21, monY, 42, 10, 3);
        ctx.fillStyle = status === "standby" ? "#1e293b" : meta.color;
        ctx.fill();
      }

      // Keyboard pad
      const kbY = facingDown ? deskY + 14 : deskY + 28;
      roundedRect(ctx, -18, kbY, 36, 9, 2);
      ctx.fillStyle = "#0b1220";
      ctx.fill();

      // Chair & Top-Down Seated Avatar
      const avY = facingDown ? -30 : 28;
      roundedRect(ctx, -20, avY - 14, 40, 28, 9);
      ctx.fillStyle = "#1e293b";
      ctx.fill();

      // Typing arm sway when working
      const sway = isWorking ? Math.sin(t * 9 + pos.x) * 2.5 : 0;
      ctx.fillStyle = "#cbd5e1";
      ctx.beginPath();
      ctx.arc(-14, avY + (facingDown ? 10 + sway : -10 - sway), 5.5, 0, Math.PI * 2);
      ctx.arc(14, avY + (facingDown ? 10 - sway : -10 + sway), 5.5, 0, Math.PI * 2);
      ctx.fill();

      // Shoulders + Head
      roundedRect(ctx, -17, avY - 9, 34, 18, 9);
      ctx.fillStyle = meta.color;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(0, avY, 11, 0, Math.PI * 2);
      ctx.fillStyle = "#f1f5f9";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#0f172a";
      ctx.stroke();

      // Nameplate & status pill under/above desk
      const labelY = facingDown ? 64 : 62;
      roundedRect(ctx, -74, labelY, 148, 36, 8);
      ctx.fillStyle = "rgba(8, 13, 24, 0.92)";
      ctx.fill();
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = isSelected ? meta.color : "rgba(148, 163, 184, 0.28)";
      ctx.stroke();

      // Status dot
      ctx.beginPath();
      ctx.arc(-60, labelY + 12, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = statusCol;
      ctx.fill();

      ctx.font = "700 11.5px 'JetBrains Mono', monospace";
      ctx.fillStyle = "#f8fafc";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(`${meta.id} · ${meta.name}`, -50, labelY + 12);

      ctx.font = "500 10px 'JetBrains Mono', monospace";
      ctx.fillStyle = "#94a3b8";
      const bal = hb.balance || "$0.00";
      ctx.fillText(`${isCmd ? "CMD" : meta.role} · ${status.toUpperCase()} · ${bal}`, -62, labelY + 27);

      ctx.restore();

      // Floating speech bubble (latest peer chat or task)
      const bubbleText = latestBubbleFor(meta.id);
      const bubbleY = facingDown ? pos.y - 84 : pos.y - 82;
      drawBubble(ctx, pos.x, bubbleY, bubbleText, meta.color, meta.id === "muse-5");
    }

    // Animated peer-to-peer message orbs
    for (let i = packets.length - 1; i >= 0; i--) {
      const p = packets[i];
      p.t += 0.016 * p.speed;
      if (p.t >= 1) {
        packets.splice(i, 1);
        continue;
      }
      const x = p.ax + (p.bx - p.ax) * p.t;
      const y = p.ay + (p.by - p.ay) * p.t;
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 14;
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }

  function animate(now) {
    requestAnimationFrame(animate);
    drawFloorplan(now * 0.001);
  }
  requestAnimationFrame(animate);

  return {
    focusDesk,
    resetCamera,
    resize,
    triggerPacket,
    updateState,
  };
}
