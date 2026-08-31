class CloudTokAdmin {
  constructor() {
    this.token = localStorage.getItem("adminToken");
    this.apiBase = "https://cloudtok-api.bossmanp16.workers.dev/api";
    this.selectedUsers = new Set();
    this.selectedVideos = new Set();
    this.allUsers = [];
    this.allVideos = [];
    this.settings = {
      requireEmailVerification: true, enable2FA: false, loginNotifications: true,
      allowSignups: true, allowUploads: true, allowLiveStreaming: true,
      allowGifts: true, allowComments: true, allowMessaging: true, maintenanceMode: false
    };
    if (this.token) this.showPanel(); else this.showLogin();
    this.setupLoginForm(); this.setupTabs(); this.setupLogout();
    this.setupPreviewClose(); this.setupSearch(); this.setupToggles(); this.loadSettings();
  }
  showLogin() { document.getElementById("adminLoginGate").style.display = "flex"; document.getElementById("adminPanel").style.display = "none"; }
  showPanel() { document.getElementById("adminLoginGate").style.display = "none"; document.getElementById("adminPanel").style.display = "flex"; this.loadDashboard(); }
  setupLoginForm() {
    document.getElementById("adminLoginForm").onsubmit = async (e) => {
      e.preventDefault();
      const email = document.getElementById("adminEmail").value;
      const password = document.getElementById("adminPassword").value;
      const errEl = document.getElementById("adminLoginError");
      const btn = document.getElementById("adminLoginBtn");
      errEl.textContent = ""; btn.textContent = "Logging in..."; btn.disabled = true;
      try {
        const res = await fetch(this.apiBase + "/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
        const data = await res.json();
        if (data.success && data.token) { this.token = data.token; localStorage.setItem("adminToken", data.token); localStorage.setItem("adminUser", JSON.stringify(data.user)); this.showPanel(); }
        else {
          var errMsg = data.error || "Login failed";
          if (errMsg.toLowerCase().includes("invalid") || errMsg.toLowerCase().includes("password")) {
            errMsg = "Invalid email or password. If you recently updated your password, please use your new password.";
          }
          errEl.textContent = errMsg;
        }
      } catch (err) { errEl.textContent = "Connection failed. Try again."; }
      btn.textContent = "Login"; btn.disabled = false;
    };
  }
  setupTabs() {
    document.querySelectorAll(".adminNav").forEach((btn) => {
      btn.onclick = () => {
        document.querySelectorAll(".adminNav").forEach((b) => b.classList.remove("active"));
        document.querySelectorAll(".adminTab").forEach((t) => t.classList.remove("active"));
        btn.classList.add("active");
        document.getElementById(btn.dataset.tab + "Tab").classList.add("active");
        const loaders = { dashboard: () => this.loadDashboard(), analytics: () => this.loadAnalytics(), users: () => this.loadUsers(), videos: () => this.loadVideos(), comments: () => this.loadComments(), messages: () => this.loadMessages(), reports: () => this.loadReports(), streams: () => this.loadStreams(), transactions: () => this.loadTransactions(), withdrawals: () => this.loadWithdrawals(), gifts: () => this.loadGifts(), giftConfig: () => this.loadGiftConfig(), logs: () => this.loadLogs(), storage: () => this.loadStorage() };
        if (loaders[btn.dataset.tab]) loaders[btn.dataset.tab]();
      };
    });
  }
  setupLogout() { document.getElementById("adminLogoutBtn").onclick = () => { localStorage.removeItem("adminToken"); localStorage.removeItem("adminUser"); this.token = null; this.showLogin(); }; }
  setupPreviewClose() {
    document.getElementById("closePreviewBtn").onclick = () => { const m = document.getElementById("videoPreviewModal"); const v = document.getElementById("previewVideo"); v.pause(); v.src = ""; m.classList.remove("show"); };
    document.getElementById("videoPreviewModal").onclick = (e) => { if (e.target.id === "videoPreviewModal") { const v = document.getElementById("previewVideo"); v.pause(); v.src = ""; e.target.classList.remove("show"); } };
  }
  setupSearch() {
    let ut = null; document.getElementById("usersSearch")?.addEventListener("input", () => { clearTimeout(ut); ut = setTimeout(() => this.loadUsers(), 300); });
    let vt = null; document.getElementById("videosSearch")?.addEventListener("input", () => { clearTimeout(vt); vt = setTimeout(() => this.loadVideos(), 300); });
    document.getElementById("videosTable")?.addEventListener("click", (e) => {
      const thumb = e.target.closest(".videoPreviewThumb");
      if (!thumb) return;
      const idx = parseInt(thumb.dataset.vidx);
      const v = this.allVideos[idx];
      if (v) this.previewVideo(v.video_url || "", v.caption || "", "@" + (v.username || ""), v.likes || 0, v.comments_count || 0, v.views || 0);
    });
  }
  setupToggles() { document.querySelectorAll(".toggle").forEach((t) => { t.onclick = () => { t.classList.toggle("on"); this.settings[t.dataset.setting] = t.classList.contains("on"); this.saveSettings(); }; }); }
  loadSettings() { try { const s = localStorage.getItem("adminSettings"); if (s) this.settings = JSON.parse(s); document.querySelectorAll(".toggle").forEach((t) => { t.classList.toggle("on", !!this.settings[t.dataset.setting]); }); } catch (e) {} }
  saveSettings() { try { localStorage.setItem("adminSettings", JSON.stringify(this.settings)); } catch (e) {} }
  async api(path, method = "GET", body = null) {
    const opts = { method, headers: { Authorization: "Bearer " + this.token, "Content-Type": "application/json" } };
    if (body) { if (body instanceof FormData) { delete opts.headers["Content-Type"]; opts.body = body; } else opts.body = JSON.stringify(body); }
    const res = await fetch(this.apiBase + path, opts);
    const data = await res.json();
    if (res.status === 401 && (data.error === "invalid_token" || data.error === "session_expired")) {
      this.showSessionExpired(data.message || "Your admin session has expired. Please log in again.");
      return data;
    }
    return data;
  }
  showSessionExpired(msg) {
    if (document.getElementById("adminSessionExpiredModal")) return;
    var overlay = document.createElement("div");
    overlay.id = "adminSessionExpiredModal";
    overlay.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:99999;display:flex;align-items:center;justify-content:center;";
    var card = document.createElement("div");
    card.style.cssText = "background:#1a1a2e;border-radius:16px;padding:32px;max-width:360px;width:90%;text-align:center;border:1px solid #333;";
    card.innerHTML = '<div style="width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#ff0050,#ff6b35);margin:0 auto 20px;display:flex;align-items:center;justify-content:center;font-size:28px;color:#fff;">&#9888;</div>' +
      '<h2 style="color:#fff;margin:0 0 12px;font-size:18px;">Session Expired</h2>' +
      '<p style="color:#aaa;margin:0 0 24px;font-size:14px;line-height:1.5;">' + msg + '</p>' +
      '<button id="adminSessionExpiredBtn" style="background:linear-gradient(135deg,#ff0050,#ff6b35);color:#fff;border:none;border-radius:8px;padding:12px 32px;font-size:15px;font-weight:600;cursor:pointer;width:100%;">Log In</button>';
    overlay.appendChild(card);
    document.body.appendChild(overlay);
    document.getElementById("adminSessionExpiredBtn").addEventListener("click", function() {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminUser");
      window.location.reload();
    });
  }
  async loadDashboard() {
    try {
      const stats = await this.api("/admin/stats");
      if (stats.error) { document.getElementById("statsGrid").innerHTML = "<p>" + stats.error + "</p>"; return; }
      const items = [["Users", stats.users], ["Videos", stats.videos], ["Likes", stats.likes], ["Comments", stats.comments], ["Follows", stats.follows], ["Messages", stats.messages], ["Live Now", stats.activeStreams], ["Gifts Sent", stats.giftsSent]];
      document.getElementById("statsGrid").innerHTML = items.map(function(i) { return '<div class="statCard"><div class="statNumber">' + (i[1] || 0) + '</div><div class="statLabel">' + i[0] + '</div></div>'; }).join("");
    } catch (e) { document.getElementById("statsGrid").innerHTML = "<p>Failed to load stats.</p>"; }
  }
  async loadAnalytics() {
    try {
      const users = await this.api("/admin/users"); const videos = await this.api("/admin/videos");
      const u = users.users || []; const v = videos.videos || []; const now = Date.now(); const day = 86400000;
      const nw = u.filter(function(x) { return new Date(x.created_at) > now - 7 * day; }).length;
      const nm = u.filter(function(x) { return new Date(x.created_at) > now - 30 * day; }).length;
      const bn = u.filter(function(x) { return x.status === "banned"; }).length;
      const ad = u.filter(function(x) { return x.role === "admin"; }).length;
      const tv = v.reduce(function(s, x) { return s + (x.views || 0); }, 0);
      const tl = v.reduce(function(s, x) { return s + (x.likes || 0); }, 0);
      const aItems = [["New Users (7d)", nw], ["New Users (30d)", nm], ["Banned", bn], ["Admins", ad], ["Total Views", tv], ["Total Likes", tl]];
      document.getElementById("analyticsGrid").innerHTML = aItems.map(function(i) { return '<div class="statCard"><div class="statNumber">' + i[1] + '</div><div class="statLabel">' + i[0] + '</div></div>'; }).join("");
      var uhtml = ""; var vhtml = "";
      for (var i = 6; i >= 0; i--) {
        const d = new Date(now - i * day); const ds = d.toISOString().split("T")[0];
        const count = u.filter(function(x) { return (x.created_at || "").startsWith(ds); }).length;
        const vcount = v.filter(function(x) { return (x.created_at || "").startsWith(ds); }).length;
        const dn = d.toLocaleDateString("en", { weekday: "short" });
        uhtml += '<div style="flex:1;display:flex;flex-direction:column;align-items:center"><div class="barValue">' + count + '</div><div class="bar" style="height:' + Math.max(4, count * 10) + 'px"></div><div class="barLabel">' + dn + '</div></div>';
        vhtml += '<div style="flex:1;display:flex;flex-direction:column;align-items:center"><div class="barValue">' + vcount + '</div><div class="bar" style="height:' + Math.max(4, vcount * 5) + 'px"></div><div class="barLabel">' + dn + '</div></div>';
      }
      document.getElementById("userGrowthBars").innerHTML = uhtml;
      document.getElementById("videoActivityBars").innerHTML = vhtml;
    } catch (e) { document.getElementById("analyticsGrid").innerHTML = "<p>Failed to load analytics.</p>"; }
  }
  async loadUsers() {
    try {
      const result = await this.api("/admin/users");
      if (result.error) { document.getElementById("usersTable").innerHTML = "<p>" + result.error + "</p>"; return; }
      var users = result.users || []; this.allUsers = users;
      const search = (document.getElementById("usersSearch")?.value || "").toLowerCase();
      if (search) users = users.filter(function(u) { return (u.username || "").toLowerCase().includes(search) || (u.email || "").toLowerCase().includes(search) || (u.display_name || "").toLowerCase().includes(search); });
      if (users.length === 0) { document.getElementById("usersTable").innerHTML = '<div class="emptyState"><div class="icon">👥</div><p>No users found</p></div>'; return; }
      var html = '<table><thead><tr><th><input type="checkbox" onchange="admin.toggleAllUsers(this)"></th><th>User</th><th>Email</th><th>Role</th><th>Status</th><th>Balance</th><th>Joined</th><th>Actions</th></tr></thead><tbody>';
      users.forEach(function(u) {
        const status = u.status || "active"; const role = u.role || "user";
        html += '<tr><td><input type="checkbox" value="' + u.id + '" onchange="admin.toggleUserSelect(' + u.id + ',this)"></td>';
        html += '<td><div class="userCell"><img src="' + (u.avatar || "assets/images/default-avatar.png") + '" class="userCellAvatar" onerror="this.style.display=\'none\'"><div><strong>' + (u.display_name || u.username) + '</strong><br><small>@' + u.username + '</small></div></div></td>';
        html += '<td>' + (u.email || "") + '</td>';
        html += '<td><span class="statusBadge ' + role + '">' + role + '</span></td>';
        html += '<td><span class="statusBadge ' + status + '">' + status + '</span></td>';
        html += '<td>$' + (u.wallet_balance || 0).toFixed(2) + '</td>';
        html += '<td>' + (u.created_at ? new Date(u.created_at).toLocaleDateString() : "") + '</td>';
        html += '<td class="actionsCell">';
        html += '<button class="adminBtn view" onclick="admin.viewUser(' + u.id + ')">View</button> ';
        html += '<button class="adminBtn view" onclick="admin.adjustBalance(' + u.id + ')">💰</button> ';
        html += status !== "banned" ? '<button class="adminBtn ban" onclick="admin.banUser(' + u.id + ')">Ban</button> ' : '<button class="adminBtn unban" onclick="admin.unbanUser(' + u.id + ')">Unban</button> ';
        if (role !== "admin") html += '<button class="adminBtn admin" onclick="admin.makeAdmin(' + u.id + ')">Admin</button> ';
        if (role !== "admin") html += '<button class="adminBtn danger" onclick="admin.deleteUser(' + u.id + ')">Delete</button>';
        html += '</td></tr>';
      });
      html += "</tbody></table>";
      document.getElementById("usersTable").innerHTML = html;
    } catch (e) { document.getElementById("usersTable").innerHTML = "<p>Failed to load users.</p>"; }
  }
  toggleAllUsers(cb) { document.querySelectorAll("#usersTable tbody input[type=checkbox]").forEach(function(c) { c.checked = cb.checked; }); this.selectedUsers.clear(); if (cb.checked) this.allUsers.forEach((u) => this.selectedUsers.add(u.id)); this.updateBulkBar("users"); }
  toggleUserSelect(id, cb) { cb.checked ? this.selectedUsers.add(id) : this.selectedUsers.delete(id); this.updateBulkBar("users"); }
  updateBulkBar(type) { const bar = document.getElementById(type + "BulkBar"); const cnt = document.getElementById(type + "BulkCount"); const sel = type === "users" ? this.selectedUsers : this.selectedVideos; if (sel.size > 0) { bar.classList.add("show"); cnt.textContent = sel.size + " selected"; } else bar.classList.remove("show"); }
  bulkBanUsers() { if (!confirm("Ban " + this.selectedUsers.size + " users?")) return; this.selectedUsers.forEach((id) => this.banUser(id, false)); this.selectedUsers.clear(); this.updateBulkBar("users"); this.loadUsers(); }
  bulkUnbanUsers() { this.selectedUsers.forEach((id) => this.unbanUser(id, false)); this.selectedUsers.clear(); this.updateBulkBar("users"); this.loadUsers(); }
  bulkDeleteSelected() { this.selectedUsers.clear(); this.updateBulkBar("users"); document.querySelectorAll("#usersTable tbody input[type=checkbox]").forEach((c) => c.checked = false); }
  async viewUser(userId) {
    const user = this.allUsers.find(function(u) { return u.id === userId; });
    if (!user) return;
    document.getElementById("detailAvatar").src = user.avatar || "assets/images/default-avatar.png";
    document.getElementById("detailName").textContent = user.display_name || user.username;
    document.getElementById("detailUsername").textContent = "@" + user.username;
    document.getElementById("detailEmail").textContent = user.email || "";
    document.getElementById("detailJoined").textContent = "Joined: " + (user.created_at ? new Date(user.created_at).toLocaleDateString() : "Unknown");
    document.getElementById("detailBio").textContent = user.bio || "No bio";
    const status = user.status || "active"; const role = user.role || "user";
    var ah = '<button class="adminBtn ' + (status === "banned" ? "unban" : "ban") + '" onclick="admin.' + (status === "banned" ? "unbanUser" : "banUser") + "(" + user.id + ");admin.closeUserDetail()\">" + (status === "banned" ? "Unban User" : "Ban User") + "</button> ";
    if (role !== "admin") ah += '<button class="adminBtn admin" onclick="admin.makeAdmin(' + user.id + ');admin.closeUserDetail()">Make Admin</button> ';
    if (role !== "admin") ah += '<button class="adminBtn danger" onclick="admin.deleteUser(' + user.id + ');admin.closeUserDetail()">Delete User</button>';
    ah += '<button class="adminBtn view" onclick="admin.closeUserDetail()">Close</button>';
    document.getElementById("detailActions").innerHTML = ah;
    var statsHtml = '';
    statsHtml += '<div class="userDetailStat"><div class="num">' + (user.wallet_balance != null ? "$" + user.wallet_balance.toFixed(2) : "$0.00") + '</div><div class="lbl">Balance</div></div>';
    statsHtml += '<div class="userDetailStat"><div class="num">' + role + '</div><div class="lbl">Role</div></div>';
    statsHtml += '<div class="userDetailStat"><div class="num">' + status + '</div><div class="lbl">Status</div></div>';
    statsHtml += '<div class="userDetailStat"><div class="num">' + user.id + '</div><div class="lbl">User ID</div></div>';
    var existing = document.getElementById("detailStatsGrid");
    if (existing) existing.innerHTML = statsHtml;
    document.getElementById("userDetailModal").classList.add("show");
  }
  closeUserDetail() { document.getElementById("userDetailModal").classList.remove("show"); }
  async loadVideos() {
    try {
      const result = await this.api("/admin/videos");
      if (result.error) { document.getElementById("videosTable").innerHTML = "<p>" + result.error + "</p>"; return; }
      var videos = result.videos || []; this.allVideos = videos;
      const search = (document.getElementById("videosSearch")?.value || "").toLowerCase();
      if (search) videos = videos.filter(function(v) { return (v.caption || "").toLowerCase().includes(search) || (v.username || "").toLowerCase().includes(search); });
      if (videos.length === 0) { document.getElementById("videosTable").innerHTML = '<div class="emptyState"><div class="icon">🎬</div><p>No videos found</p></div>'; return; }
      var html = '<table><thead><tr><th><input type="checkbox" onchange="admin.toggleAllVideos(this)"></th><th>Preview</th><th>User</th><th>Caption</th><th>Likes</th><th>Views</th><th>Date</th><th>Actions</th></tr></thead><tbody>';
      videos.forEach(function(v, idx) {
        const thumb = v.thumbnail_url || ""; const vidUrl = v.video_url || "";
        const cap = (v.caption || "").substring(0, 35) + ((v.caption || "").length > 35 ? "..." : "");
        html += '<tr><td><input type="checkbox" value="' + v.id + '" onchange="admin.toggleVideoSelect(' + v.id + ',this)"></td>';
        html += '<td><div class="videoPreviewThumb" data-vidx="' + idx + '">';
        html += thumb ? '<img src="' + thumb + '" onerror="this.parentElement.innerHTML=\'🎬\'">' : '<span>🎬</span>';
        html += '</div></td>';
        html += '<td>@' + v.username + '</td><td>' + cap + '</td><td>' + (v.likes || 0) + '</td><td>' + (v.views || 0) + '</td>';
        html += '<td>' + (v.created_at ? new Date(v.created_at).toLocaleDateString() : "") + '</td>';
        html += '<td><button class="adminBtn delete" onclick="admin.deleteVideo(' + v.id + ')">Delete</button></td></tr>';
      });
      html += "</tbody></table>";
      document.getElementById("videosTable").innerHTML = html;
    } catch (e) { document.getElementById("videosTable").innerHTML = "<p>Failed to load videos.</p>"; }
  }
  toggleAllVideos(cb) { document.querySelectorAll("#videosTable tbody input[type=checkbox]").forEach(function(c) { c.checked = cb.checked; }); this.selectedVideos.clear(); if (cb.checked) this.allVideos.forEach((v) => this.selectedVideos.add(v.id)); this.updateBulkBar("videos"); }
  toggleVideoSelect(id, cb) { cb.checked ? this.selectedVideos.add(id) : this.selectedVideos.delete(id); this.updateBulkBar("videos"); }
  bulkDeleteVideos() { if (!confirm("Delete " + this.selectedVideos.size + " videos?")) return; this.selectedVideos.forEach((id) => this.deleteVideo(id, false)); this.selectedVideos.clear(); this.updateBulkBar("videos"); this.loadVideos(); }
  bulkClearVideoSelection() { this.selectedVideos.clear(); this.updateBulkBar("videos"); document.querySelectorAll("#videosTable tbody input[type=checkbox]").forEach((c) => c.checked = false); }
  async loadComments() {
    try {
      const result = await this.api("/admin/comments");
      if (result.error) { document.getElementById("commentsTable").innerHTML = "<p>" + result.error + "</p>"; return; }
      const comments = result.comments || [];
      if (comments.length === 0) { document.getElementById("commentsTable").innerHTML = '<div class="emptyState"><div class="icon">💬</div><p>No comments found</p></div>'; return; }
      var html = '<table><thead><tr><th>User</th><th>Comment</th><th>Video</th><th>Date</th><th>Actions</th></tr></thead><tbody>';
      comments.forEach(function(c) {
        const vl = c.video_caption ? c.video_caption.substring(0, 30) + (c.video_caption.length > 30 ? "..." : "") : (c.video_id ? "#" + c.video_id : "-");
        html += '<tr><td>@' + (c.username || "unknown") + '</td><td><span class="commentText" title="' + (c.text || "").replace(/"/g, "&quot;") + '">' + (c.text || "").substring(0, 50) + ((c.text || "").length > 50 ? "..." : "") + '</span></td><td>' + vl + '</td><td>' + (c.created_at ? new Date(c.created_at).toLocaleDateString() : "") + '</td><td><button class="adminBtn delete" onclick="admin.deleteComment(' + c.id + ')">Delete</button></td></tr>';
      });
      html += "</tbody></table>";
      document.getElementById("commentsTable").innerHTML = html;
    } catch (e) { document.getElementById("commentsTable").innerHTML = "<p>Failed to load comments.</p>"; }
  }
  async loadMessages() {
    try {
      const result = await this.api("/admin/messages");
      if (result.error) { document.getElementById("messagesTable").innerHTML = "<p>" + result.error + "</p>"; return; }
      const messages = result.messages || [];
      if (messages.length === 0) { document.getElementById("messagesTable").innerHTML = '<div class="emptyState"><div class="icon">✉️</div><p>No messages found</p></div>'; return; }
      var html = '<table><thead><tr><th>From</th><th>To</th><th>Message</th><th>Date</th></tr></thead><tbody>';
      messages.forEach(function(m) {
        html += '<tr><td>@' + (m.sender_name || m.sender_username || "?") + '</td><td>@' + (m.receiver_name || "?") + '</td><td><span class="msgPreview" title="' + (m.text || m.content || "").replace(/"/g, "&quot;") + '">' + (m.text || m.content || "").substring(0, 60) + ((m.text || m.content || "").length > 60 ? "..." : "") + '</span></td><td>' + (m.created_at ? new Date(m.created_at).toLocaleDateString() : "") + '</td></tr>';
      });
      html += "</tbody></table>";
      document.getElementById("messagesTable").innerHTML = html;
    } catch (e) { document.getElementById("messagesTable").innerHTML = "<p>Failed to load messages.</p>"; }
  }
  async loadReports() {
    try {
      const result = await this.api("/admin/reports");
      if (result.error) { document.getElementById("reportsTable").innerHTML = "<p>" + result.error + "</p>"; return; }
      const reports = result.reports || [];
      if (reports.length === 0) { document.getElementById("reportsTable").innerHTML = '<div class="emptyState"><div class="icon">🚨</div><p>No reports found</p></div>'; return; }
      var html = '<table><thead><tr><th>Reporter</th><th>Reported User</th><th>Reason</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead><tbody>';
      reports.forEach(function(r) {
        const statusColor = r.status === "pending" ? "#ff4444" : r.status === "reviewed" ? "#44aa44" : "#888";
        html += '<tr><td>@' + (r.reporter_username || "?") + '</td><td>@' + (r.reported_username || "N/A") + '</td><td>' + (r.reason || "No reason").substring(0, 80) + '</td><td><span style="color:' + statusColor + ';font-weight:600;">' + (r.status || "pending") + '</span></td><td>' + (r.created_at ? new Date(r.created_at).toLocaleDateString() : "") + '</td><td class="actionsCell">' + (r.status === "pending" ? '<button class="adminBtn" onclick="admin.updateReport(' + r.id + ',\'reviewed\')">Mark Reviewed</button>' : "") + '</td></tr>';
      });
      html += "</tbody></table>";
      document.getElementById("reportsTable").innerHTML = html;
    } catch (e) { document.getElementById("reportsTable").innerHTML = "<p>Failed to load reports.</p>"; }
  }
  async updateReport(reportId, status) {
    try {
      await this.api("/admin/reports/" + reportId, "PUT", { status: status });
      this.loadReports();
    } catch (e) {}
  }
  async loadStreams() {
    try {
      const result = await this.api("/admin/streams");
      if (result.error) { document.getElementById("streamsTable").innerHTML = "<p>" + result.error + "</p>"; return; }
      const streams = result.streams || [];
      if (streams.length === 0) { document.getElementById("streamsTable").innerHTML = '<div class="emptyState"><div class="icon">📡</div><p>No live streams</p></div>'; return; }
      var html = '<table><thead><tr><th>Streamer</th><th>Title</th><th>Viewers</th><th>Started</th><th>Status</th><th>Actions</th></tr></thead><tbody>';
      streams.forEach(function(s) {
        const isLive = s.status === "active" || s.status === "live";
        html += '<tr><td>@' + (s.username || "?") + '</td><td>' + (s.title || "Untitled") + '</td><td>' + (s.viewers || 0) + '</td><td>' + (s.created_at ? new Date(s.created_at).toLocaleString() : "") + '</td><td><span class="statusBadge ' + (isLive ? "live" : "offline") + '">' + (isLive ? "LIVE" : "Ended") + '</span></td><td class="actionsCell">' + (isLive ? '<button class="adminBtn stop" onclick="admin.stopStream(\'' + s.stream_key + '\')">Stop</button>' : "") + '</td></tr>';
      });
      html += "</tbody></table>";
      document.getElementById("streamsTable").innerHTML = html;
    } catch (e) { document.getElementById("streamsTable").innerHTML = "<p>Failed to load streams.</p>"; }
  }
  async loadWithdrawals() {
    try {
      const result = await this.api("/wallet/all-withdrawals");
      if (result.error) { document.getElementById("withdrawalsTable").innerHTML = "<p>" + result.error + "</p>"; return; }
      const wds = result.withdrawals || [];
      if (wds.length === 0) { document.getElementById("withdrawalsTable").innerHTML = '<div class="emptyState"><div class="icon">💸</div><p>No withdrawal requests</p></div>'; return; }
      var html = '<table><thead><tr><th>User</th><th>Amount</th><th>Method</th><th>Details</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead><tbody>';
      wds.forEach(function(w) {
        var details = "";
        if (w.method === "bank") details = (w.account_name||"") + " • " + (w.accountNumber||w.account_number||"") + " • " + (w.bank_name||"");
        else if (w.method === "mobile_money") details = w.mobile_number || "";
        else details = w.method;
        var statusColor = w.status === "pending" ? "#ffaa00" : w.status === "approved" ? "#00c853" : "#ff4444";
        html += '<tr><td>@' + (w.username || w.user_id) + '</td><td>$' + Number(w.amount).toFixed(2) + '</td><td>' + w.method + '</td><td><small>' + details + '</small></td><td><span style="color:' + statusColor + ';font-weight:600;">' + w.status + '</span></td><td>' + (w.created_at ? new Date(w.created_at).toLocaleString() : "") + '</td><td class="actionsCell">';
        if (w.status === "pending") {
          html += '<button class="adminBtn" style="background:rgba(0,200,83,.15);color:#00c853;" onclick="admin.approveWithdrawal(' + w.id + ')">Approve & Deduct</button> ';
          html += '<button class="adminBtn delete" onclick="admin.rejectWithdrawal(' + w.id + ')">Reject</button>';
        } else { html += '<span style="color:#888;">—</span>'; }
        html += '</td></tr>';
      });
      html += "</tbody></table>";
      document.getElementById("withdrawalsTable").innerHTML = html;
    } catch (e) { document.getElementById("withdrawalsTable").innerHTML = "<p>Failed to load withdrawals.</p>"; }
  }
  async approveWithdrawal(id) { if (!confirm("Approve this withdrawal? This will DEDUCT the amount from user's wallet and you must then pay them manually from your bank.")) return; const r = await this.api("/wallet/approve-withdrawal","POST",{id:id}); alert(r.message||r.error||"Done"); this.loadWithdrawals(); this.loadUsers(); this.loadDashboard(); }
  async rejectWithdrawal(id) { if (!confirm("Reject this withdrawal?")) return; const r = await this.api("/wallet/reject-withdrawal","POST",{id:id}); alert(r.message||r.error||"Done"); this.loadWithdrawals(); }
  async loadTransactions() {
    try {
      const result = await this.api("/admin/transactions");
      if (result.error) { document.getElementById("transactionsTable").innerHTML = "<p>" + result.error + "</p>"; return; }
      const txns = result.transactions || [];
      if (txns.length === 0) { document.getElementById("transactionsTable").innerHTML = '<div class="emptyState"><div class="icon">💰</div><p>No transactions</p></div>'; return; }
      var html = '<table><thead><tr><th>User</th><th>Amount</th><th>Status</th><th>Reference</th><th>Date</th></tr></thead><tbody>';
      txns.forEach(function(t) {
        html += '<tr><td>@' + (t.username || "?") + '</td><td>$' + (t.amount != null ? Number(t.amount).toFixed(2) : "-") + '</td><td><span class="statusBadge ' + (t.status || "active") + '">' + (t.status || "-") + '</span></td><td><small>' + (t.reference || t.paystack_reference || "-") + '</small></td><td>' + (t.created_at ? new Date(t.created_at).toLocaleDateString() : "") + '</td></tr>';
      });
      html += "</tbody></table>";
      document.getElementById("transactionsTable").innerHTML = html;
    } catch (e) { document.getElementById("transactionsTable").innerHTML = "<p>Failed to load transactions.</p>"; }
  }
  async loadGifts() {
    try {
      const result = await this.api("/admin/gifts");
      if (result.error) { document.getElementById("giftsTable").innerHTML = "<p>" + result.error + "</p>"; return; }
      const gifts = result.gifts || [];
      if (gifts.length === 0) { document.getElementById("giftsTable").innerHTML = '<div class="emptyState"><div class="icon">🎁</div><p>No gifts sent yet</p></div>'; return; }
      var html = '<table><thead><tr><th>From</th><th>To</th><th>Gift</th><th>Amount</th><th>Date</th></tr></thead><tbody>';
      gifts.forEach(function(g) {
        html += '<tr><td>@' + (g.sender_username || "?") + '</td><td>@' + (g.receiver_username || "?") + '</td><td>' + (g.gift_emoji || "🎁") + " " + (g.gift_name || "Gift") + '</td><td>$' + (g.amount_usd != null ? Number(g.amount_usd).toFixed(2) : "-") + '</td><td>' + (g.created_at ? new Date(g.created_at).toLocaleDateString() : "") + '</td></tr>';
      });
      html += "</tbody></table>";
      document.getElementById("giftsTable").innerHTML = html;
    } catch (e) { document.getElementById("giftsTable").innerHTML = "<p>Failed to load gifts.</p>"; }
  }
  async loadLogs() {
    try {
      const result = await this.api("/admin/logs");
      if (result.error) { document.getElementById("logsTable").innerHTML = "<p>" + result.error + "</p>"; return; }
      const logs = result.logs || [];
      if (logs.length === 0) { document.getElementById("logsTable").innerHTML = '<div class="emptyState"><div class="icon">📋</div><p>No activity logs</p></div>'; return; }
      var html = '<table><thead><tr><th>User</th><th>Action</th><th>Details</th><th>Date</th></tr></thead><tbody>';
      logs.forEach(function(l) {
        html += '<tr><td>@' + (l.admin_username || l.username || "system") + '</td><td><span class="statusBadge active">' + (l.action || "-") + '</span></td><td><span class="msgPreview" title="' + (l.details || "").replace(/"/g, "&quot;") + '">' + (l.details || "-").substring(0, 60) + '</span></td><td>' + (l.created_at ? new Date(l.created_at).toLocaleString() : "") + '</td></tr>';
      });
      html += "</tbody></table>";
      document.getElementById("logsTable").innerHTML = html;
    } catch (e) { document.getElementById("logsTable").innerHTML = "<p>Failed to load logs.</p>"; }
  }
  async loadStorage() {
    try {
      const result = await this.api("/admin/storage");
      const s = result.storage || result;
      const providers = s.providers || [];
      const events = s.events || [];
      const summary = s.summary || {};

      var html = '<div class="statsGrid">' +
        '<div class="statCard"><div class="statNumber">' + (summary.healthyProviders || 0) + "/" + (summary.totalProviders || 0) + '</div><div class="statLabel">Healthy Providers</div></div>' +
        '<div class="statCard"><div class="statNumber">' + (summary.totalUploads || 0) + '</div><div class="statLabel">Total Uploads</div></div>' +
        '<div class="statCard"><div class="statNumber">' + (summary.totalVideos || 0) + '</div><div class="statLabel">Videos Stored</div></div>' +
        '<div class="statCard"><div class="statNumber">' + (summary.successRate || 100) + '%</div><div class="statLabel">Success Rate</div></div>' +
        '</div>';

      if (providers.length > 0) {
        html += '<div class="storageSection"><h3>Provider Details</h3>';
        html += '<div class="storageProviderGrid">';
        providers.forEach(function(p) {
          var healthClass = p.health >= 80 ? "safe" : p.health >= 50 ? "medium" : "danger";
          var statusLabel = p.healthy ? (p.enabled ? "Active" : "Disabled") : "Unhealthy";
          var statusClass = p.healthy ? (p.enabled ? "active" : "disabled") : "unhealthy";
          var usagePct = p.usagePercent || 0;
          var barClass = usagePct > 80 ? "high" : usagePct > 50 ? "medium" : "low";

          html += '<div class="storageProviderCard">';

          html += '<div class="storageProviderHeader">';
          html += '<div><span class="storageProviderName">' + (p.name || p.id) + '</span>';
          html += '<span class="storageProviderStatus ' + statusClass + '">' + statusLabel + '</span></div>';
          html += '<span class="storageHealthBadge" style="color:' + (healthClass === "safe" ? "#00cc66" : healthClass === "medium" ? "#ffaa00" : "#ff4444") + ';">' + (p.health || 0) + '%</span>';
          html += '</div>';

          html += '<div style="margin-bottom:10px;">';
          html += '<div class="storageUsageRow"><span>' + (p.usedStorage || 0) + ' / ' + (p.freeStorage || 0) + ' ' + (p.storageUnit || "GB") + '</span><span>' + usagePct + '%</span></div>';
          html += '<div class="storageUsageBar"><div class="storageUsageFill ' + barClass + '" style="width:' + Math.min(usagePct, 100) + '%;"></div></div>';
          html += '</div>';

          html += '<div class="storageStatGrid">';
          html += '<div><span class="label">Max File</span> <span class="val">' + (p.maxFileSize || "N/A") + '</span></div>';
          html += '<div><span class="label">Priority</span> <span class="val">#' + (p.priority || "?") + '</span></div>';
          html += '<div><span class="label">Uploads</span> <span class="val">' + (p.uploadCount || 0) + '</span></div>';
          html += '<div><span class="label">Avg Speed</span> <span class="val">' + (p.averageUpload ? p.averageUpload.toFixed(1) + "s" : "N/A") + '</span></div>';
          html += '<div><span class="label">Failures</span> <span class="val ' + (p.failures > 0 ? "danger" : "safe") + '">' + (p.failures || 0) + '</span></div>';
          html += '<div><span class="label">Success Rate</span> <span class="val">' + (p.successRate || 100) + '%</span></div>';
          html += '<div><span class="label">Events OK</span> <span class="val">' + (p.eventsUploaded || 0) + '</span></div>';
          html += '<div><span class="label">Events Fail</span> <span class="val ' + (p.eventsFailed > 0 ? "danger" : "safe") + '">' + (p.eventsFailed || 0) + '</span></div>';
          html += '</div>';

          html += '<div class="storageProviderFooter">';
          html += '<div>Roles: ' + (p.roles || []).join(", ") + '</div>';
          if (p.lastSuccess) html += '<div>Last Success: ' + new Date(p.lastSuccess).toLocaleString() + '</div>';
          if (p.lastFailure) html += '<div class="fail">Last Failure: ' + new Date(p.lastFailure).toLocaleString() + '</div>';
          html += '</div>';

          html += '</div>';
        });
        html += '</div></div>';
      }

      if (events.length > 0) {
        html += '<div class="storageSection"><h3>Recent Storage Events</h3>';
        html += '<div class="storageEventsTable"><table><thead><tr><th>Event</th><th>Provider</th><th>Status</th><th>File</th><th>Time</th></tr></thead><tbody>';
        events.forEach(function(ev) {
          var statusClass = ev.status === "success" ? "storageEventSuccess" : "storageEventFail";
          html += '<tr>';
          html += '<td>' + (ev.event_type || "unknown") + '</td>';
          html += '<td>' + (ev.provider || "system") + '</td>';
          html += '<td class="' + statusClass + '">' + (ev.status || "unknown") + '</td>';
          html += '<td class="storageEventFile">' + (ev.filename || "") + '</td>';
          html += '<td>' + (ev.created_at ? new Date(ev.created_at).toLocaleString() : "") + '</td>';
          html += '</tr>';
        });
        html += '</tbody></table></div></div>';
      }

      document.getElementById("storageGrid").innerHTML = html;
    } catch (e) {
      document.getElementById("storageGrid").innerHTML = "<p>Failed to load storage info. " + (e.message || "") + "</p>";
    }
  }
  previewVideo(url, caption, username, likes, comments, views) {
    document.getElementById("previewVideo").src = url;
    document.getElementById("previewInfo").innerHTML = '<h3>' + caption + '</h3><p>by ' + username + '</p><div class="previewStats"><span>❤️ ' + likes + '</span><span>💬 ' + comments + '</span><span>👁 ' + views + '</span></div>';
    document.getElementById("videoPreviewModal").classList.add("show");
  }
  async banUser(id, confirmMsg) { if (confirmMsg !== false && !confirm("Ban this user?")) return; await this.api("/admin/users/" + id, "PUT", { status: "banned" }); this.loadUsers(); }
  async unbanUser(id, confirmMsg) { if (confirmMsg !== false && !confirm("Unban this user?")) return; await this.api("/admin/users/" + id, "PUT", { status: "active" }); this.loadUsers(); }
  async makeAdmin(id) { if (!confirm("Make this user an admin?")) return; await this.api("/admin/users/" + id, "PUT", { role: "admin" }); this.loadUsers(); }
  async deleteVideo(id, confirmMsg) { if (confirmMsg !== false && !confirm("Delete this video?")) return; await this.api("/admin/videos/" + id, "DELETE"); this.loadVideos(); }
  async deleteComment(id) { if (!confirm("Delete this comment?")) return; await this.api("/admin/comments/" + id, "DELETE"); this.loadComments(); }
  async deleteUser(id, confirmMsg) { if (confirmMsg !== false && !confirm("PERMANENTLY delete this user and ALL their data? This cannot be undone.")) return; const result = await this.api("/admin/users/" + id, "DELETE"); if (result.success) { alert("User deleted permanently."); this.loadUsers(); } else alert(result.error || "Delete failed"); }
  async stopStream(streamKey) { if (!confirm("Stop this live stream?")) return; await this.api("/admin/streams/" + encodeURIComponent(streamKey) + "/stop", "POST"); this.loadStreams(); }
  async adjustBalance(userId) {
    const amount = prompt("Enter amount (+ to add, - to remove):");
    if (amount === null) return; const num = parseFloat(amount);
    if (isNaN(num)) { alert("Invalid amount"); return; }
    const reason = prompt("Reason (optional):") || "";
    const result = await this.api("/admin/balance", "POST", { user_id: userId, amount: num, reason: reason });
    if (result.success) { alert("Balance updated! New: $" + result.balance.toFixed(2)); this.loadUsers(); } else alert(result.error || "Failed");
  }
  async loadGiftConfig() {
    try {
      const result = await this.api("/admin/gift-config"); const config = result.config || [];
      const defaults = [{ n: "Rose", p: 0.99 }, { n: "Heart", p: 1.99 }, { n: "Star", p: 4.99 }, { n: "Fire", p: 9.99 }, { n: "Diamond", p: 19.99 }, { n: "Crown", p: 49.99 }, { n: "Party", p: 9.99 }, { n: "Clap", p: 0.99 }];
      const emojis = { Rose: "🌹", Heart: "❤️", Star: "⭐", Fire: "🔥", Diamond: "💎", Crown: "👑", Party: "🎉", Clap: "👏" };
      var html = '<table><thead><tr><th>Gift</th><th>Price (USD)</th><th>Actions</th></tr></thead><tbody>';
      defaults.forEach(function(d) { const found = config.find(function(c) { return c.gift_name === d.n; }); const price = found ? found.price_usd : d.p; html += '<tr><td>' + (emojis[d.n] || "🎁") + " " + d.n + '</td><td>$' + price.toFixed(2) + '</td><td><button class="adminBtn view" onclick="admin.editGiftPrice(\'' + d.n + "'," + price + ')">Edit</button></td></tr>'; });
      html += "</tbody></table>";
      document.getElementById("giftConfigTable").innerHTML = html;
    } catch (e) { document.getElementById("giftConfigTable").innerHTML = "<p>Failed to load gift config.</p>"; }
  }
  async editGiftPrice(name, current) {
    const np = prompt("New price for " + name + ":", current); if (np === null) return; const num = parseFloat(np);
    if (isNaN(num) || num <= 0) { alert("Invalid price"); return; }
    const result = await this.api("/admin/gift-config", "POST", { gift_name: name, new_price: num });
    if (result.success) { alert(name + " updated to $" + num.toFixed(2)); this.loadGiftConfig(); } else alert(result.error || "Failed");
  }
  async clearTable(table, label) {
    if (!confirm("Clear ALL " + label + "? This cannot be undone.")) return;
    const result = await this.api("/admin/clear/" + table, "POST");
    if (result.success) { alert(label + " cleared."); if (label === "comments") { this.loadComments(); this.loadVideos(); } else if (label === "transactions") this.loadTransactions(); else if (label === "gifts") this.loadGifts(); else if (label === "logs") this.loadLogs(); else if (label === "reports") this.loadReports(); else if (label === "withdrawals") this.loadWithdrawals(); } else alert(result.error || "Failed");
  }
}

const admin = new CloudTokAdmin();