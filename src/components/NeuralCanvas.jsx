import { useEffect, useRef } from "react";

// ---------------------------------------------------------------------------
// Palette — muted base, soft activity colours
// ---------------------------------------------------------------------------
const BASE_COLOR = [100, 120, 145];    // grey-blue for dormant neurons + edges
const FIRE_COLORS = [
  [80, 200, 220],   // soft cyan
  [140, 120, 230],  // soft purple
  [60, 190, 170],   // teal-green
];

// ---------------------------------------------------------------------------
// Tuning
// ---------------------------------------------------------------------------
const CLUSTER_COUNT_DESKTOP = 14;
const CLUSTER_COUNT_MOBILE = 8;
const NODES_PER_CLUSTER_MIN = 22;
const NODES_PER_CLUSTER_MAX = 38;
const CLUSTER_RADIUS_MIN = 130;
const CLUSTER_RADIUS_MAX = 280;
const SCATTER_COUNT_DESKTOP = 120;
const SCATTER_COUNT_MOBILE = 50;
const CONNECTION_RADIUS = 150;
const CONNECTION_PROB = 0.55;

const SIGNAL_SPEED_MIN = 0.008;
const SIGNAL_SPEED_MAX = 0.018;
const CASCADE_PROB = 0.55;
const MAX_CASCADE_DEPTH = 8;
const MAX_CONCURRENT_SIGNALS = 60;
const HOVER_RADIUS = 150;
const HOVER_BRIGHTNESS = 0.4;

// Burst / silence rhythm
const BURST_FIRE_COUNT_MIN = 4;
const BURST_FIRE_COUNT_MAX = 12;
const BURST_FIRE_GAP_MIN = 4;          // ~65ms between fires in a burst
const BURST_FIRE_GAP_MAX = 14;         // ~230ms
const SILENCE_MIN = 120;               // ~2 s
const SILENCE_MAX = 360;               // ~6 s
const BURST_COOLDOWN_MIN = 30;
const BURST_COOLDOWN_MAX = 90;

// ---------------------------------------------------------------------------
// Gaussian-ish random — for organic clustering
// ---------------------------------------------------------------------------
function gaussRand() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// ---------------------------------------------------------------------------
// Graph generation — clustered neurons + curved dendrites
// ---------------------------------------------------------------------------
function addEdge(nodes, edges, i, j) {
  const dx = nodes[j].x - nodes[i].x;
  const dy = nodes[j].y - nodes[i].y;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
  const mx = (nodes[i].x + nodes[j].x) / 2;
  const my = (nodes[i].y + nodes[j].y) / 2;
  const perpX = -dy / dist;
  const perpY = dx / dist;
  const offset = (Math.random() - 0.5) * 35;
  const edgeIdx = edges.length;
  edges.push({
    from: i,
    to: j,
    cpx: mx + perpX * offset,
    cpy: my + perpY * offset,
  });
  nodes[i].connections.push(edgeIdx);
  nodes[j].connections.push(edgeIdx);
}

