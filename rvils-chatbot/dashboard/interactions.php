<?php if (!defined('ABSPATH')) exit; ?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>RVILS Chat Transcripts & Interactions</title>
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
        main { flex-grow: 1; height: 100vh; overflow-y: auto; padding: 30px 36px; display: flex; flex-direction: column; }
        .search-bar { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 12px 18px; margin-top: 18px; margin-bottom: 24px; display: flex; gap: 12px; }
        .search-input { flex-grow: 1; background: transparent; border: none; color: #fff; font-size: 14px; outline: none; }
        .transcript-list { display: flex; flex-direction: column; gap: 14px; }
        .transcript-item { background: var(--card); border: 1px solid var(--border); border-radius: 14px; padding: 18px; backdrop-filter: blur(10px); }
        .transcript-header { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 12px; color: var(--text-dim); }
        .bubble-row { margin: 6px 0; font-size: 13px; line-height: 1.5; }
        .bubble-user { color: #60a5fa; font-weight: 600; }
        .bubble-bot { color: var(--gold-light); }
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
            <li class="nav-item active">💬 Interactions</li>
            <li class="nav-item" onclick="location.href='?page=rvils-chatbot-dashboard&tab=sessions'">🌐 Sessions</li>
        </ul>
    </aside>

    <main>
        <h1 style="font-size: 24px; font-weight: 800;">💬 Student Conversations & Chat Logs</h1>
        <p style="font-size: 13px; color: var(--text-dim); margin-top: 4px;">Live question-answer transcripts, intent tags, and sentiment auditing</p>

        <div class="search-bar">
            <span>🔍</span>
            <input type="text" id="searchInput" class="search-input" placeholder="Search inquiries by keyword (e.g. 'RVILS-LAT', 'scholarship', 'B.A. LL.B.')...">
        </div>

        <div id="transcriptsContainer" class="transcript-list">
            <?php
            global $wpdb;
            $table_events = $wpdb->prefix . 'rvils_chatbot_events';
            $rows = $wpdb->get_results("SELECT * FROM $table_events WHERE event_type IN ('user_message', 'bot_reply') ORDER BY id DESC LIMIT 40", ARRAY_A);

            if (empty($rows)) {
                echo '<div style="text-align:center;color:var(--text-dim);padding:50px;">No conversation messages logged yet. Interact with the RVILS chatbot widget to see live transcripts here!</div>';
            } else {
                foreach ($rows as $row) {
                    $d = json_decode($row['event_data'], true);
                    $text = esc_html($d['text'] ?? '');
                    $sender = ($row['event_type'] === 'user_message') ? 'Prospective Student' : 'RVILS Assistant';
                    $class = ($row['event_type'] === 'user_message') ? 'bubble-user' : 'bubble-bot';
                    $sid = esc_html($row['session_id']);
                    $time = esc_html($row['created_at']);
                    echo "
                    <div class='transcript-item'>
                        <div class='transcript-header'>
                            <span>Session: <code>$sid</code></span>
                            <span>$time</span>
                        </div>
                        <div class='bubble-row'>
                            <span class='$class'>[$sender]:</span> $text
                        </div>
                    </div>";
                }
            }
            ?>
        </div>
    </main>

    <script>
        document.getElementById('searchInput')?.addEventListener('input', function(e) {
            const query = e.target.value.toLowerCase();
            document.querySelectorAll('.transcript-item').forEach(el => {
                const text = el.innerText.toLowerCase();
                el.style.display = text.includes(query) ? 'block' : 'none';
            });
        });
    </script>
</body>
</html>

