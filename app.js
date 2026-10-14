/**
 * ====================================================================================
 * Project: From Transistors to Qubits: A Hybrid Learning Framework
 * File: app.js
 * Description: Interactive semiconductor & quantum simulation engines,
 *              Bloch sphere visualizer, oscilloscope, and evaluation engine.
 * ====================================================================================
 */

// Global State
const state = {
  theme: 'dark',
  level1: { vin: 0.0, vth: 0.7, vcc: 5.0, rb: 1000, rl: 330 },
  level2: { input: 0 },
  level3: { theta: 0, phi: 0, alpha: 1.0, beta: 0.0, hadamardAppliedOnce: false },
  level4: { a: 0, b: 0, isSuperposition: false },
  moduleA: { vbe: 0.75, vth: 0.70, rl: 1000, vcc: 5.0, beta: 100 },
  moduleB: { currentGate: 'NOT', inA: 0, inB: 0 },
  moduleC: {
    // Statevector [alpha_r, alpha_i, beta_r, beta_i]
    alpha: { r: 1.0, i: 0.0 },
    beta: { r: 0.0, i: 0.0 },
    history: []
  },
  noise: { sigma: 0.60, vIdeal: 5.0, samples: 10000 },
  qec: { errorQubit: -1 },
  eval: {
    preScore: null,
    postScore: null
  }
};

// ====================================================================================
// 1. DOM INITIALIZATION & NAVIGATION
// ====================================================================================
document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  initTabNavigation();
  initLevelPills();
  initEvaluationPills();

  // Initialize Modules
  initLevel1();
  initLevel2();
  initLevel3();
  initLevel4();
  initModuleA();
  initModuleB();
  initModuleC();
  initNoiseLab();
  initEvaluationQuestions();

  // Initial window resize handler for crisp canvas
  window.addEventListener('resize', () => {
    drawLevel1Circuit();
    drawLevel2Transfer();
    drawLevel3Bloch();
    drawLevel4Circuit();
    drawModuleA_IV();
    drawModuleB_Schematic();
    drawModuleC_Bloch();
    drawNoiseOscilloscope();
    drawQECCircuit();
  });
});

function initThemeToggle() {
  const btn = document.getElementById('themeToggleBtn');
  btn.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    state.theme = document.body.classList.contains('light-theme') ? 'light' : 'dark';
    redrawAllCanvases();
  });
}

function initTabNavigation() {
  const tabs = document.querySelectorAll('.nav-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      const paneId = tab.getAttribute('data-tab');
      document.getElementById(paneId).classList.add('active');
      setTimeout(redrawAllCanvases, 50);
    });
  });
}

function initLevelPills() {
  const pills = document.querySelectorAll('.level-pill');
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('active'));
      document.querySelectorAll('.level-view').forEach(v => v.classList.remove('active'));
      pill.classList.add('active');
      const lvl = pill.getAttribute('data-level');
      document.getElementById(`level-content-${lvl}`).classList.add('active');
      setTimeout(redrawAllCanvases, 50);
    });
  });
}

function initEvaluationPills() {
  const pills = document.querySelectorAll('.eval-pill');
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('active'));
      document.querySelectorAll('.eval-pane').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const target = pill.getAttribute('data-eval');
      document.getElementById(`eval-${target}-pane`).classList.add('active');
    });
  });
}

function redrawAllCanvases() {
  drawLevel1Circuit();
  drawLevel2Transfer();
  drawLevel3Bloch();
  drawLevel4Circuit();
  drawModuleA_IV();
  drawModuleB_Schematic();
  drawModuleC_Bloch();
  drawModuleC_Histogram(1024);
  drawNoiseOscilloscope();
  drawQECCircuit();
}

// ====================================================================================
// 2. LEVEL 1: TRANSISTOR SWITCH LOGIC
// ====================================================================================
function initLevel1() {
  const slider = document.getElementById('l1-vin-slider');
  slider.addEventListener('input', (e) => {
    setL1Vin(parseFloat(e.target.value));
  });
  setL1Vin(0.0);
}

function setL1Vin(v) {
  state.level1.vin = v;
  document.getElementById('l1-vin-slider').value = v;
  document.getElementById('l1-vin-val').textContent = v.toFixed(2) + ' V';

  const vth = state.level1.vth;
  let bjtState = 'CUT-OFF (Switch Open)';
  let ic_mA = 0.0;
  let bitVal = 0;

  if (v >= vth) {
    const ib_mA = (v - vth) / (state.level1.rb / 1000);
    ic_mA = Math.min(14.5, ib_mA * 80);
    bjtState = (ic_mA > 10.0) ? 'SATURATION (Switch Closed / ON)' : 'ACTIVE (Conducting)';
    bitVal = 1;
  }

  document.getElementById('l1-bjt-state').textContent = bjtState;
  document.getElementById('l1-ic-val').textContent = ic_mA.toFixed(2) + ' mA';
  const bitBadge = document.getElementById('l1-bit-val');
  bitBadge.textContent = bitVal;
  bitBadge.style.color = bitVal ? 'var(--accent-green)' : 'var(--text-muted)';

  drawLevel1Circuit();
}

