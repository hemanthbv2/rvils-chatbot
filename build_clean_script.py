import json
import re
import os
import shutil

# 1. Load verified website data
with open('verified_website_data.json', 'r', encoding='utf-8') as f:
    website_data = json.load(f)

page_corpus = []
for url, data in website_data.items():
    body = data.get('text', '').replace('\r', '')
    body = re.sub(r'\n\s*\n', '\n', body)
    menu_idx = body.rfind('Contact Us')
    if 0 <= menu_idx < 4000:
        body = body[menu_idx + 10:]
    clean_body = re.sub(r'\s+', ' ', body).strip()
    if len(clean_body) > 50:
        page_corpus.append({
            'url': data.get('url'),
            'title': data.get('title'),
            'slug': data.get('slug'),
            'snippet': clean_body[:1800]
        })

print(f"Loaded {len(page_corpus)} pages into searchable corpus.")

# 2. Read base script.js from assets
with open('rvils-chatbot/assets/script.js', 'r', encoding='utf-8') as f:
    code = f.read()

# 3. Add PAGE_CORPUS & searchWebsiteCorpus right before classifyIntent
corpus_json_str = json.dumps(page_corpus, indent=4)

corpus_code = f"""
    /* =============== DEEP IN-MEMORY 43-PAGE WEBSITE CORPUS =============== */
    const PAGE_CORPUS = {corpus_json_str};

    function searchWebsiteCorpus(query) {{
        if (!query) return null;
        const qTokens = tokenize(query).filter(w => !STOP_WORDS.has(w));
        if (qTokens.length === 0) return null;

        let bestMatch = null;
        let highestScore = 0;

        for (const page of PAGE_CORPUS) {{
            let score = 0;
            const textLower = (page.snippet || '').toLowerCase();
            const titleLower = (page.title || '').toLowerCase();

            for (const token of qTokens) {{
                if (titleLower.includes(token)) score += 5;
                if (textLower.includes(token)) score += 2;
            }}

            if (score > highestScore) {{
                highestScore = score;
                bestMatch = page;
            }}
        }}

        if (highestScore >= 3 && bestMatch) {{
            return {{
                page: bestMatch,
                score: highestScore
            }};
        }}
        return null;
    }}
"""

code = code.replace("    /* =============== INTENT MATCHER & CLASSIFIER =============== */", corpus_code + "\n    /* =============== INTENT MATCHER & CLASSIFIER =============== */")

# 4. Enhance classifyIntent with specific intents
code = code.replace(
    "if (contains('principal') || contains('head of') || contains('director') || contains('anjina reddy')) {",
    "if (contains('principal') || contains('head of') || contains('anjina reddy') || (contains('director') && !contains('sports') && !contains('physical') && !contains('pe') && !contains('kabaddi'))) {"
)

additional_intents_classify = """
        // Specific Faculty Lookups
        if (contains('hanumaprakash') || contains('commercial law')) return { intent: 'faculty_hanumaprakash', confidence: 0.95 };
        if (contains('thejesh') || (contains('management') && contains('prof'))) return { intent: 'faculty_thejesh', confidence: 0.95 };
        if (contains('chaitra')) return { intent: 'faculty_chaitra', confidence: 0.95 };
        if (contains('runjhun') || contains('international law')) return { intent: 'faculty_runjhun', confidence: 0.95 };
        if (contains('aswin') || contains('corporate law')) return { intent: 'faculty_aswin', confidence: 0.95 };
        if (contains('anncy') || contains('criminal law')) return { intent: 'faculty_anncy', confidence: 0.95 };
        if (contains('shruthi') || contains('economics')) return { intent: 'faculty_shruthi', confidence: 0.95 };
        if (contains('rahul simha') || (contains('constitutional law') && contains('prof'))) return { intent: 'faculty_rahul_simha', confidence: 0.95 };
        if (contains('sheena') || contains('family law')) return { intent: 'faculty_sheena', confidence: 0.95 };
        if (contains('kruthika') || contains('cyber law') || contains('ipr')) return { intent: 'faculty_kruthika', confidence: 0.95 };
        if (contains('paavana')) return { intent: 'faculty_paavana', confidence: 0.95 };
        if (contains('mohankumar') || contains('mohan kumar') || contains('sports director') || contains('kabaddi') || contains('physical education director')) return { intent: 'director_sports', confidence: 0.95 };
        if (contains('santosh kumar') || contains('naragund') || contains('librarian') || contains('sagar')) return { intent: 'library_staff', confidence: 0.95 };

        // Special Library Assets
        if (contains('manuscript') || contains('original constitution') || contains('constitution manuscript')) {
            return { intent: 'constitution_manuscript', confidence: 0.95 };
        }

        // Student Activities & Nyaya Darpana
        if (contains('nyaya darpana') || contains('lecture series')) {
            return { intent: 'nyaya_darpana', confidence: 0.95 };
        }

        // Statutory Committees
        if (contains('ragging') || contains('anti-ragging') || contains('anti ragging')) return { intent: 'anti_ragging', confidence: 0.95 };
        if (contains('icc') || contains('internal complaints') || contains('harassment')) return { intent: 'icc', confidence: 0.95 };
        if (contains('grievance') || contains('redressal')) return { intent: 'grievance_cell', confidence: 0.95 };
        if (contains('sc/st') || contains('sc st cell') || contains('equal opportunity')) return { intent: 'sc_st_cell', confidence: 0.95 };
"""

