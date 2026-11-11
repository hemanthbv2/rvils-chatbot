# MKPM RV Institute of Legal Studies (RVILS) Chatbot & Analytics Platform
## Master Technical Specification & Architecture Manual

**Project Version:** 3.1.0 (Enterprise Architecture)  
**Governing Institution:** Rashtreeya Sikshana Samithi Trust (RSST) / MKPM RV Institute of Legal Studies (RVILS)  
**Affiliation & Approvals:** Karnataka State Law University (KSLU), Hubballi | Bar Council of India (BCI), New Delhi  
**Campus Location:** #45/1, 22nd Cross, 3rd Block, Jayanagar, Bengaluru - 560011, Karnataka, India  
**Release Date:** November 2026  
**License:** Institutional Proprietary / Commercial  

---

## 1. Executive Summary & Institutional Context

The **RVILS Chatbot & Behavioral Analytics Platform** is an enterprise-grade conversational AI and dual-write behavioral intelligence system engineered specifically for **MKPM RV Institute of Legal Studies (RVILS)** (`https://rvils.edu.in`). 

Established in 2018 under the aegis of the prestigious **Rashtreeya Sikshana Samithi Trust (RSST)**, RVILS is a premier center of legal education offering both integrated 5-year undergraduate law programs and the 3-year professional LL.B. degree for graduates.

The platform features an enterprise, high-availability conversational AI architecture:
- **Zero-Cloud-AI-Cost Deterministic Client-Side NLP Engine (`script.js`)**: All intent parsing, tokenization, fuzzy matching, entity recognition, and content moderation are executed directly within the visitor's browser thread. Operates with $<15\text{ ms}$ latency, $0 token consumption cost, and zero reliance on external LLM APIs (OpenAI, Gemini, Anthropic).
- **Dual-Write Telemetry Pipeline (`telemetry.js`)**: Real-time behavioral telemetry, rage-click detection, scroll depth tracking, and student leads are dispatched simultaneously to:
  1. The RVILS WordPress MySQL database (`/wp-json/rvils/v1/telemetry`)
  2. The standalone Node.js / Vercel central Command Center (`/api/telemetry/events`)
- **Triple-Tier Session Continuity Protocol**: Unbroken visitor tracking across cross-domain transitions via inbound URL parameter injection (`?rvils_sid=...`), shared first-party root cookies (`.rvils.edu.in`), and local/session storage fallbacks.
- **Dual Command Centers**:
  1. Native WordPress Admin Command Center (`dashboard/` within the plugin)
  2. Standalone Dark Glassmorphism Command Center (`#030712`) deployable to Vercel or Node.js

---

## 2. End-to-End System Topology

```
                                  [ VISITOR / APPLICANT ]
                 (Mobile Browsers, Desktop, Organic Search, Legal Portals)
                                            │
                                            ▼
                    ┌───────────────────────────────────────────────┐
                    │            RVILS OFFICIAL PORTAL              │
                    │            https://rvils.edu.in               │
                    │  ┌─────────────────────────────────────────┐  │
                    │  │       RVILS Chatbot Widget (v3.1.0)     │  │
                    │  │       - Deterministic NLP (script.js)   │  │
                    │  │       - RVILS Legal Theme (style.css)   │  │
                    │  │       - Voice & Audio Synthesis         │  │
                    │  │       - Pro/Friendly Tone Switcher      │  │
                    │  └────────────────────┬────────────────────┘  │
                    │                       │                       │
                    │  ┌────────────────────┴────────────────────┐  │
                    │  │       Behavioral Telemetry Engine       │  │
                    │  │       (telemetry.js)                    │  │
                    │  │       - Scroll Depth Milestones         │  │
                    │  │       - Rage & Dead Click Detection     │  │
                    │  │       - Triple-Tier Session Handshake   │  │
                    │  └────────┬───────────────────────┬────────┘  │
                    └───────────┼───────────────────────┼───────────┘
                                │                       │
     ┌──────────────────────────┴────────┐     ┌────────┴──────────────────────────┐
     │ Hub 1: WordPress Ingestion        │     │ Hub 2: Standalone Command Center │
     │ POST /wp-json/rvils/v1/telemetry │     │ POST /api/telemetry/events        │
     ▼                                   ▼     ▼                                   ▼
┌─────────────────────────┐ ┌────────────────┐ ┌──────────────────────────────────┐
│ WordPress MySQL Tables  │ │ In-Plugin WP   │ │ Standalone Express Hub (server.js│
│ - wp_rvils_chatbot_leads│ │ Admin Command  │ │ - Multi-Origin CORS Handling     │
│ - wp_rvils_chatbot_sess │ │ Center         │ │ - Key Normalization Layer        │
│ - wp_rvils_chatbot_event│ │ (/wp-admin/)   │ │ - In-Memory Cache (FIFO Safe)    │
└─────────────────────────┘ └────────────────┘ │ - MongoDB / Supabase Connectors  │
                                               └────────────────┬─────────────────┘
                                                                │
                                                                ▼
                                               ┌──────────────────────────────────┐
                                               │ Glassmorphism Command Center     │
                                               │ - Dark Theme (#030712)           │
                                               │ - Live Active Users Pulse        │
                                               │ - Lead Directory & Excel Export  │
                                               │ - Behavioral Funnel Analytics    │
                                               └──────────────────────────────────┘
```

