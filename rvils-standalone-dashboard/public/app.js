let leadsCache = [];
let sessionsCache = [];

// Navigation Tabs
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

        item.classList.add('active');
        const tab = item.getAttribute('data-tab');
        const pane = document.getElementById(`tab-${tab}`);
        if (pane) pane.classList.add('active');
    });
});

// Fetch KPI Stats
async function refreshDashboard() {
    try {
        const statsRes = await fetch('/api/dashboard/stats');
        if (statsRes.ok) {
            const stats = await statsRes.json();
            document.getElementById('statLeads').textContent = stats.totalLeads || 0;
            document.getElementById('statSessions').textContent = stats.totalSessions || 0;
            document.getElementById('statEvents').textContent = stats.totalEvents || 0;
        }

        const leadsRes = await fetch('/api/dashboard/leads');
        if (leadsRes.ok) {
            leadsCache = await leadsRes.json();
            renderLeads(leadsCache);
        }

        const sessRes = await fetch('/api/dashboard/sessions');
        if (sessRes.ok) {
            sessionsCache = await sessRes.json();
            renderSessions(sessionsCache);
        }
    } catch (e) {
        console.error("Dashboard refresh error:", e);
    }
}

function renderLeads(leads) {
    const ovBody = document.getElementById('overviewLeadsTable');
    const fullBody = document.getElementById('fullLeadsTable');

    if (!leads || leads.length === 0) {
        const emptyRow = `<tr><td colspan="7" class="loading-td">No inquiries logged yet. Test on the public chatbot widget!</td></tr>`;
        if (ovBody) ovBody.innerHTML = emptyRow;
        if (fullBody) fullBody.innerHTML = emptyRow;
        return;
    }

    const rowsHtml = leads.map(l => {
        const name = escapeHtml(l.name || l.data?.name);
        const phone = escapeHtml(l.phone || l.data?.phone);
        const email = escapeHtml(l.email || l.data?.email);
        const prog = escapeHtml(l.program || l.data?.program || '5-Year B.A. LL.B.');
        const city = escapeHtml(l.city || l.data?.city || 'Bengaluru');
        const date = new Date(l.timestamp || l.createdAt).toLocaleDateString();
        const status = escapeHtml(l.status || 'new');

        return `
            <tr>
                <td><strong>${name}</strong></td>
                <td>${phone}</td>
                <td>${email}</td>
                <td><span class="pill-prog">${prog}</span></td>
                <td>${city}</td>
                <td>${date}</td>
                <td><span class="pill-status">${status}</span></td>
            </tr>
        `;
    }).join('');

    if (ovBody) ovBody.innerHTML = rowsHtml;
    if (fullBody) fullBody.innerHTML = rowsHtml;
}

function renderSessions(sessions) {
    const body = document.getElementById('sessionsTable');
    if (!body) return;

    if (!sessions || sessions.length === 0) {
        body.innerHTML = `<tr><td colspan="6" class="loading-td">No active sessions found.</td></tr>`;
        return;
    }

    body.innerHTML = sessions.map(s => `
        <tr>
            <td><code>${escapeHtml(s.sessionId)}</code></td>
            <td>${new Date(s.firstSeen).toLocaleTimeString()}</td>
            <td>${new Date(s.lastActive).toLocaleTimeString()}</td>
            <td><strong>${s.messageCount || 0}</strong></td>
            <td>${s.pageViews || 1}</td>
            <td>${escapeHtml(s.referrer || 'Direct')}</td>
        </tr>
    `).join('');
}

function escapeHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function exportLeads() {
    if (!leadsCache || leadsCache.length === 0) {
        alert("No leads recorded yet to export.");
        return;
    }
    const ws = XLSX.utils.json_to_sheet(leadsCache);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "RVILS_Leads");
    XLSX.writeFile(wb, `RVILS_Admissions_CRM_${Date.now()}.xlsx`);
}

// Charts Initialization
function initCharts() {
    const funnelCtx = document.getElementById('liveFunnelChart');
    if (funnelCtx) {
        new Chart(funnelCtx, {
            type: 'line',
            data: {
                labels: ['Page Views', 'Widget Opened', 'Engaged (3+ Msgs)', 'Lead Form Opened', 'Lead Submitted'],
                datasets: [{
                    label: 'Visitor Journey',
                    data: [1200, 520, 310, 140, 78],
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    fill: true,
                    tension: 0.35
                }]
            },
            options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { grid: { color: 'rgba(255,255,255,0.05)' } } } }
        });
    }

    const progCtx = document.getElementById('liveProgramChart');
    if (progCtx) {
        new Chart(progCtx, {
            type: 'doughnut',
            data: {
                labels: ['5-Year B.A. LL.B.', '3-Year LL.B.', '5-Year B.B.A. LL.B.', '5-Year B.Com. LL.B.'],
                datasets: [{
                    data: [45, 30, 15, 10],
                    backgroundColor: ['#7B371C', '#C07A3A', '#964726', '#FFCE7C'],
                    borderWidth: 0
                }]
            },
            options: { responsive: true }
        });
    }
}

// SSE Connection
function initSSE() {
    try {
        const evtSource = new EventSource('/api/events');
        evtSource.onmessage = (e) => {
            const data = JSON.parse(e.data);
            if (data.type === 'telemetry_batch' || data.type === 'new_lead') {
                refreshDashboard();
            }
        };
    } catch (e) {}
}

window.addEventListener('DOMContentLoaded', () => {
    refreshDashboard();
    initCharts();
    initSSE();
    setInterval(refreshDashboard, 10000);
});