code = code.replace(
    "        // Faculty Directory\n        if (contains('faculty') || contains('professor') || contains('teacher') || contains('lecturer') || contains('staff') || contains('hanumaprakash') || contains('runjhun') || contains('thejesh')) {",
    additional_intents_classify + "\n        // Faculty Directory\n        if (contains('faculty') || contains('professor') || contains('teacher') || contains('lecturer') || contains('staff')) {"
)

# 5. Add response generators for new intents
new_responses = """
            case 'faculty_hanumaprakash':
                return {
                    text: `### 👨‍🏫 Dr. Hanumaprakash K.S.
* **Role:** Professor of Law
* **Qualification:** LL.M. (Commercial Law), Ph.D., KSET
* **Profile:** Faculty Member at MKPM RV Institute of Legal Studies (rvils.edu.in/faculty/).`,
                    chips: ["Faculty Directory", "Admissions 2026", "Programmes", "Contact Us"]
                };

            case 'faculty_thejesh':
                return {
                    text: `### 👨‍🏫 Mr. Thejesh K.M.
* **Role:** Assistant Professor of Management
* **Qualification:** M.Com., MBA, PGDFM
* **Profile:** Faculty Member at MKPM RV Institute of Legal Studies (rvils.edu.in/faculty/).`,
                    chips: ["5-Yr B.B.A. LL.B.", "Faculty Directory", "Contact Us"]
                };

            case 'faculty_chaitra':
                return {
                    text: `### 👩‍🏫 Ms. Chaitra M.D.
* **Role:** Assistant Professor of Management
* **Qualification:** B.Com., M.Com.
* **Profile:** Faculty Member at MKPM RV Institute of Legal Studies (rvils.edu.in/faculty/).`,
                    chips: ["5-Yr B.B.A. LL.B.", "Faculty Directory", "Contact Us"]
                };

            case 'faculty_runjhun':
                return {
                    text: `### 👩‍🏫 Ms. Runjhun Sharma
* **Role:** Assistant Professor of Law
* **Qualification:** B.A., LL.B., LL.M.
* **Profile:** Faculty Member at MKPM RV Institute of Legal Studies (rvils.edu.in/faculty/).`,
                    chips: ["Faculty Directory", "Moot Court Society", "Library"]
                };

            case 'faculty_aswin':
                return {
                    text: `### 👨‍🏫 Mr. Aswin K.
* **Role:** Assistant Professor of Law
* **Qualification:** B.B.A., LL.B., LL.M.
* **Profile:** Faculty Member at MKPM RV Institute of Legal Studies (rvils.edu.in/faculty/).`,
                    chips: ["5-Yr B.Com. LL.B.", "Faculty Directory", "Internships"]
                };

            case 'faculty_anncy':
                return {
                    text: `### 👩‍🏫 Ms. Anncy Flora
* **Role:** Assistant Professor of Law
* **Department:** Faculty of Law
* **Profile:** Faculty Member at MKPM RV Institute of Legal Studies (rvils.edu.in/faculty/).`,
                    chips: ["Faculty Directory", "Legal Aid Clinic", "Library"]
                };

            case 'faculty_shruthi':
                return {
                    text: `### 👩‍🏫 Ms. Shruthi M.S.
* **Role:** Assistant Professor of Economics
* **Qualification:** M.A. in Economics
* **Profile:** Faculty Member at MKPM RV Institute of Legal Studies (rvils.edu.in/faculty/).`,
                    chips: ["5-Yr B.A. LL.B.", "Faculty Directory", "Library"]
                };

            case 'faculty_rahul_simha':
                return {
                    text: `### 👨‍🏫 Mr. Rahul Simha N.
* **Role:** Assistant Professor of Law
* **Qualification:** B.A., LL.B., LL.M.
* **Profile:** Faculty Member at MKPM RV Institute of Legal Studies (rvils.edu.in/faculty/).`,
                    chips: ["Constitution Manuscript", "Faculty Directory", "Library"]
                };

            case 'faculty_sheena':
                return {
                    text: `### 👩‍🏫 Mrs. Sheena Razdan
* **Role:** Assistant Professor of Law
* **Qualification:** B.S.L. LL.B., LL.M.
* **Profile:** Faculty Member at MKPM RV Institute of Legal Studies (rvils.edu.in/faculty/).`,
                    chips: ["Legal Aid Clinic", "Faculty Directory", "Programmes"]
                };

            case 'faculty_kruthika':
                return {
                    text: `### 👩‍🏫 Ms. Kruthika B.
* **Role:** Assistant Professor of Law
* **Qualification:** B.A., LL.B., LL.M.
* **Profile:** Faculty Member at MKPM RV Institute of Legal Studies (rvils.edu.in/faculty/).`,
                    chips: ["Faculty Directory", "Research Policy", "Library"]
                };

            case 'faculty_paavana':
                return {
                    text: `### 👩‍🏫 Ms. Paavana E.
* **Role:** Assistant Professor of Law
* **Qualification:** LL.M. (Business Law), B.A. LL.B.
* **Profile:** Faculty Member at MKPM RV Institute of Legal Studies (rvils.edu.in/faculty/).`,
                    chips: ["Faculty Directory", "Moot Court Hall", "Contact Us"]
                };

            case 'director_sports':
                return {
                    text: `### 🏆 Mr. Mohan Kumar N.N.
* **Role:** Director of Physical Education, RVILS
* **Official Recognition (from rvils.edu.in):** Officiated as Referee / Technical Official in the **Commonwealth Kabaddi Championship (Melbourne, Australia, 2026)**.
* **Campus Facilities:** Oversees indoor and outdoor sports, athletics, table tennis, badminton, chess, and yoga training for law students.`,
                    chips: ["Campus Life", "Student Activities", "Contact Us"]
                };

            case 'library_staff':
                return {
                    text: `### 📚 RVILS Library Executives (Official Website Details)
* **Senior Library Executive:** Mr. Santosh Kumar N. (Santosh Kumar Naragund)
* **Junior Library Executive:** Mr. Sagar S.
* **Attender:** Ms. Anitha M.K.
* **Location:** RVILS Knowledge Centre, 3rd Floor`,
                    chips: ["Library Overview", "Constitution Manuscript", "Digital Databases"]
                };

            case 'constitution_manuscript':
                return {
                    text: `### 📜 Original Manuscript of the Constitution of India
The **RVILS Knowledge Centre** proudly houses a certified copy of the **original Manuscript of the Constitution of India** (calligraphed by Prem Behari Narain Raizada with artwork by Nandalal Bose).
* Available for study, jurisprudence research, and ceremonial events in the college library.`,
                    chips: ["Library Overview", "Principal", "Contact Us"]
                };

            case 'nyaya_darpana':
                return {
                    text: `### ⚖️ Nyaya Darpana Lecture Series
**Nyaya Darpana** is RVILS's signature legal discourse series featuring sitting & retired High Court and Supreme Court Justices, Senior Advocates, and legal scholars delivering cutting-edge jurisprudence lectures for students.`,
                    chips: ["Student Activities", "Moot Court Academy", "Legal Aid Clinic"]
                };

            case 'anti_ragging':
                return {
                    text: `### 🛡️ Anti-Ragging Committee (RVILS)
RVILS strictly adheres to UGC, BCI, and KSLU Zero-Tolerance anti-ragging regulations.
* 24/7 Anti-Ragging squad active on campus.
* Immediate disciplinary action under Karnataka Prohibition of Ragging Act.`,
                    chips: ["Campus Life", "Principal", "Contact Us"]
                };

            case 'icc':
                return {
                    text: `### ⚖️ Internal Complaints Committee (ICC)
Established pursuant to the PoSH Act (2013) to ensure gender equity, safety, and grievance redressal for female students, faculty, and administrative staff at RVILS.`,
                    chips: ["Campus Life", "Principal", "Contact Us"]
                };

            case 'grievance_cell':
            case 'sc_st_cell':
                return {
                    text: `### 🏛️ Statutory Cells & Redressal
RVILS maintains an active **Student Grievance Redressal Cell** and **SC/ST Cell** to uphold equal opportunity, social justice, and merit-based institutional harmony.`,
                    chips: ["Campus Life", "Board of Management", "Principal"]
                };
"""

