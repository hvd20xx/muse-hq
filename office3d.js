import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const DEFAULT_CAM_POS = new THREE.Vector3(0, 11.2, 13.8);
const DEFAULT_TARGET = new THREE.Vector3(0, 0.8, -0.4);

const STATUS_COLORS = {
  working: "#34d399",
  online: "#38bdf8",
  idle: "#38bdf8",
  standby: "#64748b",
  error: "#fb7185",
};

function createSignTexture(title, subtitle) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#0a101d";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(245, 158, 11, 0.6)";
  ctx.lineWidth = 6;
  ctx.strokeRect(12, 12, canvas.width - 24, canvas.height - 24);

  ctx.fillStyle = "#fbbf24";
  ctx.font = "bold 68px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(title, canvas.width / 2, 118);

  ctx.fillStyle = "#94a3b8";
  ctx.font = "500 32px 'JetBrains Mono', monospace";
  ctx.fillText(subtitle, canvas.width / 2, 184);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function drawScreenCanvas(canvas, meta, status, task) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  const accent = meta.color || "#38bdf8";

  ctx.fillStyle = "#080e1a";
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, w, 12);

  ctx.fillStyle = "#f8fafc";
  ctx.font = "bold 28px 'JetBrains Mono', monospace";
  ctx.textAlign = "left";
  ctx.fillText(`${meta.id} · ${meta.name}`, 20, 56);

  ctx.fillStyle = STATUS_COLORS[status] || "#38bdf8";
  ctx.font = "bold 18px 'JetBrains Mono', monospace";
  ctx.fillText(`● ${(status || "standby").toUpperCase()}`, 20, 90);

  ctx.fillStyle = "#cbd5e1";
  ctx.font = "16px Inter, sans-serif";
  const text = (task || meta.subtitle || "").slice(0, 36);
  ctx.fillText(text, 20, 128);

  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = i % 2 === 0 ? "rgba(148,163,184,0.22)" : "rgba(56,189,248,0.24)";
    ctx.fillRect(20, 150 + i * 16, 150 + ((i * 53) % 140), 7);
  }
}

