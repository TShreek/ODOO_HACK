(function () {
  const $ = (id) => document.getElementById(id);
  const state = {
    apiBase: localStorage.getItem("apiBase") || "http://localhost:8000",
    token: localStorage.getItem("token") || "",
    theme: localStorage.getItem("theme") || "dark", // default dark
    palette: localStorage.getItem("palette") || "brown", // default to user's palette
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
  }

  document.addEventListener("DOMContentLoaded", init);
})();