# Replace the default fallback block with deep corpus search
old_default = """            default:
                return {
                    text: tone === 'funny'
                        ? "Hmm, that specific motion isn't recorded on the official RVILS website! 🧐 Could you rephrase your question, or select from one of our verified topics below?"
                        : "I am designed to provide information verified strictly from the official RVILS website (`rvils.edu.in`). I could not find a matching record for that inquiry. You can select one of our verified academic topics below.",
                    chips: ["Admissions 2026", "5-Yr B.A. LL.B.", "3-Yr LL.B.", "RVILS-LAT", "Faculty", "Contact Us"]
                };"""

new_default = f"""{new_responses}
            default: {{
                const searchResult = searchWebsiteCorpus(originalQuery);
                if (searchResult && searchResult.page) {{
                    const p = searchResult.page;
                    return {{
                        text: `### 📄 Verified Official Website Record: ${{p.title}}
*Extracted directly from the official portal (\`rvils.edu.in\`):*

> "${{p.snippet.substring(0, 420)}}..."

🔗 **Official Source Page:** [${{p.title}}](${{p.url}})`,
                        chips: ["Admissions 2026", "Programmes", "Faculty", "Library", "Contact Us"]
                    }};
                }}
                return {{
                    text: tone === 'funny'
                        ? "Hmm, that specific motion isn't recorded on the official RVILS website! 🧐 Could you rephrase your question, or select from one of our verified topics below?"
                        : "I am designed to provide information verified strictly from the official RVILS website (`rvils.edu.in`). I could not find a matching record for that inquiry. You can select one of our verified academic topics below.",
                    chips: ["Admissions 2026", "5-Yr B.A. LL.B.", "3-Yr LL.B.", "RVILS-LAT", "Faculty", "Contact Us"]
                }};
            }}"""