function buildGraph(w, h, isMobile) {
  const clusterCount = isMobile ? CLUSTER_COUNT_MOBILE : CLUSTER_COUNT_DESKTOP;
  const nodes = [];
  const edges = [];
  const pad = 60;

  // Place cluster centres across the viewport
  const centres = Array.from({ length: clusterCount }, () => ({
    x: pad + Math.random() * (w - pad * 2),
    y: pad + Math.random() * (h - pad * 2),
  }));

  // Populate each cluster with neurons (gaussian distribution from centre)
  for (const c of centres) {
    const start = nodes.length;
    const count = NODES_PER_CLUSTER_MIN +
      Math.floor(Math.random() * (NODES_PER_CLUSTER_MAX - NODES_PER_CLUSTER_MIN));
    const radius = CLUSTER_RADIUS_MIN +
      Math.random() * (CLUSTER_RADIUS_MAX - CLUSTER_RADIUS_MIN);

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.abs(gaussRand()) * radius * 0.45;
      nodes.push({
        x: Math.max(4, Math.min(w - 4, c.x + Math.cos(angle) * dist)),
        y: Math.max(4, Math.min(h - 4, c.y + Math.sin(angle) * dist)),
        r: 2.2 + Math.random() * 2.3,
        connections: [],
        brightness: 0,
        baseBrightness: 0.2 + Math.random() * 0.15,
      });
    }
  }

  // Scatter fill neurons uniformly so there are no dead zones
  const scatterCount = isMobile ? SCATTER_COUNT_MOBILE : SCATTER_COUNT_DESKTOP;
  for (let i = 0; i < scatterCount; i++) {
    nodes.push({
      x: pad * 0.5 + Math.random() * (w - pad),
      y: pad * 0.5 + Math.random() * (h - pad),
      r: 2 + Math.random() * 1.8,
      connections: [],
      brightness: 0,
      baseBrightness: 0.18 + Math.random() * 0.12,
    });
  }

  // Connect nearby neurons with curved dendrites
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[j].x - nodes[i].x;
      const dy = nodes[j].y - nodes[i].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > CONNECTION_RADIUS) continue;
      const prob = (1 - dist / CONNECTION_RADIUS) * CONNECTION_PROB;
      if (Math.random() > prob) continue;
      addEdge(nodes, edges, i, j);
    }
  }

  return { nodes, edges };
}

