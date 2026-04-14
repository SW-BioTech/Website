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
const CLUSTER_COUNT_DESKTOP = 10;
const CLUSTER_COUNT_MOBILE = 6;
const NODES_PER_CLUSTER_MIN = 18;
const NODES_PER_CLUSTER_MAX = 30;
const CLUSTER_RADIUS_MIN = 140;
const CLUSTER_RADIUS_MAX = 300;
const SCATTER_COUNT_DESKTOP = 80;      // uniform fill between clusters
const SCATTER_COUNT_MOBILE = 35;
const CONNECTION_RADIUS = 180;
const CONNECTION_PROB = 0.45;
const LONG_RANGE_COUNT = 25;

const FIRE_INTERVAL_MIN = 120;         // ~2 s at 60 fps
const FIRE_INTERVAL_MAX = 300;         // ~5 s
const SIGNAL_SPEED_MIN = 0.003;
const SIGNAL_SPEED_MAX = 0.007;
const CASCADE_PROB = 0.55;
const MAX_CASCADE_DEPTH = 8;
const MAX_CONCURRENT_SIGNALS = 40;
const HOVER_RADIUS = 150;
const HOVER_BRIGHTNESS = 0.4;

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

      // Quadratic bezier control point — offset perpendicular to midpoint
      const mx = (nodes[i].x + nodes[j].x) / 2;
      const my = (nodes[i].y + nodes[j].y) / 2;
      const len = dist || 1;
      const perpX = -dy / len;
      const perpY = dx / len;
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
  }

  // Add a handful of long-range connections for realism
  for (let k = 0; k < LONG_RANGE_COUNT; k++) {
    const a = Math.floor(Math.random() * nodes.length);
    let b = Math.floor(Math.random() * nodes.length);
    if (a === b) continue;
    const dx = nodes[b].x - nodes[a].x;
    const dy = nodes[b].y - nodes[a].y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const mx = (nodes[a].x + nodes[b].x) / 2;
    const my = (nodes[a].y + nodes[b].y) / 2;
    const len = dist || 1;
    const offset = (Math.random() - 0.5) * 60;
    const edgeIdx = edges.length;
    edges.push({
      from: a,
      to: b,
      cpx: mx + (-dy / len) * offset,
      cpy: my + (dx / len) * offset,
    });
    nodes[a].connections.push(edgeIdx);
    nodes[b].connections.push(edgeIdx);
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
// Position along a quadratic bezier at parameter t
// ---------------------------------------------------------------------------
function bezierPoint(ax, ay, cpx, cpy, bx, by, t) {
  const mt = 1 - t;
  return {
    x: mt * mt * ax + 2 * mt * t * cpx + t * t * bx,
    y: mt * mt * ay + 2 * mt * t * cpy + t * t * by,
  };
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
      nextFire: FIRE_INTERVAL_MIN + Math.random() * (FIRE_INTERVAL_MAX - FIRE_INTERVAL_MIN),
      frame: 0,
      animId: 0,
      w: 0,
      h: 0,
      dpr: 1,
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

      // 5. Draw and advance signals along dendrites
      for (let i = signals.length - 1; i >= 0; i--) {
        const sig = signals[i];
        sig.progress += sig.speed;

        const edge = edges[sig.edgeIdx];
        const nA = nodes[edge.from];
        const nB = nodes[edge.to];
        const t = Math.max(0, Math.min(1, sig.speed > 0 ? sig.progress : 1 - sig.progress));
        const pos = bezierPoint(nA.x, nA.y, edge.cpx, edge.cpy, nB.x, nB.y, t);
        const [cr, cg, cb] = sig.color;

        // Signal dot — bright, glowing
        const dotR = 5;
        const sg2 = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, dotR + 8);
        sg2.addColorStop(0, `rgba(${cr}, ${cg}, ${cb}, 0.95)`);
        sg2.addColorStop(0.3, `rgba(${cr}, ${cg}, ${cb}, 0.4)`);
        sg2.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, dotR + 8, 0, Math.PI * 2);
        ctx.fillStyle = sg2;
        ctx.fill();

        // Brighten the edge being traversed
        ctx.beginPath();
        ctx.moveTo(nA.x, nA.y);
        ctx.quadraticCurveTo(edge.cpx, edge.cpy, nB.x, nB.y);
        ctx.strokeStyle = `rgba(${cr}, ${cg}, ${cb}, 0.18)`;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Signal arrived at destination
        const done = sig.speed > 0 ? sig.progress >= 1 : sig.progress <= 0;
        if (done) {
          const destIdx = sig.speed > 0 ? edge.to : edge.from;
          nodes[destIdx].brightness = 1;

          // Cascade — probability decays with depth so it thins out naturally
          const depthProb = CASCADE_PROB * Math.pow(0.82, sig.depth);
          if (sig.depth < MAX_CASCADE_DEPTH && Math.random() < depthProb) {
            fireNeuron(destIdx, sig.depth + 1);
          }
          signals.splice(i, 1);
        }
      }

      // 6. Spawn new fire events at random intervals
      if (s.frame >= s.nextFire) {
        const startNode = Math.floor(Math.random() * nodes.length);
        fireNeuron(startNode, 0);
        s.nextFire = s.frame + FIRE_INTERVAL_MIN +
          Math.random() * (FIRE_INTERVAL_MAX - FIRE_INTERVAL_MIN);
      }

      s.animId = requestAnimationFrame(draw);
    }

    // ---- Bootstrap ----
    init();
    draw();

    let resizeTimer;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(init, 200);
    };
    const onMouse = (e) => { s.mouse = { x: e.clientX, y: e.clientY }; };
    const onTouch = (e) => {
      const t = e.touches[0];
      if (t) s.mouse = { x: t.clientX, y: t.clientY };
    };
    const onLeave = () => { s.mouse = { x: -9999, y: -9999 }; };

    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", onMouse);
    window.addEventListener("touchmove", onTouch, { passive: true });
    window.addEventListener("mouseleave", onLeave);
    window.addEventListener("touchend", onLeave);

    return () => {
      cancelAnimationFrame(s.animId);
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("touchmove", onTouch);
      window.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("touchend", onLeave);
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