let animPhase = 0;
function drawLevel1Circuit() {
  const canvas = document.getElementById('l1-circuit-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  const isLight = state.theme === 'light';
  const wireColor = isLight ? '#334155' : '#64748b';
  const activeColor = '#38bdf8';
  const vin = state.level1.vin;
  const isConducting = vin >= state.level1.vth;

  // Background Grid hint
  ctx.strokeStyle = isLight ? '#e2e8f0' : '#1e293b';
  ctx.lineWidth = 1;
  for (let x = 20; x < w; x += 40) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
  for (let y = 20; y < h; y += 40) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }

  // Draw +5V Supply Rail
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(50, 40); ctx.lineTo(410, 40); ctx.stroke();
  ctx.fillStyle = '#ef4444';
  ctx.font = 'bold 12px Inter';
  ctx.fillText('+5V (VCC Rail)', 50, 30);

  // Draw GND Rail
  ctx.strokeStyle = isLight ? '#0f172a' : '#94a3b8';
  ctx.beginPath(); ctx.moveTo(50, 300); ctx.lineTo(410, 300); ctx.stroke();
  ctx.fillStyle = isLight ? '#0f172a' : '#94a3b8';
  ctx.fillText('0V (GND Rail)', 50, 320);

  // Coordinates
  const bjtX = 260, bjtY = 200;

  // Wire from VCC down through LED and R_L to Collector
  ctx.strokeStyle = isConducting ? activeColor : wireColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(bjtX, 40);
  ctx.lineTo(bjtX, 80); // To LED
  ctx.stroke();

  // Draw LED symbol at (bjtX, 95)
  const ledY = 95;
  ctx.fillStyle = isConducting ? '#22c55e' : (isLight ? '#cbd5e1' : '#334155');
  ctx.strokeStyle = isConducting ? '#22c55e' : wireColor;
  ctx.beginPath();
  ctx.moveTo(bjtX - 15, ledY - 15);
  ctx.lineTo(bjtX + 15, ledY - 15);
  ctx.lineTo(bjtX, ledY + 10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(bjtX - 15, ledY + 10);
  ctx.lineTo(bjtX + 15, ledY + 10);
  ctx.stroke();

  // LED Light Glow if ON
  if (isConducting) {
    ctx.save();
    ctx.shadowColor = '#22c55e';
    ctx.shadowBlur = 20;
    ctx.fillStyle = 'rgba(34, 197, 94, 0.3)';
    ctx.beginPath();
    ctx.arc(bjtX, ledY, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Photon arrows
    ctx.strokeStyle = '#facc15';
    ctx.beginPath();
    ctx.moveTo(bjtX + 18, ledY - 10); ctx.lineTo(bjtX + 32, ledY - 20);
    ctx.moveTo(bjtX + 22, ledY); ctx.lineTo(bjtX + 36, ledY - 10);
    ctx.stroke();
  }
  ctx.fillStyle = isConducting ? '#22c55e' : (isLight ? '#64748b' : '#94a3b8');
  ctx.font = '11px Inter';
  ctx.fillText(isConducting ? 'LED: ON (1)' : 'LED: OFF (0)', bjtX + 25, ledY + 5);

  // Wire through Current limiting resistor R_L
  ctx.strokeStyle = isConducting ? activeColor : wireColor;
  ctx.beginPath();
  ctx.moveTo(bjtX, ledY + 10);
  ctx.lineTo(bjtX, 135);
  ctx.stroke();

  // Resistor R_L Box
  ctx.fillStyle = isLight ? '#f1f5f9' : '#1e293b';
  ctx.strokeStyle = wireColor;
  ctx.fillRect(bjtX - 10, 135, 20, 30);
  ctx.strokeRect(bjtX - 10, 135, 20, 30);
  ctx.fillStyle = isLight ? '#0f172a' : '#f8fafc';
  ctx.font = '10px Fira Code';
  ctx.fillText('330Ω', bjtX + 15, 153);

  // Wire into Collector
  ctx.beginPath();
  ctx.moveTo(bjtX, 165);
  ctx.lineTo(bjtX, bjtY - 20);
  ctx.stroke();

  // BJT Symbol (NPN)
  // Base bar
  ctx.lineWidth = 4;
  ctx.strokeStyle = isConducting ? '#38bdf8' : wireColor;
  ctx.beginPath();
  ctx.moveTo(bjtX - 30, bjtY - 25);
  ctx.lineTo(bjtX - 30, bjtY + 25);
  ctx.stroke();

  // Collector branch
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(bjtX - 30, bjtY - 10);
  ctx.lineTo(bjtX, bjtY - 25);
  ctx.lineTo(bjtX, bjtY - 20);
  ctx.stroke();

  // Emitter branch with NPN Arrow
  ctx.beginPath();
  ctx.moveTo(bjtX - 30, bjtY + 10);
  ctx.lineTo(bjtX, bjtY + 25);
  ctx.stroke();

  // Arrowhead pointing outward on emitter
  ctx.fillStyle = isConducting ? '#38bdf8' : wireColor;
  ctx.beginPath();
  ctx.moveTo(bjtX - 5, bjtY + 18);
  ctx.lineTo(bjtX, bjtY + 25);
  ctx.lineTo(bjtX - 12, bjtY + 25);
  ctx.fill();

  // Emitter to GND
  ctx.beginPath();
  ctx.moveTo(bjtX, bjtY + 25);
  ctx.lineTo(bjtX, 300);
  ctx.stroke();

  // Base input from Vin
  const inX = 60, inY = bjtY;
  ctx.beginPath();
  ctx.moveTo(inX, inY);
  ctx.lineTo(inX + 50, inY);
  ctx.stroke();

  // Base Resistor R_B
  ctx.fillStyle = isLight ? '#f1f5f9' : '#1e293b';
  ctx.fillRect(inX + 50, inY - 10, 40, 20);
  ctx.strokeRect(inX + 50, inY - 10, 40, 20);
  ctx.fillStyle = isLight ? '#0f172a' : '#f8fafc';
  ctx.font = '10px Fira Code';
  ctx.fillText('1kΩ', inX + 58, inY + 4);

  // R_B to Base
  ctx.beginPath();
  ctx.moveTo(inX + 90, inY);
  ctx.lineTo(bjtX - 30, inY);
  ctx.stroke();

  // Vin Control Source circle
  ctx.fillStyle = isLight ? '#e0f2fe' : 'rgba(56, 189, 248, 0.15)';
  ctx.strokeStyle = activeColor;
  ctx.beginPath();
  ctx.arc(inX, inY, 18, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = activeColor;
  ctx.font = 'bold 11px Fira Code';
  ctx.textAlign = 'center';
  ctx.fillText(`${vin.toFixed(1)}V`, inX, inY + 4);
  ctx.textAlign = 'left';

  // Current animation particles if conducting
  if (isConducting) {
    animPhase = (animPhase + 1) % 40;
    ctx.fillStyle = '#facc15';
    for (let offset = 0; offset < 200; offset += 35) {
      const py = 40 + ((animPhase + offset) % 240);
      if (py > 40 && py < 300) {
        ctx.beginPath();
        ctx.arc(bjtX, py, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

// Loop animation for circuit
setInterval(() => {
  if (document.getElementById('level-content-1').classList.contains('active')) {
    drawLevel1Circuit();
  }
}, 80);

// ====================================================================================
// 3. LEVEL 2: NOT GATE vs PAULI-X GATE
// ====================================================================================
function initLevel2() {
  setL2Input(0);
}

function setL2Input(val) {
  state.level2.input = val;
  const isPlus = val === 'plus';

  document.getElementById('l2-input-0-btn').className = `btn ${val === 0 ? 'btn-primary' : 'btn-secondary'}`;
  document.getElementById('l2-input-1-btn').className = `btn ${val === 1 ? 'btn-primary' : 'btn-secondary'}`;
  document.getElementById('l2-input-plus-btn').className = `btn ${isPlus ? 'btn-accent' : 'btn-secondary'}`;

  const classInElem = document.getElementById('l2-class-in');
  const classOutElem = document.getElementById('l2-class-out');
  const quantInElem = document.getElementById('l2-quant-in');
  const quantOutElem = document.getElementById('l2-quant-out');

  if (val === 0) {
    classInElem.innerHTML = '0.0V (Bit 0)';
    classOutElem.innerHTML = '<span class="badge badge-success">5.0V (Bit 1)</span>';
    quantInElem.innerHTML = '|0&rang; = [1, 0]<sup>T</sup>';
    quantOutElem.innerHTML = '<span class="badge badge-accent">|1&rang; = [0, 1]<sup>T</sup></span>';
  } else if (val === 1) {
    classInElem.innerHTML = '5.0V (Bit 1)';
    classOutElem.innerHTML = '<span class="badge badge-success">0.15V (Bit 0)</span>';
    quantInElem.innerHTML = '|1&rang; = [0, 1]<sup>T</sup>';
    quantOutElem.innerHTML = '<span class="badge badge-accent">|0&rang; = [1, 0]<sup>T</sup></span>';
  } else {
    classInElem.innerHTML = '<em>Undefined (Metastable analog)</em>';
    classOutElem.innerHTML = '<span class="badge" style="background:#f43f5e; color:#fff;">Invalid Binary / Oscillates</span>';
    quantInElem.innerHTML = '|+&rang; = (|0&rang; + |1&rang;)/&radic;2';
    quantOutElem.innerHTML = '<span class="badge badge-accent">|+&rang; (Eigenstate, unchanged!)</span>';
  }

  drawLevel2Transfer();
}

function drawLevel2Transfer() {
  const canvas = document.getElementById('l2-transfer-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);
  const isLight = state.theme === 'light';

  // Axes: VTC curve on Left half, Vector Inversion on Right half
  const midX = w / 2;

  // Divider
  ctx.strokeStyle = isLight ? '#cbd5e1' : '#334155';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(midX, 20); ctx.lineTo(midX, h - 20); ctx.stroke();

  // LEFT: Voltage Transfer Characteristic
  ctx.fillStyle = isLight ? '#0f172a' : '#f8fafc';
  ctx.font = 'bold 12px Inter';
  ctx.fillText('RTL Inverter VTC Curve', 30, 30);

  const ox = 40, oy = h - 50, gw = midX - 70, gh = h - 100;
  ctx.strokeStyle = isLight ? '#94a3b8' : '#64748b';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(ox, oy - gh); ctx.lineTo(ox, oy); ctx.lineTo(ox + gw, oy);
  ctx.stroke();

  ctx.fillStyle = isLight ? '#64748b' : '#94a3b8';
  ctx.font = '10px Inter';
  ctx.fillText('Vin (0V -> 5V)', ox + gw - 60, oy + 20);
  ctx.save();
  ctx.translate(ox - 20, oy - gh / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('Vout', 0, 0);
  ctx.restore();

  // Inverter Sigmoid curve
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  let ptX = ox, ptY = oy;
  for (let vx = 0; vx <= 5.0; vx += 0.1) {
    const px = ox + (vx / 5.0) * gw;
    // Vout = Vsat + (Vcc - Vsat) / (1 + exp((vx - 0.75)/0.15))
    const vout = 0.15 + (4.85) / (1 + Math.exp((vx - 0.75) / 0.18));
    const py = oy - (vout / 5.0) * gh;
    if (vx === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);

    const targetIn = (state.level2.input === 0) ? 0.0 : (state.level2.input === 1 ? 5.0 : 0.75);
    if (Math.abs(vx - targetIn) < 0.06) {
      ptX = px; ptY = py;
    }
  }
  ctx.stroke();

  // Highlight Operating Point
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.arc(ptX, ptY, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // RIGHT: Quantum Pauli-X Inversion
  ctx.fillStyle = isLight ? '#0f172a' : '#f8fafc';
  ctx.font = 'bold 12px Inter';
  ctx.fillText('Quantum Bit-Flip (Pauli-X)', midX + 30, 30);

  // Draw 2 State Nodes: |0> and |1>
  const n0X = midX + 60, n0Y = 120;
  const n1X = midX + 60, n1Y = 250;

  // Node |0>
  ctx.fillStyle = state.level2.input === 0 ? 'rgba(56, 189, 248, 0.3)' : (isLight ? '#f1f5f9' : '#1e293b');
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(n0X, n0Y, 26, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 14px Fira Code';
  ctx.textAlign = 'center';
  ctx.fillText('|0⟩', n0X, n0Y + 5);

  // Node |1>
  ctx.fillStyle = state.level2.input === 1 ? 'rgba(168, 85, 247, 0.3)' : (isLight ? '#f1f5f9' : '#1e293b');
  ctx.strokeStyle = '#a855f7';
  ctx.beginPath(); ctx.arc(n1X, n1Y, 26, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#a855f7';
  ctx.fillText('|1⟩', n1X, n1Y + 5);

  // Inversion Arrow with X gate badge
  ctx.strokeStyle = '#22c55e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(n0X + 35, n0Y + 10);
  ctx.quadraticCurveTo(n0X + 90, (n0Y + n1Y) / 2, n1X + 35, n1Y - 10);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(n0X - 35, n1Y - 10);
  ctx.quadraticCurveTo(n0X - 90, (n0Y + n1Y) / 2, n1X - 35, n0Y + 10);
  ctx.stroke();

  // X Gate Box
  const gX = midX + 115, gY = (n0Y + n1Y) / 2 - 14;
  ctx.fillStyle = '#3b82f6';
  ctx.fillRect(gX, gY, 32, 28);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 13px Fira Code';
  ctx.fillText('X', gX + 16, gY + 18);
  ctx.textAlign = 'left';
}

// ====================================================================================
// 4. LEVEL 3: CLASSICAL BIT TO QUBIT (HADAMARD & BLOCH SPHERE)
// ====================================================================================
function initLevel3() {
  const slider = document.getElementById('l3-theta-slider');
  slider.addEventListener('input', (e) => {
    updateL3Theta(parseFloat(e.target.value));
  });
  updateL3Theta(0);
}

function updateL3Theta(deg) {
  state.level3.theta = deg;
  const rad = (deg * Math.PI) / 180;
  const alpha = Math.cos(rad / 2);
  const beta = Math.sin(rad / 2);

  state.level3.alpha = alpha;
  state.level3.beta = beta;

  document.getElementById('l3-theta-slider').value = deg;
  let label = `${deg}°`;
  if (deg === 0) label += ' (Pure |0⟩)';
  else if (deg === 90) label += ' (Hadamard |+⟩)';
  else if (deg === 180) label += ' (Pure |1⟩)';
  document.getElementById('l3-theta-val').textContent = label;

  const p0 = (alpha * alpha * 100);
  const p1 = (beta * beta * 100);

  document.getElementById('l3-p0-val').textContent = p0.toFixed(1) + '%';
  document.getElementById('l3-p1-val').textContent = p1.toFixed(1) + '%';
  document.getElementById('l3-p0-bar').style.width = p0 + '%';
  document.getElementById('l3-p1-bar').style.width = p1 + '%';

  document.getElementById('l3-coords-info').textContent =
    `Vector: |ψ⟩ = ${alpha.toFixed(3)}|0⟩ + ${beta.toFixed(3)}|1⟩ | Bloch: (θ=${deg}°, φ=0°)`;

  drawLevel3Bloch();
}

function setL3Preset(deg) {
  state.level3.hadamardAppliedOnce = (deg === 90);
  updateL3Theta(deg);
}

function applyL3HadamardAgain() {
  // If at |+>, applying H returns to |0>
  if (Math.abs(state.level3.theta - 90) < 5) {
    updateL3Theta(0);
    alert('Hadamard applied twice (H * H |0⟩ = |0⟩)!\n\nDue to constructive interference on |0⟩ and destructive interference on |1⟩, the qubit returns with 100% certainty to |0⟩. A classical random coin toss CANNOT do this!');
  } else {
    updateL3Theta(90);
  }
}

function drawLevel3Bloch() {
  const canvas = document.getElementById('l3-bloch-canvas');
  if (!canvas) return;
  renderBlochSphere(canvas, state.level3.theta, state.level3.phi);
}

// Reusable Bloch Sphere 3D Projection Engine
function renderBlochSphere(canvas, thetaDeg, phiDeg) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2;
  const r = Math.min(w, h) * 0.38;
  const isLight = state.theme === 'light';

  // Draw 3D wireframe Sphere
  ctx.strokeStyle = isLight ? '#cbd5e1' : '#334155';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  // Equator ellipse
  ctx.strokeStyle = isLight ? '#94a3b8' : '#475569';
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.ellipse(cx, cy, r, r * 0.32, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Z-Axis (Vertical)
  ctx.strokeStyle = isLight ? '#64748b' : '#94a3b8';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(cx, cy + r + 20); ctx.lineTo(cx, cy - r - 20); ctx.stroke();

  // X-Axis (Angled)
  const xAng = Math.PI / 6;
  ctx.beginPath();
  ctx.moveTo(cx - r * Math.cos(xAng) * 0.9, cy + r * Math.sin(xAng) * 0.9);
  ctx.lineTo(cx + r * Math.cos(xAng) * 0.9, cy - r * Math.sin(xAng) * 0.9);
  ctx.stroke();

  // Labels
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 13px Fira Code';
  ctx.textAlign = 'center';
  ctx.fillText('|0⟩ (+Z)', cx, cy - r - 26);

  ctx.fillStyle = '#a855f7';
  ctx.fillText('|1⟩ (-Z)', cx, cy + r + 32);

  ctx.fillStyle = isLight ? '#0f172a' : '#f8fafc';
  ctx.font = '10px Fira Code';
  ctx.fillText('|+⟩ (+X)', cx + r + 20, cy + 4);
  ctx.fillText('|−⟩ (-X)', cx - r - 20, cy + 4);

  // Compute 3D Coordinates of Statevector
  const thetaRad = (thetaDeg * Math.PI) / 180;
  const phiRad = (phiDeg * Math.PI) / 180;

  // Bloch mapping: x = sin(theta)*cos(phi), y = sin(theta)*sin(phi), z = cos(theta)
  const bx = Math.sin(thetaRad) * Math.cos(phiRad);
  const by = Math.sin(thetaRad) * Math.sin(phiRad);
  const bz = Math.cos(thetaRad);

  // Screen projection:
  // sx = cx + r * (bx * cos(xAng) - by * sin(xAng) * 0.5)
  // sy = cy - r * bz + r * (bx * sin(xAng) * 0.3)
  const sx = cx + r * (bx * 0.9 - by * 0.35);
  const sy = cy - r * bz + r * (bx * 0.2 + by * 0.1);

  // State Vector Arrow
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(sx, sy);
  ctx.stroke();

  // Vector Tip Dot with Glow
  ctx.save();
  ctx.shadowColor = '#f59e0b';
  ctx.shadowBlur = 12;
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.arc(sx, sy, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 11px Inter';
  ctx.fillText('|ψ⟩', sx + 12, sy - 6);
  ctx.textAlign = 'left';
}

// ====================================================================================
// 5. LEVEL 4: CLASSICAL vs QUANTUM REVERSIBLE HALF ADDER
// ====================================================================================
function initLevel4() {
  setL4Inputs(0, 0);
}

function setL4Inputs(a, b) {
  state.level4.a = a;
  state.level4.b = b;
  state.level4.isSuperposition = false;

  const sum = a ^ b;
  const carry = a & b;

  document.querySelectorAll('.l4-in-btn').forEach(btn => btn.classList.remove('btn-primary'));

  document.getElementById('l4-inputs-disp').textContent = `A = ${a}, B = ${b}`;
  document.getElementById('l4-class-out-disp').textContent = `Sum = ${sum}, Carry = ${carry}`;
  document.getElementById('l4-quant-out-disp').textContent = `|A, B, Sum, Carry⟩ = |${a}${b}${sum}${carry}⟩ (100% Deterministic)`;

  drawLevel4Circuit();
}

function setL4Superposition() {
  state.level4.isSuperposition = true;
  document.getElementById('l4-inputs-disp').textContent = 'A, B in Superposition (H|0⟩)';
  document.getElementById('l4-class-out-disp').textContent = 'Not supported (Requires 4 sequential clock cycles)';
  document.getElementById('l4-quant-out-disp').textContent = '0.5|0000⟩ + 0.5|0110⟩ + 0.5|1010⟩ + 0.5|1101⟩ (All 4 in 1 shot!)';

  drawLevel4Circuit();
}

function drawLevel4Circuit() {
  const canvas = document.getElementById('l4-circuit-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const isLight = state.theme === 'light';
  const wireCol = isLight ? '#475569' : '#94a3b8';
  const midY = h / 2;

  // Divider
  ctx.strokeStyle = isLight ? '#cbd5e1' : '#334155';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(20, midY); ctx.lineTo(w - 20, midY); ctx.stroke();

  // TOP HALF: Classical Gate Circuit
  ctx.fillStyle = isLight ? '#0f172a' : '#f8fafc';
  ctx.font = 'bold 11px Inter';
  ctx.fillText('Classical CMOS Gate Network (Irreversible)', 25, 20);

  const inA = state.level4.a;
  const inB = state.level4.b;
  const sOut = inA ^ inB;
  const cOut = inA & inB;

  // Wire lines
  ctx.strokeStyle = inA ? '#38bdf8' : wireCol;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(40, 50); ctx.lineTo(160, 50); ctx.stroke();
  ctx.fillStyle = ctx.strokeStyle;
  ctx.fillText(`A = ${inA}`, 40, 42);

  ctx.strokeStyle = inB ? '#38bdf8' : wireCol;
  ctx.beginPath(); ctx.moveTo(40, 95); ctx.lineTo(160, 95); ctx.stroke();
  ctx.fillStyle = ctx.strokeStyle;
  ctx.fillText(`B = ${inB}`, 40, 87);

  // XOR Gate Box
  ctx.fillStyle = '#3b82f6';
  ctx.fillRect(160, 40, 65, 30);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 11px Fira Code';
  ctx.fillText('XOR', 178, 60);

  // XOR Out wire
  ctx.strokeStyle = sOut ? '#22c55e' : wireCol;
  ctx.beginPath(); ctx.moveTo(225, 55); ctx.lineTo(380, 55); ctx.stroke();
  ctx.fillStyle = ctx.strokeStyle;
  ctx.fillText(`Sum = ${sOut}`, 385, 59);

  // AND Gate Box
  ctx.fillStyle = '#6366f1';
  ctx.fillRect(160, 85, 65, 30);
  ctx.fillStyle = '#fff';
  ctx.fillText('AND', 178, 105);

  // AND Out wire
  ctx.strokeStyle = cOut ? '#22c55e' : wireCol;
  ctx.beginPath(); ctx.moveTo(225, 100); ctx.lineTo(380, 100); ctx.stroke();
  ctx.fillStyle = ctx.strokeStyle;
  ctx.fillText(`Carry = ${cOut}`, 385, 104);

  // BOTTOM HALF: Quantum Reversible Circuit
  ctx.fillStyle = isLight ? '#0f172a' : '#f8fafc';
  ctx.font = 'bold 11px Inter';
  ctx.fillText('Quantum Reversible Circuit (Unitary / Information Preserved)', 25, midY + 22);

  const wires = [
    { name: `q0: |${state.level4.isSuperposition ? '+' : inA}⟩`, y: midY + 45 },
    { name: `q1: |${state.level4.isSuperposition ? '+' : inB}⟩`, y: midY + 75 },
    { name: `q2 (Sum): |0⟩`, y: midY + 105 },
    { name: `q3 (Carry): |0⟩`, y: midY + 135 }
  ];

  ctx.font = '10px Fira Code';
  wires.forEach(wObj => {
    ctx.strokeStyle = wireCol;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(110, wObj.y);
    ctx.lineTo(410, wObj.y);
    ctx.stroke();
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(wObj.name, 15, wObj.y + 4);
  });

  // Toffoli (CCX) for Carry: Controls q0, q1, Target q3
  const ccxX = 180;
  ctx.strokeStyle = '#a855f7';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(ccxX, wires[0].y); ctx.lineTo(ccxX, wires[3].y); ctx.stroke();
  // Dots on q0, q1
  ctx.fillStyle = '#a855f7';
  ctx.beginPath(); ctx.arc(ccxX, wires[0].y, 4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(ccxX, wires[1].y, 4, 0, Math.PI * 2); ctx.fill();
  // Target on q3
  ctx.beginPath(); ctx.arc(ccxX, wires[3].y, 7, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(ccxX - 7, wires[3].y); ctx.lineTo(ccxX + 7, wires[3].y); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(ccxX, wires[3].y - 7); ctx.lineTo(ccxX, wires[3].y + 7); ctx.stroke();

  // CNOT 1 for Sum: Control q0, Target q2
  const cx1X = 260;
  ctx.beginPath(); ctx.moveTo(cx1X, wires[0].y); ctx.lineTo(cx1X, wires[2].y); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx1X, wires[0].y, 4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx1X, wires[2].y, 7, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx1X - 7, wires[2].y); ctx.lineTo(cx1X + 7, wires[2].y); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx1X, wires[2].y - 7); ctx.lineTo(cx1X, wires[2].y + 7); ctx.stroke();

  // CNOT 2 for Sum: Control q1, Target q2
  const cx2X = 330;
  ctx.beginPath(); ctx.moveTo(cx2X, wires[1].y); ctx.lineTo(cx2X, wires[2].y); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx2X, wires[1].y, 4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx2X, wires[2].y, 7, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx2X - 7, wires[2].y); ctx.lineTo(cx2X + 7, wires[2].y); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx2X, wires[2].y - 7); ctx.lineTo(cx2X, wires[2].y + 7); ctx.stroke();
}

// ====================================================================================
// 6. MODULE A: TRANSISTOR SIMULATOR (IV CURVES & LOAD LINE)
// ====================================================================================
function initModuleA() {
  ['ma-vbe', 'ma-vth', 'ma-rl', 'ma-vcc'].forEach(id => {
    document.getElementById(id).addEventListener('input', updateModuleA);
  });
  updateModuleA();
}

function updateModuleA() {
  const vbe = parseFloat(document.getElementById('ma-vbe').value);
  const vth = parseFloat(document.getElementById('ma-vth').value);
  const rl = parseFloat(document.getElementById('ma-rl').value);
  const vcc = parseFloat(document.getElementById('ma-vcc').value);

  state.moduleA.vbe = vbe;
  state.moduleA.vth = vth;
  state.moduleA.rl = rl;
  state.moduleA.vcc = vcc;

  document.getElementById('ma-vbe-val').textContent = vbe.toFixed(2) + ' V';
  document.getElementById('ma-vth-val').textContent = vth.toFixed(2) + ' V';
  document.getElementById('ma-rl-val').textContent = rl + ' Ω';
  document.getElementById('ma-vcc-val').textContent = vcc.toFixed(1) + ' V';

  // Transistor physics calculations
  let region = 'Cut-Off';
  let ic_mA = 0.0;
  let vce = vcc;
  let led = 'OFF';

  const maxIc_mA = (vcc / rl) * 1000;

  if (vbe < vth) {
    region = 'Cut-Off';
    ic_mA = 0.0;
    vce = vcc;
    led = 'OFF';
  } else {
    const ib_uA = ((vbe - vth) / 1000) * 1000000; // using 1k base resistance
    const desiredIc_mA = (ib_uA * state.moduleA.beta) / 1000;

    if (desiredIc_mA >= maxIc_mA * 0.95) {
      region = 'Saturation (ON)';
      ic_mA = maxIc_mA * 0.98;
      vce = 0.18;
      led = 'ON (Full Brightness)';
    } else {
      region = 'Active Region';
      ic_mA = desiredIc_mA;
      vce = Math.max(0.2, vcc - (ic_mA / 1000) * rl);
      led = (ic_mA > 2.0) ? 'ON (Moderate)' : 'Dim / Transition';
    }
  }

  document.getElementById('ma-region-val').textContent = region;
  document.getElementById('ma-ic-val').textContent = ic_mA.toFixed(2) + ' mA';
  document.getElementById('ma-vce-val').textContent = vce.toFixed(2) + ' V';
  document.getElementById('ma-led-val').textContent = led;

  drawModuleA_IV();
}

function drawModuleA_IV() {
  const canvas = document.getElementById('ma-iv-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const isLight = state.theme === 'light';
  const ox = 50, oy = h - 45, gw = w - 80, gh = h - 80;

  // Axes
  ctx.strokeStyle = isLight ? '#94a3b8' : '#64748b';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(ox, oy - gh); ctx.lineTo(ox, oy); ctx.lineTo(ox + gw, oy);
  ctx.stroke();

  ctx.fillStyle = isLight ? '#475569' : '#94a3b8';
  ctx.font = '11px Inter';
  ctx.fillText('V_CE (Collector-Emitter Voltage, V)', ox + gw - 180, oy + 32);

  ctx.save();
  ctx.translate(ox - 30, oy - gh / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('I_C (Collector Current, mA)', -60, 0);
  ctx.restore();

  const vcc = state.moduleA.vcc;
  const rl = state.moduleA.rl;
  const icSat_mA = (vcc / rl) * 1000;
  const maxAxisIc = Math.max(15, icSat_mA * 1.25);

  // Draw DC Load Line (Red)
  const loadLineX1 = ox;
  const loadLineY1 = oy - (icSat_mA / maxAxisIc) * gh;
  const loadLineX2 = ox + (vcc / 12.0) * gw;
  const loadLineY2 = oy;

  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(loadLineX1, loadLineY1);
  ctx.lineTo(loadLineX2, loadLineY2);
  ctx.stroke();
  ctx.fillStyle = '#ef4444';
  ctx.fillText('DC Load Line', loadLineX1 + 10, loadLineY1 - 5);

  // Draw BJT IV Family curves (Blue)
  for (let ib = 10; ib <= 80; ib += 15) {
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    const ic_level = (ib * state.moduleA.beta) / 1000;
    for (let vce = 0; vce <= 12.0; vce += 0.2) {
      const px = ox + (vce / 12.0) * gw;
      // knee saturation around 0.3V
      const knee = 1 - Math.exp(-vce / 0.25);
      const py = oy - ((ic_level * knee) / maxAxisIc) * gh;
      if (vce === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }

  // Active IV curve corresponding to current Vbe
  const currVbe = state.moduleA.vbe;
  const currVth = state.moduleA.vth;
  let currIb_uA = Math.max(0, ((currVbe - currVth) / 1000) * 1000000);
  let activeIc_level = (currIb_uA * state.moduleA.beta) / 1000;

  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (let vce = 0; vce <= 12.0; vce += 0.2) {
    const px = ox + (vce / 12.0) * gw;
    const knee = 1 - Math.exp(-vce / 0.25);
    const py = oy - ((activeIc_level * knee) / maxAxisIc) * gh;
    if (vce === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();

  // Draw Operating Q-Point
  const currVce = parseFloat(document.getElementById('ma-vce-val').textContent);
  const currIc = parseFloat(document.getElementById('ma-ic-val').textContent);
  const qX = ox + (currVce / 12.0) * gw;
  const qY = oy - (currIc / maxAxisIc) * gh;

  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.arc(qX, qY, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 11px Inter';
  ctx.fillText(`Q-Point (${currVce.toFixed(1)}V, ${currIc.toFixed(1)}mA)`, qX + 10, qY - 10);
}

// ====================================================================================
// 7. MODULE B: LOGIC GATE SIMULATOR
// ====================================================================================
const GATES_DATA = {
  NOT: {
    title: 'NOT Gate (Logic Inverter)',
    desc: 'Produces inverse logic: 0 -> 1, 1 -> 0.',
    twoInputs: false,
    eval: (a) => a === 0 ? 1 : 0,
    table: [[0, 1], [1, 0]],
    topology: 'Single NPN transistor in common-emitter mode. High base input saturates transistor and grounds output.'
  },
  AND: {
    title: 'AND Gate',
    desc: 'Output is 1 ONLY when both inputs A and B are 1.',
    twoInputs: true,
    eval: (a, b) => (a && b) ? 1 : 0,
    table: [[0, 0, 0], [0, 1, 0], [1, 0, 0], [1, 1, 1]],
    topology: 'Two NPN transistors in SERIES. Current only reaches ground when BOTH transistors are ON.'
  },
  OR: {
    title: 'OR Gate',
    desc: 'Output is 1 if EITHER input A or input B (or both) are 1.',
    twoInputs: true,
    eval: (a, b) => (a || b) ? 1 : 0,
    table: [[0, 0, 0], [0, 1, 1], [1, 0, 1], [1, 1, 1]],
    topology: 'Two NPN transistors in PARALLEL. Turning either transistor ON pulls the common node.'
  },
  NAND: {
    title: 'NAND Gate (Universal Logic)',
    desc: 'Negated AND gate: Output is 0 ONLY when both inputs are 1.',
    twoInputs: true,
    eval: (a, b) => !(a && b) ? 1 : 0,
    table: [[0, 0, 1], [0, 1, 1], [1, 0, 1], [1, 1, 0]],
    topology: 'Standard building block of flash memory & modern CMOS: 2 NMOS in series, 2 PMOS in parallel.'
  },
  NOR: {
    title: 'NOR Gate (Universal Logic)',
    desc: 'Negated OR gate: Output is 1 ONLY when both inputs are 0.',
    twoInputs: true,
    eval: (a, b) => !(a || b) ? 1 : 0,
    table: [[0, 0, 1], [0, 1, 0], [1, 0, 0], [1, 1, 0]],
    topology: 'Apollo Guidance Computer was built entirely from 3-input NOR gates in integrated circuits.'
  },
  XOR: {
    title: 'XOR Gate (Exclusive OR / Sum)',
    desc: 'Output is 1 when inputs differ. Serves as 1-bit binary adder (Sum).',
    twoInputs: true,
    eval: (a, b) => (a ^ b) ? 1 : 0,
    table: [[0, 0, 0], [0, 1, 1], [1, 0, 1], [1, 1, 0]],
    topology: 'Requires 8-12 CMOS transistors. Quantum equivalent is the reversible CNOT gate.'
  }
};

function initModuleB() {
  const gateButtons = document.querySelectorAll('.gate-btn');
  gateButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      gateButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectModuleBGate(btn.getAttribute('data-gate'));
    });
  });
  selectModuleBGate('NOT');
}

function selectModuleBGate(gateName) {
  state.moduleB.currentGate = gateName;
  const g = GATES_DATA[gateName];

  document.getElementById('mb-gate-title').textContent = g.title;
  document.getElementById('mb-gate-desc').textContent = g.desc;
  document.getElementById('mb-topology-text').textContent = g.topology;

  const inBContainer = document.getElementById('mb-input-b-container');
  inBContainer.style.display = g.twoInputs ? 'flex' : 'none';

  updateModuleBOutput();
}

function toggleGateInput(which) {
  if (which === 'A') {
    state.moduleB.inA = state.moduleB.inA === 0 ? 1 : 0;
    document.getElementById('mb-btn-a').textContent = state.moduleB.inA;
  } else {
    state.moduleB.inB = state.moduleB.inB === 0 ? 1 : 0;
    document.getElementById('mb-btn-b').textContent = state.moduleB.inB;
  }
  updateModuleBOutput();
}

function updateModuleBOutput() {
  const g = GATES_DATA[state.moduleB.currentGate];
  const out = g.twoInputs ? g.eval(state.moduleB.inA, state.moduleB.inB) : g.eval(state.moduleB.inA);

  const outBadge = document.getElementById('mb-gate-out');
  outBadge.textContent = out;
  outBadge.style.color = out ? 'var(--accent-green)' : 'var(--text-muted)';

  // Build truth table
  const table = document.getElementById('mb-truth-table');
  table.innerHTML = '';
  const thead = document.createElement('thead');
  thead.innerHTML = g.twoInputs
    ? '<tr><th>Input A</th><th>Input B</th><th>Output Y</th></tr>'
    : '<tr><th>Input A</th><th>Output Y</th></tr>';
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  g.table.forEach(row => {
    const tr = document.createElement('tr');
    const isCurrent = g.twoInputs
      ? (row[0] === state.moduleB.inA && row[1] === state.moduleB.inB)
      : (row[0] === state.moduleB.inA);

    if (isCurrent) {
      tr.style.backgroundColor = 'rgba(56, 189, 248, 0.2)';
      tr.style.fontWeight = 'bold';
    }

    if (g.twoInputs) {
      tr.innerHTML = `<td>${row[0]}</td><td>${row[1]}</td><td><span class="badge ${row[2] ? 'badge-success' : ''}">${row[2]}</span></td>`;
    } else {
      tr.innerHTML = `<td>${row[0]}</td><td><span class="badge ${row[1] ? 'badge-success' : ''}">${row[1]}</span></td>`;
    }
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);

  drawModuleB_Schematic();
}

// Helper: Draw NPN BJT Transistor Symbol
function drawNPNSymbol(ctx, x, y, isConducting, label, isLight) {
  const wireCol = isLight ? '#475569' : '#94a3b8';
  const actCol = '#38bdf8';
  const leadCol = isConducting ? actCol : wireCol;

  // Base Bar
  ctx.strokeStyle = leadCol;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(x - 18, y - 18);
  ctx.lineTo(x - 18, y + 18);
  ctx.stroke();

  // Base Lead
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 32, y);
  ctx.lineTo(x - 18, y);
  ctx.stroke();

  // Collector Branch (Angled up)
  ctx.beginPath();
  ctx.moveTo(x - 18, y - 8);
  ctx.lineTo(x, y - 18);
  ctx.lineTo(x, y - 24);
  ctx.stroke();

  // Emitter Branch (Angled down with NPN Arrow)
  ctx.beginPath();
  ctx.moveTo(x - 18, y + 8);
  ctx.lineTo(x, y + 18);
  ctx.lineTo(x, y + 24);
  ctx.stroke();

  // NPN Arrowhead on Emitter (pointing outward/down)
  ctx.fillStyle = leadCol;
  ctx.beginPath();
  ctx.moveTo(x - 4, y + 14);
  ctx.lineTo(x, y + 18);
  ctx.lineTo(x - 8, y + 20);
  ctx.fill();

  // Transistor Label & State
  ctx.fillStyle = isConducting ? '#38bdf8' : (isLight ? '#64748b' : '#94a3b8');
  ctx.font = 'bold 10px Fira Code';
  ctx.fillText(label, x + 8, y - 4);

  ctx.font = '9px Inter';
  ctx.fillStyle = isConducting ? '#22c55e' : (isLight ? '#94a3b8' : '#64748b');
  ctx.fillText(isConducting ? 'ON (Sat)' : 'OFF (Cut)', x + 8, y + 8);
}

// Helper: Draw Resistor Symbol
function drawResistorSymbol(ctx, x, y, w, h, label, isHorizontal, isLight) {
  ctx.fillStyle = isLight ? '#f8fafc' : '#1e293b';
  ctx.strokeStyle = isLight ? '#64748b' : '#94a3b8';
  ctx.lineWidth = 1.5;

  if (isHorizontal) {
    ctx.fillRect(x - w / 2, y - h / 2, w, h);
    ctx.strokeRect(x - w / 2, y - h / 2, w, h);
    ctx.fillStyle = isLight ? '#0f172a' : '#f8fafc';
    ctx.font = '9px Fira Code';
    ctx.textAlign = 'center';
    ctx.fillText(label, x, y - h / 2 - 4);
    ctx.textAlign = 'left';
  } else {
    ctx.fillRect(x - w / 2, y - h / 2, w, h);
    ctx.strokeRect(x - w / 2, y - h / 2, w, h);
    ctx.fillStyle = isLight ? '#0f172a' : '#f8fafc';
    ctx.font = '9px Fira Code';
    ctx.fillText(label, x + w / 2 + 5, y + 3);
  }
}

// Helper: Draw Ground Symbol
function drawGNDSymbol(ctx, x, y, isLight) {
  const col = isLight ? '#334155' : '#94a3b8';
  ctx.strokeStyle = col;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y); ctx.lineTo(x, y + 10);
  ctx.moveTo(x - 12, y + 10); ctx.lineTo(x + 12, y + 10);
  ctx.moveTo(x - 8, y + 14); ctx.lineTo(x + 8, y + 14);
  ctx.moveTo(x - 4, y + 18); ctx.lineTo(x + 4, y + 18);
  ctx.stroke();
  ctx.fillStyle = col;
  ctx.font = '9px Inter';
  ctx.fillText('GND', x + 15, y + 15);
}

// Helper: Draw IEEE Logic Gate Symbol Inset
function drawIEEEInsetSymbol(ctx, gate, boxX, boxY, boxW, boxH, inA, inB, outVal, isLight) {
  // Inset Box
  ctx.fillStyle = isLight ? 'rgba(241, 245, 249, 0.95)' : 'rgba(15, 23, 42, 0.9)';
  ctx.strokeStyle = isLight ? '#cbd5e1' : '#334155';
  ctx.lineWidth = 1;
  ctx.fillRect(boxX, boxY, boxW, boxH);
  ctx.strokeRect(boxX, boxY, boxW, boxH);

  ctx.fillStyle = isLight ? '#0f172a' : '#f8fafc';
  ctx.font = 'bold 9px Inter';
  ctx.fillText('IEEE Gate Symbol', boxX + 8, boxY + 12);

  const cx = boxX + 48;
  const cy = boxY + 40;
  const colA = inA ? '#38bdf8' : (isLight ? '#94a3b8' : '#64748b');
  const colB = inB ? '#38bdf8' : (isLight ? '#94a3b8' : '#64748b');
  const colOut = outVal ? '#22c55e' : (isLight ? '#94a3b8' : '#64748b');

  ctx.lineWidth = 1.8;
  ctx.strokeStyle = isLight ? '#0f172a' : '#f8fafc';

  if (gate === 'NOT') {
    // Input wire
    ctx.strokeStyle = colA;
    ctx.beginPath(); ctx.moveTo(boxX + 15, cy); ctx.lineTo(cx - 16, cy); ctx.stroke();
    // Triangle
    ctx.strokeStyle = isLight ? '#0f172a' : '#f8fafc';
    ctx.beginPath();
    ctx.moveTo(cx - 16, cy - 14);
    ctx.lineTo(cx - 16, cy + 14);
    ctx.lineTo(cx + 8, cy);
    ctx.closePath();
    ctx.stroke();
    // Inversion Bubble
    ctx.beginPath(); ctx.arc(cx + 12, cy, 3.5, 0, Math.PI * 2); ctx.stroke();
    // Output wire
    ctx.strokeStyle = colOut;
    ctx.beginPath(); ctx.moveTo(cx + 16, cy); ctx.lineTo(boxX + boxW - 12, cy); ctx.stroke();
  } else if (gate === 'AND' || gate === 'NAND') {
    // Inputs A and B wires
    ctx.strokeStyle = colA; ctx.beginPath(); ctx.moveTo(boxX + 12, cy - 8); ctx.lineTo(cx - 15, cy - 8); ctx.stroke();
    ctx.strokeStyle = colB; ctx.beginPath(); ctx.moveTo(boxX + 12, cy + 8); ctx.lineTo(cx - 15, cy + 8); ctx.stroke();

    // D-Shape
    ctx.strokeStyle = isLight ? '#0f172a' : '#f8fafc';
    ctx.beginPath();
    ctx.moveTo(cx - 15, cy - 15);
    ctx.lineTo(cx, cy - 15);
    ctx.arc(cx, cy, 15, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(cx - 15, cy + 15);
    ctx.closePath();
    ctx.stroke();

    if (gate === 'NAND') {
      ctx.beginPath(); ctx.arc(cx + 19, cy, 3.5, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = colOut;
      ctx.beginPath(); ctx.moveTo(cx + 23, cy); ctx.lineTo(boxX + boxW - 10, cy); ctx.stroke();
    } else {
      ctx.strokeStyle = colOut;
      ctx.beginPath(); ctx.moveTo(cx + 15, cy); ctx.lineTo(boxX + boxW - 10, cy); ctx.stroke();
    }
  } else if (gate === 'OR' || gate === 'NOR') {
    // Inputs A and B wires
    ctx.strokeStyle = colA; ctx.beginPath(); ctx.moveTo(boxX + 12, cy - 8); ctx.lineTo(cx - 12, cy - 8); ctx.stroke();
    ctx.strokeStyle = colB; ctx.beginPath(); ctx.moveTo(boxX + 12, cy + 8); ctx.lineTo(cx - 12, cy + 8); ctx.stroke();

    // Curved Shield
    ctx.strokeStyle = isLight ? '#0f172a' : '#f8fafc';
    ctx.beginPath();
    ctx.moveTo(cx - 18, cy - 15);
    ctx.quadraticCurveTo(cx - 8, cy - 15, cx + 8, cy);
    ctx.quadraticCurveTo(cx - 8, cy + 15, cx - 18, cy + 15);
    ctx.quadraticCurveTo(cx - 10, cy, cx - 18, cy - 15);
    ctx.stroke();

    if (gate === 'NOR') {
      ctx.beginPath(); ctx.arc(cx + 12, cy, 3.5, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = colOut;
      ctx.beginPath(); ctx.moveTo(cx + 16, cy); ctx.lineTo(boxX + boxW - 10, cy); ctx.stroke();
    } else {
      ctx.strokeStyle = colOut;
      ctx.beginPath(); ctx.moveTo(cx + 8, cy); ctx.lineTo(boxX + boxW - 10, cy); ctx.stroke();
    }
  } else if (gate === 'XOR') {
    // Inputs A and B wires
    ctx.strokeStyle = colA; ctx.beginPath(); ctx.moveTo(boxX + 10, cy - 8); ctx.lineTo(cx - 18, cy - 8); ctx.stroke();
    ctx.strokeStyle = colB; ctx.beginPath(); ctx.moveTo(boxX + 10, cy + 8); ctx.lineTo(cx - 18, cy + 8); ctx.stroke();

    // Extra curved back line for XOR
    ctx.strokeStyle = isLight ? '#0f172a' : '#f8fafc';
    ctx.beginPath();
    ctx.moveTo(cx - 23, cy - 15);
    ctx.quadraticCurveTo(cx - 15, cy, cx - 23, cy + 15);
    ctx.stroke();

    // Body
    ctx.beginPath();
    ctx.moveTo(cx - 18, cy - 15);
    ctx.quadraticCurveTo(cx - 8, cy - 15, cx + 8, cy);
    ctx.quadraticCurveTo(cx - 8, cy + 15, cx - 18, cy + 15);
    ctx.quadraticCurveTo(cx - 10, cy, cx - 18, cy - 15);
    ctx.stroke();

    ctx.strokeStyle = colOut;
    ctx.beginPath(); ctx.moveTo(cx + 8, cy); ctx.lineTo(boxX + boxW - 10, cy); ctx.stroke();
  }
}

// Master Module B Schematic Drawing Engine
let modBAnimOffset = 0;
function drawModuleB_Schematic() {
  const canvas = document.getElementById('mb-schematic-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const isLight = state.theme === 'light';
  const wireCol = isLight ? '#475569' : '#94a3b8';
  const actCol = '#38bdf8';
  const greenCol = '#22c55e';
  const redCol = '#ef4444';

  const gate = state.moduleB.currentGate;
  const inA = state.moduleB.inA;
  const inB = state.moduleB.inB;
  const gData = GATES_DATA[gate];
  const outVal = gData.twoInputs ? gData.eval(inA, inB) : gData.eval(inA);

  modBAnimOffset = (modBAnimOffset + 1.2) % 24;

  // Title Banner
  ctx.fillStyle = isLight ? '#0f172a' : '#f8fafc';
  ctx.font = 'bold 12px Inter';
  ctx.fillText(`${gate} Gate: True Transistor-Level Schematic`, 18, 20);

  // Power Rail: +5V (VCC)
  ctx.strokeStyle = redCol;
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(25, 40); ctx.lineTo(340, 40); ctx.stroke();
  ctx.fillStyle = redCol;
  ctx.font = 'bold 10px Fira Code';
  ctx.fillText('+5V (VCC)', 25, 34);

  // Ground Rail: GND (0V)
  ctx.strokeStyle = isLight ? '#334155' : '#64748b';
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(25, 305); ctx.lineTo(340, 305); ctx.stroke();
  ctx.fillStyle = isLight ? '#334155' : '#94a3b8';
  ctx.font = 'bold 10px Fira Code';
  ctx.fillText('GND (0V)', 25, 322);

  // Draw IEEE Inset Symbol in Top-Right
  drawIEEEInsetSymbol(ctx, gate, 345, 12, 105, 75, inA, inB, outVal, isLight);

  // =========================================================================
  // CASE 1: NOT GATE (Single BJT Inverter)
  // =========================================================================
  if (gate === 'NOT') {
    const qX = 180, qY = 195;
    const isConducting = inA === 1;

    // Pull-up Resistor R_C (from VCC down to Collector)
    ctx.strokeStyle = isConducting ? actCol : wireCol;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(qX, 40); ctx.lineTo(qX, 85); ctx.stroke();
    drawResistorSymbol(ctx, qX, 100, 18, 30, 'R_C 1kΩ', false, isLight);
    ctx.beginPath(); ctx.moveTo(qX, 115); ctx.lineTo(qX, qY - 24); ctx.stroke();

    // Output Wire Tapped at Collector node (qX, 135)
    const nodeY = 135;
    ctx.fillStyle = isConducting ? '#f43f5e' : '#22c55e';
    ctx.beginPath(); ctx.arc(qX, nodeY, 4, 0, Math.PI * 2); ctx.fill();

    ctx.strokeStyle = outVal ? greenCol : wireCol;
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(qX, nodeY); ctx.lineTo(380, nodeY); ctx.stroke();

    // Output Terminal Badge
    ctx.fillStyle = outVal ? greenCol : (isLight ? '#94a3b8' : '#64748b');
    ctx.beginPath(); ctx.arc(380, nodeY, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = isLight ? '#0f172a' : '#f8fafc';
    ctx.font = 'bold 11px Fira Code';
    ctx.fillText(`Output Y = ${outVal}`, 392, nodeY - 4);
    ctx.font = '9px Fira Code';
    ctx.fillStyle = outVal ? greenCol : redCol;
    ctx.fillText(outVal ? '(5.0V High)' : '(0.18V Low)', 392, nodeY + 9);

    // Base Input Branch
    const inWireCol = inA ? actCol : wireCol;
    ctx.strokeStyle = inWireCol;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(35, qY); ctx.lineTo(85, qY); ctx.stroke();
    drawResistorSymbol(ctx, 105, qY, 32, 16, 'R_B 1kΩ', true, isLight);
    ctx.beginPath(); ctx.moveTo(121, qY); ctx.lineTo(qX - 32, qY); ctx.stroke();

    // Input A Terminal
    ctx.fillStyle = inA ? actCol : (isLight ? '#94a3b8' : '#64748b');
    ctx.beginPath(); ctx.arc(35, qY, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = isLight ? '#0f172a' : '#f8fafc';
    ctx.font = 'bold 11px Fira Code';
    ctx.fillText(`In A: ${inA}`, 25, qY - 10);

    // Draw Transistor Q1
    drawNPNSymbol(ctx, qX, qY, isConducting, 'Q1 (2N2222)', isLight);

    // Emitter to GND
    ctx.strokeStyle = isConducting ? actCol : wireCol;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(qX, qY + 24); ctx.lineTo(qX, 305); ctx.stroke();

    // Live Current Particles if conducting
    if (isConducting) {
      ctx.fillStyle = '#facc15';
      for (let p = 0; p < 260; p += 25) {
        const py = 40 + ((p + modBAnimOffset) % 265);
        ctx.beginPath(); ctx.arc(qX, py, 2.5, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  // =========================================================================
  // CASE 2: NAND GATE (2 Series NPN BJTs - Universal RTL Topology)
  // =========================================================================
  else if (gate === 'NAND') {
    const qX = 180;
    const qAY = 145;
    const qBY = 235;
    const isQ1ON = inA === 1;
    const isQ2ON = inB === 1;
    const fullPathConduction = isQ1ON && isQ2ON;

    // Pull-Up Resistor R_C
    ctx.strokeStyle = fullPathConduction ? actCol : wireCol;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(qX, 40); ctx.lineTo(qX, 60); ctx.stroke();
    drawResistorSymbol(ctx, qX, 75, 18, 30, 'R_C 1kΩ', false, isLight);
    ctx.beginPath(); ctx.moveTo(qX, 90); ctx.lineTo(qX, qAY - 24); ctx.stroke();

    // Node Y (NAND Output)
    const nodeY = 105;
    ctx.fillStyle = fullPathConduction ? '#f43f5e' : '#22c55e';
    ctx.beginPath(); ctx.arc(qX, nodeY, 4, 0, Math.PI * 2); ctx.fill();

    // Output Line to Right
    ctx.strokeStyle = outVal ? greenCol : wireCol;
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(qX, nodeY); ctx.lineTo(380, nodeY); ctx.stroke();
    ctx.fillStyle = outVal ? greenCol : (isLight ? '#94a3b8' : '#64748b');
    ctx.beginPath(); ctx.arc(380, nodeY, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = isLight ? '#0f172a' : '#f8fafc';
    ctx.font = 'bold 11px Fira Code';
    ctx.fillText(`Output Y = ${outVal}`, 380, nodeY - 12);
    ctx.font = '9px Fira Code';
    ctx.fillStyle = outVal ? greenCol : redCol;
    ctx.fillText(outVal ? '(5V High)' : '(0V Low)', 380, nodeY + 16);

    // Transistor QA (Top)
    drawNPNSymbol(ctx, qX, qAY, isQ1ON, 'QA (Top)', isLight);
    // Base A wire & resistor
    ctx.strokeStyle = inA ? actCol : wireCol;
    ctx.beginPath(); ctx.moveTo(35, qAY); ctx.lineTo(85, qAY); ctx.stroke();
    drawResistorSymbol(ctx, 105, qAY, 32, 16, 'R_BA', true, isLight);
    ctx.beginPath(); ctx.moveTo(121, qAY); ctx.lineTo(qX - 32, qAY); ctx.stroke();
    ctx.fillStyle = inA ? actCol : (isLight ? '#94a3b8' : '#64748b');
    ctx.beginPath(); ctx.arc(35, qAY, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = isLight ? '#0f172a' : '#f8fafc';
    ctx.fillText(`In A: ${inA}`, 25, qAY - 10);

    // SERIES CONNECTION: Emitter of QA connects directly to Collector of QB!
    ctx.strokeStyle = (isQ1ON && isQ2ON) ? actCol : wireCol;
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(qX, qAY + 24); ctx.lineTo(qX, qBY - 24); ctx.stroke();
    ctx.fillStyle = isLight ? '#475569' : '#94a3b8';
    ctx.font = '9px Inter';
    ctx.fillText('Series Link', qX + 6, (qAY + qBY) / 2);

    // Transistor QB (Bottom)
    drawNPNSymbol(ctx, qX, qBY, isQ2ON, 'QB (Bottom)', isLight);
    // Base B wire & resistor
    ctx.strokeStyle = inB ? actCol : wireCol;
    ctx.beginPath(); ctx.moveTo(35, qBY); ctx.lineTo(85, qBY); ctx.stroke();
    drawResistorSymbol(ctx, 105, qBY, 32, 16, 'R_BB', true, isLight);
    ctx.beginPath(); ctx.moveTo(121, qBY); ctx.lineTo(qX - 32, qBY); ctx.stroke();
    ctx.fillStyle = inB ? actCol : (isLight ? '#94a3b8' : '#64748b');
    ctx.beginPath(); ctx.arc(35, qBY, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = isLight ? '#0f172a' : '#f8fafc';
    ctx.fillText(`In B: ${inB}`, 25, qBY - 10);

    // Emitter of QB to GND
    ctx.strokeStyle = fullPathConduction ? actCol : wireCol;
    ctx.beginPath(); ctx.moveTo(qX, qBY + 24); ctx.lineTo(qX, 305); ctx.stroke();

    // Current animation if both ON
    if (fullPathConduction) {
      ctx.fillStyle = '#facc15';
      for (let p = 0; p < 265; p += 25) {
        const py = 40 + ((p + modBAnimOffset) % 265);
        ctx.beginPath(); ctx.arc(qX, py, 2.5, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  // =========================================================================
  // CASE 3: AND GATE (2 Series BJTs NAND Stage + 1 Inverter BJT Stage)
  // =========================================================================
  else if (gate === 'AND') {
    const q1X = 120, q1AY = 140, q1BY = 230;
    const qInvX = 265, qInvY = 190;
    const nandConducting = (inA === 1) && (inB === 1);
    const nandOut = nandConducting ? 0 : 1;
    const invConducting = nandOut === 1;

    // NAND Stage Pull-Up R_C1
    ctx.strokeStyle = nandConducting ? actCol : wireCol;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(q1X, 40); ctx.lineTo(q1X, 60); ctx.stroke();
    drawResistorSymbol(ctx, q1X, 75, 16, 28, 'R_C1', false, isLight);
    ctx.beginPath(); ctx.moveTo(q1X, 90); ctx.lineTo(q1X, q1AY - 24); ctx.stroke();

    // QA and QB in Series
    drawNPNSymbol(ctx, q1X, q1AY, inA === 1, 'QA', isLight);
    drawNPNSymbol(ctx, q1X, q1BY, inB === 1, 'QB', isLight);

    // Series link between QA and QB
    ctx.strokeStyle = nandConducting ? actCol : wireCol;
    ctx.beginPath(); ctx.moveTo(q1X, q1AY + 24); ctx.lineTo(q1X, q1BY - 24); ctx.stroke();
    // QB Emitter to GND
    ctx.beginPath(); ctx.moveTo(q1X, q1BY + 24); ctx.lineTo(q1X, 305); ctx.stroke();

    // Inputs A and B
    ctx.strokeStyle = inA ? actCol : wireCol;
    ctx.beginPath(); ctx.moveTo(25, q1AY); ctx.lineTo(55, q1AY); ctx.stroke();
    drawResistorSymbol(ctx, 70, q1AY, 26, 14, 'R_A', true, isLight);
    ctx.beginPath(); ctx.moveTo(83, q1AY); ctx.lineTo(q1X - 32, q1AY); ctx.stroke();
    ctx.fillText(`A:${inA}`, 15, q1AY - 6);

    ctx.strokeStyle = inB ? actCol : wireCol;
    ctx.beginPath(); ctx.moveTo(25, q1BY); ctx.lineTo(55, q1BY); ctx.stroke();
    drawResistorSymbol(ctx, 70, q1BY, 26, 14, 'R_B', true, isLight);
    ctx.beginPath(); ctx.moveTo(83, q1BY); ctx.lineTo(q1X - 32, q1BY); ctx.stroke();
    ctx.fillText(`B:${inB}`, 15, q1BY - 6);

    // Intermediate Node Y_int (NAND Output) tapped and fed to Inverter
    const nodeY = 100;
    ctx.fillStyle = nandConducting ? '#f43f5e' : '#22c55e';
    ctx.beginPath(); ctx.arc(q1X, nodeY, 3.5, 0, Math.PI * 2); ctx.fill();

    // Wire to Inverter Stage Base
    ctx.strokeStyle = nandOut ? actCol : wireCol;
    ctx.beginPath();
    ctx.moveTo(q1X, nodeY);
    ctx.lineTo(195, nodeY);
    ctx.lineTo(195, qInvY);
    ctx.lineTo(210, qInvY);
    ctx.stroke();
    drawResistorSymbol(ctx, 222, qInvY, 24, 14, 'R_inv', true, isLight);
    ctx.beginPath(); ctx.moveTo(234, qInvY); ctx.lineTo(qInvX - 32, qInvY); ctx.stroke();

    ctx.fillStyle = isLight ? '#475569' : '#94a3b8';
    ctx.font = '8px Fira Code';
    ctx.fillText(`Int: ${nandOut}`, 165, nodeY - 6);

    // Inverter Stage Transistor Q_inv
    drawNPNSymbol(ctx, qInvX, qInvY, invConducting, 'Q_inv', isLight);

    // Inverter Pull-up R_C2
    ctx.strokeStyle = invConducting ? actCol : wireCol;
    ctx.beginPath(); ctx.moveTo(qInvX, 40); ctx.lineTo(qInvX, 75); ctx.stroke();
    drawResistorSymbol(ctx, qInvX, 90, 16, 28, 'R_C2', false, isLight);
    ctx.beginPath(); ctx.moveTo(qInvX, 105); ctx.lineTo(qInvX, qInvY - 24); ctx.stroke();

    // Q_inv Emitter to GND
    ctx.beginPath(); ctx.moveTo(qInvX, qInvY + 24); ctx.lineTo(qInvX, 305); ctx.stroke();

    // Output Y from Q_inv Collector
    const outNodeY = 125;
    ctx.fillStyle = invConducting ? '#f43f5e' : '#22c55e';
    ctx.beginPath(); ctx.arc(qInvX, outNodeY, 4, 0, Math.PI * 2); ctx.fill();

    ctx.strokeStyle = outVal ? greenCol : wireCol;
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(qInvX, outNodeY); ctx.lineTo(380, outNodeY); ctx.stroke();
    ctx.fillStyle = outVal ? greenCol : (isLight ? '#94a3b8' : '#64748b');
    ctx.beginPath(); ctx.arc(380, outNodeY, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = isLight ? '#0f172a' : '#f8fafc';
    ctx.font = 'bold 11px Fira Code';
    ctx.fillText(`Output Y = ${outVal}`, 380, outNodeY - 12);
    ctx.font = '9px Fira Code';
    ctx.fillStyle = outVal ? greenCol : redCol;
    ctx.fillText(outVal ? '(5V High)' : '(0V Low)', 380, outNodeY + 16);
  }

  // =========================================================================
  // CASE 4: NOR GATE (2 Parallel NPN BJTs - Apollo Guidance Universal RTL)
  // =========================================================================
  else if (gate === 'NOR') {
    const qAX = 125, qBX = 225, qY = 195;
    const isQ1ON = inA === 1;
    const isQ2ON = inB === 1;
    const anyConducting = isQ1ON || isQ2ON;

    // Common Collector Bus wire at y = 120
    const busY = 120;
    ctx.strokeStyle = anyConducting ? actCol : wireCol;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(qAX, busY); ctx.lineTo(qBX, busY); ctx.stroke();

    // Main Pull-Up Resistor R_C at center x = 175
    const midX = 175;
    ctx.beginPath(); ctx.moveTo(midX, 40); ctx.lineTo(midX, 60); ctx.stroke();
    drawResistorSymbol(ctx, midX, 75, 18, 30, 'R_C 1kΩ', false, isLight);
    ctx.beginPath(); ctx.moveTo(midX, 90); ctx.lineTo(midX, busY); ctx.stroke();

    // From bus down to Collector QA and Collector QB
    ctx.beginPath(); ctx.moveTo(qAX, busY); ctx.lineTo(qAX, qY - 24); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(qBX, busY); ctx.lineTo(qBX, qY - 24); ctx.stroke();

    // Common Emitter Bus wire to GND at y = 265
    const emBusY = 265;
    ctx.strokeStyle = anyConducting ? actCol : wireCol;
    ctx.beginPath(); ctx.moveTo(qAX, qY + 24); ctx.lineTo(qAX, emBusY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(qBX, qY + 24); ctx.lineTo(qBX, emBusY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(qAX, emBusY); ctx.lineTo(qBX, emBusY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(midX, emBusY); ctx.lineTo(midX, 305); ctx.stroke();

    // Draw Transistors QA and QB
    drawNPNSymbol(ctx, qAX, qY, isQ1ON, 'QA (Left)', isLight);
    drawNPNSymbol(ctx, qBX, qY, isQ2ON, 'QB (Right)', isLight);

    // Base A
    ctx.strokeStyle = inA ? actCol : wireCol;
    ctx.beginPath(); ctx.moveTo(25, qY); ctx.lineTo(55, qY); ctx.stroke();
    drawResistorSymbol(ctx, 70, qY, 26, 14, 'R_BA', true, isLight);
    ctx.beginPath(); ctx.moveTo(83, qY); ctx.lineTo(qAX - 32, qY); ctx.stroke();
    ctx.fillStyle = inA ? actCol : (isLight ? '#94a3b8' : '#64748b');
    ctx.beginPath(); ctx.arc(25, qY, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = isLight ? '#0f172a' : '#f8fafc';
    ctx.fillText(`A:${inA}`, 15, qY - 8);

    // Base B
    ctx.strokeStyle = inB ? actCol : wireCol;
    ctx.beginPath(); ctx.moveTo(25, 245); ctx.lineTo(155, 245); ctx.lineTo(155, qY); ctx.stroke();
    drawResistorSymbol(ctx, 175, qY, 26, 14, 'R_BB', true, isLight);
    ctx.beginPath(); ctx.moveTo(188, qY); ctx.lineTo(qBX - 32, qY); ctx.stroke();
    ctx.fillStyle = inB ? actCol : (isLight ? '#94a3b8' : '#64748b');
    ctx.beginPath(); ctx.arc(25, 245, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = isLight ? '#0f172a' : '#f8fafc';
    ctx.fillText(`B:${inB}`, 15, 237);

    // Output Node Y tapped from center of Collector Bus
    ctx.fillStyle = anyConducting ? '#f43f5e' : '#22c55e';
    ctx.beginPath(); ctx.arc(midX, busY, 4, 0, Math.PI * 2); ctx.fill();

    ctx.strokeStyle = outVal ? greenCol : wireCol;
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(midX, busY); ctx.lineTo(380, busY); ctx.stroke();
    ctx.fillStyle = outVal ? greenCol : (isLight ? '#94a3b8' : '#64748b');
    ctx.beginPath(); ctx.arc(380, busY, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = isLight ? '#0f172a' : '#f8fafc';
    ctx.font = 'bold 11px Fira Code';
    ctx.fillText(`Output Y = ${outVal}`, 380, busY - 12);
    ctx.font = '9px Fira Code';
    ctx.fillStyle = outVal ? greenCol : redCol;
    ctx.fillText(outVal ? '(5V High)' : '(0V Low)', 380, busY + 16);
  }

  // =========================================================================
  // CASE 5: OR GATE (2 Parallel BJTs NOR Stage + 1 Inverter BJT Stage)
  // =========================================================================
  else if (gate === 'OR') {
    const qAX = 95, qBX = 175, qY = 195;
    const qInvX = 275, qInvY = 195;
    const norConducting = (inA === 1) || (inB === 1);
    const norOut = norConducting ? 0 : 1;
    const invConducting = norOut === 1;

    // Parallel QA, QB with common collector bus at y = 120
    const busY = 120;
    ctx.strokeStyle = norConducting ? actCol : wireCol;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(qAX, busY); ctx.lineTo(qBX, busY); ctx.stroke();
    drawResistorSymbol(ctx, 135, 75, 16, 28, 'R_C1', false, isLight);
    ctx.beginPath(); ctx.moveTo(135, 40); ctx.lineTo(135, 61); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(135, 89); ctx.lineTo(135, busY); ctx.stroke();

    ctx.beginPath(); ctx.moveTo(qAX, busY); ctx.lineTo(qAX, qY - 24); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(qBX, busY); ctx.lineTo(qBX, qY - 24); ctx.stroke();

    // Emitters to GND
    const emBusY = 265;
    ctx.beginPath(); ctx.moveTo(qAX, qY + 24); ctx.lineTo(qAX, emBusY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(qBX, qY + 24); ctx.lineTo(qBX, emBusY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(qAX, emBusY); ctx.lineTo(qBX, emBusY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(135, emBusY); ctx.lineTo(135, 305); ctx.stroke();

    drawNPNSymbol(ctx, qAX, qY, inA === 1, 'QA', isLight);
    drawNPNSymbol(ctx, qBX, qY, inB === 1, 'QB', isLight);

    // Inputs
    ctx.strokeStyle = inA ? actCol : wireCol;
    ctx.beginPath(); ctx.moveTo(15, qY); ctx.lineTo(40, qY); ctx.stroke();
    drawResistorSymbol(ctx, 52, qY, 22, 14, 'RA', true, isLight);
    ctx.beginPath(); ctx.moveTo(63, qY); ctx.lineTo(qAX - 32, qY); ctx.stroke();
    ctx.fillText(`A:${inA}`, 10, qY - 6);

    ctx.strokeStyle = inB ? actCol : wireCol;
    ctx.beginPath(); ctx.moveTo(15, 245); ctx.lineTo(110, 245); ctx.lineTo(110, qY); ctx.stroke();
    drawResistorSymbol(ctx, 128, qY, 22, 14, 'RB', true, isLight);
    ctx.beginPath(); ctx.moveTo(139, qY); ctx.lineTo(qBX - 32, qY); ctx.stroke();
    ctx.fillText(`B:${inB}`, 10, 237);

    // Intermediate line to Inverter
    ctx.strokeStyle = norOut ? actCol : wireCol;
    ctx.beginPath();
    ctx.moveTo(135, busY);
    ctx.lineTo(215, busY);
    ctx.lineTo(215, qInvY);
    ctx.lineTo(225, qInvY);
    ctx.stroke();
    drawResistorSymbol(ctx, 236, qInvY, 22, 14, 'R_inv', true, isLight);
    ctx.beginPath(); ctx.moveTo(247, qInvY); ctx.lineTo(qInvX - 32, qInvY); ctx.stroke();

    // Inverter Stage
    drawNPNSymbol(ctx, qInvX, qInvY, invConducting, 'Q_inv', isLight);
    ctx.strokeStyle = invConducting ? actCol : wireCol;
    ctx.beginPath(); ctx.moveTo(qInvX, 40); ctx.lineTo(qInvX, 75); ctx.stroke();
    drawResistorSymbol(ctx, qInvX, 90, 16, 28, 'R_C2', false, isLight);
    ctx.beginPath(); ctx.moveTo(qInvX, 105); ctx.lineTo(qInvX, qInvY - 24); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(qInvX, qInvY + 24); ctx.lineTo(qInvX, 305); ctx.stroke();

    // Final Output Y
    const outNodeY = 125;
    ctx.fillStyle = invConducting ? '#f43f5e' : '#22c55e';
    ctx.beginPath(); ctx.arc(qInvX, outNodeY, 4, 0, Math.PI * 2); ctx.fill();

    ctx.strokeStyle = outVal ? greenCol : wireCol;
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(qInvX, outNodeY); ctx.lineTo(380, outNodeY); ctx.stroke();
    ctx.fillStyle = outVal ? greenCol : (isLight ? '#94a3b8' : '#64748b');
    ctx.beginPath(); ctx.arc(380, outNodeY, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = isLight ? '#0f172a' : '#f8fafc';
    ctx.font = 'bold 11px Fira Code';
    ctx.fillText(`Output Y = ${outVal}`, 380, outNodeY - 12);
    ctx.font = '9px Fira Code';
    ctx.fillStyle = outVal ? greenCol : redCol;
    ctx.fillText(outVal ? '(5V High)' : '(0V Low)', 380, outNodeY + 16);
  }

  // =========================================================================
  // CASE 6: XOR GATE (Balanced Cross-Coupled Transistor Network)
  // =========================================================================
  else if (gate === 'XOR') {
    const q1X = 120, q2X = 230;
    const topY = 140, botY = 230;

    // Branch 1: Q1 (A) and Q2 (NOT B)
    // Branch 2: Q3 (NOT A) and Q4 (B)
    const b1Conduct = (inA === 1 && inB === 0);
    const b2Conduct = (inA === 0 && inB === 1);
    const xorActive = b1Conduct || b2Conduct;

    // Common Output Pull-Up
    const outNodeX = 175, outNodeY = 95;
    ctx.strokeStyle = xorActive ? actCol : wireCol;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(outNodeX, 40); ctx.lineTo(outNodeX, 60); ctx.stroke();
    drawResistorSymbol(ctx, outNodeX, 75, 18, 28, 'R_C 1kΩ', false, isLight);
    ctx.beginPath(); ctx.moveTo(outNodeX, 90); ctx.lineTo(outNodeX, outNodeY); ctx.stroke();

    // Split to Branch 1 (left) and Branch 2 (right)
    ctx.beginPath(); ctx.moveTo(outNodeX, outNodeY); ctx.lineTo(q1X, outNodeY); ctx.lineTo(q1X, topY - 24); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(outNodeX, outNodeY); ctx.lineTo(q2X, outNodeY); ctx.lineTo(q2X, topY - 24); ctx.stroke();

    // Branch 1: Q1 (A) series with Q2 (B_bar)
    drawNPNSymbol(ctx, q1X, topY, inA === 1, 'Q1 (A)', isLight);
    drawNPNSymbol(ctx, q1X, botY, inB === 0, 'Q2 (~B)', isLight);
    ctx.beginPath(); ctx.moveTo(q1X, topY + 24); ctx.lineTo(q1X, botY - 24); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(q1X, botY + 24); ctx.lineTo(q1X, 305); ctx.stroke();

    // Branch 2: Q3 (A_bar) series with Q4 (B)
    drawNPNSymbol(ctx, q2X, topY, inA === 0, 'Q3 (~A)', isLight);
    drawNPNSymbol(ctx, q2X, botY, inB === 1, 'Q4 (B)', isLight);
    ctx.beginPath(); ctx.moveTo(q2X, topY + 24); ctx.lineTo(q2X, botY - 24); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(q2X, botY + 24); ctx.lineTo(q2X, 305); ctx.stroke();

    // Input Labels and Links
    ctx.fillStyle = isLight ? '#0f172a' : '#f8fafc';
    ctx.font = '10px Fira Code';
    ctx.fillText(`Branch 1: A·~B (${b1Conduct ? 'Active' : 'Closed'})`, 20, 290);
    ctx.fillText(`Branch 2: ~A·B (${b2Conduct ? 'Active' : 'Closed'})`, 180, 290);

    // Output Y
    ctx.fillStyle = xorActive ? '#f43f5e' : '#22c55e';
    ctx.beginPath(); ctx.arc(outNodeX, outNodeY, 4, 0, Math.PI * 2); ctx.fill();

    ctx.strokeStyle = outVal ? greenCol : wireCol;
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(outNodeX, outNodeY); ctx.lineTo(380, outNodeY); ctx.stroke();
    ctx.fillStyle = outVal ? greenCol : (isLight ? '#94a3b8' : '#64748b');
    ctx.beginPath(); ctx.arc(380, outNodeY, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = isLight ? '#0f172a' : '#f8fafc';
    ctx.font = 'bold 11px Fira Code';
    ctx.fillText(`Output Y = ${outVal}`, 380, outNodeY - 12);
    ctx.font = '9px Fira Code';
    ctx.fillStyle = outVal ? greenCol : redCol;
    ctx.fillText(outVal ? '(5V High)' : '(0V Low)', 380, outNodeY + 16);
  }
}

// Module B Live Animation Loop
setInterval(() => {
  const mbPane = document.getElementById('tab-module-b');
  if (mbPane && mbPane.classList.contains('active')) {
    drawModuleB_Schematic();
  }
}, 80);

// ====================================================================================
// 8. MODULE C: QUANTUM SIMULATOR (1-QUBIT GATES & MONTE CARLO HISTOGRAM)
// ====================================================================================
function initModuleC() {
  resetQuantumCircuit();
}

function resetQuantumCircuit() {
  state.moduleC.alpha = { r: 1.0, i: 0.0 };
  state.moduleC.beta = { r: 0.0, i: 0.0 };
  state.moduleC.history = [];
  updateModuleCUI();
}

// Complex number arithmetic
function cAdd(a, b) { return { r: a.r + b.r, i: a.i + b.i }; }
function cSub(a, b) { return { r: a.r - b.r, i: a.i - b.i }; }
function cMul(a, b) { return { r: a.r * b.r - a.i * b.i, i: a.r * b.i + a.i * b.r }; }
function cScale(a, s) { return { r: a.r * s, i: a.i * s }; }
function cNormSq(a) { return a.r * a.r + a.i * a.i; }

function applyQuantumGate(gate) {
  const a = state.moduleC.alpha;
  const b = state.moduleC.beta;
  const invSqrt2 = 1.0 / Math.SQRT2;

  let newA = a, newB = b;

  if (gate === 'X') {
    // X = [[0, 1], [1, 0]]
    newA = b;
    newB = a;
  } else if (gate === 'H') {
    // H = (1/sqrt(2)) * [[1, 1], [1, -1]]
    newA = cScale(cAdd(a, b), invSqrt2);
    newB = cScale(cSub(a, b), invSqrt2);
  } else if (gate === 'Z') {
    // Z = [[1, 0], [0, -1]]
    newA = a;
    newB = cScale(b, -1.0);
  } else if (gate === 'Y') {
    // Y = [[0, -i], [i, 0]]
    newA = { r: b.i, i: -b.r };
    newB = { r: -a.i, i: a.r };
  } else if (gate === 'S') {
    // S = [[1, 0], [0, i]]
    newA = a;
    newB = { r: -b.i, i: b.r };
  }

  state.moduleC.alpha = newA;
  state.moduleC.beta = newB;
  state.moduleC.history.push(gate);

  updateModuleCUI();
}

function updateModuleCUI() {
  const a = state.moduleC.alpha;
  const b = state.moduleC.beta;

  const p0 = cNormSq(a);
  const p1 = cNormSq(b);

  // Update wire display
  const wire = document.getElementById('qc-gate-sequence');
  wire.innerHTML = '<span class="qubit-label">q[0]: |0⟩</span>';
  state.moduleC.history.forEach(g => {
    const chip = document.createElement('span');
    chip.className = 'gate-badge-chip';
    chip.textContent = g;
    wire.appendChild(chip);
  });

  // State string
  const aStr = formatComplex(a);
  const bStr = formatComplex(b);
  document.getElementById('mc-ket-str').innerHTML = `|&psi;&rang; = (${aStr})|0&rang; + (${bStr})|1&rang;`;
  document.getElementById('mc-alpha-val').textContent = aStr;
  document.getElementById('mc-beta-val').textContent = bStr;

  // Relative phase
  const phaseA = Math.atan2(a.i, a.r);
  const phaseB = Math.atan2(b.i, b.r);
  let relPhase = ((phaseB - phaseA) * 180 / Math.PI) % 360;
  if (relPhase < 0) relPhase += 360;
  document.getElementById('mc-phase-val').textContent = relPhase.toFixed(1) + '°';

  // Probabilities
  const p0Pct = (p0 * 100);
  const p1Pct = (p1 * 100);
  document.getElementById('mc-p0-pct').textContent = p0Pct.toFixed(1) + '%';
  document.getElementById('mc-p1-pct').textContent = p1Pct.toFixed(1) + '%';
  document.getElementById('mc-p0-bar').style.width = p0Pct + '%';
  document.getElementById('mc-p1-bar').style.width = p1Pct + '%';

  // Bloch coordinates:
  // theta = 2 * arccos(|alpha|)
  const thetaDeg = 2 * Math.acos(Math.min(1.0, Math.sqrt(p0))) * (180 / Math.PI);
  document.getElementById('mc-theta-angle').textContent = thetaDeg.toFixed(1) + '°';
  document.getElementById('mc-phi-angle').textContent = relPhase.toFixed(1) + '°';

  drawModuleC_Bloch(thetaDeg, relPhase);
  drawModuleC_Histogram(1024);
}

function formatComplex(c) {
  const r = c.r.toFixed(3);
  const sign = c.i >= 0 ? '+' : '-';
  const absI = Math.abs(c.i).toFixed(3);
  return `${r} ${sign} ${absI}i`;
}

function drawModuleC_Bloch(theta, phi) {
  const canvas = document.getElementById('mc-bloch-canvas');
  if (!canvas) return;
  renderBlochSphere(canvas, theta !== undefined ? theta : 0, phi !== undefined ? phi : 0);
}

let lastShotsCounts = { 0: 1024, 1: 0 };
function run1024Shots() {
  const p0 = cNormSq(state.moduleC.alpha);
  let count0 = 0;
  for (let i = 0; i < 1024; i++) {
    if (Math.random() < p0) count0++;
  }
  lastShotsCounts = { 0: count0, 1: 1024 - count0 };
  drawModuleC_Histogram(1024);
}

function drawModuleC_Histogram(shots) {
  const canvas = document.getElementById('mc-hist-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const c0 = lastShotsCounts[0];
  const c1 = lastShotsCounts[1];

  const maxC = 1024;
  const barW = 55;
  const b0H = (c0 / maxC) * (h - 40);
  const b1H = (c1 / maxC) * (h - 40);

  // Bar 0
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(w / 3 - barW / 2, h - 25 - b0H, barW, b0H);
  ctx.fillText(`|0⟩: ${c0}`, w / 3 - barW / 2 + 5, h - 8);

  // Bar 1
  ctx.fillStyle = '#a855f7';
  ctx.fillRect((2 * w) / 3 - barW / 2, h - 25 - b1H, barW, b1H);
  ctx.fillText(`|1⟩: ${c1}`, (2 * w) / 3 - barW / 2 + 5, h - 8);
}

// ====================================================================================
// 9. NOISE & QUANTUM ERROR CORRECTION (QEC)
// ====================================================================================
function initNoiseLab() {
  document.getElementById('noise-sigma-slider').addEventListener('input', (e) => {
    state.noise.sigma = parseFloat(e.target.value);
    document.getElementById('noise-sigma-val').textContent = state.noise.sigma.toFixed(2) + ' V';
    updateClassicalNoise();
  });

  document.getElementById('noise-ideal-select').addEventListener('change', (e) => {
    state.noise.vIdeal = parseFloat(e.target.value);
    updateClassicalNoise();
  });

  updateClassicalNoise();
  runQECSimulation(-1);
}

function updateClassicalNoise() {
  const sigma = state.noise.sigma;
  const vIdeal = state.noise.vIdeal;
  const numSamples = state.noise.samples;

  // Monte Carlo sample for Gaussian noise
  let errors = 0;
  for (let i = 0; i < numSamples; i++) {
    // Box-Muller transform
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    const noisyV = vIdeal + z * sigma;

    // Threshold detection
    if (vIdeal > 2.5 && noisyV < 2.0) {
      errors++; // Dropped below logic high margin V_IH
    } else if (vIdeal < 2.5 && noisyV > 0.8) {
      errors++; // Exceeded logic low margin V_IL
    }
  }

  const ber = (errors / numSamples) * 100;
  document.getElementById('noise-errors-cnt').textContent = errors.toLocaleString();
  document.getElementById('noise-ber-val').textContent = ber.toFixed(2) + ' %';

  drawNoiseOscilloscope();
}

function drawNoiseOscilloscope() {
  const canvas = document.getElementById('noise-scope-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const isLight = state.theme === 'light';
  const sigma = state.noise.sigma;
  const vIdeal = state.noise.vIdeal;

  // Grid
  ctx.strokeStyle = isLight ? '#e2e8f0' : '#1e293b';
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
  for (let y = 0; y < h; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

  // Voltage Threshold Lines
  const vScale = h / 6.0; // 0 to 6V
  const yThreshHigh = h - 2.0 * vScale;
  const yThreshLow = h - 0.8 * vScale;

  ctx.strokeStyle = '#ef4444';
  ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(0, yThreshHigh); ctx.lineTo(w, yThreshHigh); ctx.stroke();
  ctx.fillStyle = '#ef4444';
  ctx.font = '10px Fira Code';
  ctx.fillText('V_IH Threshold (2.0V)', 10, yThreshHigh - 4);

  ctx.strokeStyle = '#f59e0b';
  ctx.beginPath(); ctx.moveTo(0, yThreshLow); ctx.lineTo(w, yThreshLow); ctx.stroke();
  ctx.fillStyle = '#f59e0b';
  ctx.fillText('V_IL Threshold (0.8V)', 10, yThreshLow + 12);
  ctx.setLineDash([]);

  // Live Noisy Waveform
  ctx.strokeStyle = '#22c55e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = 0; x < w; x += 3) {
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    const v = vIdeal + z * sigma;
    const y = Math.max(5, Math.min(h - 5, h - v * vScale));
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

function runQECSimulation(errorQubit) {
  state.qec.errorQubit = errorQubit;

  const synValElem = document.getElementById('qec-syn-val');
  const actionElem = document.getElementById('qec-action-val');
  const fidElem = document.getElementById('qec-fidelity-val');

  if (errorQubit === -1) {
    synValElem.textContent = '00 (s1=0, s0=0)';
    actionElem.textContent = 'None needed (No Bit Flip)';
    fidElem.textContent = '100.0% Restored';
  } else if (errorQubit === 0) {
    synValElem.textContent = '01 (s1=0, s0=1)';
    actionElem.textContent = 'Conditional Pauli-X applied to Data Qubit 0';
    fidElem.textContent = '100.0% Restored';
  } else if (errorQubit === 1) {
    synValElem.textContent = '11 (s1=1, s0=1)';
    actionElem.textContent = 'Conditional Pauli-X applied to Data Qubit 1';
    fidElem.textContent = '100.0% Restored';
  } else if (errorQubit === 2) {
    synValElem.textContent = '10 (s1=1, s0=0)';
    actionElem.textContent = 'Conditional Pauli-X applied to Data Qubit 2';
    fidElem.textContent = '100.0% Restored';
  }

  drawQECCircuit();
}

function drawQECCircuit() {
  const canvas = document.getElementById('qec-circuit-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const isLight = state.theme === 'light';
  const wireCol = isLight ? '#475569' : '#94a3b8';

  // 3 Data wires + 2 Syndrome wires
  const qLines = [
    { label: 'd0', y: 30 },
    { label: 'd1', y: 60 },
    { label: 'd2', y: 90 },
    { label: 's0', y: 125 },
    { label: 's1', y: 155 }
  ];

  ctx.lineWidth = 1.5;
  qLines.forEach(l => {
    ctx.strokeStyle = wireCol;
    ctx.beginPath(); ctx.moveTo(40, l.y); ctx.lineTo(w - 20, l.y); ctx.stroke();
    ctx.fillStyle = '#38bdf8';
    ctx.font = '10px Fira Code';
    ctx.fillText(l.label, 15, l.y + 4);
  });

  // Highlight Injected Error if any
  const errQ = state.qec.errorQubit;
  if (errQ >= 0) {
    const errY = qLines[errQ].y;
    ctx.fillStyle = '#f43f5e';
    ctx.fillRect(170, errY - 12, 24, 24);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px Fira Code';
    ctx.fillText('X', 178, errY + 4);
    ctx.fillStyle = '#f43f5e';
    ctx.font = '9px Inter';
    ctx.fillText('Noise', 168, errY - 16);
  }

  // Parity CNOTs to s0 and s1
  ctx.strokeStyle = '#a855f7';
  ctx.beginPath(); ctx.moveTo(240, 30); ctx.lineTo(240, 125); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(270, 60); ctx.lineTo(270, 125); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(300, 60); ctx.lineTo(300, 155); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(330, 90); ctx.lineTo(330, 155); ctx.stroke();

  // Recovery Gate Box
  if (errQ >= 0) {
    const recY = qLines[errQ].y;
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(380, recY - 12, 24, 24);
    ctx.fillStyle = '#fff';
    ctx.fillText('X', 388, recY + 4);
    ctx.fillStyle = '#22c55e';
    ctx.font = '9px Inter';
    ctx.fillText('Recover', 372, recY - 16);
  }
}

// ====================================================================================
// 10. EVALUATION ENGINE (PRE-TEST, POST-TEST & HAKE'S GAIN)
// ====================================================================================
const PRE_TEST_QUESTIONS = [
  {
    q: "1. In an NPN bipolar junction transistor (BJT) acting as a switch, what condition drives it into the saturation (ON) state?",
    opts: ["V_in = 0V with base-emitter junction reverse biased", "V_in >= 0.7V with base-emitter junction forward biased", "Collector current is zero", "V_CE equals V_CC"],
    ans: 1
  },
  {
    q: "2. What is the fundamental unit of information in a classical computer?",
    opts: ["Continuous voltage", "Classical bit (0 or 1)", "Probability amplitude", "Bloch sphere vector"],
    ans: 1
  },
  {
    q: "3. How does an RTL (Resistor-Transistor Logic) NOT gate invert an input voltage of 5V (Logic 1)?",
    opts: ["By boosting the voltage to 10V", "By saturating the transistor, dropping V_out to V_CE(sat) ~ 0.2V", "By disconnecting ground", "By converting voltage into magnetic spin"],
    ans: 1
  },
  {
    q: "4. What is the quantum equivalent of the classical NOT gate?",
    opts: ["Hadamard (H) Gate", "Pauli-Z Gate", "Pauli-X Gate", "Phase (S) Gate"],
    ans: 2
  },
  {
    q: "5. What mathematical space describes a single qubit state |ψ⟩ = α|0⟩ + β|1⟩?",
    opts: ["1D Real space R^1", "2D Complex Hilbert space C^2", "Discrete boolean set {0, 1}", "Euclidean 3D space R^3 only"],
    ans: 1
  },
  {
    q: "6. What is the normalization condition for the complex amplitudes α and β of a valid qubit?",
    opts: ["α + β = 1", "|α| + |β| = 1", "|α|^2 + |β|^2 = 1", "α * β = 0"],
    ans: 2
  },
  {
    q: "7. When a Hadamard gate is applied to state |0⟩, what is the resulting state?",
    opts: ["|1⟩", "(|0⟩ + |1⟩)/√2 (state |+⟩)", "(|0⟩ - |1⟩)/√2 (state |−⟩)", "|0⟩"],
    ans: 1
  },
  {
    q: "8. Why can a classical computer copy a bit freely, but a quantum computer cannot duplicate an unknown quantum state?",
    opts: ["Classical computers have larger memory", "The Quantum No-Cloning Theorem forbids copying unknown states", "Quantum gates are too slow", "Semiconductors have infinite fan-out"],
    ans: 1
  },
  {
    q: "9. How do classical logic gates typically handle small additive thermal noise?",
    opts: ["Noise accumulates without bound", "Noise margins (V_IL, V_IH) and non-linear saturation actively restore the signal", "They use quantum error correction", "They invert the noise"],
    ans: 1
  },
  {
    q: "10. In classical digital logic, what happens to information during operations like AND or OR?",
    opts: ["Information is always conserved", "Input information is permanently erased, dissipating Landauer's heat", "It is stored in superposition", "It creates quantum entanglement"],
    ans: 1
  }
];

const POST_TEST_QUESTIONS = [
  {
    q: "1. In terms of linear algebra, how does the Pauli-X gate operate on an arbitrary superposition state α|0⟩ + β|1⟩?",
    opts: ["α|0⟩ - β|1⟩", "β|0⟩ + α|1⟩", "α|1⟩ + β|0⟩", "(α+β)|0⟩"],
    ans: 1
  },
  {
    q: "2. If a qubit is in the state |+⟩ = (|0⟩+|1⟩)/√2 and we apply a second Hadamard gate H(H|0⟩), what is the outcome and why?",
    opts: ["Random 50% 0 and 50% 1", "100% |0⟩ due to constructive interference on |0⟩ and destructive on |1⟩", "100% |1⟩", "State collapses to mixed density matrix"],
    ans: 1
  },
  {
    q: "3. What physical property allows quantum circuits to evaluate all 4 inputs of a half-adder in a single run?",
    opts: ["Transistor overclocking", "Quantum Parallelism via Superposition", "Higher clock frequency", "Zero resistance in copper wires"],
    ans: 1
  },
  {
    q: "4. Why must quantum logic gates be represented by Unitary matrices (U† U = I)?",
    opts: ["To save electricity", "To preserve total probability (norm = 1) and guarantee reversibility", "Because quantum computers use AC power", "To prevent transistor heating"],
    ans: 1
  },
  {
    q: "5. What distinguishes quantum phase-flip noise (Pauli-Z) from classical bit noise?",
    opts: ["It changes voltage from 0V to 5V", "It alters the relative quantum phase without changing computational basis measurement probabilities", "It consumes more battery power", "It only affects classical wires"],
    ans: 1
  },
  {
    q: "6. How does the 3-qubit bit-flip repetition code detect errors without violating the No-Cloning Theorem?",
    opts: ["By cloning the state 3 times", "By measuring entangled parity syndromes without measuring the data amplitudes", "By measuring the qubit and resetting it", "By using a classical voting circuit"],
    ans: 1
  },
  {
    q: "7. In the 3-qubit bit-flip code, if the measured syndrome is (s1=1, s0=1), which qubit experienced an error?",
    opts: ["Qubit 0", "Qubit 1", "Qubit 2", "No error occurred"],
    ans: 1
  },
  {
    q: "8. What is the fundamental difference between reading a classical register vs measuring a quantum register?",
    opts: ["Quantum measurement is non-destructive", "Quantum measurement irreversibly collapses the wavefunction to an eigenstate", "Classical reading erases data", "Quantum measurement requires a multimeter"],
    ans: 1
  },
  {
    q: "9. Landauer's Principle dictates that erasing 1 bit of information dissipates at least k_B*T*ln(2) Joules. Why do ideal quantum circuits avoid this loss?",
    opts: ["Quantum gates are reversible and do not erase information", "Quantum computers operate at absolute zero", "Superconductors have infinite capacitance", "Qubits do not have mass"],
    ans: 0
  },
  {
    q: "10. In the Bloch sphere representation, where do the classical states 'Bit 0' and 'Bit 1' reside?",
    opts: ["Along the Equator", "At the North Pole (|0⟩) and South Pole (|1⟩)", "Outside the sphere", "At the center of the sphere"],
    ans: 1
  }
];

function initEvaluationQuestions() {
  renderQuestionList('pre-test-questions', PRE_TEST_QUESTIONS, 'pre');
  renderQuestionList('post-test-questions', POST_TEST_QUESTIONS, 'post');
}

function renderQuestionList(containerId, questions, prefix) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  questions.forEach((item, qIdx) => {
    const card = document.createElement('div');
    card.className = 'question-card';

    const qText = document.createElement('div');
    qText.className = 'question-text';
    qText.textContent = item.q;
    card.appendChild(qText);

    const grp = document.createElement('div');
    grp.className = 'options-group';

    item.opts.forEach((opt, optIdx) => {
      const lbl = document.createElement('label');
      lbl.className = 'option-label';
      lbl.innerHTML = `
        <input type="radio" name="${prefix}_q_${qIdx}" value="${optIdx}">
        <span>${opt}</span>
      `;
      grp.appendChild(lbl);
    });

    card.appendChild(grp);
    container.appendChild(card);
  });
}

function submitPreTest() {
  let score = 0;
  let answered = 0;

  PRE_TEST_QUESTIONS.forEach((item, qIdx) => {
    const sel = document.querySelector(`input[name="pre_q_${qIdx}"]:checked`);
    if (sel) {
      answered++;
      if (parseInt(sel.value) === item.ans) score++;
    }
  });

  if (answered < PRE_TEST_QUESTIONS.length) {
    if (!confirm(`You have only answered ${answered} of ${PRE_TEST_QUESTIONS.length} questions. Do you want to submit anyway?`)) {
      return;
    }
  }

  state.eval.preScore = score;
  const pct = (score / PRE_TEST_QUESTIONS.length) * 100;
  const disp = document.getElementById('pre-score-display');
  disp.style.display = 'block';
  disp.innerHTML = `
    <h4>Pre-Test Baseline Recorded: ${score} / ${PRE_TEST_QUESTIONS.length} (${pct.toFixed(1)}%)</h4>
    <p>Your baseline score has been saved. Please proceed through the 4 learning levels and simulator modules before attempting the Post-Test!</p>
  `;
}

function submitPostTest() {
  let score = 0;
  let answered = 0;

  POST_TEST_QUESTIONS.forEach((item, qIdx) => {
    const sel = document.querySelector(`input[name="post_q_${qIdx}"]:checked`);
    if (sel) {
      answered++;
      if (parseInt(sel.value) === item.ans) score++;
    }
  });

  if (answered < POST_TEST_QUESTIONS.length) {
    if (!confirm(`You have only answered ${answered} of ${POST_TEST_QUESTIONS.length} questions. Submit anyway?`)) {
      return;
    }
  }

  state.eval.postScore = score;
  const postPct = (score / POST_TEST_QUESTIONS.length) * 100;
  const disp = document.getElementById('post-score-display');
  disp.style.display = 'block';
  disp.innerHTML = `
    <h4>Post-Test Score: ${score} / ${POST_TEST_QUESTIONS.length} (${postPct.toFixed(1)}%)</h4>
  `;

  // Calculate Hake's Gain
  const prePct = state.eval.preScore !== null ? (state.eval.preScore / PRE_TEST_QUESTIONS.length) * 100 : 40.0; // fallback if pre-test not taken
  const absGain = postPct - prePct;
  const maxPossibleGain = 100.0 - prePct;
  const hakeG = maxPossibleGain > 0 ? (absGain / maxPossibleGain) : 1.0;

  const gainBox = document.getElementById('learning-gain-box');
  gainBox.style.display = 'block';
  document.getElementById('gain-pre-val').textContent = prePct.toFixed(1) + '%';
  document.getElementById('gain-post-val').textContent = postPct.toFixed(1) + '%';
  document.getElementById('gain-abs-val').textContent = (absGain >= 0 ? '+' : '') + absGain.toFixed(1) + '%';
  document.getElementById('gain-hake-val').textContent = hakeG.toFixed(2);

  let interpText = '';
  if (hakeG >= 0.7) {
    interpText = '<strong style="color:var(--accent-green)">High Normalized Learning Gain (g ≥ 0.70):</strong> Exemplary conceptual mastery achieved across semiconductor and quantum physics domains!';
  } else if (hakeG >= 0.3) {
    interpText = '<strong style="color:var(--accent-cyan)">Medium Normalized Learning Gain (0.30 ≤ g < 0.70):</strong> Good conceptual progress. Review quantum interference and reversible parity circuits for deeper viva mastery.';
  } else {
    interpText = '<strong style="color:var(--accent-rose)">Low Normalized Learning Gain (g < 0.30):</strong> Revisit the interactive modules, particularly Level 3 (Bloch sphere) and the Noise Lab.';
  }
  document.getElementById('gain-interp-val').innerHTML = interpText;
}
