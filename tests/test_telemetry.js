/**
 * Automated Telemetry Dual-Write & Server Contract Test Suite
 */

const assert = require('assert');
const http = require('http');

// Import Express app from standalone server
const app = require('../rvils-standalone-dashboard/server.js');

let server;
const TEST_PORT = 3099;

function request(method, path, body = null) {
    return new Promise((resolve, reject) => {
        const payload = body ? JSON.stringify(body) : null;
        const options = {
            hostname: '127.0.0.1',
            port: TEST_PORT,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ status: res.statusCode, body: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, raw: data });
                }
            });
        });

        req.on('error', reject);
        if (payload) req.write(payload);
        req.end();
    });
}

console.log("==================================================");
console.log("  RVILS STANDALONE SERVER & TELEMETRY TEST SUITE  ");
console.log("==================================================");

let testsPassed = 0;
let testsTotal = 0;

async function runTest(desc, fn) {
    testsTotal++;
    try {
        await fn();
        console.log(`  [PASS] ${desc}`);
        testsPassed++;
    } catch (err) {
        console.error(`  [FAIL] ${desc}: ${err.message}`);
    }
}

async function start() {
    server = app.listen(TEST_PORT, async () => {
        try {
            // 1. Health check
            await runTest("GET /api/health: Returns healthy status", async () => {
                const res = await request('GET', '/api/health');
                assert.strictEqual(res.status, 200);
                assert.strictEqual(res.body.status, 'healthy');
            });

            // 2. Ingest telemetry batch
            await runTest("POST /api/telemetry/events: Successfully ingests batch", async () => {
                const testBatch = {
                    events: [
                        {
                            sessionId: 'sess_rvils_test_123',
                            instituteId: 'RVILS_BLR',
                            eventType: 'page_view',
                            timestamp: Date.now(),
                            pageUrl: 'https://rvils.edu.in/programmes/5_year_b_a_ll_b/'
                        },
                        {
                            sessionId: 'sess_rvils_test_123',
                            instituteId: 'RVILS_BLR',
                            eventType: 'user_message',
                            timestamp: Date.now(),
                            data: { text: 'What is the syllabus for 5-Year B.A. LL.B.?' }
                        }
                    ]
                };
                const res = await request('POST', '/api/telemetry/events', testBatch);
                assert.strictEqual(res.status, 200);
                assert.strictEqual(res.body.status, 'success');
                assert.strictEqual(res.body.processed, 2);
            });

            // 3. Post Admissions Lead
            await runTest("POST /api/dashboard/leads: Ingests student enquiry", async () => {
                const leadPayload = {
                    sessionId: 'sess_rvils_test_123',
                    instituteId: 'RVILS_BLR',
                    leadData: {
                        name: 'Adv. Test Candidate',
                        phone: '+91 98765 43210',
                        email: 'test.law@rvils.edu.in',
                        program: '5-Year B.A. LL.B.',
                        city: 'Bengaluru'
                    }
                };
                const res = await request('POST', '/api/dashboard/leads', leadPayload);
                assert.strictEqual(res.status, 200);
                assert.strictEqual(res.body.status, 'success');
                assert.strictEqual(res.body.lead.name, 'Adv. Test Candidate');
            });

            // 4. Retrieve Leads & Key Normalization
            await runTest("GET /api/dashboard/leads: Normalized keys (timestamp & data)", async () => {
                const res = await request('GET', '/api/dashboard/leads');
                assert.strictEqual(res.status, 200);
                assert.ok(Array.isArray(res.body));
                assert.ok(res.body.length > 0);
                const lead = res.body[0];
                assert.ok(lead.timestamp, "Timestamp key must exist for WP compatibility");
                assert.ok(lead.data, "Data key must exist for WP compatibility");
            });

            // 5. Verify Sessions
            await runTest("GET /api/dashboard/sessions: Session tracked with message count", async () => {
                const res = await request('GET', '/api/dashboard/sessions');
                assert.strictEqual(res.status, 200);
                assert.ok(Array.isArray(res.body));
                const sess = res.body.find(s => s.sessionId === 'sess_rvils_test_123');
                assert.ok(sess, "Session must be found");
                assert.strictEqual(sess.messageCount, 1);
            });

            // 6. Verify Stats
            await runTest("GET /api/dashboard/stats: Returns accurate KPI totals", async () => {
                const res = await request('GET', '/api/dashboard/stats');
                assert.strictEqual(res.status, 200);
                assert.ok(res.body.totalLeads >= 1);
                assert.ok(res.body.totalSessions >= 1);
                assert.ok(res.body.totalEvents >= 2);
            });

            console.log("--------------------------------------------------");
            console.log(`Results: ${testsPassed} / ${testsTotal} tests passed (${Math.round(testsPassed/testsTotal*100)}%)`);
            console.log("==================================================");

            server.close();
            if (testsPassed !== testsTotal) process.exit(1);
            process.exit(0);

        } catch (e) {
            console.error("Test execution failed:", e);
            server.close();
            process.exit(1);
        }
    });
}

start();

