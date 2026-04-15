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
const MAX_CASCADE_DEPTH = 5;
const MAX_CONCURRENT_SIGNALS = 60;
const HOVER_RADIUS = 150;
const HOVER_POTENTIAL_BOOST = 0.015;

const LEAK_RATE = 0.985;
const FIRE_PHASE_SPEED = 0.035;
const REFRACTORY_MIN = 18;
const REFRACTORY_MAX = 28;
const INHIBITORY_RATIO = 0.2;

// Synaptic plasticity
const EDGE_DECAY_RATE = 0.9997;
const EDGE_STRENGTHEN = 0.05;
const EDGE_DEATH_THRESHOLD = 0.05;
const EDGE_INITIAL_STRENGTH = 0.5;
const EDGE_NEW_STRENGTH = 0.15;
const GROWTH_INTERVAL = 90;
const GROWTH_RADIUS = 200;
const MAX_CONNECTIONS = 8;
const PRUNE_INTERVAL = 180;
const STATIC_REDRAW_INTERVAL = 90;

// Burst / silence rhythm
const BURST_FIRE_COUNT_MIN = 4;
const BURST_FIRE_COUNT_MAX = 12;
const BURST_FIRE_GAP_MIN = 4;
const BURST_FIRE_GAP_MAX = 14;
const SILENCE_MIN = 120;
const SILENCE_MAX = 360;
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
function addEdge(nodes, edges, i, j, strength = EDGE_INITIAL_STRENGTH) {
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
    excitatory: Math.random() > INHIBITORY_RATIO,
    weight: 0.3 + Math.random() * 0.3,
    strength,
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
  const clusterRanges = [];
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
        baseBrightness: 0.2 + Math.random() * 0.15,
        potential: 0,
        threshold: 0.4 + Math.random() * 0.3,
        refractory: 0,
        firePhase: 0,
      });
    }
    clusterRanges.push([start, nodes.length]);
  }

  // Scatter fill neurons uniformly so there are no dead zones
  const scatterCount = isMobile ? SCATTER_COUNT_MOBILE : SCATTER_COUNT_DESKTOP;
  for (let i = 0; i < scatterCount; i++) {
    nodes.push({
      x: pad * 0.5 + Math.random() * (w - pad),
      y: pad * 0.5 + Math.random() * (h - pad),
      r: 2 + Math.random() * 1.8,
      connections: [],
      baseBrightness: 0.18 + Math.random() * 0.12,
      potential: 0,
      threshold: 0.4 + Math.random() * 0.3,
      refractory: 0,
      firePhase: 0,
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

  // Guarantee every cluster neuron has at least one intra-cluster connection
  for (const [start, end] of clusterRanges) {
    for (let i = start; i < end; i++) {
      if (nodes[i].connections.length > 0) continue;
      let bestJ = -1, bestDist = Infinity;
      for (let j = start; j < end; j++) {
        if (j === i) continue;
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const d = dx * dx + dy * dy;
        if (d < bestDist) { bestDist = d; bestJ = j; }
      }
      if (bestJ >= 0) addEdge(nodes, edges, i, bestJ);
    }
  }

  return { nodes, edges };
}

// ---------------------------------------------------------------------------
// Action potential waveform — maps firePhase (0→1) to visual brightness
// ---------------------------------------------------------------------------
function actionPotentialCurve(phase) {
  if (phase <= 0.2) return phase / 0.2;
  if (phase <= 0.35) return 1;
  if (phase <= 0.7) return 1 - (phase - 0.35) / 0.35;
  return -0.15 * (1 - (phase - 0.7) / 0.3);
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
    const sa = Math.min(1, (edge.strength || EDGE_INITIAL_STRENGTH) * 2);
    ctx.strokeStyle = edge.excitatory
      ? `rgba(${br}, ${bg}, ${bb}, ${0.12 * sa})`
      : `rgba(130, 105, 135, ${0.10 * sa})`;
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
export default function NeuralCanvas({ showSignals = false }) {
  const canvasRef = useRef(null);
  const state = useRef(null);
  const showSignalsRef = useRef(showSignals);

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
      burstState: "silence",
      stateEnd: 120 + Math.random() * 180,
      burstRemaining: 0,
      nextBurstFire: 0,
      burstNearby: [],
      burstFiredCount: 0,
      staticDirty: false,
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
      s.burstNearby = [];
      s.burstFiredCount = 0;

      renderStaticLayer(offscreen, s.w, s.h, s.dpr, s.nodes, s.edges);
    }

    // ---- Fire a neuron: start action-potential arc + send signals ----
    function fireNeuron(nodeIdx, depth) {
      if (s.signals.length >= MAX_CONCURRENT_SIGNALS) return;

      const node = s.nodes[nodeIdx];
      if (node.refractory > 0 || node.firePhase > 0) return;

      node.firePhase = 0.01;
      node.refractory = REFRACTORY_MIN +
        Math.floor(Math.random() * (REFRACTORY_MAX - REFRACTORY_MIN));
      node.potential = 0;

      if (node.connections.length === 0) return;

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

    // ---- Pick a cluster center + sort nearby neurons for burst firing ----
    function prepareBurst() {
      const cx = Math.random() * s.w;
      const cy = Math.random() * s.h;
      const nearby = [];
      for (let i = 0; i < s.nodes.length; i++) {
        const dx = s.nodes[i].x - cx;
        const dy = s.nodes[i].y - cy;
        nearby.push({ idx: i, d: dx * dx + dy * dy });
      }
      nearby.sort((a, b) => a.d - b.d);
      s.burstNearby = nearby;
      s.burstFiredCount = 0;
    }

    // ---- Animation loop ----
    function draw() {
      const { w, h, dpr, nodes, edges, signals, mouse } = s;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(offscreen, 0, 0, w, h);

      s.frame++;

      // 1. Per-neuron updates: leak potential, advance firePhase, decrement refractory
      for (const node of nodes) {
        if (node.potential > 0) {
          node.potential *= LEAK_RATE;
          if (node.potential < 0.005) node.potential = 0;
        } else if (node.potential < 0) {
          node.potential *= LEAK_RATE;
          if (node.potential > -0.005) node.potential = 0;
        }

        if (node.refractory > 0) node.refractory--;

        if (node.firePhase > 0) {
          node.firePhase += FIRE_PHASE_SPEED;
          if (node.firePhase >= 1) node.firePhase = 0;
        }
      }

      // 2. Mouse hover — gently raises nearby neurons' potential
      if (mouse.x > 0 && mouse.y > 0) {
        for (let ni = 0; ni < nodes.length; ni++) {
          const node = nodes[ni];
          const dx = mouse.x - node.x;
          const dy = mouse.y - node.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < HOVER_RADIUS && node.refractory === 0 && node.firePhase === 0) {
            const boost = (1 - dist / HOVER_RADIUS) * HOVER_POTENTIAL_BOOST;
            node.potential += boost;
            if (node.potential >= node.threshold) {
              fireNeuron(ni, 0);
            }
          }
        }
      }

      // 3. Draw active neurons — action-potential arc or sub-threshold glow
      for (const node of nodes) {
        let b = 0;
        let colorIdx = 0;

        if (node.firePhase > 0) {
          b = actionPotentialCurve(node.firePhase);
          if (node.firePhase <= 0.35) colorIdx = 0;
          else if (node.firePhase <= 0.7) colorIdx = 1;
          else colorIdx = 2;
        } else if (node.potential > 0.05) {
          b = (node.potential / node.threshold) * 0.4;
          colorIdx = 0;
        }

        if (Math.abs(b) < 0.01) continue;

        const [cr, cg, cb] = b > 0 ? FIRE_COLORS[colorIdx] : BASE_COLOR;
        const absB = Math.abs(b);
        const alpha = Math.min(1, absB * 0.85);

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.r + Math.max(0, b) * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${alpha})`;
        ctx.fill();

        if (b > 0.05) {
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
      }

      // 4. Draw signal pulses traveling along dendrites (when enabled)
      if (!showSignalsRef.current) { /* skip drawing pulses */ }
      else for (const sig of signals) {
        const edge = edges[sig.edgeIdx];
        const t = Math.max(0, Math.min(1, sig.progress));
        const nA = nodes[edge.from];
        const nB = nodes[edge.to];
        const x = (1 - t) * (1 - t) * nA.x + 2 * (1 - t) * t * edge.cpx + t * t * nB.x;
        const y = (1 - t) * (1 - t) * nA.y + 2 * (1 - t) * t * edge.cpy + t * t * nB.y;

        const [pr, pg, pb] = sig.color;

        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${pr}, ${pg}, ${pb}, 0.9)`;
        ctx.fill();

        const grad = ctx.createRadialGradient(x, y, 0, x, y, 8);
        grad.addColorStop(0, `rgba(${pr}, ${pg}, ${pb}, 0.35)`);
        grad.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // 5. Advance signals — synaptic summation on arrival
      for (let i = signals.length - 1; i >= 0; i--) {
        const sig = signals[i];
        sig.progress += sig.speed;

        const done = sig.speed > 0 ? sig.progress >= 1 : sig.progress <= 0;
        if (done) {
          const edge = edges[sig.edgeIdx];
          const destIdx = sig.speed > 0 ? edge.to : edge.from;
          const dest = nodes[destIdx];

          edge.strength = Math.min(1.0, edge.strength + EDGE_STRENGTHEN);

          const effectiveWeight = edge.weight * Math.max(0.3, edge.strength);
          if (edge.excitatory) {
            dest.potential += effectiveWeight;
          } else {
            dest.potential -= effectiveWeight * 0.6;
          }
          dest.potential = Math.max(-0.3, dest.potential);

          if (dest.potential >= dest.threshold &&
              dest.refractory === 0 &&
              dest.firePhase === 0 &&
              sig.depth < MAX_CASCADE_DEPTH) {
            fireNeuron(destIdx, sig.depth + 1);
          }

          signals.splice(i, 1);
        }
      }

      // 6. Burst state machine — spatially clustered firing
      if (s.frame >= s.stateEnd) {
        if (s.burstState === "silence") {
          s.burstState = "burst";
          s.burstRemaining = BURST_FIRE_COUNT_MIN +
            Math.floor(Math.random() * (BURST_FIRE_COUNT_MAX - BURST_FIRE_COUNT_MIN));
          s.nextBurstFire = s.frame;
          s.stateEnd = Infinity;
          prepareBurst();
        } else if (s.burstState === "cooldown") {
          if (Math.random() < 0.4) {
            s.burstState = "burst";
            s.burstRemaining = BURST_FIRE_COUNT_MIN +
              Math.floor(Math.random() * (BURST_FIRE_COUNT_MAX - BURST_FIRE_COUNT_MIN - 2));
            s.nextBurstFire = s.frame;
            s.stateEnd = Infinity;
            prepareBurst();
          } else {
            s.burstState = "silence";
            s.stateEnd = s.frame + SILENCE_MIN + Math.random() * (SILENCE_MAX - SILENCE_MIN);
          }
        }
      }

      if (s.burstState === "burst" && s.frame >= s.nextBurstFire && s.burstRemaining > 0) {
        if (s.burstFiredCount < s.burstNearby.length) {
          fireNeuron(s.burstNearby[s.burstFiredCount].idx, 0);
          s.burstFiredCount++;
        }
        s.burstRemaining--;
        s.nextBurstFire = s.frame + BURST_FIRE_GAP_MIN +
          Math.random() * (BURST_FIRE_GAP_MAX - BURST_FIRE_GAP_MIN);

        if (s.burstRemaining <= 0) {
          s.burstState = "cooldown";
          s.stateEnd = s.frame + BURST_COOLDOWN_MIN +
            Math.random() * (BURST_COOLDOWN_MAX - BURST_COOLDOWN_MIN);
        }
      }

      // 7. Synaptic plasticity — decay, prune, grow
      for (const edge of edges) {
        edge.strength *= EDGE_DECAY_RATE;
      }

      if (s.frame % PRUNE_INTERVAL === 0) {
        for (let i = edges.length - 1; i >= 0; i--) {
          if (edges[i].strength >= EDGE_DEATH_THRESHOLD) continue;
          const e = edges[i];
          nodes[e.from].connections = nodes[e.from].connections.filter(idx => idx !== i);
          nodes[e.to].connections = nodes[e.to].connections.filter(idx => idx !== i);
          edges.splice(i, 1);
          for (const node of nodes) {
            for (let c = 0; c < node.connections.length; c++) {
              if (node.connections[c] > i) node.connections[c]--;
            }
          }
        }
        s.staticDirty = true;
      }

      if (s.frame % GROWTH_INTERVAL === 0) {
        const srcIdx = Math.floor(Math.random() * nodes.length);
        const src = nodes[srcIdx];
        if (src.connections.length < MAX_CONNECTIONS) {
          const connectedSet = new Set();
          connectedSet.add(srcIdx);
          for (const eIdx of src.connections) {
            const e = edges[eIdx];
            connectedSet.add(e.from === srcIdx ? e.to : e.from);
          }
          let bestIdx = -1, bestDist = Infinity;
          const gr2 = GROWTH_RADIUS * GROWTH_RADIUS;
          for (let j = 0; j < nodes.length; j++) {
            if (connectedSet.has(j)) continue;
            const dx = nodes[j].x - src.x;
            const dy = nodes[j].y - src.y;
            const d = dx * dx + dy * dy;
            if (d < bestDist && d <= gr2) { bestDist = d; bestIdx = j; }
          }
          if (bestIdx >= 0) {
            addEdge(nodes, edges, srcIdx, bestIdx, EDGE_NEW_STRENGTH);
            s.staticDirty = true;
          }
        }
      }

      if (s.staticDirty || s.frame % STATIC_REDRAW_INTERVAL === 0) {
        renderStaticLayer(offscreen, w, h, dpr, nodes, edges);
        s.staticDirty = false;
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

  useEffect(() => {
    showSignalsRef.current = showSignals;
  }, [showSignals]);

  return (
    <canvas
      ref={canvasRef}
      className="neural-canvas"
      aria-hidden="true"
    />
  );
}
