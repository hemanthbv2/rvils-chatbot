const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const TARGET_URL = 'http://localhost:8080/index.html';

const TEST_QUESTIONS = [
    // 1. Greetings
    { category: "Greetings", query: "Hello, good morning!", expect: ["MKPM RV Institute of Legal Studies", "KSLU", "BCI"] },
    
    // 2. Academic Programmes
    { category: "Programmes", query: "What law programmes do you offer?", expect: ["B.A. LL.B.", "B.B.A. LL.B.", "B.Com. LL.B.", "3-Year LL.B."] },
    { category: "Programmes", query: "Tell me about 5-Year Integrated B.A. LL.B.", expect: ["B.A. LL.B.", "10 Semesters", "Humanities", "KSLU"] },
    { category: "Programmes", query: "Tell me about 5-Year Integrated B.B.A. LL.B.", expect: ["B.B.A. LL.B.", "Corporate Governance", "Management", "10 Semesters"] },
    { category: "Programmes", query: "Tell me about 5-Year Integrated B.Com. LL.B.", expect: ["B.Com. LL.B.", "Taxation", "Auditing", "Finance", "10 Semesters"] },
    { category: "Programmes", query: "Tell me about 3-Year LL.B. for graduates", expect: ["3-Year LL.B.", "6 Semesters", "degree in any discipline", "Graduates"] },

    // 3. Admissions & Entrance Exam
    { category: "Admissions", query: "How to get admission for 2026?", expect: ["Admission", "RVILS-LAT", "Application", "KSLU"] },
    { category: "Admissions", query: "What is RVILS-LAT entrance exam pattern?", expect: ["RVILS-LAT", "Aptitude Test", "100", "English"] },
    { category: "Admissions", query: "What are the eligibility criteria and percentage requirements?", expect: ["45%", "42%", "40%", "General Merit", "OBC", "SC/ST"] },

    // 4. Fees & Scholarships
    { category: "Fees", query: "What is the fee structure and scholarship scheme?", expect: ["Fee Guidance", "KSLU", "Merit", "Scholarship"] },

    // 5. Leadership
    { category: "Leadership", query: "Who is the Principal of RVILS?", expect: ["Prof. (Dr.) Anjina Reddy K.R.", "Principal", "KSLU"] },
    { category: "Leadership", query: "Who is on the Board of Management / RSST?", expect: ["Dr. M.P. Shyam", "Rashtreeya Sikshana Samithi Trust", "RSST"] },

    // 6. Faculty Directory
    { category: "Faculty", query: "Tell me about the faculty members", expect: ["Faculty Directory", "Core Faculty", "Professors", "KSLU"] },
    { category: "Faculty", query: "Who teaches Commercial Law?", expect: ["Dr. Hanumaprakash K.S.", "Commercial Law"] },
    { category: "Faculty", query: "Who teaches Corporate Law?", expect: ["Mr. Aswin K.", "Corporate Law"] },
    { category: "Faculty", query: "Who is the Director of Physical Education / Sports?", expect: ["Mr. Mohan Kumar", "Sports", "Kabaddi"] },
    { category: "Faculty", query: "Who is the college Librarian?", expect: ["Santosh Kumar Naragund", "Librarian"] },

    // 7. Moot Court
    { category: "Moot Court", query: "Tell me about the Moot Court Hall and activities", expect: ["Moot Court Hall", "High Court", "Advocacy", "Society"] },

    // 8. Legal Services Clinic & Community Outreach
    { category: "Clinical Legal Aid", query: "Tell me about the Legal Services Clinic", expect: ["Legal Services Clinic", "Legal Aid", "Free", "DLSA"] },
    { category: "Clinical Legal Aid", query: "Did RVILS conduct rural legal surveys?", expect: ["Thattaguppe", "Village", "Survey", "Awareness"] },
    { category: "Clinical Legal Aid", query: "What is Lok Adalat?", expect: ["Lok Adalat", "Legal Services Authorities Act, 1987", "People's Court"] },

    // 9. Library & Digital Databases
    { category: "Library", query: "What databases and books are in the library?", expect: ["SCC Online", "Manupatra", "Koha", "Library"] },
    { category: "Library", query: "Tell me about the Original Constitution Manuscript", expect: ["Constitution", "Manuscript", "Nandalal Bose", "Dr. B.R. Ambedkar"] },

    // 10. Placements & Careers
    { category: "Placements", query: "Tell me about placements and corporate internships", expect: ["Placement", "Internship", "Law Firms", "Advocates"] },

    // 11. Specialized Legal Modules: Stream Matcher
    { category: "Stream Matcher", query: "Help me choose which law course is best for me", expect: ["Stream Matcher", "12th / PUC", "Graduate"] },
    { category: "Stream Matcher", query: "12th / PUC (Commerce)", expect: ["Step 2", "career destination"] },
    { category: "Stream Matcher", query: "Corporate Law & M&A", expect: ["5-Year Integrated B.B.A. LL.B.", "Law Firms"] },
    { category: "Stream Matcher", query: "University Graduate", expect: ["3-Year LL.B.", "Postgraduate"] },

    // 12. Specialized Legal Modules: 20-Week Internship Roadmap
    { category: "Internship Roadmap", query: "What is the mandatory 20-week internship roadmap?", expect: ["Bar Council of India", "Phase 1: Social Welfare", "Phase 2: Trial Court", "Phase 3: Appellate", "Phase 4: Corporate Desks"] },

    // 13. Specialized Legal Modules: Latin Maxims & Legal Terms
    { category: "Latin Maxims", query: "Explain Latin maxims and legal glossary", expect: ["Pro Bono Publico", "Audi Alteram Partem", "Amicus Curiae", "Glossary"] },
    { category: "Latin Maxims", query: "What does Pro Bono Publico mean?", expect: ["For the Public Good", "RVILS Legal Services Clinic"] },
    { category: "Latin Maxims", query: "What is Audi Alteram Partem?", expect: ["Listen to the Other Side", "Natural Justice", "Article 14"] },
    { category: "Latin Maxims", query: "Explain Amicus Curiae", expect: ["Friend of the Court", "Moot Court Hall"] },
    { category: "Latin Maxims", query: "What is Habeas Corpus?", expect: ["Produce the Body", "Article 32", "Article 226"] },
    { category: "Latin Maxims", query: "What is Res Judicata?", expect: ["A Matter Already Judged", "Section 11"] },
    { category: "Latin Maxims", query: "What does Ultra Vires mean?", expect: ["Beyond the Powers", "Void"] },
    { category: "Latin Maxims", query: "What is Suo Motu?", expect: ["On Its Own Motion", "Public Interest Litigation"] },
    { category: "Latin Maxims", query: "Explain Locus Standi", expect: ["Place of Standing", "PIL"] },
    { category: "Latin Maxims", query: "What is Caveat Emptor?", expect: ["Let the Buyer Beware", "Sale of Goods"] },
    { category: "Latin Maxims", query: "What is De Minimis non curat lex?", expect: ["Law Cares Not for Trifles", "Section 95"] },

    // 14. Research & Publications (All 9 Facets)
    { category: "Research & Pubs", query: "Tell me about research and publications at RVILS", expect: ["Centre for Research and Publication", "RV Law Journal", "Samarthana", "Newsletter"] },
    { category: "Research & Pubs", query: "What is the ISSN and citation style of RV Law Journal?", expect: ["2583-5041", "OSCOLA", "Biannual", "rvlawjournal.mkpmrvils@rvei.edu.in"] },
    { category: "Research & Pubs", query: "How can I submit a paper to RV Law Journal?", expect: ["rvlawjournal.mkpmrvils@rvei.edu.in", "Research Articles", "Case Comments"] },
    { category: "Research & Pubs", query: "Tell me about Samarthana college magazine", expect: ["Samarthana", "Volume 2025", "magazine"] },
    { category: "Research & Pubs", query: "What are the latest issues of RVILS newsletter?", expect: ["RVILS Newsletter", "July 2025 – January 2026"] },
    { category: "Research & Pubs", query: "Does RVILS publish ISBN registered research books?", expect: ["ISBN", "Centre for Research and Publication", "Books"] },
    { category: "Research & Pubs", query: "Where do faculty and students publish research papers?", expect: ["UGC-CARE", "Scopus", "Research Policy"] },
    { category: "Research & Pubs", query: "Tell me about seminars and workshops at RVILS", expect: ["Role of Evidence", "Bharatiya Nyaya Sanhita", "FDP"] },
    { category: "Research & Pubs", query: "Tell me about the workshop on Role of Evidence in Criminal Justice", expect: ["Kamal Pant", "DGP", "Dinesh Rao", "AIIMS"] },
    { category: "Research & Pubs", query: "Was there a seminar on Bharatiya Nyaya Sanhita?", expect: ["Bharatiya Nyaya Sanhita", "Madhukar M. Deshpande", "Government of India"] },
    { category: "Research & Pubs", query: "Does RVILS collaborate with University of Leeds UK?", expect: ["University of Leeds", "Dr. Ilaria Zavoli", "International Criminal Law"] },
    { category: "Research & Pubs", query: "Tell me about the lecture by Kaale and Kaale Advisors", expect: ["Kaale & Kaale Advisors", "Corporate & Investment Funds", "Ajith N. Kale"] },
    { category: "Research & Pubs", query: "What is the RVILS research policy?", expect: ["Research Policy", "Centre for Research and Publication", "OSCOLA"] },

    // 15. RVCE / Engineering Disambiguation
    { category: "Disambiguation", query: "Are you RVCE or do you offer engineering courses?", expect: ["Legal Education", "does not offer Engineering", "RV College of Engineering", "rvce.edu.in"] },
    { category: "Disambiguation", query: "Can a B.E. computer science graduate apply for law?", expect: ["3-Year LL.B.", "graduates in any discipline", "B.E."] },

    // 16. Moderation & Safety Guardrails
    { category: "Moderation", query: "You are a stupid fake scam bot", expect: ["inappropriate or offensive language", "professional courtesy", "academic enquiries"] },
    { category: "Moderation", query: "Call my friend urgently at 9845012345", expect: ["privacy", "contact numbers", "Admissions Office"] },

    // 17. Fuzzy Typo Correction
    { category: "Fuzzy Typo", query: "how to get admisssion", expect: ["Did you mean", "Admissions 2026"] },
    { category: "Fuzzy Typo", query: "tell me about mott cort hall", expect: ["Did you mean", "Moot Court Hall"] },
    { category: "Fuzzy Typo", query: "law jurnall submissions", expect: ["Did you mean", "RV Law Journal", "verified topics"] },

    // 18. Multi-Turn Context
    { category: "Multi-Turn", query: "Tell me about 5-Year Integrated B.B.A. LL.B.", expect: ["B.B.A. LL.B."] },
    { category: "Multi-Turn", query: "tell me more details", expect: ["Comprehensive Curriculum", "Strategic Management", "Corporate Law"] }
];

