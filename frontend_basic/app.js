(function () {
  const $ = (id) => document.getElementById(id);
  const state = {
    apiBase: localStorage.getItem("apiBase") || "http://localhost:8000",
    token: localStorage.getItem("token") || "",
    theme: localStorage.getItem("theme") || "dark", // default dark
    palette: localStorage.getItem("palette") || "brown", // default to user's palette
  };

  // Dashboard runtime state
  const dash = {
    flow: {
      ctx: null,
      canvas: null,
      particles: [],
      lastSpawn: 0,
      inflowColor: "#0bbf66",
      outflowColor: "#ff6b6b",
      bgAlpha: 0.06,
      running: false,
    },
    kpi: {
      revenue: { val: 150000, series: [] },
      expense: { val: 90000, series: [] },
      net: { val: 60000, series: [] },
      cash: { val: 240000, series: [] },
      timer: null,
      maxPoints: 30,
    },
    ticker: {
      el: null,
      paused: false,
      timer: null,
      itemsMax: 20,
      seq: 1,
    },
  };

  const setApiBase = (v) => {
    state.apiBase = v;
    localStorage.setItem("apiBase", v);
  };
  const setToken = (t) => {
    state.token = t || "";
    localStorage.setItem("token", state.token);
    $("tokenPreview").textContent = state.token ? state.token.slice(0, 18) + "..." : "(none)";
  };

  const applyTheme = () => {
    document.documentElement.setAttribute("data-theme", state.theme);
    document.documentElement.setAttribute("data-palette", state.palette);
    const btn = $("themeToggle");
    if (btn) btn.textContent = state.theme === "dark" ? "Dark ▾" : "Light ▾";
    const sel = $("paletteSelect");
    if (sel) sel.value = state.palette;
    // Refresh dashboard colors/sizing when theme or palette changes
    refreshDashboardTheme();
  };
  const toggleTheme = () => {
    state.theme = state.theme === "dark" ? "light" : "dark";
    localStorage.setItem("theme", state.theme);
    applyTheme();
  };
  const setPalette = (p) => {
    state.palette = p;
    localStorage.setItem("palette", state.palette);
    applyTheme();
  };

  const headers = (json = true) => {
    const h = json ? { "Content-Type": "application/json" } : {};
    if (state.token) h["Authorization"] = `Bearer ${state.token}`;
    return h;
  };

  const log = (el, data) => el.textContent = typeof data === "string" ? data : JSON.stringify(data, null, 2);

  async function register() {
    const payload = {
      name: $("regName").value.trim(),
      login_id: $("regLoginId").value.trim(),
      email_id: $("regEmail").value.trim(),
      password: $("regPassword").value,
    };
    const res = await fetch(`${state.apiBase}/api/v1/register`, {
      method: "POST", headers: headers(), body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    log($("regLog"), data);
    if (res.ok && data.access_token) setToken(data.access_token);
  }

  async function login() {
    const payload = {
      login_id: $("loginLoginId").value.trim(),
      password: $("loginPassword").value,
    };
    const res = await fetch(`${state.apiBase}/api/v1/login`, {
      method: "POST", headers: headers(), body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    log($("loginLog"), data);
    if (res.ok && data.access_token) setToken(data.access_token);
  }

  async function createContact() {
    if (!state.token) return log($("contactsLog"), "Please login first.");
    const payload = {
      name: $("contactName").value.trim(),
      email: $("contactEmail").value.trim() || null,
      phone: $("contactPhone").value.trim() || null,
      contact_type: "customer",
    };
    const res = await fetch(`${state.apiBase}/api/v1/masters/contacts`, {
      method: "POST", headers: headers(), body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    log($("contactsLog"), data);
    if (res.ok) await listContacts();
  }

  async function listContacts() {
    if (!state.token) return log($("contactsLog"), "Please login first.");
    const res = await fetch(`${state.apiBase}/api/v1/masters/contacts?page=1&per_page=50`, {
      headers: headers(false),
    });
    const data = await res.json().catch(() => ({}));
    log($("contactsLog"), data);

    const tbody = $("contactsTable").querySelector("tbody");
    tbody.innerHTML = "";
    if (res.ok && data.items && Array.isArray(data.items)) {
      data.items.forEach((c) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${escapeHtml(c.name || "")}</td>
          <td>${escapeHtml(c.email || "")}</td>
          <td>${escapeHtml(c.phone || "")}</td>
          <td><small>${escapeHtml(c.id || "")}</small></td>
        `;
        tbody.appendChild(tr);
      });
    }
  }

  function escapeHtml(str) {
    return (str + "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // ===== Dashboard helpers =====
  const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const fmt = (n) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  function initDashboard() {
    // Flow
    dash.flow.canvas = $("flowCanvas");
    dash.flow.ctx = dash.flow.canvas ? dash.flow.canvas.getContext("2d") : null;

    // KPI timer
    dash.kpi.series = [];
    [dash.kpi.revenue, dash.kpi.expense, dash.kpi.net, dash.kpi.cash].forEach(obj => obj.series = []);

    // Ticker
    dash.ticker.el = $("tickerList");
    const pauseBtn = $("pauseTicker");
    if (pauseBtn) pauseBtn.addEventListener("click", () => dash.ticker.paused = !dash.ticker.paused);

    refreshDashboardTheme();
    startFlow();
    startKPIs();
    startTicker();

    window.addEventListener('resize', resizeFlowCanvas);
  }

  function refreshDashboardTheme() {
    // Palette-aware colors
    const inflow = cssVar('--accent') || '#0bbf66';
    const outflow = cssVar('--danger') || '#ff6b6b';
    dash.flow.inflowColor = inflow;
    dash.flow.outflowColor = outflow;
    resizeFlowCanvas();
  }

  function resizeFlowCanvas() {
    if (!dash.flow.canvas) return;
    const rect = dash.flow.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    dash.flow.canvas.width = Math.max(600, Math.floor(rect.width * dpr));
    dash.flow.canvas.height = Math.max(200, Math.floor(rect.height * dpr));
  }

  function startFlow() {
    if (!dash.flow.ctx) return;
    dash.flow.running = true;
    let last = performance.now();
    const loop = (now) => {
      if (!dash.flow.running) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      stepFlow(dt);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  function spawnParticle() {
    const w = dash.flow.canvas.width;
    const h = dash.flow.canvas.height;
    const isInflow = Math.random() > 0.45; // slightly more inflows
    const speed = isInflow ? 40 : 32;
    const size = isInflow ? 2.0 + Math.random() * 2.5 : 1.8 + Math.random() * 2.2;
    const y = Math.random() * (h * 0.90) + h * 0.05;
    dash.flow.particles.push({
      x: -20, y,
      vx: (speed + Math.random() * 30) * (window.devicePixelRatio || 1),
      vy: (Math.random() - 0.5) * 8,
      life: 0,
      maxLife: 6 + Math.random() * 6,
      color: isInflow ? dash.flow.inflowColor : dash.flow.outflowColor,
      size: size * (window.devicePixelRatio || 1),
      glow: isInflow ? 0.7 : 0.6,
    });
  }

  function stepFlow(dt) {
    const ctx = dash.flow.ctx;
    const w = dash.flow.canvas.width;
    const h = dash.flow.canvas.height;

    // Fade background for trails
    ctx.fillStyle = `rgba(0,0,0,${state.theme === 'dark' ? 0.06 : 0.02})`;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillRect(0, 0, w, h);

    // Spawn
    dash.flow.lastSpawn += dt;
    const spawnRate = 0.018; // particles per ms equivalence
    if (dash.flow.lastSpawn > spawnRate) {
      dash.flow.lastSpawn = 0;
      for (let i = 0; i < 6; i++) spawnParticle();
    }

    // Draw particles
    ctx.globalCompositeOperation = 'lighter';
    for (let i = dash.flow.particles.length - 1; i >= 0; i--) {
      const p = dash.flow.particles[i];
      p.life += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy *= 0.98;
      const alpha = Math.max(0, 1 - (p.life / p.maxLife));
      if (p.x > w + 30 || alpha <= 0) {
        dash.flow.particles.splice(i, 1);
        continue;
      }
      ctx.beginPath();
      ctx.fillStyle = hexToRgba(p.color, alpha * (state.theme === 'dark' ? 0.9 : 0.7));
      ctx.shadowBlur = 12 * p.glow;
      ctx.shadowColor = p.color;
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function hexToRgba(hex, a) {
    const m = hex.replace('#','');
    const bigint = parseInt(m.length === 3 ? m.split('').map(c=>c+c).join('') : m, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r},${g},${b},${a})`;
  }

  function startKPIs() {
    if (dash.kpi.timer) clearInterval(dash.kpi.timer);
    // seed series
    for (let i = 0; i < dash.kpi.maxPoints; i++) {
      tickKPI(true);
    }
    renderKPIs();
    dash.kpi.timer = setInterval(() => {
      tickKPI(false);
      renderKPIs();
    }, 1200);
  }

  function tickKPI(seeding=false) {
    const jitter = () => (Math.random() - 0.45);
    dash.kpi.revenue.val = Math.max(0, dash.kpi.revenue.val * (1 + jitter() * 0.02) + (seeding ? 0 : 800 * Math.random()));
    dash.kpi.expense.val = Math.max(0, dash.kpi.expense.val * (1 + jitter() * 0.02) + (seeding ? 0 : 600 * Math.random()));
    dash.kpi.net.val = Math.max(0, dash.kpi.revenue.val - dash.kpi.expense.val);
    dash.kpi.cash.val = Math.max(0, dash.kpi.cash.val + (dash.kpi.net.val * 0.02) * (0.5 + Math.random()));

    const push = (arr, v) => { arr.push(v); if (arr.length > dash.kpi.maxPoints) arr.shift(); };
    push(dash.kpi.revenue.series, dash.kpi.revenue.val);
    push(dash.kpi.expense.series, dash.kpi.expense.val);
    push(dash.kpi.net.series, dash.kpi.net.val);
    push(dash.kpi.cash.series, dash.kpi.cash.val);
  }

  function renderKPIs() {
    $("kpiRevenue").textContent = fmt(dash.kpi.revenue.val);
    $("kpiExpense").textContent = fmt(dash.kpi.expense.val);
    $("kpiNet").textContent = fmt(dash.kpi.net.val);
    $("kpiCash").textContent = fmt(dash.kpi.cash.val);

    const drawSpark = (id, series, colorVar) => {
      const poly = $(id);
      if (!poly) return;
      const n = series.length;
      const max = Math.max(...series);
      const min = Math.min(...series);
      const range = Math.max(1, max - min);
      const pts = series.map((v, i) => {
        const x = (i / (n - 1)) * 100;
        const y = 2 + 28 * (1 - (v - min) / range);
        return `${x},${y}`;
      }).join(' ');
      poly.setAttribute('points', pts);
      poly.style.stroke = cssVar(colorVar) || '#888';
    };

    drawSpark('sparkRevenue', dash.kpi.revenue.series, '--accent');
    drawSpark('sparkExpense', dash.kpi.expense.series, '--danger');
    drawSpark('sparkNet', dash.kpi.net.series, '--accent-2');
    drawSpark('sparkCash', dash.kpi.cash.series, '--accent');
  }

  function startTicker() {
    if (!dash.ticker.el) return;
    if (dash.ticker.timer) clearInterval(dash.ticker.timer);
    dash.ticker.timer = setInterval(() => {
      if (dash.ticker.paused) return;
      addTickerItem();
      trimTicker();
    }, 1500);
  }

  function addTickerItem() {
    const li = document.createElement('li');
    const isInflow = Math.random() > 0.5;
    const amount = Math.floor(500 + Math.random() * 5000);
    const type = isInflow ? 'Payment Received' : 'Vendor Bill';
    const color = isInflow ? cssVar('--accent') : cssVar('--danger');
    const id = String(dash.ticker.seq++).padStart(5, '0');
    li.innerHTML = `
      <span style="color:${color}; font-weight:700;">${isInflow ? '+' : '-'} ${fmt(amount)}</span>
      <span class="meta">${type} • #${id}</span>
    `;
    dash.ticker.el.prepend(li);
  }

  function trimTicker() {
    const items = dash.ticker.el.querySelectorAll('li');
    for (let i = dash.ticker.itemsMax; i < items.length; i++) {
      items[i].remove();
    }
  }

  function init() {
    $("apiBase").value = state.apiBase;
    $("saveApiBase").addEventListener("click", () => setApiBase($("apiBase").value.trim()));
    const toggle = $("themeToggle");
    if (toggle) toggle.addEventListener("click", toggleTheme);
    const paletteSelect = $("paletteSelect");
    if (paletteSelect) paletteSelect.addEventListener("change", (e) => setPalette(e.target.value));
    applyTheme();

    $("btnRegister").addEventListener("click", register);
    $("btnLogin").addEventListener("click", login);
    $("btnCreateContact").addEventListener("click", createContact);
    $("btnListContacts").addEventListener("click", listContacts);
    setToken(state.token);

    // Dashboard
    initDashboard();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
