/**
 * RVILS Telemetry & Session Continuity Engine
 * Dual-Write Architecture for MKPM RV Institute of Legal Studies (RVILS)
 * 
 * Endpoints:
 *  1. WordPress REST API  -> MySQL DB (/wp-json/rvils/v1/telemetry)
 *  2. Standalone Node API -> MongoDB / Supabase / MemStore (/api/telemetry/events)
 */

(function () {
    'use strict';

    // 1. Never execute inside Elementor editor or preview
    if (
        typeof window !== 'undefined' && (
            window.location.search.includes('elementor-preview') ||
            window.location.search.includes('action=elementor') ||
            window.location.search.includes('elementor_library') ||
            window.location.search.includes('fl_builder') ||
            window.location.search.includes('et_fb') ||
            window.location.search.includes('ct_builder') ||
            window.location.search.includes('bricks') ||
            (window.parent !== window && (window.location.search.includes('preview') || document.body?.classList.contains('elementor-editor-active')))
        )
    ) {
        return;
    }

    const SESSION_COOKIE_NAME = 'rvils_sid';
    const SESSION_STORAGE_KEY = 'rvils_telemetry_session';
    const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 mins
    const FLUSH_INTERVAL_MS = 10000; // 10s batch flush

    let eventQueue = [];
    let isFlushing = false;
    let rageClickTracker = { count: 0, lastX: 0, lastY: 0, lastTime: 0 };

    /* === Cookie & Root Domain Helpers === */
    function getRootDomain() {
        try {
            const host = window.location.hostname;
            if (!host || host === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(host)) return '';
            const parts = host.split('.');
            if (parts.length >= 2) {
                const isTwoPartTld = parts.length > 2 && (parts[parts.length - 2] === 'edu' || parts[parts.length - 2] === 'ac' || parts[parts.length - 2] === 'in');
                return '.' + parts.slice(isTwoPartTld ? -3 : -2).join('.');
            }
        } catch (e) {}
        return '';
    }

    function readCookie(name) {
        try {
            const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
            return match ? decodeURIComponent(match[3]) : null;
        } catch (e) {
            return null;
        }
    }

    function writeCookie(name, val, maxAgeSec = 86400) {
        try {
            const rootDomain = getRootDomain();
            const domainPart = rootDomain ? `; domain=${rootDomain}` : '';
            const securePart = window.location.protocol === 'https:' ? '; Secure' : '';
            document.cookie = `${name}=${encodeURIComponent(val)}; path=/${domainPart}; max-age=${maxAgeSec}; SameSite=Lax${securePart}`;
        } catch (e) {}
    }

    function generateSecureSessionId() {
        try {
            if (typeof crypto !== 'undefined' && crypto.randomUUID) {
                return 'sess_rvils_' + crypto.randomUUID().replace(/-/g, '').substring(0, 16) + '_' + Date.now().toString(36);
            }
        } catch (e) {}
        return 'sess_rvils_' + Math.random().toString(36).substr(2, 9) + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
    }

    /* === Triple-Tier Handshake Resolution === */
    function getOrCreateSessionId() {
        let sid = null;

        // Tier 1: Query param handoff (?rvils_sid=... or ?sid=...)
        try {
            const urlParams = new URLSearchParams(window.location.search);
            sid = urlParams.get('rvils_sid') || urlParams.get('sid');
            if (sid) {
                writeCookie(SESSION_COOKIE_NAME, sid);
                try {
                    sessionStorage.setItem('rvils_sid', sid);
                    localStorage.setItem('rvils_sid', sid);
                } catch (e) {}
                return sid;
            }
        } catch (e) {}

        // Tier 2: First-party root cookie
        sid = readCookie(SESSION_COOKIE_NAME);
        if (sid) {
            try {
                sessionStorage.setItem('rvils_sid', sid);
            } catch (e) {}
            return sid;
        }

        // Tier 3: Storage fallback
        try {
            sid = sessionStorage.getItem('rvils_sid') || localStorage.getItem('rvils_sid');
            if (sid) {
                writeCookie(SESSION_COOKIE_NAME, sid);
                return sid;
            }
        } catch (e) {}

        // Generate brand new session
        sid = generateSecureSessionId();
        writeCookie(SESSION_COOKIE_NAME, sid);
        try {
            sessionStorage.setItem('rvils_sid', sid);
            localStorage.setItem('rvils_sid', sid);
        } catch (e) {}
        return sid;
    }

    const sessionId = getOrCreateSessionId();
    window.rvilsSessionId = sessionId;

    /* === Geolocation Enrichment === */
    let userLocation = { city: 'Unknown', region: 'Unknown', country: 'Unknown' };
    let locationFetched = false;

    async function fetchUserLocation() {
        if (locationFetched || typeof window === 'undefined') return;
        try {
            const res = await fetch('https://ipapi.co/json/');
            const data = await res.json();
            if (data && data.city) userLocation.city = data.city;
            if (data && data.region) userLocation.region = data.region;
            if (data && data.country_name) userLocation.country = data.country_name;
            locationFetched = true;
        } catch (e) {}
    }
    fetchUserLocation();

    /* === Telemetry Configuration === */
    const config = {
        wpRestUrl: (window.rvilsChatbotConfig && window.rvilsChatbotConfig.wpRestUrl) || '/wp-json/rvils/v1/telemetry',
        vercelUrl: (window.rvilsChatbotConfig && window.rvilsChatbotConfig.vercelUrl) || 'http://localhost:3001/api/telemetry/events',
        instituteId: 'RVILS_BLR'
    };

    /* === Event Logger === */
    function logEvent(eventType, eventData = {}) {
        const payload = {
            sessionId: sessionId,
            instituteId: config.instituteId,
            eventType: eventType,
            timestamp: Date.now(),
            pageUrl: window.location.href,
            referrer: document.referrer || '',
            device: {
                userAgent: navigator.userAgent,
                screenWidth: window.innerWidth,
                screenHeight: window.innerHeight,
                language: navigator.language
            },
            location: userLocation,
            data: eventData
        };

        eventQueue.push(payload);
        if (eventQueue.length >= 8) {
            flushQueue();
        }
    }

    /* === Queue Flush with Dual-Write === */
    function flushQueue() {
        if (eventQueue.length === 0 || isFlushing) return;
        isFlushing = true;

        const batch = [...eventQueue];
        eventQueue = [];

        const bodyData = JSON.stringify({ events: batch });

        // 1. Dual Write: Dispatch to WordPress REST API
        if (config.wpRestUrl) {
            try {
                fetch(config.wpRestUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: bodyData,
                    keepalive: true
                }).catch(() => {});
            } catch (e) {}
        }

        // 2. Dual Write: Dispatch to Central Standalone Node/Vercel Hub
        if (config.vercelUrl) {
            try {
                fetch(config.vercelUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: bodyData,
                    keepalive: true
                }).catch(() => {});
            } catch (e) {}
        }

        isFlushing = false;
    }

    /* === Lead Form Submission === */
    function submitLead(leadData) {
        const payload = {
            sessionId: sessionId,
            instituteId: config.instituteId,
            eventType: 'lead_submission',
            timestamp: Date.now(),
            pageUrl: window.location.href,
            lead: leadData
        };

        // WordPress endpoint
        const wpLeadUrl = config.wpRestUrl.replace('/telemetry', '/lead');
        try {
            fetch(wpLeadUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }).catch(() => {});
        } catch (e) {}

        // Standalone backend endpoint
        const nodeLeadUrl = config.vercelUrl.replace('/telemetry/events', '/dashboard/leads');
        try {
            fetch(nodeLeadUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: sessionId,
                    instituteId: config.instituteId,
                    leadData: leadData,
                    timestamp: new Date().toISOString()
                })
            }).catch(() => {});
        } catch (e) {}

        logEvent('lead_captured', { name: leadData.name, program: leadData.program });
        flushQueue();
    }

    /* === Micro-Interaction & Friction Trackers === */
    function initFrictionTrackers() {
        // 1. Page View
        logEvent('page_view', { title: document.title });

        // 2. Scroll Depth Milestones (25%, 50%, 75%, 100%)
        let reachedDepths = new Set();
        window.addEventListener('scroll', () => {
            const h = document.documentElement;
            const b = document.body;
            const st = 'scrollTop';
            const sh = 'scrollHeight';
            const percent = Math.floor(((h[st] || b[st]) / ((h[sh] || b[sh]) - h.clientHeight)) * 100);

            [25, 50, 75, 100].forEach(milestone => {
                if (percent >= milestone && !reachedDepths.has(milestone)) {
                    reachedDepths.add(milestone);
                    logEvent('scroll_depth', { milestone: `${milestone}%` });
                }
            });
        }, { passive: true });

        // 3. Rage Clicks (Rapid clicks within a 40px radius)
        document.addEventListener('click', (e) => {
            const now = Date.now();
            const dist = Math.hypot(e.clientX - rageClickTracker.lastX, e.clientY - rageClickTracker.lastY);

            if (dist < 40 && (now - rageClickTracker.lastTime) < 600) {
                rageClickTracker.count++;
                if (rageClickTracker.count >= 3) {
                    logEvent('rage_click', {
                        x: e.clientX,
                        y: e.clientY,
                        target: e.target.tagName
                    });
                    rageClickTracker.count = 0;
                }
            } else {
                rageClickTracker.count = 1;
            }
            rageClickTracker.lastX = e.clientX;
            rageClickTracker.lastY = e.clientY;
            rageClickTracker.lastTime = now;
        }, { passive: true });

        // 4. Outbound link decoration (?rvils_sid=...)
        document.addEventListener('click', (e) => {
            const a = e.target.closest('a');
            if (!a || !a.href) return;
            try {
                const target = new URL(a.href, window.location.href);
                if (target.hostname.endsWith('rvils.edu.in') && !target.searchParams.has('rvils_sid')) {
                    target.searchParams.set('rvils_sid', sessionId);
                    a.href = target.toString();
                }
            } catch (err) {}
        }, true);
    }

    // Auto-flush timer
    setInterval(flushQueue, FLUSH_INTERVAL_MS);

    // Page unload beacon
    window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            flushQueue();
        }
    });

    // Initialize trackers when ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFrictionTrackers);
    } else {
        initFrictionTrackers();
    }

    // Expose Telemetry Object
    window.rvilsTelemetry = {
        sessionId: sessionId,
        logEvent: logEvent,
        submitLead: submitLead,
        flushQueue: flushQueue
    };

})();