code = code.replace(old_default, new_default)

# 6. Update export object
old_export = """    window.RVILSChatbot = {
        open: () => {
            const win = document.getElementById('rvilsChatWindow');
            if (win && win.style.display === 'none') {
                const fab = document.getElementById('rvilsChatFab');
                if (fab) fab.click();
            }
        },
        close: () => {
            const closeBtn = document.getElementById('rvilsChatClose');
            if (closeBtn) closeBtn.click();
        },
        ask: (q) => handleUserSubmit(q),
        openLeadModal: openLeadModal,
        classifyIntent: classifyIntent,
        checkModeration: checkModeration,
        knowledgeBase: RVILS_DATA
    };"""

new_export = """    window.RVILSChatbot = {
        open: () => {
            const win = document.getElementById('rvilsChatWindow');
            if (win && win.style.display === 'none') {
                const fab = document.getElementById('rvilsChatFab');
                if (fab) fab.click();
            }
        },
        close: () => {
            const closeBtn = document.getElementById('rvilsChatClose');
            if (closeBtn) closeBtn.click();
        },
        ask: (q) => handleUserSubmit(q),
        openLeadModal: openLeadModal,
        classifyIntent: classifyIntent,
        matchIntent: classifyIntent,
        checkModeration: checkModeration,
        knowledgeBase: RVILS_DATA,
        pageCorpus: PAGE_CORPUS,
        searchCorpus: searchWebsiteCorpus
    };"""

code = code.replace(old_export, new_export)

# Save to script.js and rvils-chatbot/assets/script.js
with open('script.js', 'w', encoding='utf-8') as f:
    f.write(code)

with open('rvils-chatbot/assets/script.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("Generated script.js and rvils-chatbot/assets/script.js successfully!")
print("Script size:", len(code), "bytes")
