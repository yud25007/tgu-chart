const refreshButton = document.querySelector("#admin-refresh-btn");
const logoutButton = document.querySelector("#admin-logout-btn");
const meta = document.querySelector("#admin-meta");
const onlineBody = document.querySelector("#online-body");
const loginBody = document.querySelector("#login-body");

const stats = {
  online: document.querySelector("#stat-online"),
  onlineIp: document.querySelector("#stat-online-ip"),
  success: document.querySelector("#stat-success"),
  failed: document.querySelector("#stat-failed"),
};

function setText(node, value) {
  node.textContent = value == null || value === "" ? "-" : String(value);
}

function shortUserAgent(userAgent) {
  const text = String(userAgent || "").trim();
  if (!text) return "-";
  return text.length > 120 ? `${text.slice(0, 117)}...` : text;
}

function clearTable(body, message) {
  const row = document.createElement("tr");
  const cell = document.createElement("td");
  cell.className = "admin-empty";
  cell.colSpan = 4;
  cell.textContent = message;
  row.append(cell);
  body.replaceChildren(row);
}

function renderOnlineRows(rows) {
  if (!rows.length) {
    clearTable(onlineBody, "当前没有在线会话。");
    return;
  }

  onlineBody.replaceChildren(...rows.map((item) => {
    const row = document.createElement("tr");
    const ip = document.createElement("td");
    const loginAt = document.createElement("td");
    const lastSeen = document.createElement("td");
    const userAgent = document.createElement("td");

    ip.className = "ip-cell";
    userAgent.className = "ua-cell";
    setText(ip, item.ip);
    setText(loginAt, item.loginAt);
    setText(lastSeen, item.lastSeenAt);
    userAgent.title = item.userAgent || "";
    setText(userAgent, shortUserAgent(item.userAgent));

    row.append(ip, loginAt, lastSeen, userAgent);
    return row;
  }));
}

function renderLoginRows(rows) {
  if (!rows.length) {
    clearTable(loginBody, "还没有登录记录。");
    return;
  }

  loginBody.replaceChildren(...rows.map((item) => {
    const row = document.createElement("tr");
    const status = document.createElement("td");
    const ip = document.createElement("td");
    const createdAt = document.createElement("td");
    const userAgent = document.createElement("td");

    const pill = document.createElement("span");
    pill.className = `login-state ${item.success ? "success" : "failed"}`;
    pill.textContent = item.success ? "成功" : "失败";
    status.append(pill);

    ip.className = "ip-cell";
    userAgent.className = "ua-cell";
    setText(ip, item.ip);
    setText(createdAt, item.createdAt);
    userAgent.title = item.userAgent || "";
    setText(userAgent, shortUserAgent(item.userAgent));

    row.append(status, ip, createdAt, userAgent);
    return row;
  }));
}

async function refreshAdminData() {
  refreshButton.disabled = true;
  meta.textContent = "正在刷新...";
  try {
    const response = await fetch("/admin-data", { cache: "no-store" });
    const result = await response.json();
    if (!response.ok || !result.ok) {
      throw new Error(result.message || "读取后台数据失败");
    }

    stats.online.textContent = result.onlineCount || 0;
    stats.onlineIp.textContent = result.onlineUniqueIpCount || 0;
    stats.success.textContent = result.success24h || 0;
    stats.failed.textContent = result.failed24h || 0;
    const minutes = Math.max(1, Math.round((result.onlineWindowSeconds || 900) / 60));
    meta.textContent = `最后刷新：${result.generatedAt}，在线窗口：${minutes} 分钟`;
    renderOnlineRows(result.onlineSessions || []);
    renderLoginRows(result.recentLogins || []);
  } catch (error) {
    meta.textContent = error.message;
    clearTable(onlineBody, "读取失败。");
    clearTable(loginBody, "读取失败。");
  } finally {
    refreshButton.disabled = false;
  }
}

async function logout() {
  try {
    await fetch("/logout", { method: "POST" });
  } finally {
    window.location.href = "/login";
  }
}

refreshButton.addEventListener("click", refreshAdminData);
logoutButton.addEventListener("click", logout);

refreshAdminData();
window.setInterval(refreshAdminData, 30000);