export function createOfficeScene({ canvas, nameplateLayer, roster, onSelect }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#070b12");
  scene.fog = new THREE.FogExp2("#070b12", 0.022);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.copy(DEFAULT_CAM_POS);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.maxPolarAngle = Math.PI * 0.46;
  controls.minDistance = 5.5;
  controls.maxDistance = 26;
  controls.target.copy(DEFAULT_TARGET);

  const ambient = new THREE.AmbientLight("#b9d4ff", 0.55);
  scene.add(ambient);

  const keyLight = new THREE.DirectionalLight("#fff3dc", 1.75);
  keyLight.position.set(7, 14, 9);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(2048, 2048);
  keyLight.shadow.camera.near = 2;
  keyLight.shadow.camera.far = 36;
  keyLight.shadow.camera.left = -13;
  keyLight.shadow.camera.right = 13;
  keyLight.shadow.camera.top = 11;
  keyLight.shadow.camera.bottom = -11;
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight("#38bdf8", 0.55);
  rimLight.position.set(-9, 8, -10);
  scene.add(rimLight);

  // Studio floor & grid
  const floorGeo = new THREE.BoxGeometry(24, 0.4, 16);
  const floorMat = new THREE.MeshStandardMaterial({ color: "#0f1624", roughness: 0.78, metalness: 0.18 });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.position.y = -0.2;
  floor.receiveShadow = true;
  scene.add(floor);

  const grid = new THREE.GridHelper(24, 24, 0x26354f, 0x162033);
  grid.position.y = 0.01;
  scene.add(grid);

  // Commander elevated dais
  const dais = new THREE.Mesh(
    new THREE.CylinderGeometry(2.7, 3.05, 0.35, 32),
    new THREE.MeshStandardMaterial({ color: "#172033", roughness: 0.5, metalness: 0.35 })
  );
  dais.position.set(0, 0.175, -3.2);
  dais.receiveShadow = true;
  scene.add(dais);

  const commandRing = new THREE.Mesh(
    new THREE.TorusGeometry(2.86, 0.04, 12, 64),
    new THREE.MeshBasicMaterial({ color: "#f59e0b", transparent: true, opacity: 0.65 })
  );
  commandRing.rotation.x = Math.PI / 2;
  commandRing.position.set(0, 0.05, -3.2);
  scene.add(commandRing);

  // Architectural back glass wall & HQ sign
  const backWall = new THREE.Mesh(
    new THREE.BoxGeometry(22, 4.8, 0.2),
    new THREE.MeshStandardMaterial({
      color: "#121c2e",
      roughness: 0.22,
      metalness: 0.5,
      transparent: true,
      opacity: 0.85,
    })
  );
  backWall.position.set(0, 2.4, -6.9);
  scene.add(backWall);

  const signMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(7.6, 1.85),
    new THREE.MeshBasicMaterial({ map: createSignTexture("MUSE FLEET HQ", "COMMANDER STUDIO -> WORKERS BUS") })
  );
  signMesh.position.set(0, 3.1, -6.78);
  scene.add(signMesh);

  // Server rack & studio plants
  const rack = new THREE.Mesh(
    new THREE.BoxGeometry(1.1, 2.7, 0.9),
    new THREE.MeshStandardMaterial({ color: "#111827", roughness: 0.4, metalness: 0.7 })
  );
  rack.position.set(-9.5, 1.35, -5.6);
  rack.castShadow = true;
  scene.add(rack);

  const rackLeds = [];
  for (let i = 0; i < 6; i++) {
    const led = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.07, 0.05),
      new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? "#38bdf8" : "#34d399" })
    );
    led.position.set(-9.5, 0.5 + i * 0.36, -5.13);
    scene.add(led);
    rackLeds.push(led);
  }

  for (const [px, pz] of [[-10.4, 5.2], [10.4, 5.2], [9.5, -5.6]]) {
    const pot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.32, 0.65, 14),
      new THREE.MeshStandardMaterial({ color: "#1e293b", roughness: 0.7 })
    );
    pot.position.set(px, 0.325, pz);
    pot.castShadow = true;
    scene.add(pot);

    const leaves = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.68, 1),
      new THREE.MeshStandardMaterial({ color: "#15803d", roughness: 0.85 })
    );
    leaves.position.set(px, 1.15, pz);
    leaves.castShadow = true;
    scene.add(leaves);
  }

  // Build 6 named workstations
  const stations = new Map();
  const pickMeshes = [];

  for (const meta of roster) {
    const isCmd = meta.role === "COMMANDER";
    const group = new THREE.Group();
    group.position.set(...meta.position);
    group.rotation.y = meta.rotationY || 0;

    const deskWidth = isCmd ? 3.2 : 2.35;
    const deskDepth = isCmd ? 1.3 : 1.05;
    const deskTopMat = new THREE.MeshStandardMaterial({
      color: isCmd ? "#232c3f" : "#1a2334",
      roughness: 0.42,
      metalness: 0.35,
    });
    const deskTop = new THREE.Mesh(new THREE.BoxGeometry(deskWidth, 0.1, deskDepth), deskTopMat);
    deskTop.position.y = 0.82;
    deskTop.castShadow = true;
    deskTop.receiveShadow = true;
    deskTop.userData.museId = meta.id;
    group.add(deskTop);
    pickMeshes.push(deskTop);

    const trim = new THREE.Mesh(
      new THREE.BoxGeometry(deskWidth + 0.02, 0.035, 0.04),
      new THREE.MeshBasicMaterial({ color: meta.color })
    );
    trim.position.set(0, 0.78, deskDepth / 2);
    group.add(trim);

    const legGeo = new THREE.BoxGeometry(0.08, 0.78, 0.08);
    const legMat = new THREE.MeshStandardMaterial({ color: "#0c121e", metalness: 0.6, roughness: 0.4 });
    for (const lx of [-deskWidth / 2 + 0.14, deskWidth / 2 - 0.14]) {
      for (const lz of [-deskDepth / 2 + 0.14, deskDepth / 2 - 0.14]) {
        const leg = new THREE.Mesh(legGeo, legMat);
        leg.position.set(lx, 0.39, lz);
        leg.castShadow = true;
        group.add(leg);
      }
    }

    // Monitor(s)
    const screenCanvas = document.createElement("canvas");
    screenCanvas.width = 400;
    screenCanvas.height = 240;
    drawScreenCanvas(screenCanvas, meta, meta.role === "STANDBY" ? "standby" : "online", meta.subtitle);
    const screenTex = new THREE.CanvasTexture(screenCanvas);
    screenTex.colorSpace = THREE.SRGBColorSpace;
    const screenMat = new THREE.MeshBasicMaterial({ map: screenTex });

    const monOffsets = isCmd ? [-0.62, 0.62] : [0];
    for (const mx of monOffsets) {
      const stand = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.24, 0.08), legMat);
      stand.position.set(mx, 0.96, -0.26);
      group.add(stand);

      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(1.12, 0.68, 0.06),
        new THREE.MeshStandardMaterial({ color: "#0b111d", roughness: 0.35 })
      );
      frame.position.set(mx, 1.32, -0.26);
      frame.rotation.y = isCmd ? (mx < 0 ? 0.16 : -0.16) : 0;
      frame.castShadow = true;
      frame.userData.museId = meta.id;
      group.add(frame);
      pickMeshes.push(frame);

      const display = new THREE.Mesh(new THREE.PlaneGeometry(1.02, 0.58), screenMat);
      display.position.set(0, 0, 0.034);
      frame.add(display);
    }

    // Chair & low-poly seated agent avatar
    const chairSeat = new THREE.Mesh(
      new THREE.BoxGeometry(0.62, 0.1, 0.58),
      new THREE.MeshStandardMaterial({ color: "#1e293b", roughness: 0.7 })
    );
    chairSeat.position.set(0, 0.48, 0.84);
    chairSeat.castShadow = true;
    group.add(chairSeat);

    const chairBack = new THREE.Mesh(
      new THREE.BoxGeometry(0.58, 0.7, 0.09),
      new THREE.MeshStandardMaterial({ color: "#1e293b", roughness: 0.7 })
    );
    chairBack.position.set(0, 0.85, 1.1);
    chairBack.castShadow = true;
    group.add(chairBack);

    const avatar = new THREE.Group();
    avatar.position.set(0, 0.55, 0.8);

    const torso = new THREE.Mesh(
      new THREE.BoxGeometry(0.48, 0.56, 0.3),
      new THREE.MeshStandardMaterial({ color: meta.color, roughness: 0.48, metalness: 0.2 })
    );
    torso.position.y = 0.32;
    torso.castShadow = true;
    torso.userData.museId = meta.id;
    avatar.add(torso);
    pickMeshes.push(torso);

    const head = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.32, 0.32),
      new THREE.MeshStandardMaterial({ color: "#e2e8f0", roughness: 0.45 })
    );
    head.position.y = 0.8;
    head.castShadow = true;
    avatar.add(head);

    const visor = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.1, 0.05),
      new THREE.MeshBasicMaterial({ color: "#090d16" })
    );
    visor.position.set(0, 0.81, -0.155);
    avatar.add(visor);

    const armGeo = new THREE.BoxGeometry(0.11, 0.11, 0.42);
    const armMat = new THREE.MeshStandardMaterial({ color: "#cbd5e1", roughness: 0.5 });
    const leftArm = new THREE.Mesh(armGeo, armMat);
    leftArm.position.set(-0.28, 0.42, -0.22);
    avatar.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, armMat);
    rightArm.position.set(0.28, 0.42, -0.22);
    avatar.add(rightArm);

    group.add(avatar);

    // Status floor halo ring
    const haloMat = new THREE.MeshBasicMaterial({
      color: meta.role === "STANDBY" ? "#64748b" : meta.color,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
    });
    const halo = new THREE.Mesh(new THREE.RingGeometry(1.45, 1.57, 40), haloMat);
    halo.rotation.x = -Math.PI / 2;
    halo.position.y = 0.025;
    group.add(halo);

    scene.add(group);

    // Floating HTML nameplate
    const plate = document.createElement("div");
    plate.className = `nameplate ${isCmd ? "commander" : ""}`;
    plate.style.setProperty("--desk-color", meta.color);
    plate.innerHTML = `
      <div class="np-top">
        <span class="np-name">${meta.id} · ${meta.name}</span>
        <span class="np-role ${isCmd ? "commander" : ""}">${meta.role}</span>
      </div>
      <div class="np-status-row">
        <i class="dot dot-${meta.role === "STANDBY" ? "standby" : "online"}"></i>
        <span class="np-task">${meta.subtitle}</span>
      </div>
    `;
    plate.addEventListener("click", (ev) => {
      ev.stopPropagation();
      focusDesk(meta.id);
      onSelect?.(meta.id);
    });
    nameplateLayer.appendChild(plate);

    stations.set(meta.id, {
      meta,
      group,
      avatar,
      head,
      leftArm,
      rightArm,
      haloMat,
      screenCanvas,
      screenTex,
      plate,
      status: meta.role === "STANDBY" ? "standby" : "online",
      task: meta.subtitle,
      anchorLocal: new THREE.Vector3(0, 2.38, 0),
    });
  }

  // Floor cables from Commander (muse-3) to all other desks
  const cables = new Map();
  const cmdPos = new THREE.Vector3(...stations.get("muse-3").meta.position);
  for (const [id, st] of stations) {
    if (id === "muse-3") continue;
    const end = new THREE.Vector3(...st.meta.position);
    const mid = new THREE.Vector3((cmdPos.x + end.x) * 0.5, 0.04, (cmdPos.z + end.z) * 0.5);
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(cmdPos.x, 0.04, cmdPos.z + 1.2),
      mid,
      new THREE.Vector3(end.x, 0.04, end.z - 0.8),
    ]);
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 24, 0.035, 8, false),
      new THREE.MeshBasicMaterial({ color: st.meta.color, transparent: true, opacity: 0.32 })
    );
    scene.add(tube);
    cables.set(id, curve);
  }

  // Active light-pulse packets along cables
  const packets = [];
  const packetGeo = new THREE.SphereGeometry(0.12, 12, 12);

  function spawnPacket(targetId, colorHex = "#fbbf24") {
    const curve = cables.get(targetId);
    if (!curve) return;
    const mesh = new THREE.Mesh(packetGeo, new THREE.MeshBasicMaterial({ color: colorHex }));
    scene.add(mesh);
    packets.push({ mesh, curve, t: 0, speed: 0.72 + Math.random() * 0.25 });
  }

  function triggerPacket(target, colorHex = "#fbbf24") {
    if (target === "all") {
      for (const id of ["muse-1", "muse-4", "muse-5"]) {
        spawnPacket(id, colorHex);
      }
      return;
    }
    spawnPacket(target, colorHex);
  }

  let selectedId = "muse-3";
  let cameraTargetGoal = null;
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let downXY = null;

  function focusDesk(id) {
    selectedId = id;
    for (const [sid, st] of stations) {
      st.plate.classList.toggle("selected", sid === id);
    }
    const st = stations.get(id);
    if (st) {
      cameraTargetGoal = new THREE.Vector3(...st.meta.position);
      cameraTargetGoal.y = 0.9;
    }
  }

  function resetCamera() {
    cameraTargetGoal = DEFAULT_TARGET.clone();
    camera.position.copy(DEFAULT_CAM_POS);
  }

  canvas.addEventListener("pointerdown", (e) => {
    downXY = { x: e.clientX, y: e.clientY };
  });

  canvas.addEventListener("pointerup", (e) => {
    if (!downXY) return;
    const dist = Math.hypot(e.clientX - downXY.x, e.clientY - downXY.y);
    downXY = null;
    if (dist > 6) return;

    const rect = canvas.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(pickMeshes, false);
    if (hits.length > 0 && hits[0].object.userData.museId) {
      const id = hits[0].object.userData.museId;
      focusDesk(id);
      onSelect?.(id);
    }
  });

  function updateStationVisuals(heartbeats) {
    for (const [id, st] of stations) {
      const hb = heartbeats?.[id];
      const status = hb?.status || (st.meta.role === "STANDBY" ? "standby" : "online");
      const task = hb?.task || st.meta.subtitle;
      st.status = status;
      st.task = task;
      st.haloMat.color.set(STATUS_COLORS[status] || st.meta.color);
      drawScreenCanvas(st.screenCanvas, st.meta, status, task);
      st.screenTex.needsUpdate = true;

      const dotEl = st.plate.querySelector(".dot");
      const taskEl = st.plate.querySelector(".np-task");
      if (dotEl) {
        dotEl.className = `dot dot-${st.meta.role === "COMMANDER" ? "commander" : status}`;
      }
      if (taskEl) taskEl.textContent = task;
      st.plate.classList.toggle("selected", id === selectedId);
    }
  }

  function resize() {
    const parent = canvas.parentElement;
    if (!parent) return;
    const w = parent.clientWidth;
    const h = parent.clientHeight;
    if (w === 0 || h === 0) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  window.addEventListener("resize", resize);
  if (typeof ResizeObserver !== "undefined" && canvas.parentElement) {
    new ResizeObserver(resize).observe(canvas.parentElement);
  }
  resize();

  const tempVec = new THREE.Vector3();
  let lastTime = performance.now();

  function animate(now) {
    requestAnimationFrame(animate);
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    const t = now * 0.001;

    commandRing.rotation.z = t * 0.4;
    for (let i = 0; i < rackLeds.length; i++) {
      rackLeds[i].visible = Math.sin(t * 4 + i * 1.4) > -0.3;
    }

    let idx = 0;
    for (const [, st] of stations) {
      idx += 1;
      const isWorking = st.status === "working";
      const speed = isWorking ? 12 : st.status === "standby" ? 0 : 2.4;
      if (speed > 0) {
        st.leftArm.position.y = 0.42 + Math.sin(t * speed + idx) * (isWorking ? 0.035 : 0.008);
        st.rightArm.position.y = 0.42 + Math.cos(t * speed + idx) * (isWorking ? 0.035 : 0.008);
        st.head.rotation.y = Math.sin(t * 0.9 + idx * 2) * 0.14;
      } else {
        st.head.rotation.x = 0.22;
      }
    }

    for (let i = packets.length - 1; i >= 0; i--) {
      const p = packets[i];
      p.t += dt * p.speed;
      if (p.t >= 1) {
        scene.remove(p.mesh);
        p.mesh.material.dispose();
        packets.splice(i, 1);
      } else {
        p.curve.getPoint(p.t, p.mesh.position);
      }
    }

    if (cameraTargetGoal) {
      controls.target.lerp(cameraTargetGoal, 0.08);
      if (controls.target.distanceTo(cameraTargetGoal) < 0.03) cameraTargetGoal = null;
    }

    controls.update();
    renderer.render(scene, camera);

    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    for (const [, st] of stations) {
      tempVec.copy(st.anchorLocal).applyMatrix4(st.group.matrixWorld);
      tempVec.project(camera);
      if (tempVec.z > 1) {
        st.plate.style.display = "none";
      } else {
        const px = (tempVec.x * 0.5 + 0.5) * w;
        const py = (-tempVec.y * 0.5 + 0.5) * h;
        st.plate.style.display = "block";
        st.plate.style.transform = `translate(-50%, -100%) translate3d(${px.toFixed(1)}px, ${py.toFixed(1)}px, 0)`;
      }
    }
  }

  requestAnimationFrame(animate);

  return {
    focusDesk,
    resetCamera,
    resize,
    triggerPacket,
    updateStationVisuals,
  };
}