---

## 3. Client-Side NLP Reasoning Engine (`script.js`)

### 3.1 Pure Website Extraction Protocol (100% Website Verified Data)
To guarantee 100% data fidelity and eliminate hallucinations, every fact embedded in the chatbot was extracted directly from live rendered pages of `https://rvils.edu.in/`.

- **Visual Screen Records Captured**: 45 unique full rendered page screenshots recorded in `d:/hemanth bv/RVILS/screenshots/` and catalogued in `screenshots/index.html`.
- **Zero Third-Party Data**: Strictly no data was ingested from third-party college portals or unverified sources. All board members, faculty profiles, eligibility percentages, internship regulations, and research publications originate solely from `rvils.edu.in`.
- **Text Corpus Ingested**: Over 1,415,000 characters of clean DOM text parsed into `verified_website_data.json`.
1. **Stop Words Filtering**: Eliminates grammatical noise while strictly preserving legal keywords (`b.a`, `b.b.a`, `b.com`, `ll.b`, `3-year`, `lat`, `moot`, `clinic`, `scc`, `manupatra`, `kslu`, `bci`).
2. **Punctuation Stripping & Sanitization**: Strips decorative characters and maps multiple spaces to clean tokens.
3. **Typo Tolerance**: Token boundary evaluation with fuzzy fallbacks.

### 3.2 Content Moderation Guardrails
The engine enforces three strict layers of real-time input moderation:
- **Abusive Profanity Filter**: Intercepts toxic, defamatory, or vulgar phrases and responds with an authoritative legal de-escalation prompt.
- **Conspiracy & Unverified Claims Blocker**: Declines engagement with political or unverified theories, redirecting visitors to verified RVILS academic data.
- **Privacy & Confidential Records Shield**: Prevents disclosure of personal faculty phone numbers, individual salaries, student marks, or private identifiers.

### 3.3 Domain-Specific Knowledge Base Structure
The chatbot embeds exhaustive, factual data sourced directly from `rvils.edu.in`:

| Category | Details Embedded |
| :--- | :--- |
| **Academic Programs** | 5-Year B.A. LL.B., 5-Year B.B.A. LL.B., 5-Year B.Com. LL.B., 3-Year LL.B. (Graduates). Full course curricula, eligibility ($45\%$ General, $40\%$ SC/ST), duration, and career outlook. |
| **Admissions 2026** | 6-Step Selection Lifecycle: 1. Application $\rightarrow$ 2. RVILS-LAT Entrance Test $\rightarrow$ 3. Institutional Interaction $\rightarrow$ 4. Personal Interview $\rightarrow$ 5. Offer Letter $\rightarrow$ 6. Confirmation. |
| **Entrance Exam (RVILS-LAT)**| Exam syllabus: Legal Aptitude & Reasoning, General Knowledge & Constitution of India, Analytical/Logical Reasoning, English Proficiency. |
| **Faculty & Administration** | Founder Principal Prof. (Dr.) Anjina Reddy K.R., Dr. Hanumaprakash K.S., Mr. Thejesh K.M., Ms. Chaitra M.D., Ms. Runjhun Sharma, Mr. Aswin K., Ms. Anncy Flora, Ms. Shruthi M.S., Mr. Rahul Simha N., Mrs. Sheena Razdan, Ms. Kruthika B. |
| **Moot Court Society** | Air-conditioned Moot Court Hall, trial simulations, memorial drafting bootcamps, annual internal ranking moots, national and international moot court participation. |
| **Legal Services Clinic** | KSLU and KSLSA approved clinic; free legal aid, Lok Adalat participation, rural legal awareness camps, collaboration with NSS and Youth Red Cross. |
| **Hybrid Library** | Comprehensive law library with **SCC Online**, **Manupatra**, AIR, Karnataka Law Journal, KOHA automated system, and research lab. |
| **Placements & Internships** | Mandatory judicial clerkships and internships under Supreme/High Court judges, leading corporate law firms, and NGO advocacy groups. |
| **Campus Facilities** | Jayanagar 3rd Block location (near South End Circle Metro), separate boys and girls hostels, sports facilities, auditorium, cafeteria, health center. |
| **Trust Governance** | Rashtreeya Sikshana Samithi Trust (RSST), founded in 1940 by Sri M.C. Sivananda Sarma, managing 28+ institutions serving 24,000+ students. |