// ---------------------------------------------------------------------------
// Render the static layer to an offscreen canvas (called once per resize)
//   — all edges + dormant node bases
//   — never re-drawn per frame, just blitted as an image
// ---------------------------------------------------------------------------
function renderStaticLayer(offscreen, w, h, dpr, nodes, edges) {
  offscreen.width = w * dpr;
  offscreen.height = h * dpr;
  const ctx = offscreen.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const [br, bg, bb] = BASE_COLOR;

  // Edges — curved dendrites
  ctx.lineCap = "round";
  for (const edge of edges) {
    const nA = nodes[edge.from];
    const nB = nodes[edge.to];
    ctx.beginPath();
    ctx.moveTo(nA.x, nA.y);
    ctx.quadraticCurveTo(edge.cpx, edge.cpy, nB.x, nB.y);
    ctx.strokeStyle = `rgba(${br}, ${bg}, ${bb}, 0.12)`;
    ctx.lineWidth = 0.7;
    ctx.stroke();
  }

  // Node somas — visible base dots with soft glow
  for (const node of nodes) {
    const alpha = node.baseBrightness;

    // Outer glow
    const gr = node.r * 4;
    const grad = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, gr);
    grad.addColorStop(0, `rgba(${br}, ${bg}, ${bb}, ${alpha * 0.2})`);
    grad.addColorStop(1, "transparent");
    ctx.beginPath();
    ctx.arc(node.x, node.y, gr, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Core
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${br}, ${bg}, ${bb}, ${alpha})`;
    ctx.fill();
  }
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function NeuralCanvas() {
  const canvasRef = useRef(null);
  const state = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const offscreen = document.createElement("canvas");

    const s = {
      mouse: { x: -9999, y: -9999 },
      nodes: [],
      edges: [],
      signals: [],
      frame: 0,
      animId: 0,
      w: 0,
      h: 0,
      dpr: 1,
      // Burst state machine
      burstState: "silence",            // "silence" | "burst" | "cooldown"
      stateEnd: 120 + Math.random() * 180,
      burstRemaining: 0,
      nextBurstFire: 0,
    };
    state.current = s;

    // ---- Resize: regenerate the entire graph + static layer ----
    function init() {
      s.dpr = Math.min(window.devicePixelRatio || 1, 2);
      s.w = window.innerWidth;
      s.h = window.innerHeight;
      canvas.width = s.w * s.dpr;
      canvas.height = s.h * s.dpr;
      canvas.style.width = s.w + "px";
      canvas.style.height = s.h + "px";

      const isMobile = s.w < 768;
      const graph = buildGraph(s.w, s.h, isMobile);
      s.nodes = graph.nodes;
      s.edges = graph.edges;
      s.signals = [];
      s.frame = 0;

      renderStaticLayer(offscreen, s.w, s.h, s.dpr, s.nodes, s.edges);
    }

    // ---- Spawn a signal cascade from a neuron ----
    function fireNeuron(nodeIdx, depth) {
      if (s.signals.length >= MAX_CONCURRENT_SIGNALS) return;

      const node = s.nodes[nodeIdx];
      node.brightness = 1;

      if (node.connections.length === 0) return;

      // Fan-out decreases with depth: 2-3 at root, 1-2 deeper in
      const maxOut = depth < 2 ? 3 : 2;
      const outCount = 1 + Math.floor(Math.random() * Math.min(maxOut, node.connections.length));
      const shuffled = [...node.connections].sort(() => Math.random() - 0.5);
      const budget = MAX_CONCURRENT_SIGNALS - s.signals.length;

      for (let i = 0; i < Math.min(outCount, budget); i++) {
        const edgeIdx = shuffled[i];
        const edge = s.edges[edgeIdx];
        const direction = edge.from === nodeIdx ? 1 : -1;

        s.signals.push({
          edgeIdx,
          progress: direction === 1 ? 0 : 1,
          speed: (SIGNAL_SPEED_MIN + Math.random() * (SIGNAL_SPEED_MAX - SIGNAL_SPEED_MIN)) * direction,
          depth,
          color: FIRE_COLORS[Math.floor(Math.random() * FIRE_COLORS.length)],
        });
      }
    }

    // ---- Animation loop ----
    function draw() {
      const { w, h, dpr, nodes, edges, signals, mouse } = s;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // 1. Blit the static layer (edges + base nodes) — single fast call
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(offscreen, 0, 0, w, h);

      s.frame++;

      // 2. Decay brightness on all nodes
      for (const node of nodes) {
        node.brightness *= 0.955;
        if (node.brightness < 0.005) node.brightness = 0;
      }

      // 3. Mouse hover — subtle local highlight
      if (mouse.x > 0 && mouse.y > 0) {
        for (const node of nodes) {
          const dx = mouse.x - node.x;
          const dy = mouse.y - node.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < HOVER_RADIUS) {
            const strength = (1 - dist / HOVER_RADIUS) * HOVER_BRIGHTNESS;
            node.brightness = Math.max(node.brightness, strength);
          }
        }
      }

      // 4. Draw active (bright) nodes — only those above threshold
      for (const node of nodes) {
        if (node.brightness < 0.01) continue;
        const b = node.brightness;
        const [cr, cg, cb] = b > 0.25
          ? FIRE_COLORS[Math.floor(b * 2.99) % FIRE_COLORS.length]
          : BASE_COLOR;
        const alpha = Math.min(1, b * 0.85);

        // Core — grows when firing
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.r + b * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${alpha})`;
        ctx.fill();

        // Glow halo — large, soft
        const gr = node.r * 6 + b * 18;
        const grad = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, gr);
        grad.addColorStop(0, `rgba(${cr}, ${cg}, ${cb}, ${alpha * 0.35})`);
        grad.addColorStop(0.5, `rgba(${cr}, ${cg}, ${cb}, ${alpha * 0.08})`);
        grad.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(node.x, node.y, gr, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // 5. Advance signals (invisible travel — only nodes glow on arrival)
      for (let i = signals.length - 1; i >= 0; i--) {
        const sig = signals[i];
        sig.progress += sig.speed;

        const done = sig.speed > 0 ? sig.progress >= 1 : sig.progress <= 0;
        if (done) {
          const edge = edges[sig.edgeIdx];
          const destIdx = sig.speed > 0 ? edge.to : edge.from;
          nodes[destIdx].brightness = 1;

          const depthProb = CASCADE_PROB * Math.pow(0.82, sig.depth);
          if (sig.depth < MAX_CASCADE_DEPTH && Math.random() < depthProb) {
            fireNeuron(destIdx, sig.depth + 1);
          }
          signals.splice(i, 1);
        }
      }

      // 6. Burst / silence state machine
      if (s.frame >= s.stateEnd) {
        if (s.burstState === "silence") {
          // Transition to burst
          s.burstState = "burst";
          s.burstRemaining = BURST_FIRE_COUNT_MIN +
            Math.floor(Math.random() * (BURST_FIRE_COUNT_MAX - BURST_FIRE_COUNT_MIN));
          s.nextBurstFire = s.frame;
          s.stateEnd = Infinity; // burst ends when burstRemaining hits 0
        } else if (s.burstState === "cooldown") {
          // After cooldown, either burst again or go silent
          if (Math.random() < 0.4) {
            // Chain into another burst
            s.burstState = "burst";
            s.burstRemaining = BURST_FIRE_COUNT_MIN +
              Math.floor(Math.random() * (BURST_FIRE_COUNT_MAX - BURST_FIRE_COUNT_MIN - 2));
            s.nextBurstFire = s.frame;
            s.stateEnd = Infinity;
          } else {
            s.burstState = "silence";
            s.stateEnd = s.frame + SILENCE_MIN + Math.random() * (SILENCE_MAX - SILENCE_MIN);
          }
        }
      }

      if (s.burstState === "burst" && s.frame >= s.nextBurstFire && s.burstRemaining > 0) {
        const startNode = Math.floor(Math.random() * nodes.length);
        fireNeuron(startNode, 0);
        s.burstRemaining--;
        s.nextBurstFire = s.frame + BURST_FIRE_GAP_MIN +
          Math.random() * (BURST_FIRE_GAP_MAX - BURST_FIRE_GAP_MIN);

        if (s.burstRemaining <= 0) {
          s.burstState = "cooldown";
          s.stateEnd = s.frame + BURST_COOLDOWN_MIN +
            Math.random() * (BURST_COOLDOWN_MAX - BURST_COOLDOWN_MIN);
        }
      }

      s.animId = requestAnimationFrame(draw);
    }

    // ---- Bootstrap ----
    init();
    draw();

    let resizeTimer;
    let lastWidth = s.w;
    const onResize = () => {
      const newWidth = window.innerWidth;
      if (newWidth === lastWidth) return; // ignore address-bar hide/show
      lastWidth = newWidth;
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(init, 200);
    };
    const onMouse = (e) => { s.mouse = { x: e.clientX, y: e.clientY }; };
    const onTouch = (e) => {
      const t = e.touches[0];
      if (t) s.mouse = { x: t.clientX, y: t.clientY };
    };
    const onLeave = () => { s.mouse = { x: -9999, y: -9999 }; };

    function findNearest(px, py) {
      let best = -1, bestDist = Infinity;
      for (let i = 0; i < s.nodes.length; i++) {
        const dx = s.nodes[i].x - px;
        const dy = s.nodes[i].y - py;
        const d = dx * dx + dy * dy;
        if (d < bestDist) { bestDist = d; best = i; }
      }
      return best;
    }

    const onMouseDown = (e) => {
      const idx = findNearest(e.clientX, e.clientY);
      if (idx >= 0) fireNeuron(idx, 0);
    };
    const onTouchStart = (e) => {
      const t = e.touches[0];
      if (!t) return;
      s.mouse = { x: t.clientX, y: t.clientY };
      const idx = findNearest(t.clientX, t.clientY);
      if (idx >= 0) fireNeuron(idx, 0);
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", onMouse);
    window.addEventListener("touchmove", onTouch, { passive: true });
    window.addEventListener("mouseleave", onLeave);
    window.addEventListener("touchend", onLeave);
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("touchstart", onTouchStart, { passive: true });

    return () => {
      cancelAnimationFrame(s.animId);
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("touchmove", onTouch);
      window.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("touchend", onLeave);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("touchstart", onTouchStart);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="neural-canvas"
      aria-hidden="true"
    />
  );
}
