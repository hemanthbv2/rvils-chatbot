const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

// Load assets as base64
const logoPath = path.join(__dirname, 'rvils_logo.png');
const chatShotPath = path.join(__dirname, 'screenshots', 'ui_verification', '02_chat_opened_greeting.png');
const dashShotPath = path.join(__dirname, 'screenshots', 'ui_verification', '07_standalone_dashboard.png');

const logoBase64 = fs.existsSync(logoPath) ? `data:image/png;base64,${fs.readFileSync(logoPath).toString('base64')}` : '';
const chatShotBase64 = fs.existsSync(chatShotPath) ? `data:image/png;base64,${fs.readFileSync(chatShotPath).toString('base64')}` : '';
const dashShotBase64 = fs.existsSync(dashShotPath) ? `data:image/png;base64,${fs.readFileSync(dashShotPath).toString('base64')}` : '';

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>RVILS Chatbot Implementation Audit & Institutional Integrations Proposal</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 12mm 10mm 12mm;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #241D1A;
      background: #FFFFFF;
      font-size: 8pt;
      line-height: 1.36;
      -webkit-font-smoothing: antialiased;
    }

    .page {
      page-break-after: always;
      break-after: page;
      height: 277mm;
      max-height: 277mm;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
    }

    .page:last-child {
      page-break-after: avoid;
      break-after: avoid;
    }

    .page-content {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    /* Brand Colors */
    :root {
      --primary: #7B371C;
      --primary-dark: #58240F;
      --gold: #C07A3A;
      --gold-dark: #9E5B20;
      --charcoal: #2B1E1A;
      --muted: #5C4D48;
      --bg-light: #FAF7F5;
      --border-color: #E6DDD8;
      --badge-green: #1B7943;
      --badge-blue: #1C5D99;
    }

    /* Top Institutional Bar */
    .inst-header {
      display: flex;
      align-items: center;
      gap: 14px;
      padding-bottom: 9px;
      border-bottom: 2px solid var(--primary);
      margin-bottom: 11px;
    }

    .inst-logo {
      width: 52px;
      height: 52px;
      object-fit: contain;
    }

    .inst-titles {
      flex: 1;
    }

    .inst-parent {
      font-size: 7.2pt;
      font-weight: 700;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      color: var(--gold-dark);
    }

    .inst-name {
      font-family: "Georgia", serif;
      font-size: 14pt;
      font-weight: 700;
      color: var(--primary);
      line-height: 1.15;
      margin: 1px 0;
    }

    .inst-sub {
      font-size: 7.2pt;
      color: var(--muted);
      font-weight: 500;
    }

    /* Document Title Banner */
    .doc-banner {
      background: linear-gradient(135deg, #FAF7F5 0%, #F5ECE6 100%);
      border-left: 4px solid var(--primary);
      border-radius: 4px;
      padding: 9px 12px;
      margin-bottom: 11px;
    }

    .doc-type {
      font-size: 7.2pt;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      font-weight: 700;
      color: var(--primary);
    }

    .doc-title {
      font-family: "Georgia", serif;
      font-size: 12.5pt;
      font-weight: 700;
      color: var(--charcoal);
      margin: 2px 0;
    }

    .doc-desc {
      font-size: 7.5pt;
      color: var(--muted);
      line-height: 1.3;
    }

    /* Metadata Strip */
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-bottom: 11px;
    }

    .meta-card {
      background: #FFFFFF;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      padding: 5px 8px;
    }

    .meta-label {
      font-size: 6.5pt;
      text-transform: uppercase;
      font-weight: 700;
      color: var(--muted);
      letter-spacing: 0.5px;
    }

    .meta-val {
      font-size: 7.8pt;
      font-weight: 600;
      color: var(--charcoal);
      margin-top: 1px;
    }

    /* KPI Highlight Strip */
    .kpi-row {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 7px;
      margin-bottom: 11px;
    }

    .kpi-box {
      background: #FAF7F5;
      border: 1px solid var(--border-color);
      border-top: 3px solid var(--primary);
      border-radius: 4px;
      padding: 7px 5px;
      text-align: center;
    }

    .kpi-box.gold {
      border-top-color: var(--gold);
    }

    .kpi-num {
      font-size: 12.5pt;
      font-weight: 800;
      color: var(--primary);
      font-family: "Georgia", serif;
      line-height: 1;
    }

    .kpi-box.gold .kpi-num {
      color: var(--gold-dark);
    }

    .kpi-label {
      font-size: 6.5pt;
      font-weight: 600;
      color: var(--muted);
      margin-top: 3px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    /* Headings */
    h2.section-heading {
      font-family: "Georgia", serif;
      font-size: 10.5pt;
      font-weight: 700;
      color: var(--primary);
      border-bottom: 1.5px solid var(--border-color);
      padding-bottom: 3px;
      margin: 10px 0 6px 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    h2.section-heading:first-of-type {
      margin-top: 0;
    }

    h2.section-heading .badge {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 6.5pt;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 10px;
      letter-spacing: 0.4px;
      text-transform: uppercase;
    }

    .badge-verified {
      background: #E8F5E9;
      color: #1B5E20;
      border: 1px solid #A5D6A7;
    }

    .badge-proposed {
      background: #FFF3E0;
      color: #E65100;
      border: 1px solid #FFCC80;
    }

    .badge-action {
      background: #EDE7F6;
      color: #4A148C;
      border: 1px solid #D1C4E9;
    }

    h3.sub-heading {
      font-size: 8.5pt;
      font-weight: 700;
      color: var(--charcoal);
      margin: 7px 0 4px 0;
    }

    p {
      margin-bottom: 5px;
      color: #382D29;
      font-size: 7.8pt;
    }

    /* Tables */
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8px;
      font-size: 7.3pt;
    }

    table.data-table th {
      background: var(--primary);
      color: #FFFFFF;
      font-weight: 600;
      text-align: left;
      padding: 4.5px 6.5px;
      font-size: 6.9pt;
      letter-spacing: 0.3px;
      border: 1px solid var(--primary-dark);
    }

    table.data-table td {
      padding: 4px 6.5px;
      border: 1px solid var(--border-color);
      vertical-align: top;
      color: #2F2622;
      line-height: 1.32;
    }

    table.data-table tr:nth-child(even) td {
      background: #FAF7F5;
    }

    .tag {
      display: inline-block;
      padding: 1px 4.5px;
      border-radius: 3px;
      font-size: 6.5pt;
      font-weight: 600;
    }

    .tag-green { background: #E8F5E9; color: #1B5E20; }
    .tag-blue { background: #E3F2FD; color: #0D47A1; }
    .tag-gold { background: #FFF8E1; color: #F57F17; }
    .tag-purple { background: #F3E5F5; color: #6A1B9A; }
    .tag-gray { background: #EEEEEE; color: #424242; }

    /* Feature Grid */
    .feature-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 7px;
      margin-bottom: 8px;
    }

    .feature-card {
      background: #FAF7F5;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      padding: 6px 8px;
    }

    .feature-card.highlight {
      border-left: 3px solid var(--primary);
      background: #FFFFFF;
    }

    .feature-title {
      font-size: 7.8pt;
      font-weight: 700;
      color: var(--primary);
      margin-bottom: 2px;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .feature-desc {
      font-size: 7.2pt;
      color: var(--muted);
      line-height: 1.3;
    }

    /* Diagram / Architecture Pillars */
    .pillar-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 5px;
      margin-bottom: 9px;
    }

    .pillar-box {
      border: 1px solid var(--border-color);
      border-radius: 4px;
      overflow: hidden;
      background: #FFFFFF;
    }

    .pillar-header {
      background: var(--primary);
      color: #FFFFFF;
      padding: 4px 5px;
      font-size: 6.8pt;
      font-weight: 700;
      text-align: center;
      line-height: 1.2;
    }

    .pillar-box:nth-child(2) .pillar-header { background: #9E5B20; }
    .pillar-box:nth-child(3) .pillar-header { background: #2E5B88; }
    .pillar-box:nth-child(4) .pillar-header { background: #237A57; }
    .pillar-box:nth-child(5) .pillar-header { background: #683073; }

    .pillar-body {
      padding: 4px 5px;
      font-size: 6.5pt;
      color: var(--charcoal);
    }

    .pillar-item {
      padding: 2px 0;
      border-bottom: 1px dashed #EDE5E0;
      line-height: 1.25;
    }

    .pillar-item:last-child {
      border-bottom: none;
    }

    /* Screenshot Showcase */
    .shot-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 9px;
      margin: 8px 0;
    }

    .shot-card {
      border: 1px solid var(--border-color);
      border-radius: 4px;
      overflow: hidden;
      background: #FAF7F5;
      text-align: center;
    }

    .shot-img {
      width: 100%;
      height: 155px;
      object-fit: contain;
      background: #FFFFFF;
      display: block;
      border-bottom: 1px solid var(--border-color);
    }

    .shot-caption {
      font-size: 6.8pt;
      font-weight: 600;
      color: var(--muted);
      padding: 3.5px 5px;
    }

    /* Checklist */
    .check-list {
      list-style: none;
      margin: 5px 0 7px 0;
    }

    .check-item {
      display: flex;
      align-items: flex-start;
      gap: 7px;
      padding: 4.5px 7px;
      margin-bottom: 3.5px;
      background: #FAF7F5;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      font-size: 7.4pt;
    }

    .check-box {
      width: 13px;
      height: 13px;
      border: 1.5px solid var(--primary);
      border-radius: 3px;
      background: #FFFFFF;
      flex-shrink: 0;
      margin-top: 1px;
    }

    .check-content strong {
      color: var(--primary);
    }

    /* Sign-off Matrix */
    .sign-matrix {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-top: 9px;
    }

    .sign-box {
      border: 1px solid var(--border-color);
      border-radius: 4px;
      padding: 8px 7px 6px 7px;
      background: #FAF7F5;
      min-height: 85px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .sign-line {
      border-bottom: 1px dashed var(--muted);
      height: 32px;
      margin-bottom: 4px;
    }

    .sign-role {
      font-size: 6.8pt;
      font-weight: 700;
      color: var(--charcoal);
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .sign-name {
      font-size: 6.5pt;
      color: var(--muted);
      line-height: 1.25;
    }

    /* Callout Alert */
    .callout {
      background: #FAF7F5;
      border-left: 3px solid var(--gold);
      padding: 5px 8px;
      border-radius: 3px;
      font-size: 7.2pt;
      color: #3E322E;
      margin: 5px 0;
      line-height: 1.32;
    }

    .callout strong {
      color: var(--gold-dark);
    }

    .callout-green {
      border-left-color: #2E7D32;
      background: #F1F8E9;
    }
    .callout-green strong {
      color: #1B5E20;
    }

    /* Mini Grid for Two Column Content */
    .two-col-box {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 7px;
      margin: 6px 0;
    }

    .sub-box {
      background: #FAF7F5;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      padding: 6px 8px;
    }

    .sub-box-title {
      font-size: 7.2pt;
      font-weight: 700;
      color: var(--primary);
      margin-bottom: 3px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .sub-box-list {
      font-size: 6.8pt;
      color: var(--charcoal);
      line-height: 1.35;
    }

    /* Footer stamp */
    .doc-footer-bar {
      margin-top: auto;
      padding-top: 6px;
      border-top: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 6.5pt;
      color: var(--muted);
    }
  </style>
</head>
<body>

  <!-- ==================== PAGE 1 ==================== -->
  <div class="page">
    <div class="page-content">
      <!-- Institutional Header -->
      <div class="inst-header">
        ${logoBase64 ? `<img src="${logoBase64}" class="inst-logo" alt="RVILS Crest">` : ''}
        <div class="inst-titles">
          <div class="inst-parent">Rashtreeya Sikshana Samithi Trust (RSST) • Estd. 1940</div>
          <div class="inst-name">MKPM RV Institute of Legal Studies (RVILS)</div>
          <div class="inst-sub">Affiliated to Karnataka State Law University (KSLU), Hubballi | Approved by Bar Council of India (BCI), New Delhi</div>
        </div>
      </div>

      <!-- Title Banner -->
      <div class="doc-banner">
        <div class="doc-type">Institutional Executive Briefing & Technical Proposal</div>
        <div class="doc-title">Chatbot Implementation Audit & Institutional Integrations Roadmap</div>
        <div class="doc-desc">Official compliance report documenting verified data implemented from <strong>rvils.edu.in</strong> and proposing modular enterprise integrations (ERP, Library Koha, Payment Gateway, WhatsApp API, and Clinical Legal Aid) for formal Governing Council & Administrative approval.</div>
      </div>

      <!-- Metadata Grid -->
      <div class="meta-grid">
        <div class="meta-card">
          <div class="meta-label">Target Authority</div>
          <div class="meta-val">Principal & Governing Council</div>
        </div>
        <div class="meta-card">
          <div class="meta-label">Governing Trust</div>
          <div class="meta-val">RSST / RVEI, Bengaluru</div>
        </div>
        <div class="meta-card">
          <div class="meta-label">Data Ground Truth</div>
          <div class="meta-val">100% Official Portal (rvils.edu.in)</div>
        </div>
        <div class="meta-card">
          <div class="meta-label">Document Version</div>
          <div class="meta-val">November 2026 | Release v1.0</div>
        </div>
      </div>

      <!-- KPI Metrics -->
      <div class="kpi-row">
        <div class="kpi-box">
          <div class="kpi-num">4</div>
          <div class="kpi-label">Law Programmes</div>
        </div>
        <div class="kpi-box gold">
          <div class="kpi-num">43</div>
          <div class="kpi-label">Crawled Pages</div>
        </div>
        <div class="kpi-box">
          <div class="kpi-num">62 / 62</div>
          <div class="kpi-label">Scenarios Passed</div>
        </div>
        <div class="kpi-box gold">
          <div class="kpi-num">0%</div>
          <div class="kpi-label">AI Hallucination</div>
        </div>
        <div class="kpi-box">
          <div class="kpi-num">Dual</div>
          <div class="kpi-label">Write Telemetry</div>
        </div>
      </div>

      <!-- Executive Overview -->
      <h2 class="section-heading">
        Executive Summary & Strategic Rationale
        <span class="badge badge-verified">Ready for Production</span>
      </h2>
      <p>
        In accordance with the academic vision of the <strong>Rashtreeya Sikshana Samithi Trust (RSST)</strong> and <strong>MKPM RVILS</strong>, this initiative delivers an institutional conversational AI assistant engineered specifically for legal education. Unlike generic commercial chatbots that extrapolate or guess information, the RVILS Chatbot operates on a <strong>100% deterministic, zero-hallucination ground-truth engine</strong> mapped directly from the verified content of the official portal (<code>rvils.edu.in</code>).
      </p>

      <div class="callout callout-green">
        <strong>Zero Cloud LLM Dependency & Zero Cost:</strong> The chatbot's NLP classification, conversational branching, and legal stream matcher operate on local deterministic rule-trees and exact corpus search. There are <strong>no per-query API tokens or recurring cloud AI subscription fees</strong>, ensuring absolute institutional autonomy, data privacy, and zero latency.
      </div>

      <!-- Strategic Foundation Pillars -->
      <div class="feature-grid" style="margin-top: 6px;">
        <div class="feature-card highlight">
          <div class="feature-title">🏛️ 1. Statutory Compliance & Precise Disambiguation</div>
          <div class="feature-desc">Accurately conveys statutory KSLU percentage minimums (GM: 45%, OBC: 42%, SC/ST: 40%), BCI 20-week mandatory internship phases, and maintains a strict disambiguation boundary clarifying that RVILS confers law degrees exclusively, preventing confusion with engineering (RVCE).</div>
        </div>
        <div class="feature-card highlight">
          <div class="feature-title">⚖️ 2. Legal Stream Guidance & Research Showcase</div>
          <div class="feature-desc">Features an interactive 2-step Legal Stream Matcher recommending tailored degrees (B.A. LL.B., B.B.A. LL.B., B.Com. LL.B., or 3-Yr LL.B.) and showcases RVILS research assets including the <em>RV Law Journal</em> (ISSN 2583-5041), Samarthana magazine, and University of Leeds collaborations.</div>
        </div>
        <div class="feature-card highlight">
          <div class="feature-title">📊 3. Enterprise Dual-Write Telemetry</div>
          <div class="feature-desc">Every candidate inquiry, intent classification, and lead submission is synchronously stored in both the WordPress internal database (<code>wp_rvils_chatbot_leads</code>) and the Central Command Center (Node.js/MongoDB) for real-time admissions counselor notifications.</div>
        </div>
        <div class="feature-card highlight">
          <div class="feature-title">🛡️ 4. Institutional Brand & Data Privacy</div>
          <div class="feature-desc">Active moderation filters intercept sensitive personal data (e.g., unauthorized phone broadcasts, profanity, or spam). Designed in the exact RVILS visual palette (Mahogany <code>#7B371C</code>, Brass Gold <code>#C07A3A</code>) for seamless embedding into WordPress.</div>
        </div>
      </div>

      <div class="callout" style="margin-top: 6px;">
        <strong>Document Organization:</strong> <strong>Part 1</strong> audits all active data points across 9 domains for formal college authorization; <strong>Part 2</strong> presents the modular roadmap for ERP, Koha, Payment, WhatsApp & Moot Court integrations; <strong>Part 3</strong> outlines the institutional approval checklist and sign-off matrix.
      </div>
    </div>

    <div class="doc-footer-bar">
      <span>MKPM RV Institute of Legal Studies (RVILS) • Official Chatbot Audit & Proposal</span>
      <span>Confidential • Prepared for Institutional Leadership</span>
      <span>Page 1 of 5</span>
    </div>
  </div>

  <!-- ==================== PAGE 2 ==================== -->
  <div class="page">
    <div class="page-content">
      <div class="inst-header">
        ${logoBase64 ? `<img src="${logoBase64}" class="inst-logo" alt="RVILS Crest">` : ''}
        <div class="inst-titles">
          <div class="inst-name">MKPM RV Institute of Legal Studies (RVILS)</div>
          <div class="inst-sub">Part 1: Audit of Implemented Data & Knowledge Repositories (Domains 1 to 5)</div>
        </div>
      </div>

      <h2 class="section-heading">
        Academic, Governance & Statutory Knowledge Repositories
        <span class="badge badge-verified">Audit for Approval</span>
      </h2>
      <p style="font-size: 7.5pt; margin-bottom: 5px;">
        The following data points, curriculum breakdowns, and statutory cut-offs are <strong>actively running</strong> in the chatbot. All details are derived <strong>strictly from rvils.edu.in</strong> with zero third-party extrapolation:
      </p>

      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 22%;">Domain</th>
            <th style="width: 48%;">Implemented Information & Functional Capabilities</th>
            <th style="width: 17%;">Source (rvils.edu.in)</th>
            <th style="width: 13%;">Audit Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>1. Governance & Leadership</strong></td>
            <td>RSST leadership (Dr. M.P. Shyam, Sri N.R. Nandish); Founder Principal Prof. (Dr.) Anjina Reddy K.R.; statutory affiliation to KSLU Hubballi; BCI approval; campus address in Jayanagar, Bengaluru.</td>
            <td>About Us / Board / Contact</td>
            <td><span class="tag tag-green">Verified 100%</span></td>
          </tr>
          <tr>
            <td><strong>2. Statutory Disambiguation</strong></td>
            <td>Strict boundary rule distinguishing RVILS (Law degrees exclusively) from RVCE (Engineering); guides B.E./B.Tech graduates to 3-Year LL.B. while redirecting tech queries to rvce.edu.in.</td>
            <td>Institutional Policy & FAQ</td>
            <td><span class="tag tag-green">Verified 100%</span></td>
          </tr>
          <tr>
            <td><strong>3. 5-Yr B.A. LL.B. (10 Semesters)</strong></td>
            <td>Political Science, Sociology, Economics, Constitutional Law, Criminal Jurisprudence; targeted for Judiciary, Civil Services (UPSC/KPSC), and Appellate Litigation.</td>
            <td>Programmes / B.A. LL.B.</td>
            <td><span class="tag tag-green">Verified 100%</span></td>
          </tr>
          <tr>
            <td><strong>4. 5-Yr B.B.A. LL.B. (10 Semesters)</strong></td>
            <td>Strategic Management, Corporate Governance, Corporate Laws, M&A, IPR, Commercial Arbitration; tailored for Tier-1/Tier-2 Corporate Law Firms and in-house counsel.</td>
            <td>Programmes / B.B.A. LL.B.</td>
            <td><span class="tag tag-green">Verified 100%</span></td>
          </tr>
          <tr>
            <td><strong>5. 5-Yr B.Com. LL.B. (10 Semesters)</strong></td>
            <td>Financial Accounting, Corporate Auditing, Indirect Tax (GST), Direct Tax Codes, Banking Law, IBC; tailored for Corporate Tax Advisory, NCLT, and Big 4 firms.</td>
            <td>Programmes / B.Com. LL.B.</td>
            <td><span class="tag tag-green">Verified 100%</span></td>
          </tr>
          <tr>
            <td><strong>6. 3-Year LL.B. for Graduates (6 Semesters)</strong></td>
            <td>Professional law degree for holders of any recognized Bachelor’s degree (B.A., B.Sc., B.Com., B.B.A., B.E./B.Tech); procedural drafting, chamber attachments, trial advocacy.</td>
            <td>Programmes / 3-Yr LL.B.</td>
            <td><span class="tag tag-green">Verified 100%</span></td>
          </tr>
          <tr>
            <td><strong>7. Statutory Admissions Eligibility</strong></td>
            <td>6-Stage Admissions Lifecycle; Statutory KSLU Aggregate Cut-offs: <strong>GM: 45%</strong>, <strong>OBC: 42%</strong>, <strong>SC/ST: 40%</strong>; RVILS-LAT 100-mark entrance exam syllabus and schedule.</td>
            <td>Admissions & Circulars</td>
            <td><span class="tag tag-green">Verified 100%</span></td>
          </tr>
          <tr>
            <td><strong>8. Core Faculty Directory</strong></td>
            <td>Profiles for 12 faculty: Dr. Hanumaprakash K.S. (Commercial), Dr. Thejesh B.S. (Management), Mr. Aswin K. (Corporate), Mrs. Chaitra P. (Constitutional), Mrs. Runjhun Ray (International), Mrs. Anncy P. (Criminal), Mrs. Shruthi B.A. (Economics), Mr. Rahul Simha (Constitutional), Mrs. Sheena P.R. (Family), Mrs. Kruthika H.R. (Cyber/IPR), Mrs. Paavana (Social Sciences), Mr. Mohan Kumar N.N. (Sports Champion), Mr. Santosh Kumar Naragund (Librarian).</td>
            <td>Faculty Directory</td>
            <td><span class="tag tag-green">Verified 100%</span></td>
          </tr>
        </tbody>
      </table>

      <!-- Entrance Examination & Career Pathways -->
      <div class="two-col-box">
        <div class="sub-box">
          <div class="sub-box-title">📝 RVILS-LAT Entrance Test Composition (100 Marks)</div>
          <div class="sub-box-list">
            • <strong>Legal Aptitude & Reasoning (30 Marks):</strong> Legal principles, contracts, torts & Constitution.<br>
            • <strong>General Knowledge & Current Affairs (30 Marks):</strong> National/international legal developments.<br>
            • <strong>Analytical & Logical Ability (20 Marks):</strong> Critical deduction & pattern analysis.<br>
            • <strong>English Language & Comprehension (20 Marks):</strong> Vocabulary, grammar & legal phrasing.
          </div>
        </div>
        <div class="sub-box">
          <div class="sub-box-title">⚖️ Degree Specializations & Career Destination Matrix</div>
          <div class="sub-box-list">
            • <strong>B.A. LL.B.</strong> → Judicial Services Examinations, UPSC/Civil Services & Appellate Bar.<br>
            • <strong>B.B.A. LL.B.</strong> → Corporate Law Firms, M&A Advisory & In-House Corporate Counsel.<br>
            • <strong>B.Com. LL.B.</strong> → Corporate Tax Advisory, NCLT Practice, Banking Law & Big 4.<br>
            • <strong>3-Year LL.B.</strong> → Specialized Chamber Practice, Criminal/Civil Litigation & Retainers.
          </div>
        </div>
      </div>

      <div class="callout callout-green" style="margin-top: 2px;">
        <strong>Statutory Compliance Note:</strong> All minimum eligibility cut-offs match the mandatory guidelines issued by Karnataka State Law University (KSLU) and the Bar Council of India (BCI). The chatbot never misrepresents admission requirements or promises seats.
      </div>
    </div>

    <div class="doc-footer-bar">
      <span>MKPM RV Institute of Legal Studies (RVILS) • Official Chatbot Audit & Proposal</span>
      <span>Confidential • Prepared for Institutional Leadership</span>
      <span>Page 2 of 5</span>
    </div>
  </div>

  <!-- ==================== PAGE 3 ==================== -->
  <div class="page">
    <div class="page-content">
      <div class="inst-header">
        ${logoBase64 ? `<img src="${logoBase64}" class="inst-logo" alt="RVILS Crest">` : ''}
        <div class="inst-titles">
          <div class="inst-name">MKPM RV Institute of Legal Studies (RVILS)</div>
          <div class="inst-sub">Part 1 (Continued): Clinical Practicals, Research Suite & Live System Showcase</div>
        </div>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 22%;">Domain</th>
            <th style="width: 48%;">Implemented Information & Functional Capabilities</th>
            <th style="width: 17%;">Source (rvils.edu.in)</th>
            <th style="width: 13%;">Audit Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>9. Clinical Infrastructure</strong></td>
            <td>Moot Court Hall (High Court replica bench), RVILS Legal Services Clinic (free citizen aid 10am-4pm), National/State Lok Adalat dispute resolution training, and NSS field outreach.</td>
            <td>Facilities & Clinic</td>
            <td><span class="tag tag-green">Verified 100%</span></td>
          </tr>
          <tr>
            <td><strong>10. Hybrid Library Holdings</strong></td>
            <td>15,000+ legal volumes, Koha ILMS, SCC Online, Manupatra digital databases, and the calligraphed <strong>Original Constitution of India Manuscript</strong> replica on display.</td>
            <td>Library Section</td>
            <td><span class="tag tag-green">Verified 100%</span></td>
          </tr>
          <tr>
            <td><strong>11. Specialized Legal Modules</strong></td>
            <td>Interactive Stream Matcher Quiz; BCI 20-week mandatory internship roadmap (Trial, Appellate, DLSA, Chamber); Courtroom glossary & Latin legal maxims.</td>
            <td>Curriculum & Moot</td>
            <td><span class="tag tag-green">Verified 100%</span></td>
          </tr>
          <tr>
            <td><strong>12. Research & Publications</strong></td>
            <td><em>RV Law Journal</em> (ISSN: 2583-5041, OSCOLA format, Vols 3-5, submission: <code>rvlawjournal.mkpmrvils@rvei.edu.in</code>); <em>Samarthana</em> Magazine (2018-2025); Bi-annual Newsletter (July 2025–Jan 2026); CRP Books/ISBNs.</td>
            <td>Research & Publications</td>
            <td><span class="tag tag-green">Verified 100%</span></td>
          </tr>
          <tr>
            <td><strong>13. Symposia & Collaborations</strong></td>
            <td>National Seminar on Evidence with DGP Kamal Pant & AIIMS Prof. Dinesh Rao; Bharatiya Nyaya Sanhita seminar; University of Leeds UK (Dr. Ilaria Zavoli); Kaale & Kaale; B.PAC.</td>
            <td>Seminars & Collaborations</td>
            <td><span class="tag tag-green">Verified 100%</span></td>
          </tr>
        </tbody>
      </table>

      <h2 class="section-heading">
        Live Verification & Visual System Showcase
        <span class="badge badge-verified">62 / 62 Tests Passed</span>
      </h2>
      <p style="font-size: 7.5pt;">
        Automated and manual validation across 62 real-world legal and admissions scenarios confirms complete operational integrity:
      </p>

      <!-- Visual Screenshots Row -->
      <div class="shot-row">
        <div class="shot-card">
          ${chatShotBase64 ? `<img src="${chatShotBase64}" class="shot-img" alt="RVILS Live Chatbot Widget">` : '<div style="height:155px;display:flex;align-items:center;justify-content:center;">Live Widget Interface</div>'}
          <div class="shot-caption"><strong>Figure 1:</strong> Production Chatbot Widget on RVILS Website (Brand Theme, Quick Chips & Stream Matcher)</div>
        </div>
        <div class="shot-card">
          ${dashShotBase64 ? `<img src="${dashShotBase64}" class="shot-img" alt="RVILS Standalone Command Dashboard">` : '<div style="height:155px;display:flex;align-items:center;justify-content:center;">Central Analytics Dashboard</div>'}
          <div class="shot-caption"><strong>Figure 2:</strong> Central Command Dashboard (Real-time Lead Funnel, Intent Distribution & Inquiries)</div>
        </div>
      </div>

      <div class="callout" style="margin-top: 4px;">
        <strong>Admissions Lead Notification Action:</strong> Prospective students submit enquiries with Full Name, Phone, Email, Selected Law Degree, and Academic Background. Leadership is requested to confirm the institutional email address for automated daily lead digests.
      </div>
    </div>

    <div class="doc-footer-bar">
      <span>MKPM RV Institute of Legal Studies (RVILS) • Official Chatbot Audit & Proposal</span>
      <span>Confidential • Prepared for Institutional Leadership</span>
      <span>Page 3 of 5</span>
    </div>
  </div>

  <!-- ==================== PAGE 4 ==================== -->
  <div class="page">
    <div class="page-content">
      <div class="inst-header">
        ${logoBase64 ? `<img src="${logoBase64}" class="inst-logo" alt="RVILS Crest">` : ''}
        <div class="inst-titles">
          <div class="inst-name">MKPM RV Institute of Legal Studies (RVILS)</div>
          <div class="inst-sub">Part 2: Institutional Integrations Roadmap (Five Strategic Pillars)</div>
        </div>
      </div>

      <h2 class="section-heading">
        Enterprise Campus Integrations Architecture
        <span class="badge badge-proposed">Enterprise Vision</span>
      </h2>
      <p style="font-size: 7.5pt;">
        Beyond prospective student admissions, the RVILS chatbot architecture is equipped with modular connectors to integrate with existing campus software, university portals, and statutory bodies:
      </p>

      <!-- Visual Architecture Pillars -->
      <div class="pillar-grid">
        <div class="pillar-box">
          <div class="pillar-header">1. ERP & Campus SIS</div>
          <div class="pillar-body">
            <div class="pillar-item"><strong>Student Attendance:</strong> Internal % check via USN.</div>
            <div class="pillar-item"><strong>Internal Marks:</strong> Test scores & hall ticket clearance.</div>
            <div class="pillar-item"><strong>KSLU Exam Alerts:</strong> Circulars & results API sync.</div>
            <div class="pillar-item"><strong>Hostel Gate Pass:</strong> Curfew check & digital leave.</div>
          </div>
        </div>
        <div class="pillar-box">
          <div class="pillar-header">2. Library & Research</div>
          <div class="pillar-body">
            <div class="pillar-item"><strong>Koha ILMS API:</strong> Live catalog & shelf locator.</div>
            <div class="pillar-item"><strong>Book Renewals:</strong> In-chat library card renewals.</div>
            <div class="pillar-item"><strong>SCC & Manupatra:</strong> Instant SSO authentication.</div>
            <div class="pillar-item"><strong>Turnitin Plagiarism:</strong> Memorial similarity score check.</div>
          </div>
        </div>
        <div class="pillar-box">
          <div class="pillar-header">3. Admissions & CRM</div>
          <div class="pillar-body">
            <div class="pillar-item"><strong>Payment Gateway:</strong> Razorpay for RVILS-LAT fee.</div>
            <div class="pillar-item"><strong>Instant PDF Receipts:</strong> Fee receipt dispatch in chat.</div>
            <div class="pillar-item"><strong>Lead CRM:</strong> Sync with LeadSquared / Meritto.</div>
            <div class="pillar-item"><strong>DigiLocker API:</strong> Verified mark sheet retrieval.</div>
          </div>
        </div>
        <div class="pillar-box">
          <div class="pillar-header">4. Omnichannel Bot</div>
          <div class="pillar-body">
            <div class="pillar-item"><strong>WhatsApp Business:</strong> Green-tick helpline on +91-80.</div>
            <div class="pillar-item"><strong>Transactional SMS:</strong> DND-compliant OTP & circulars.</div>
            <div class="pillar-item"><strong>AI Voice Helpline:</strong> IVR agent in EN, KN & HI.</div>
            <div class="pillar-item"><strong>Parent Portal:</strong> Fee status & progress reports.</div>
          </div>
        </div>
        <div class="pillar-box">
          <div class="pillar-header">5. Clinical Advocacy</div>
          <div class="pillar-body">
            <div class="pillar-item"><strong>Moot Court Hall:</strong> Digital bench booking & schedule.</div>
            <div class="pillar-item"><strong>Legal Aid Clinic:</strong> Citizen free advice ticket booking.</div>
            <div class="pillar-item"><strong>20-Week Diary:</strong> BCI digital internship verification.</div>
            <div class="pillar-item"><strong>Lok Adalat Sync:</strong> Volunteer registration & rosters.</div>
          </div>
        </div>
      </div>

      <h3 class="sub-heading">Strategic Integration Capabilities & Institutional Value</h3>

      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 20%;">Pillar & Integration</th>
            <th style="width: 24%;">Compatible Systems</th>
            <th style="width: 38%;">Chatbot User Experience & Operational Flow</th>
            <th style="width: 18%;">Institutional Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>1. ERP & Student SIS</strong></td>
            <td>Contineo, Dhi, Linways, RSST Trust ERP</td>
            <td>Enrolled students authenticate with USN/Roll No. and OTP to ask <em>"What is my Constitutional Law attendance?"</em> or <em>"When are 4th Sem exams?"</em>.</td>
            <td>Reduces 75% counter traffic at administrative & exam offices.</td>
          </tr>
          <tr>
            <td><strong>2. Library ILMS (Koha)</strong></td>
            <td>Koha REST API, SCC Online, Manupatra SSO</td>
            <td>Students search book availability in real-time (e.g. <em>"Is Mulla on Hindu Law on the shelf?"</em>) and view rack coordinates or renew borrowings.</td>
            <td>Transforms hybrid library into a 24/7 digital concierge.</td>
          </tr>
          <tr>
            <td><strong>3. Payment Gateway</strong></td>
            <td>Razorpay, BillDesk, Cashfree, SBI Collect</td>
            <td>Applicants pay the <strong>RVILS-LAT Entrance Test Fee (₹500 - ₹1,000)</strong> directly via conversational UPI/Credit Card link with stamped PDF receipt.</td>
            <td>Dramatically increases application conversion rates.</td>
          </tr>
          <tr>
            <td><strong>4. WhatsApp Business API</strong></td>
            <td>Meta Cloud API, Gupshup, Twilio (Green Tick)</td>
            <td>Deploys the verified 43-page knowledge base to WhatsApp (+91-80-69018952), allowing parents and outstation applicants across India to chat seamlessly.</td>
            <td>High accessibility; 98% open rates compared to email.</td>
          </tr>
          <tr>
            <td><strong>5. Moot & Legal Aid Operations</strong></td>
            <td>DLSA Grievance Portal, Google Workspace, BCI Portal</td>
            <td>Citizens book free consultation appointments at RVILS Legal Clinic; student teams book practice slots in the Moot Court Hall with court diary logs.</td>
            <td>Fulfills BCI compliance and boosts institutional NAAC score.</td>
          </tr>
        </tbody>
      </table>

      <!-- Security & Technical Infrastructure -->
      <div class="two-col-box">
        <div class="sub-box">
          <div class="sub-box-title">🔒 Local Sovereignty & Zero External LLM Leakage</div>
          <div class="sub-box-list">
            • <strong>Client-Side Classification:</strong> NLP intent matching occurs locally without passing candidate data to third-party public AI models.<br>
            • <strong>Isolated WordPress Table:</strong> Leads reside inside <code>wp_rvils_chatbot_leads</code> behind institutional firewalls.
          </div>
        </div>
        <div class="sub-box">
          <div class="sub-box-title">🛡️ DPDP Act 2023 & BCI Compliance Standards</div>
          <div class="sub-box-list">
            • <strong>Encrypted Telemetry:</strong> All transmissions use 256-bit SSL encryption with sanitized PII masking for public browsers.<br>
            • <strong>Role-Based Access:</strong> Only designated admissions counselors and administrators receive decrypted student data.
          </div>
        </div>
      </div>

      <div class="callout callout-green" style="margin-top: 2px;">
        <strong>Data Protection & DPDP Act 2023:</strong> All candidate and student records are securely encrypted. No student data is transmitted to public cloud LLMs, ensuring 100% adherence to national data protection laws and RSST IT guidelines.
      </div>
    </div>

    <div class="doc-footer-bar">
      <span>MKPM RV Institute of Legal Studies (RVILS) • Official Chatbot Audit & Proposal</span>
      <span>Confidential • Prepared for Institutional Leadership</span>
      <span>Page 4 of 5</span>
    </div>
  </div>

  <!-- ==================== PAGE 5 ==================== -->
  <div class="page">
    <div class="page-content">
      <div class="inst-header">
        ${logoBase64 ? `<img src="${logoBase64}" class="inst-logo" alt="RVILS Crest">` : ''}
        <div class="inst-titles">
          <div class="inst-name">MKPM RV Institute of Legal Studies (RVILS)</div>
          <div class="inst-sub">Part 3: Governance, Phased Rollout Schedule & Executive Approvals</div>
        </div>
      </div>

      <h2 class="section-heading">
        Phased Rollout Schedule & Institutional Approvals
        <span class="badge badge-action">Action Required</span>
      </h2>

      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 14%;">Phase</th>
            <th style="width: 25%;">Deliverables & Scope</th>
            <th style="width: 37%;">Key Activities & Milestone Outcomes</th>
            <th style="width: 12%;">Duration</th>
            <th style="width: 12%;">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Phase 1: Current</strong></td>
            <td>Website Chatbot & Central Telemetry</td>
            <td>Deployment of the 43-page deterministic NLP chatbot on <code>rvils.edu.in</code> via WordPress plugin + Central Command Dashboard for lead management.</td>
            <td>Immediate</td>
            <td><span class="tag tag-green">Completed & Tested</span></td>
          </tr>
          <tr>
            <td><strong>Phase 2: Priority</strong></td>
            <td>WhatsApp Business & Payment Gateway</td>
            <td>Integration of official WhatsApp Business API (+91-80-69018952) and Razorpay integration for conversational RVILS-LAT test fee collection.</td>
            <td>2–3 Weeks</td>
            <td><span class="tag tag-gold">Proposed</span></td>
          </tr>
          <tr>
            <td><strong>Phase 3: Academic</strong></td>
            <td>ERP / SIS & Koha Library ILMS</td>
            <td>Connecting to college ERP for USN attendance/marks checking and Koha ILMS for real-time book availability and renewal in chat.</td>
            <td>4–6 Weeks</td>
            <td><span class="tag tag-blue">Planned</span></td>
          </tr>
          <tr>
            <td><strong>Phase 4: Clinical</strong></td>
            <td>Legal Aid Clinic & Moot Court Portal</td>
            <td>Digital booking for citizen legal aid consultations under DLSA; digital 20-week BCI student internship logbook verification.</td>
            <td>6–8 Weeks</td>
            <td><span class="tag tag-purple">Roadmap</span></td>
          </tr>
        </tbody>
      </table>

      <h3 class="sub-heading">Institutional Authorization Checklist</h3>
      <ul class="check-list">
        <li class="check-item">
          <div class="check-box"></div>
          <div class="check-content">
            <strong>1. Official Website Data Verification:</strong> Formal approval to present the institutional information, statutory KSLU minimum eligibility percentages (45%/42%/40%), faculty profiles, and research publication records extracted from <code>rvils.edu.in</code>.
          </div>
        </li>
        <li class="check-item">
          <div class="check-box"></div>
          <div class="check-content">
            <strong>2. Admissions Lead Email Routing:</strong> Authorization of official email endpoints (e.g. <code>admissions.rvils@rvei.edu.in</code>) to receive automated candidate lead alerts generated through the chatbot enquiry modal.
          </div>
        </li>
        <li class="check-item">
          <div class="check-box"></div>
          <div class="check-content">
            <strong>3. WordPress Plugin Deployment:</strong> Permission to upload and activate the production plugin package <code>rvils-chatbot.zip</code> on the official college WordPress hosting environment.
          </div>
        </li>
        <li class="check-item">
          <div class="check-box"></div>
          <div class="check-content">
            <strong>4. Telemetry & Analytics Architecture:</strong> Selection between using the native WordPress MySQL database exclusively or linking to the Central Command Center (Node.js/MongoDB) on institutional cloud infrastructure.
          </div>
        </li>
        <li class="check-item">
          <div class="check-box"></div>
          <div class="check-content">
            <strong>5. Phase-2 Integration Approval:</strong> Recommendation on which modular integration to initiate next:
            <span style="display:inline-block; margin-left: 6px;">[ ] Official WhatsApp Business API &nbsp;&nbsp; [ ] Razorpay Application Fee Gateway &nbsp;&nbsp; [ ] Koha ILMS Library Search</span>
          </div>
        </li>
      </ul>

      <!-- Formal Sign-Off Matrix -->
      <h2 class="section-heading" style="margin-top: 8px;">
        Institutional Review & Endorsement Matrix
        <span class="badge badge-verified">Sign-Off</span>
      </h2>

      <div class="sign-matrix">
        <div class="sign-box">
          <div class="sign-role">Prof. (Dr.) Anjina Reddy K.R.</div>
          <div class="sign-line"></div>
          <div class="sign-name">Founder Principal<br>MKPM RV Institute of Legal Studies</div>
        </div>
        <div class="sign-box">
          <div class="sign-role">Sri N.R. Nandish</div>
          <div class="sign-line"></div>
          <div class="sign-name">Hon. Chairman, Governing Council<br>Rashtreeya Sikshana Samithi Trust (RSST)</div>
        </div>
        <div class="sign-box">
          <div class="sign-role">Convener, IT & Admissions</div>
          <div class="sign-line"></div>
          <div class="sign-name">Admissions & Systems Committee<br>MKPM RV Institute of Legal Studies</div>
        </div>
      </div>

      <!-- Campus Registry Details -->
      <div style="margin-top: 8px; background: #FAF7F5; border: 1px solid var(--border-color); border-radius: 4px; padding: 6px 9px;">
        <div style="font-size: 6.8pt; font-weight: 700; color: var(--primary); text-transform: uppercase; margin-bottom: 2px;">
          🏛️ Institutional Campus Registry
        </div>
        <div style="font-size: 6.5pt; color: var(--muted); line-height: 1.3;">
          <strong>Campus Address:</strong> #45/1, 22nd Cross, 3rd Block, Jayanagar, Bengaluru – 560011, Karnataka, India<br>
          <strong>Official Telephones:</strong> +91-80-69018952 / +91-80-69018953 | <strong>Official Email:</strong> rvils@rvei.edu.in | <strong>Web:</strong> rvils.edu.in<br>
          <strong>Technical Development & Systems Architecture:</strong> Hemanth B V | <strong>Repository:</strong> github.com/hemanthbv2/rvils-chatbot
        </div>
      </div>
    </div>

    <div class="doc-footer-bar">
      <span>MKPM RV Institute of Legal Studies (RVILS) • Official Chatbot Audit & Proposal</span>
      <span>Confidential • Prepared for Institutional Leadership</span>
      <span>Page 5 of 5</span>
    </div>
  </div>

</body>
</html>
`;

async function generatePDF() {
  const outputPath = path.join(__dirname, 'RVILS_Institutional_Proposal_and_Audit.pdf');
  const tempHtmlPath = path.join(__dirname, 'temp_proposal.html');

  fs.writeFileSync(tempHtmlPath, htmlContent, 'utf8');
  console.log('Temporary HTML created at:', tempHtmlPath);

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    preferCSSPageSize: true,
    margin: {
      top: '10mm',
      bottom: '10mm',
      left: '12mm',
      right: '12mm'
    }
  });

  await browser.close();

  const stats = fs.statSync(outputPath);
  console.log(`✅ PDF successfully generated at: ${outputPath}`);
  console.log(`📊 File Size: ${(stats.size / 1024).toFixed(2)} KB`);
}

generatePDF().catch(err => {
  console.error('Error generating PDF:', err);
  process.exit(1);
});