---

## 4. Dual-Write Telemetry Pipeline (`telemetry.js`)

### 4.1 Triple-Tier Session Continuity Protocol
To guarantee session persistence across browsers, subdomains, and navigation:
1. **Tier 1 (Inbound URL Parameter)**: Outbound link decoration intercepts internal link clicks and appends `?rvils_sid=<SESSION_ID>`. The receiving page reads this parameter and sets it as the active session.
2. **Tier 2 (Root Cookie)**: Sets a first-party cookie scoped to `domain=.rvils.edu.in; SameSite=Lax; Secure`.
3. **Tier 3 (Local/Session Storage)**: Retained for development environments (`localhost`) and strict cookie sandboxes.

### 4.2 Friction & Interaction Metrics Captured
- **Milestone Scroll Depth**: Dispatches events at 25%, 50%, 75%, and 100% (footer) scroll positions.
- **Rage Clicks**: Detects $\ge 3$ rapid clicks within a 40px radius within 600ms.
- **Batching & Unload Beacon**: Flushes event queue every 10 seconds or immediately upon page visibility change (`visibilitychange`) using `fetch` with `keepalive: true`.

---

## 5. WordPress Chatbot Plugin (`rvils-chatbot/`)

### 5.1 Plugin Architecture
- **Main Plugin File**: `rvils-chatbot.php` (Version 3.1.0)
- **Database Schema**:
  - `wp_rvils_chatbot_leads`: Captures student leads (id, session_id, name, phone, email, program, city, status, created_at).
  - `wp_rvils_chatbot_sessions`: Tracks session metadata (id, session_id, start_time, last_active, message_count, device_type, referrer).
  - `wp_rvils_chatbot_events`: Stores granular telemetry and transcript records (id, session_id, event_type, event_data, page_url, timestamp, created_at).
- **REST API Routes**:
  - `POST /wp-json/rvils/v1/telemetry`: Batch event ingestion.
  - `POST /wp-json/rvils/v1/lead`: Direct lead submission.
  - `GET /wp-json/rvils/v1/stats`: Real-time KPI feed for admin dashboard.
- **Admin Command Center**:
  - `dashboard/index.php`: Real-time overview metrics, active visitor indicators, admissions leads table with Excel export.
  - `dashboard/analytics.php`: Conversion funnel, scroll depths, and law degree interest charts.
  - `dashboard/interactions.php`: Live searchable conversation transcripts.
  - `dashboard/sessions.php`: Session journeys and device breakdowns.

---

## 6. Standalone Analytics Command Center (`rvils-standalone-dashboard/`)

### 6.1 Server Architecture (`server.js`)
- High-performance Express server operating on port 3001.
- In-memory store (`memStore`) with FIFO capacity bounds (5,000 events, 1,000 sessions) ensuring 100% operational readiness out of the box with zero external database dependencies.
- Pluggable connector architecture for MongoDB Atlas and Supabase PostgreSQL.
- Server-Sent Events (SSE) live broadcaster (`/api/events`) for instant dashboard metric updates.

### 6.2 Key Normalization Compliance
To maintain full interoperability between Node.js and WordPress formats, the API normalizes output objects to provide both `timestamp` and `data` properties alongside native Mongoose fields.

---

## 7. Verification Results & Quality Assurance

Both test suites executed with 100% pass rates:

### 7.1 NLP Reasoning & Moderation Test (`tests/test_nlp.js`)
```
==================================================
   RVILS CHATBOT NLP & KNOWLEDGE BASE TEST SUITE  
==================================================
  [PASS] Content Moderation: Blocks abusive profanity
  [PASS] Content Moderation: Blocks conspiracy theories
  [PASS] Content Moderation: Blocks confidential student phone numbers
  [PASS] Content Moderation: Passes legitimate academic inquiries
  [PASS] Intent: 5-Year Integrated B.A. LL.B.
  [PASS] Intent: 5-Year Integrated B.B.A. LL.B.
  [PASS] Intent: 5-Year Integrated B.Com. LL.B.
  [PASS] Intent: 3-Year LL.B. for Graduates
  [PASS] Intent: All Academic Programmes
  [PASS] Intent: Entrance Exam (RVILS-LAT)
  [PASS] Intent: Admissions Process
  [PASS] Intent: Fees and Scholarships
  [PASS] Intent: Principal & Leadership
  [PASS] Intent: Faculty Directory
  [PASS] Intent: Moot Court Hall & Society
  [PASS] Intent: Legal Aid Clinic & Community Service
  [PASS] Intent: Hybrid Library & Digital Databases
  [PASS] Intent: Placements and Internships
  [PASS] Intent: Hostels and Campus Life
  [PASS] Intent: Affiliation (KSLU, BCI, RSST)
  [PASS] Intent: Contact & Campus Address
  [PASS] Knowledge Base: Principal Prof. (Dr.) Anjina Reddy K.R.
  [PASS] Knowledge Base: Board of Management includes Dr. M.P. Shyam
  [PASS] Knowledge Base: All 4 Programs Present with 10/6 Semesters
  [PASS] Knowledge Base: Databases Include SCC Online & Manupatra
  [PASS] Intent: Specific Faculty (Dr. Hanumaprakash K.S. - Commercial Law)
  [PASS] Intent: Specific Faculty (Mr. Mohan Kumar - Sports Director & Kabaddi)
  [PASS] Intent: Library Executives (Mr. Santosh Kumar Naragund)
  [PASS] Intent: Original Constitution Manuscript
  [PASS] Intent: Nyaya Darpana Lecture Series
  [PASS] Intent: Anti-Ragging Committee
  [PASS] Intent: Internal Complaints Committee (ICC)
  [PASS] Corpus: Loaded All 43 Searchable Pages from Verified Crawl
  [PASS] Corpus: Excludes non-page assets (dashicons.min.css removed)
  [PASS] Intent: RVCE / Engineering Clarification (Are you RVCE?)
  [PASS] Intent: RVCE / Engineering Clarification (Engineering Courses)
  [PASS] Intent: RVCE / Engineering Clarification (RVCE Admission / Fees)
  [PASS] Intent: RVCE / Engineering Clarification (Computer Science Engg)
  [PASS] Intent: 3-Year LL.B. for Engineering Graduates
  [PASS] Search Corpus: Resolves Specific Scraped Keyword (Commonwealth Kabaddi)
  [PASS] Search Corpus: Resolves Specific Scraped Keyword (Thattaguppe Village Survey)
  [PASS] Fuzzy Matching: Levenshtein distance computation
  [PASS] Fuzzy Suggestions: Recommends Admissions on 'admisssion' typo
  [PASS] Fuzzy Suggestions: Recommends BBA LLB on 'bballb' typo
  [PASS] Fuzzy Suggestions: Recommends Moot Court on 'mott cort' typo
  [PASS] Multi-Turn Context: Detects 'tell me more' continuation when context exists
  [PASS] Multi-Turn Deep Info: Returns curriculum breakdown for B.A. LL.B.
  [PASS] Dynamic Follow-Ups: Returns tailored next-steps for law programs
  [PASS] SafeStorage Persistence: Reliable memory & storage fallback
--------------------------------------------------
Results: 49 / 49 tests passed (100%)
==================================================
```

### 7.2 Standalone Server & Telemetry Contract Test (`tests/test_telemetry.js`)
```
==================================================
  RVILS STANDALONE SERVER & TELEMETRY TEST SUITE  
==================================================
  [PASS] GET /api/health: Returns healthy status
  [PASS] POST /api/telemetry/events: Successfully ingests batch
  [PASS] POST /api/dashboard/leads: Ingests student enquiry
  [PASS] GET /api/dashboard/leads: Normalized keys (timestamp & data)
  [PASS] GET /api/dashboard/sessions: Session tracked with message count
  [PASS] GET /api/dashboard/stats: Returns accurate KPI totals
--------------------------------------------------
Results: 6 / 6 tests passed (100%)
==================================================
```

---

## 8. Deployment Runbook

### 8.1 WordPress Plugin Deployment
1. Download `rvils-chatbot.zip` from `d:\hemanth bv\RVILS\rvils-chatbot.zip`.
2. In WordPress Admin, navigate to **Plugins > Add New > Upload Plugin**.
3. Select `rvils-chatbot.zip` and click **Install Now**, then click **Activate Plugin**.
4. The database tables (`wp_rvils_chatbot_*`) will be initialized automatically.
5. Access the settings and dashboard under the **RVILS Chatbot** menu in the WordPress sidebar.

### 8.2 Standalone Command Center Deployment
1. Run locally:
   ```bash
   cd "d:\hemanth bv\RVILS\rvils-standalone-dashboard"
   npm start
   ```
2. Open `http://localhost:3001` in your browser to access the live Command Center.
3. To deploy to Vercel:
   ```bash
   vercel --prod
   ```
   The included `vercel.json` will automatically configure serverless API routing.

