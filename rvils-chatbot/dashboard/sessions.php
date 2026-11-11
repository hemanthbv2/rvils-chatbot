<?php if (!defined('ABSPATH')) exit; ?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>RVILS Visitor Sessions & Journeys</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
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
        table { width: 100%; border-collapse: collapse; margin-top: 24px; font-size: 13px; }
        th { text-align: left; padding: 12px 14px; color: var(--text-dim); border-bottom: 1px solid var(--border); }
        td { padding: 14px; border-bottom: 1px solid rgba(255,255,255,0.04); }
        tr:hover td { background: rgba(255,255,255,0.02); }
        .badge-sid { background: rgba(192, 122, 58, 0.15); color: var(--gold-light); padding: 3px 8px; border-radius: 6px; font-family: monospace; }
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
            <li class="nav-item" onclick="location.href='?page=rvils-chatbot-dashboard&tab=analytics'">📈 Analytics</li>
            <li class="nav-item" onclick="location.href='?page=rvils-chatbot-dashboard&tab=interactions'">💬 Interactions</li>
            <li class="nav-item active">🌐 Sessions</li>
        </ul>
    </aside>

    <main>
        <h1 style="font-size: 24px; font-weight: 800;">🌐 Visitor Sessions & Clickstream Journeys</h1>
        <p style="font-size: 13px; color: var(--text-dim); margin-top: 4px;">Session continuity, entry referrers, message counts, and active dwell time</p>

        <table>
            <thead>
                <tr>
                    <th>Session ID</th>
                    <th>Started</th>
                    <th>Last Active</th>
                    <th>Messages</th>
                    <th>Device</th>
                    <th>Referrer</th>
                </tr>
            </thead>
            <tbody>
                <?php
                global $wpdb;
                $table_sessions = $wpdb->prefix . 'rvils_chatbot_sessions';
                $sessions = $wpdb->get_results("SELECT * FROM $table_sessions ORDER BY id DESC LIMIT 30", ARRAY_A);

                if (empty($sessions)) {
                    echo '<tr><td colspan="6" style="text-align:center;color:var(--text-dim);padding:30px;">No sessions logged yet.</td></tr>';
                } else {
                    foreach ($sessions as $s) {
                        $sid = esc_html($s['session_id']);
                        $start = esc_html($s['start_time']);
                        $last = esc_html($s['last_active']);
                        $msgs = (int)$s['message_count'];
                        $dev = esc_html($s['device_type'] ?? 'desktop');
                        $ref = esc_html($s['referrer'] ?: 'Direct Visit');
                        echo "
                        <tr>
                            <td><span class='badge-sid'>$sid</span></td>
                            <td>$start</td>
                            <td>$last</td>
                            <td><strong>$msgs</strong></td>
                            <td>$dev</td>
                            <td>$ref</td>
                        </tr>";
                    }
                }
                ?>
            </tbody>
        </table>
    </main>
</body>
</html>

