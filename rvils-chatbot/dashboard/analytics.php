<?php if (!defined('ABSPATH')) exit; ?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>RVILS Behavioral Analytics</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        :root {
            --primary: #7B371C;
            --secondary: #C07A3A;
            --gold-light: #FFCE7C;
            --bg: #030712;
            --sidebar: rgba(17, 24, 39, 0.85);
            --card: rgba(30, 41, 59, 0.55);
            --border: rgba(255, 255, 255, 0.08);
            --text: #f8fafc;
            --text-dim: #94a3b8;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; background: var(--bg); color: var(--text); height: 100vh; display: flex; overflow: hidden; }
        aside { width: 260px; background: var(--sidebar); border-right: 1px solid var(--border); padding: 26px 20px; display: flex; flex-direction: column; }
        .logo-area { display: flex; align-items: center; gap: 12px; margin-bottom: 35px; }
        .logo-box { width: 38px; height: 38px; background: linear-gradient(135deg, var(--primary), var(--secondary)); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 800; }
        .logo-text h2 { font-size: 17px; font-weight: 800; color: #fff; }
        .nav-links { list-style: none; flex-grow: 1; }
        .nav-item { padding: 13px 16px; border-radius: 12px; cursor: pointer; margin-bottom: 8px; font-size: 13.5px; font-weight: 600; color: var(--text-dim); transition: 0.2s; }
        .nav-item:hover, .nav-item.active { background: rgba(255,255,255,0.06); color: var(--text); }
        .nav-item.active { border: 1px solid var(--secondary); color: var(--gold-light); }
        main { flex-grow: 1; height: 100vh; overflow-y: auto; padding: 30px 36px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 24px; }
        .chart-card { background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 24px; backdrop-filter: blur(10px); }
        .chart-card h3 { font-size: 16px; font-weight: 700; margin-bottom: 16px; }
    </style>
</head>
<body>
    <aside>
        <div class="logo-area">
            <div class="logo-box">⚖️</div>
            <div class="logo-text"><h2>RVILS</h2><p style="font-size:10px;color:var(--gold-light);">Command Center</p></div>
        </div>
        <ul class="nav-links">
            <li class="nav-item" onclick="location.href='?page=rvils-chatbot-dashboard&tab=index'">📊 Overview</li>
            <li class="nav-item active">📈 Analytics</li>
            <li class="nav-item" onclick="location.href='?page=rvils-chatbot-dashboard&tab=interactions'">💬 Interactions</li>
            <li class="nav-item" onclick="location.href='?page=rvils-chatbot-dashboard&tab=sessions'">🌐 Sessions</li>
        </ul>
    </aside>

    <main>
        <h1 style="font-size: 24px; font-weight: 800;">📈 Telemetry & Behavioral Analytics</h1>
        <p style="font-size: 13px; color: var(--text-dim); margin-top: 4px;">Friction trackers, scroll depth, rage clicks, and conversion funnel</p>

        <div class="grid">
            <div class="chart-card">
                <h3>Top Queried Legal Topics</h3>
                <canvas id="topicChart" height="220"></canvas>
            </div>
            <div class="chart-card">
                <h3>Conversion Funnel (Visitor to Lead)</h3>
                <canvas id="funnelChart" height="220"></canvas>
            </div>
            <div class="chart-card">
                <h3>User Friction & Scroll Depths</h3>
                <canvas id="scrollChart" height="220"></canvas>
            </div>
            <div class="chart-card">
                <h3>Program Interest Distribution</h3>
                <canvas id="programChart" height="220"></canvas>
            </div>
        </div>
    </main>

    <script>
        // Topic Chart
        new Chart(document.getElementById('topicChart'), {
            type: 'bar',
            data: {
                labels: ['Admissions 2026', '5-Yr B.A. LL.B.', '3-Yr LL.B.', 'RVILS-LAT', 'Moot Court', 'Fees & Aid', 'Faculty'],
                datasets: [{
                    label: 'Query Volume',
                    data: [142, 98, 86, 74, 52, 65, 41],
                    backgroundColor: 'rgba(192, 122, 58, 0.7)',
                    borderColor: '#FFCE7C',
                    borderWidth: 1,
                    borderRadius: 6
                }]
            },
            options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { grid: { color: 'rgba(255,255,255,0.05)' } }, x: { grid: { display: false } } } }
        });

        // Funnel Chart
        new Chart(document.getElementById('funnelChart'), {
            type: 'line',
            data: {
                labels: ['Page Views', 'Widget Opened', 'Engaged (3+ Msgs)', 'Lead Form Opened', 'Lead Submitted'],
                datasets: [{
                    label: 'Visitors',
                    data: [1200, 480, 290, 110, 68],
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    fill: true,
                    tension: 0.35
                }]
            },
            options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { grid: { color: 'rgba(255,255,255,0.05)' } } } }
        });

        // Scroll Depth Chart
        new Chart(document.getElementById('scrollChart'), {
            type: 'bar',
            data: {
                labels: ['25% Depth', '50% Depth', '75% Depth', '100% Footer'],
                datasets: [{
                    label: 'Reached',
                    data: [980, 720, 540, 310],
                    backgroundColor: 'rgba(123, 55, 28, 0.75)',
                    borderRadius: 6
                }]
            },
            options: { responsive: true, plugins: { legend: { display: false } } }
        });

        // Program Interest
        new Chart(document.getElementById('programChart'), {
            type: 'doughnut',
            data: {
                labels: ['5-Yr B.A. LL.B.', '3-Yr LL.B.', '5-Yr B.B.A. LL.B.', '5-Yr B.Com. LL.B.'],
                datasets: [{
                    data: [42, 28, 18, 12],
                    backgroundColor: ['#7B371C', '#C07A3A', '#964726', '#FFCE7C'],
                    borderWidth: 0
                }]
            },
            options: { responsive: true }
        });
    </script>
</body>
</html>

