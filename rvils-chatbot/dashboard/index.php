<?php if (!defined('ABSPATH')) exit; ?>
<!DOCTYPE html>
<html lang="en">
<head>
<script>
    let token = sessionStorage.getItem('rvils_dashboard_token');
    if (!token) {
        sessionStorage.setItem('rvils_dashboard_token', 'wp-auth-rvils');
        token = 'wp-auth-rvils';
    }
    const API_URL = "<?php echo esc_js(untrailingslashit(rest_url('rvils/v1'))); ?>";
</script>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RVILS Legal Command Center</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js"></script>
    <style>
        :root {
            --primary: #7B371C;
            --primary-glow: rgba(123, 55, 28, 0.45);
            --secondary: #C07A3A;
            --secondary-glow: rgba(192, 122, 58, 0.35);
            --gold-light: #FFCE7C;
            --success: #10b981;
            --warning: #f59e0b;
            --danger: #ef4444;
            --bg: #030712;
            --sidebar: rgba(17, 24, 39, 0.85);
            --card: rgba(30, 41, 59, 0.55);
            --border: rgba(255, 255, 255, 0.08);
            --text: #f8fafc;
            --text-dim: #94a3b8;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Plus Jakarta Sans', sans-serif;
            background: var(--bg);
            color: var(--text);
            height: 100vh;
            overflow: hidden;
            display: flex;
        }

        .mesh-bg {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: -1;
            background: 
                radial-gradient(circle at 10% 20%, rgba(192, 122, 58, 0.12) 0%, transparent 40%),
                radial-gradient(circle at 90% 80%, rgba(123, 55, 28, 0.12) 0%, transparent 40%),
                radial-gradient(circle at 50% 50%, rgba(15, 23, 42, 1) 0%, rgba(3, 7, 18, 1) 100%);
        }

        aside {
            width: 260px;
            background: var(--sidebar);
            backdrop-filter: blur(20px);
            border-right: 1px solid var(--border);
            display: flex;
            flex-direction: column;
            padding: 26px 20px;
            z-index: 10;
        }
        .logo-area {
            display: flex; align-items: center; gap: 12px; margin-bottom: 35px;
        }
        .logo-box {
            width: 38px; height: 38px; background: linear-gradient(135deg, var(--primary), var(--secondary));
            border-radius: 10px; display: flex; align-items: center; justify-content: center;
            font-weight: 800; font-size: 18px; box-shadow: 0 0 20px var(--primary-glow);
        }
        .logo-text h2 { font-size: 17px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff; }
        .logo-text p { font-size: 10px; color: var(--gold-light); text-transform: uppercase; letter-spacing: 1px; }

        .nav-links { list-style: none; flex-grow: 1; }
        .nav-item {
            padding: 13px 16px; border-radius: 12px; cursor: pointer;
            margin-bottom: 8px; display: flex; align-items: center; gap: 12px;
            font-size: 13.5px; font-weight: 600; color: var(--text-dim);
            transition: all 0.25s ease;
        }
        .nav-item:hover, .nav-item.active {
            background: rgba(255, 255, 255, 0.06);
            color: var(--text);
            border: 1px solid var(--border);
        }
        .nav-item.active {
            border-color: var(--secondary);
            color: var(--gold-light);
            box-shadow: 0 4px 15px rgba(192, 122, 58, 0.15);
        }

        main {
            flex-grow: 1;
            display: flex;
            flex-direction: column;
            height: 100vh;
            overflow-y: auto;
        }

        header {
            padding: 22px 36px;
            border-bottom: 1px solid var(--border);
            display: flex;
            justify-content: space-between;
            align-items: center;
            backdrop-filter: blur(10px);
        }
        .header-title h1 { font-size: 22px; font-weight: 800; }
        .header-title p { font-size: 12.5px; color: var(--text-dim); }

        .status-badge {
            display: flex; align-items: center; gap: 8px;
            background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.25);
            padding: 6px 14px; border-radius: 20px; font-size: 12px; color: var(--success); font-weight: 700;
        }
        .pulse-dot {
            width: 8px; height: 8px; background: var(--success);
            border-radius: 50%; box-shadow: 0 0 10px var(--success);
            animation: pulseDot 2s infinite;
        }
        @keyframes pulseDot { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

        .dashboard-content {
            padding: 30px 36px;
            display: flex;
            flex-direction: column;
            gap: 24px;
        }

        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
        }
        .metric-card {
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 20px;
            backdrop-filter: blur(10px);
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .metric-title { font-size: 12.5px; color: var(--text-dim); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
        .metric-value { font-size: 28px; font-weight: 800; color: #ffffff; }
        .metric-badge {
            font-size: 11px; font-weight: 700; padding: 4px 8px; border-radius: 6px; width: fit-content;
        }
        .metric-badge.green { background: rgba(16, 185, 129, 0.15); color: var(--success); }
        .metric-badge.gold { background: rgba(192, 122, 58, 0.2); color: var(--gold-light); }

        .leads-table-card {
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 24px;
            backdrop-filter: blur(10px);
        }
        .card-header-bar {
            display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px;
        }
        .card-header-bar h3 { font-size: 17px; font-weight: 800; }
        .btn-export {
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            color: #fff; border: none; padding: 8px 16px; border-radius: 8px;
            font-size: 12.5px; font-weight: 700; cursor: pointer; transition: opacity 0.2s;
        }
        .btn-export:hover { opacity: 0.9; }

        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th { text-align: left; padding: 12px 14px; color: var(--text-dim); font-weight: 600; border-bottom: 1px solid var(--border); }
        td { padding: 14px; border-bottom: 1px solid rgba(255,255,255,0.04); }
        tr:hover td { background: rgba(255,255,255,0.02); }

        .status-pill {
            display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 700;
        }
        .status-pill.new { background: rgba(59, 130, 246, 0.2); color: #60a5fa; }
    </style>
</head>
<body>
    <div class="mesh-bg"></div>

    <aside>
        <div class="logo-area">
            <div class="logo-box">⚖️</div>
            <div class="logo-text">
                <h2>RVILS</h2>
                <p>Command Center</p>
            </div>
        </div>
        <ul class="nav-links">
            <li class="nav-item active">📊 Overview</li>
            <li class="nav-item" onclick="location.href='?page=rvils-chatbot-dashboard&tab=analytics'">📈 Analytics</li>
            <li class="nav-item" onclick="location.href='?page=rvils-chatbot-dashboard&tab=interactions'">💬 Interactions</li>
            <li class="nav-item" onclick="location.href='?page=rvils-chatbot-dashboard&tab=sessions'">🌐 Sessions</li>
        </ul>
        <div style="font-size: 11px; color: var(--text-dim); text-align: center;">
            RVILS Engine v3.1.0<br>KSLU & BCI Accredited
        </div>
    </aside>

    <main>
        <header>
            <div class="header-title">
                <h1>Executive Intelligence Hub</h1>
                <p>Real-time conversational performance & student inquiries</p>
            </div>
            <div class="status-badge">
                <span class="pulse-dot"></span>
                <span>SYSTEM ONLINE</span>
            </div>
        </header>

        <div class="dashboard-content">
            <div class="metrics-grid">
                <div class="metric-card">
                    <span class="metric-title">Total Inquiries</span>
                    <span class="metric-value" id="kpiLeads">0</span>
                    <span class="metric-badge green">+100% Verified</span>
                </div>
                <div class="metric-card">
                    <span class="metric-title">Visitor Sessions</span>
                    <span class="metric-value" id="kpiSessions">0</span>
                    <span class="metric-badge gold">Cross-Domain</span>
                </div>
                <div class="metric-card">
                    <span class="metric-title">Telemetry Events</span>
                    <span class="metric-value" id="kpiEvents">0</span>
                    <span class="metric-badge green">Dual-Write Active</span>
                </div>
                <div class="metric-card">
                    <span class="metric-title">Avg Latency</span>
                    <span class="metric-value">&lt; 12ms</span>
                    <span class="metric-badge green">Zero Cloud AI Cost</span>
                </div>
            </div>

            <div class="leads-table-card">
                <div class="card-header-bar">
                    <h3>Recent Admissions Inquiries</h3>
                    <button class="btn-export" onclick="exportLeadsToExcel()">📥 Export Leads (.xlsx)</button>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Phone</th>
                            <th>Email</th>
                            <th>Programme</th>
                            <th>City</th>
                            <th>Date</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody id="leadsTableBody">
                        <tr>
                            <td colspan="7" style="text-align: center; color: var(--text-dim); padding: 30px;">Loading live records from RVILS database...</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </main>

    <script>
        let cachedLeads = [];

        async function fetchStats() {
            try {
                const res = await fetch(API_URL + '/stats', {
                    headers: { 'X-WP-Nonce': '<?php echo esc_js(wp_create_nonce('wp_rest')); ?>' }
                });
                if (!res.ok) return;
                const data = await res.json();

                document.getElementById('kpiLeads').textContent = data.totalLeads || 0;
                document.getElementById('kpiSessions').textContent = data.totalSessions || 0;
                document.getElementById('kpiEvents').textContent = data.totalEvents || 0;

                cachedLeads = data.recentLeads || [];
                const tbody = document.getElementById('leadsTableBody');
                if (cachedLeads.length === 0) {
                    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--text-dim);padding:30px;">No lead inquiries logged yet. Test the bot on the public site!</td></tr>`;
                    return;
                }

                tbody.innerHTML = cachedLeads.map(l => `
                    <tr>
                        <td><strong>${escapeHtml(l.name)}</strong></td>
                        <td>${escapeHtml(l.phone)}</td>
                        <td>${escapeHtml(l.email)}</td>
                        <td><span style="color:var(--gold-light);font-weight:600;">${escapeHtml(l.program)}</span></td>
                        <td>${escapeHtml(l.city || 'Bengaluru')}</td>
                        <td>${new Date(l.created_at).toLocaleDateString()}</td>
                        <td><span class="status-pill new">${escapeHtml(l.status || 'new')}</span></td>
                    </tr>
                `).join('');
            } catch (e) {
                console.error(e);
            }
        }

        function escapeHtml(str) {
            return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        }

        function exportLeadsToExcel() {
            if (!cachedLeads || cachedLeads.length === 0) {
                alert('No leads to export!');
                return;
            }
            const ws = XLSX.utils.json_to_sheet(cachedLeads);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "RVILS_Leads");
            XLSX.writeFile(wb, `RVILS_Admissions_Leads_${Date.now()}.xlsx`);
        }

        fetchStats();
        setInterval(fetchStats, 15000);
    </script>
</body>
</html>