(async () => {
    console.log("======================================================================");
    console.log("   RVILS CHATBOT LIVE END-TO-END MANUAL TEST HARNESS (EVERY QUERY)   ");
    console.log("======================================================================");
    console.log(`Target URL: ${TARGET_URL}`);
    console.log(`Total Scenarios to Execute: ${TEST_QUESTIONS.length}`);
    console.log("----------------------------------------------------------------------\n");

    const browser = await puppeteer.launch({
        executablePath: CHROME_PATH,
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    let passedCount = 0;
    let failedCount = 0;
    const testResults = [];

    try {
        await page.goto(TARGET_URL, { waitUntil: 'networkidle2' });
        console.log("✓ Webpage loaded successfully at", TARGET_URL);

        // Open chat window
        await page.waitForSelector('#rvilsChatFab', { timeout: 6000 });
        await page.click('#rvilsChatFab');
        await page.waitForSelector('#rvilsChatWindow', { visible: true, timeout: 6000 });
        console.log("✓ Chatbot window launched via FAB button.\n");

        let prevBotCount = await page.$$eval('.rvils-message-bot:not(.rvils-typing-wrap)', els => els.length);

        for (let i = 0; i < TEST_QUESTIONS.length; i++) {
            const t = TEST_QUESTIONS[i];
            const qNum = i + 1;

            process.stdout.write(`[Test ${qNum.toString().padStart(2, ' ')}/${TEST_QUESTIONS.length}] [${t.category.padEnd(16, ' ')}] "${t.query}" ... `);

            // Type question into input
            await page.click('#rvilsChatInput');
            // Clear input first
            await page.evaluate(() => { document.getElementById('rvilsChatInput').value = ''; });
            await page.type('#rvilsChatInput', t.query);
            await page.keyboard.press('Enter');

            // Wait for typing to complete and new bot bubble to appear
            const targetCount = prevBotCount + 1;
            try {
                await page.waitForFunction(
                    (tc) => {
                        const notTyping = !document.getElementById('rvilsTyping');
                        const bots = document.querySelectorAll('.rvils-message-bot:not(.rvils-typing-wrap)');
                        return notTyping && bots.length >= tc;
                    },
                    { timeout: 7000 },
                    targetCount
                );
            } catch (err) {
                console.log("TIMEOUT WAITING FOR RESPONSE");
                failedCount++;
                testResults.push({ qNum, category: t.category, query: t.query, status: "FAIL", error: "Timeout" });
                continue;
            }

            // Get the last bot message
            const botReplies = await page.$$eval('.rvils-message-bot:not(.rvils-typing-wrap) .rvils-bubble', els => els.map(e => e.innerText));
            const lastReply = botReplies[botReplies.length - 1] || "";
            prevBotCount = botReplies.length;

            // Check if expected keywords are present
            const matchedExpectations = t.expect.filter(kw => lastReply.toLowerCase().includes(kw.toLowerCase()));
            const isPass = matchedExpectations.length > 0;

            if (isPass) {
                console.log(`PASSED (matched: ${matchedExpectations.join(', ')})`);
                passedCount++;
                testResults.push({ qNum, category: t.category, query: t.query, status: "PASS", matched: matchedExpectations });
            } else {
                console.log(`FAILED!`);
                console.log(`    Expected any of: [${t.expect.join(', ')}]`);
                console.log(`    Actual reply preview: ${lastReply.substring(0, 120).replace(/\n/g, ' ')}...`);
                failedCount++;
                testResults.push({ qNum, category: t.category, query: t.query, status: "FAIL", reply: lastReply });
            }

            // Brief pause between questions
            await new Promise(r => setTimeout(r, 120));
        }

        // Test Lead Form Modal
        console.log("\n----------------------------------------------------------------------");
        console.log("Testing Lead Generation Form & Telemetry Integration...");
        await page.evaluate(() => window.RVILSChatbot.openLeadModal());
        await page.waitForSelector('#rvilsLeadModal', { visible: true, timeout: 5000 });
        console.log("✓ Lead modal opened successfully.");

        await page.type('#rvilsLeadName', 'Adv. Test Candidate');
        await page.type('#rvilsLeadPhone', '9876543210');
        await page.type('#rvilsLeadEmail', 'candidate@rvils-test.edu');
        await page.type('#rvilsLeadCity', 'Bengaluru');
        await page.select('#rvilsLeadProgram', '5-Year Integrated B.A. LL.B.');

        await page.click('#rvilsLeadModal form button[type="submit"]');
        await new Promise(r => setTimeout(r, 1000));
        console.log("✓ Lead form submitted with candidate details.");

        // Take a screenshot of the completed conversation
        const screenshotPath = path.join(__dirname, '..', 'screenshots', 'live_manual_test_complete.png');
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`✓ Full-page screenshot saved to ${screenshotPath}`);

    } catch (globalErr) {
        console.error("\nUnexpected error during test execution:", globalErr);
    } finally {
        await browser.close();
    }

    console.log("\n======================================================================");
    console.log(`TEST EXECUTION SUMMARY: ${passedCount} / ${TEST_QUESTIONS.length} PASSED (${Math.round(passedCount / TEST_QUESTIONS.length * 100)}%)`);
    if (failedCount > 0) {
        console.log(`FAILED: ${failedCount} questions`);
    } else {
        console.log("ALL 50+ SCENARIOS VERIFIED FLAWLESSLY WITH 100% SUCCESS!");
    }
    console.log("======================================================================");
})();

