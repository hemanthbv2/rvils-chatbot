# MKPM RV Institute of Legal Studies (RVILS) — Institutional AI Chatbot & Dual-Write Platform

Official AI Chatbot, Client-Side Deterministic NLP Engine, WordPress Plugin, and Real-Time Dual-Write Command Center for **MKPM RV Institute of Legal Studies (RVILS)**, Bengaluru.

Affiliated with **Karnataka State Law University (KSLU)**, Hubballi | Approved by the **Bar Council of India (BCI)**, New Delhi | Governed by **Rashtreeya Sikshana Samithi Trust (RSST)**.

---

## 🌟 Key Features

### 1. 100% Pure Website Ground Truth (Zero Cloud AI Hallucinations)
- All knowledge is extracted directly from the official portal ([`rvils.edu.in`](https://rvils.edu.in/)) across 43 crawled pages.
- Client-side deterministic NLP engine with Levenshtein fuzzy distance matching ("Did you mean?"), multi-turn contextual continuation, and tokenized stop-word filtering.
- Complete parity with RVCE institutional chatbot architecture standards.

### 2. Specialized Legal Education Modules
- **Interactive Legal Stream Matcher:** 2-step decision tree matching students' 12th/PUC backgrounds and career goals (Judiciary, Corporate M&A, Taxation/Fintech, Civil Services) to **5-Year B.A. LL.B.**, **5-Year B.B.A. LL.B.**, **5-Year B.Com. LL.B.**, or **3-Year LL.B.** (for university graduates).
- **BCI Mandatory 20-Week Clinical Internship Roadmap:** Complete progression from Phase 1 (NGOs & Rural Surveys), Phase 2 (Trial Courts), Phase 3 (Appellate Courts & SCC Online/Manupatra research), to Phase 4 (DLSA & Tier-1/Tier-2 Law Firms).
- **Latin Maxims & Legal Terms Glossary:** Curated dictionary and individual intent handlers for *Pro Bono Publico*, *Audi Alteram Partem*, *Suo Motu*, *Amicus Curiae*, *Locus Standi*, *Habeas Corpus*, *Res Judicata*, *Ultra Vires*, *Caveat Emptor*, *De Minimis*, and *Lok Adalat*.

### 3. Comprehensive Research & Publications Suite
- **RV Law Journal:** Biannual blind peer-reviewed flagship journal (**ISSN: 2583-5041**, **OSCOLA** citation, submission guidelines, volumes 3 to 5).
- **Magazine – Samarthana:** Institutional annual college magazine.
- **RVILS Newsletter:** Bi-annual documentation of moots, guest lectures, and campus achievements.
- **Books & ISBN Volumes:** Centre for Research and Publication (CRP) publications.
- **Seminars, Conferences, Workshops & FDPs:** *Role of Evidence in Criminal Justice* (DGP Kamal Pant), *Bharatiya Nyaya Sanhita* (Senior Standing Counsel Madhukar Deshpande), *LEAD INDIA* symposium.
- **Institutional & Global Collaborations:** **University of Leeds (UK)** with Dr. Ilaria Zavoli on International Criminal Law, Kaale & Kaale Advisors on Corporate Practice, DLSA Bengaluru Urban & KSLSA on Lok Adalat and victim compensation.

### 4. Dual-Write Telemetry & Analytics Hub
- Real-time logging of user inquiries, sessions, and lead submissions dispatching in parallel to:
  1. WordPress REST API (`/wp-json/rvils/v1/telemetry`)
  2. Central Node.js Command Center (`/api/telemetry/events`)
- IP Geolocation enrichment and fallback memory store with 100% uptime guarantee.
- Cookie and query parameter handoff (`?rvils_sid=...`) for cross-domain session persistence.

---

## 📁 Repository Structure

```text
├── index.html                        # Local test portal & simulation harness
├── script.js                         # Core client-side NLP engine & knowledge base
├── style.css                         # Fully responsive widget styling with glassmorphism
├── telemetry.js                      # Dual-write session tracking & event telemetry
├── rvils_logo.png                    # Official RVILS emblem
│
├── rvils-chatbot/                    # Production WordPress Plugin ready for zip install
│   ├── rvils-chatbot.php             # WP plugin entry, admin settings, and REST API
│   ├── assets/                       # Minified assets (script.js, style.css, telemetry.js)
│   └── dashboard/                    # In-WordPress analytics, interactions, and leads tables
│
├── rvils-standalone-dashboard/       # Central Command Center (Node.js + Express + SSE)
│   ├── server.js                     # High-availability backend & REST API
│   ├── public/                       # Real-time dashboard frontend
│   └── vercel.json                   # Vercel serverless deployment configuration
│
├── tests/                            # Automated test suites (100% Passing)
│   ├── test_nlp.js                   # 78 NLP intent, moderation & research unit tests
│   ├── test_telemetry.js             # 6 REST API health & ingestion tests
│   ├── test_browser_widget.js        # Headless Chrome interaction tests
│   └── test_all_questions_live.js    # 62 comprehensive end-to-end question test harness
│
├── rvils-chatbot.zip                 # Distribution zip package for WordPress
└── rvils-chatbot-plugin-ready.zip    # Synchronized plugin archive
```

---

## 🚀 Quick Start

### 1. Run the Frontend Test Portal
```bash
python -m http.server 8080
# Open http://localhost:8080/index.html
```

### 2. Run the Telemetry & Command Center Hub
```bash
cd rvils-standalone-dashboard
npm install
node server.js
# Access dashboard at http://localhost:3001
```

### 3. Run Automated Test Suites
```bash
# 1. NLP & Knowledge Base Unit Tests (78 tests)
node tests/test_nlp.js

# 2. Telemetry Backend API Tests (6 tests)
node tests/test_telemetry.js

# 3. Live Headless Chrome Full-Question Test (62 scenarios)
node tests/test_all_questions_live.js
```

---

## 🏛️ Bar Council of India & KSLU Affiliation
* **Institution:** MKPM RV Institute of Legal Studies (RVILS)
* **Campus Address:** #45/1, 22nd Cross, 3rd Block, Jayanagar, Bengaluru - 560011, Karnataka, India
* **Phone:** `+91-80-69018952/53`
* **Email:** `rvils@rvei.edu.in`
* **Official Website:** [rvils.edu.in](https://rvils.edu.in)
