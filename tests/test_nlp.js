/**
 * Automated NLP Intent & Moderation Test Suite for RVILS Chatbot
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Extract script.js contents
const scriptCode = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf-8');

// Mock window and document environment to execute script.js logic in Node
const mockWindow = {
    location: { search: '', href: 'https://rvils.edu.in/', hostname: 'rvils.edu.in' }
};
const mockDoc = {
    getElementById: () => null,
    createElement: () => ({ style: {}, querySelector: () => null, appendChild: () => {} }),
    body: { appendChild: () => {}, classList: { contains: () => false } },
    addEventListener: () => {},
    readyState: 'complete'
};

global.window = mockWindow;
global.document = mockDoc;

// Evaluate script.js
eval(scriptCode);

const { 
    classifyIntent, 
    checkModeration, 
    knowledgeBase, 
    pageCorpus, 
    searchCorpus, 
    matchIntent,
    findSuggestions,
    levenshtein,
    getDeepInfo,
    getFollowUps,
    safeStorage,
    generateResponse: generateBotResponse
} = mockWindow.RVILSChatbot;

console.log("==================================================");
console.log("   RVILS CHATBOT NLP & KNOWLEDGE BASE TEST SUITE  ");
console.log("==================================================");

let testsPassed = 0;
let testsTotal = 0;

function runTest(desc, fn) {
    testsTotal++;
    try {
        fn();
        console.log(`  [PASS] ${desc}`);
        testsPassed++;
    } catch (err) {
        console.error(`  [FAIL] ${desc}: ${err.message}`);
    }
}

// 1. Moderation Tests
runTest("Content Moderation: Blocks abusive profanity", () => {
    const res = checkModeration("What the fuck is this college");
    assert.strictEqual(res.blocked, true);
    assert.strictEqual(res.type, 'abusive');
});

runTest("Content Moderation: Blocks conspiracy theories", () => {
    const res = checkModeration("Is the government mind control active at RVILS?");
    assert.strictEqual(res.blocked, true);
    assert.strictEqual(res.type, 'conspiracy');
});

runTest("Content Moderation: Blocks confidential student phone numbers", () => {
    const res = checkModeration("Give me student phone number and faculty salary");
    assert.strictEqual(res.blocked, true);
    assert.strictEqual(res.type, 'private');
});

runTest("Content Moderation: Passes legitimate academic inquiries", () => {
    const res = checkModeration("What is the admission procedure for B.A. LL.B.?");
    assert.strictEqual(res.blocked, false);
});

// 2. Intent Classification Tests
runTest("Intent: 5-Year Integrated B.A. LL.B.", () => {
    const res = classifyIntent("Tell me about BA LLB syllabus and eligibility");
    assert.strictEqual(res.intent, 'program_ba_llb');
});

runTest("Intent: 5-Year Integrated B.B.A. LL.B.", () => {
    const res = classifyIntent("What is the curriculum for BBA LLB business law?");
    assert.strictEqual(res.intent, 'program_bba_llb');
});

runTest("Intent: 5-Year Integrated B.Com. LL.B.", () => {
    const res = classifyIntent("I want to know about BCom LLB taxation and commerce");
    assert.strictEqual(res.intent, 'program_bcom_llb');
});

runTest("Intent: 3-Year LL.B. for Graduates", () => {
    const res = classifyIntent("Can I do 3 year llb after graduation?");
    assert.strictEqual(res.intent, 'program_3yr_llb');
});

runTest("Intent: All Academic Programmes", () => {
    const res = classifyIntent("What courses and law degrees are offered at RVILS?");
    assert.strictEqual(res.intent, 'all_programs');
});

runTest("Intent: Entrance Exam (RVILS-LAT)", () => {
    const res = classifyIntent("What is the exam pattern for RVILS-LAT entrance test?");
    assert.strictEqual(res.intent, 'rvils_lat');
});

runTest("Intent: Admissions Process", () => {
    const res = classifyIntent("How do I apply for admissions 2026?");
    assert.strictEqual(res.intent, 'admissions');
});

runTest("Intent: Fees and Scholarships", () => {
    const res = classifyIntent("What is the fee structure and are there scholarships available?");
    assert.strictEqual(res.intent, 'fees_scholarships');
});

runTest("Intent: Principal & Leadership", () => {
    const res = classifyIntent("Who is the principal of RVILS?");
    assert.strictEqual(res.intent, 'principal');
});

runTest("Intent: Faculty Directory", () => {
    const res = classifyIntent("Who are the law professors and faculty members?");
    assert.strictEqual(res.intent, 'faculty');
});

runTest("Intent: Moot Court Hall & Society", () => {
    const res = classifyIntent("Tell me about moot court competitions and trial advocacy");
    assert.strictEqual(res.intent, 'moot_court');
});

runTest("Intent: Legal Aid Clinic & Community Service", () => {
    const res = classifyIntent("Does RVILS have a legal aid clinic and Lok Adalat outreach?");
    assert.strictEqual(res.intent, 'legal_aid');
});

runTest("Intent: Hybrid Library & Digital Databases", () => {
    const res = classifyIntent("Does the library have access to SCC Online and Manupatra?");
    assert.strictEqual(res.intent, 'library');
});

runTest("Intent: Placements and Internships", () => {
    const res = classifyIntent("Where do students intern and how are campus placements?");
    assert.strictEqual(res.intent, 'placements');
});

runTest("Intent: Hostels and Campus Life", () => {
    const res = classifyIntent("Is hostel accommodation available for students?");
    assert.strictEqual(res.intent, 'hostel');
});

runTest("Intent: Affiliation (KSLU, BCI, RSST)", () => {
    const res = classifyIntent("Is RVILS affiliated to KSLU and approved by Bar Council of India?");
    assert.strictEqual(res.intent, 'accreditation_trust');
});

runTest("Intent: Contact & Campus Address", () => {
    const res = classifyIntent("What is the contact number and address of RVILS in Jayanagar?");
    assert.strictEqual(res.intent, 'contact');
});

// 3. Knowledge Base Completeness Tests (Pure Website Data)
runTest("Knowledge Base: Principal Prof. (Dr.) Anjina Reddy K.R.", () => {
    const p = knowledgeBase.facultyDirectory.principal;
    assert.ok(p);
    assert.ok(p.name.includes("Anjina Reddy"));
});

runTest("Knowledge Base: Board of Management includes Dr. M.P. Shyam", () => {
    assert.ok(knowledgeBase.boardOfManagement.chairman.includes("Dr. M.P. Shyam"));
});

runTest("Knowledge Base: All 4 Programs Present with 10/6 Semesters", () => {
    assert.strictEqual(knowledgeBase.programmes.length, 4);
    const ba = knowledgeBase.programmes.find(p => p.id === 'ba_llb');
    const bba = knowledgeBase.programmes.find(p => p.id === 'bba_llb');
    const bcom = knowledgeBase.programmes.find(p => p.id === 'bcom_llb');
    const llb3 = knowledgeBase.programmes.find(p => p.id === 'llb_3yr');
    assert.ok(ba && bba && bcom && llb3);
});

runTest("Knowledge Base: Databases Include SCC Online & Manupatra", () => {
    assert.ok(knowledgeBase.library.digitalDatabases.some(d => d.includes("SCC Online")));
    assert.ok(knowledgeBase.library.digitalDatabases.some(d => d.includes("Manupatra")));
});

// 4. Expanded Specific Faculty & Committee Intent Tests
runTest("Intent: Specific Faculty (Dr. Hanumaprakash K.S. - Commercial Law)", () => {
    const res = classifyIntent("tell me about Dr Hanumaprakash commercial law");
    assert.strictEqual(res.intent, 'faculty_hanumaprakash');
});

runTest("Intent: Specific Faculty (Mr. Mohan Kumar - Sports Director & Kabaddi)", () => {
    const res = classifyIntent("who is the sports director and kabaddi referee?");
    assert.strictEqual(res.intent, 'director_sports');
});

runTest("Intent: Library Executives (Mr. Santosh Kumar Naragund)", () => {
    const res = classifyIntent("who is the senior librarian santosh kumar naragund?");
    assert.strictEqual(res.intent, 'library_staff');
});

runTest("Intent: Original Constitution Manuscript", () => {
    const res = classifyIntent("does RVILS library have a copy of the original constitution manuscript?");
    assert.strictEqual(res.intent, 'constitution_manuscript');
});

runTest("Intent: Nyaya Darpana Lecture Series", () => {
    const res = classifyIntent("what is the nyaya darpana lecture series?");
    assert.strictEqual(res.intent, 'nyaya_darpana');
});

runTest("Intent: Anti-Ragging Committee", () => {
    const res = classifyIntent("what is the anti-ragging squad and policy?");
    assert.strictEqual(res.intent, 'anti_ragging');
});

runTest("Intent: Internal Complaints Committee (ICC)", () => {
    const res = classifyIntent("tell me about women safety and internal complaints committee icc");
    assert.strictEqual(res.intent, 'icc');
});

// 5. Deep In-Memory Search over Scraped Website Corpus (43 Pages)
runTest("Corpus: Loaded All 43 Searchable Pages from Verified Crawl", () => {
    assert.ok(Array.isArray(pageCorpus));
    assert.strictEqual(pageCorpus.length, 43);
});

runTest("Corpus: Excludes non-page assets (dashicons.min.css removed)", () => {
    const dashiconsFound = pageCorpus.some(p => (p.url || '').includes('dashicons'));
    assert.strictEqual(dashiconsFound, false);
    const searchResult = searchCorpus("dashicons font");
    assert.strictEqual(searchResult, null);
});

runTest("Intent: RVCE / Engineering Clarification (Are you RVCE?)", () => {
    const res = classifyIntent("Are you RVCE?");
    assert.strictEqual(res.intent, 'rvce_engineering_clarification');
});

runTest("Intent: RVCE / Engineering Clarification (Engineering Courses)", () => {
    const res = classifyIntent("Do you offer engineering courses or B.Tech?");
    assert.strictEqual(res.intent, 'rvce_engineering_clarification');
});

runTest("Intent: RVCE / Engineering Clarification (RVCE Admission / Fees)", () => {
    const res = classifyIntent("rvce admission and fee structure");
    assert.strictEqual(res.intent, 'rvce_engineering_clarification');
});

runTest("Intent: RVCE / Engineering Clarification (Computer Science Engg)", () => {
    const res = classifyIntent("what is the cutoff for computer science engineering?");
    assert.strictEqual(res.intent, 'rvce_engineering_clarification');
});

runTest("Intent: 3-Year LL.B. for Engineering Graduates", () => {
    const res = classifyIntent("Can I do 3 year llb after graduation in engineering?");
    assert.strictEqual(res.intent, 'program_3yr_llb');
    const res2 = classifyIntent("Can I do 3 year llb after btech?");
    assert.strictEqual(res2.intent, 'program_3yr_llb');
});

runTest("Search Corpus: Resolves Specific Scraped Keyword (Commonwealth Kabaddi)", () => {
    const result = searchCorpus("Commonwealth Kabaddi Championship Australia");
    assert.ok(result);
    assert.ok(result.page.title.toLowerCase().includes("sports") || result.page.snippet.toLowerCase().includes("kabaddi"));
});

runTest("Search Corpus: Resolves Specific Scraped Keyword (Thattaguppe Village Survey)", () => {
    const result = searchCorpus("Thattaguppe Village legal survey");
    assert.ok(result);
    assert.ok(result.page.title.toLowerCase().includes("clinic") || result.page.snippet.toLowerCase().includes("thattaguppe"));
});

// 6. NLP Feature Tests (Fuzzy, Multi-Turn, State Persistence)
runTest("Fuzzy Matching: Levenshtein distance computation", () => {
    assert.strictEqual(levenshtein("admission", "admisssion"), 1);
    assert.strictEqual(levenshtein("law", "law"), 0);
});

runTest("Fuzzy Suggestions: Recommends Admissions on 'admisssion' typo", () => {
    const suggestions = findSuggestions("how to get admisssion in college");
    assert.ok(suggestions.length > 0);
    assert.ok(suggestions.some(s => s.id === 'admissions'));
});

runTest("Fuzzy Suggestions: Recommends BBA LLB on 'bballb' typo", () => {
    const suggestions = findSuggestions("bballb course info");
    assert.ok(suggestions.length > 0);
    assert.ok(suggestions.some(s => s.id === 'program_bba_llb'));
});

runTest("Fuzzy Suggestions: Recommends Moot Court on 'mott cort' typo", () => {
    const suggestions = findSuggestions("mott cort hall");
    assert.ok(suggestions.length > 0);
    assert.ok(suggestions.some(s => s.id === 'moot_court'));
});

runTest("Multi-Turn Context: Detects 'tell me more' continuation when context exists", () => {
    mockWindow.RVILSChatbot.session.lastIntent = 'program_ba_llb';
    const res = classifyIntent("tell me more details");
    assert.strictEqual(res.intent, 'multi_turn_continuation');
});

runTest("Multi-Turn Deep Info: Returns curriculum breakdown for B.A. LL.B.", () => {
    const deep = getDeepInfo('program_ba_llb');
    assert.ok(deep);
    assert.ok(deep.text.includes("Comprehensive Curriculum"));
    assert.ok(deep.chips.includes("RVILS-LAT"));
});

runTest("Dynamic Follow-Ups: Returns tailored next-steps for law programs", () => {
    const chips = getFollowUps('program_ba_llb');
    assert.ok(chips.includes("RVILS-LAT"));
    assert.ok(chips.includes("Diverse Career Paths"));
});

runTest("SafeStorage Persistence: Reliable memory & storage fallback", () => {
    safeStorage.setItem('rvils_test_key', 'persisted_val');
    assert.strictEqual(safeStorage.getItem('rvils_test_key'), 'persisted_val');
    safeStorage.removeItem('rvils_test_key');
});




/* === NEW LEGAL MODULE TESTS: STREAM MATCHER, INTERNSHIP ROADMAP, LATIN MAXIMS === */

runTest("Legal Stream Matcher: Triggers 2-step decision flow on advice query", () => {
    const res = classifyIntent("Help me choose which law course is best for me");
    assert.strictEqual(res.intent, 'stream_matcher_start');
    const reply = generateBotResponse(res.intent, "Help me choose which law course is best for me");
    assert.ok(reply.text.includes("Stream Matcher"));
    assert.ok(reply.chips.includes("12th / PUC (Arts)"));
    assert.ok(reply.chips.includes("University Graduate"));
});

runTest("Legal Stream Matcher: Step 1 (University Graduate) recommends 3-Year LL.B.", () => {
    const res = classifyIntent("I am a university graduate looking for law");
    assert.strictEqual(res.intent, 'matcher_q_graduate');
    const reply = generateBotResponse(res.intent, "university graduate");
    assert.ok(reply.text.includes("3-Year LL.B."));
    assert.ok(reply.chips.includes("RVILS-LAT"));
    assert.ok(reply.chips.includes("Chamber Internships"));
});

runTest("Legal Stream Matcher: Step 1 (12th Arts/Science/Comm) prompts Step 2 Career Destination", () => {
    const res = classifyIntent("12th / PUC (Arts)");
    assert.strictEqual(res.intent, 'matcher_q_arts');
    const reply = generateBotResponse(res.intent, "12th / puc (arts)");
    assert.ok(reply.text.includes("dream legal career destination"));
    assert.ok(reply.chips.includes("Corporate Law & M&A"));
    assert.ok(reply.chips.includes("Judiciary / Civil Litigation"));
});

runTest("Legal Stream Matcher: Step 2 Corporate Law recommends 5-Yr B.B.A. LL.B.", () => {
    const res = classifyIntent("corporate law & m&a");
    assert.strictEqual(res.intent, 'matcher_ans_corporate');
    const reply = generateBotResponse(res.intent, "corporate law & m&a");
    assert.ok(reply.text.includes("5-Year Integrated B.B.A. LL.B."));
    assert.ok(reply.chips.includes("Apply for B.B.A. LL.B."));
});

runTest("Legal Stream Matcher: Step 2 Taxation & Banking recommends 5-Yr B.Com. LL.B.", () => {
    const res = classifyIntent("taxation, banking & fintech");
    assert.strictEqual(res.intent, 'matcher_ans_taxation');
    const reply = generateBotResponse(res.intent, "taxation, banking & fintech");
    assert.ok(reply.text.includes("5-Year Integrated B.Com. LL.B."));
    assert.ok(reply.chips.includes("Apply for B.Com. LL.B."));
});

runTest("Legal Stream Matcher: Step 2 Judiciary & Litigation recommends 5-Yr B.A. LL.B.", () => {
    const res = classifyIntent("judiciary / civil litigation");
    assert.strictEqual(res.intent, 'matcher_ans_judiciary');
    const reply = generateBotResponse(res.intent, "judiciary / civil litigation");
    assert.ok(reply.text.includes("5-Year Integrated B.A. LL.B."));
    assert.ok(reply.chips.includes("Apply for B.A. LL.B."));
});

runTest("BCI 20-Week Internship Roadmap: Intent & 4 Clinical Phases", () => {
    const res = classifyIntent("What is the mandatory 20-week internship roadmap?");
    assert.strictEqual(res.intent, 'internship_roadmap');
    const reply = generateBotResponse(res.intent, "mandatory 20-week internship roadmap");
    assert.ok(reply.text.includes("Bar Council of India"));
    assert.ok(reply.text.includes("Phase 1: Social Welfare"));
    assert.ok(reply.text.includes("Phase 2: Trial Court Advocacy"));
    assert.ok(reply.text.includes("Phase 3: Appellate Courts"));
    assert.ok(reply.text.includes("Phase 4: Corporate Desks, DLSA"));
    assert.ok(reply.chips.includes("Placements & Careers"));
});

runTest("Legal Glossary & Latin Maxims: Intent & Curated Reference", () => {
    const res = classifyIntent("Explain Latin maxims and legal glossary terms");
    assert.strictEqual(res.intent, 'legal_glossary');
    const reply = generateBotResponse(res.intent, "latin maxims and legal glossary");
    assert.ok(reply.text.includes("Pro Bono Publico"));
    assert.ok(reply.text.includes("Audi Alteram Partem"));
    assert.ok(reply.text.includes("Amicus Curiae"));
    assert.ok(reply.chips.includes("Moot Court Academy"));
});

runTest("Latin Maxim Individual Query: Pro Bono Publico with RVILS Clinic Context", () => {
    const res = classifyIntent("What does pro bono publico mean in law?");
    assert.strictEqual(res.intent, 'maxim_pro_bono');
    const reply = generateBotResponse(res.intent, "What does pro bono publico mean in law?");
    assert.ok(reply.text.toLowerCase().includes("for the public good"));
    assert.ok(reply.text.includes("RVILS Legal Services Clinic"));
    assert.ok(reply.chips.includes("Legal Aid Clinic"));
});

runTest("Latin Maxim Individual Query: Audi Alteram Partem (Natural Justice)", () => {
    const res = classifyIntent("What is the principle of audi alteram partem?");
    assert.strictEqual(res.intent, 'maxim_audi_alteram_partem');
    const reply = generateBotResponse(res.intent, "audi alteram partem");
    assert.ok(reply.text.toLowerCase().includes("listen to the other side"));
    assert.ok(reply.text.includes("Article 14 and 21"));
});

runTest("Latin Maxim Individual Query: Amicus Curiae (Friend of the Court)", () => {
    const res = classifyIntent("Explain amicus curiae");
    assert.strictEqual(res.intent, 'maxim_amicus_curiae');
    const reply = generateBotResponse(res.intent, "amicus curiae");
    assert.ok(reply.text.toLowerCase().includes("friend of the court"));
    assert.ok(reply.text.includes("Moot Court Hall"));
});

runTest("Latin Maxim Individual Query: Habeas Corpus (Prerogative Writ)", () => {
    const res = classifyIntent("What is habeas corpus writ?");
    assert.strictEqual(res.intent, 'maxim_habeas_corpus');
    const reply = generateBotResponse(res.intent, "habeas corpus");
    assert.ok(reply.text.toLowerCase().includes("produce the body"));
    assert.ok(reply.text.includes("Article 32") && reply.text.includes("Article 226"));
});

runTest("Latin Maxim Individual Query: Res Judicata (Finality of Litigation)", () => {
    const res = classifyIntent("What is res judicata?");
    assert.strictEqual(res.intent, 'maxim_res_judicata');
    const reply = generateBotResponse(res.intent, "res judicata");
    assert.ok(reply.text.toLowerCase().includes("a matter already judged"));
    assert.ok(reply.text.includes("Section 11"));
});

runTest("Latin Maxim Individual Query: Ultra Vires (Beyond Powers)", () => {
    const res = classifyIntent("What does ultra vires mean?");
    assert.strictEqual(res.intent, 'maxim_ultra_vires');
    const reply = generateBotResponse(res.intent, "ultra vires");
    assert.ok(reply.text.toLowerCase().includes("beyond the powers"));
});

runTest("ADR Concept Query: Lok Adalat (People's Court)", () => {
    const res = classifyIntent("Explain Lok Adalat in India");
    assert.strictEqual(res.intent, 'concept_lok_adalat');
    const reply = generateBotResponse(res.intent, "lok adalat");
    assert.ok(reply.text.includes("Legal Services Authorities Act, 1987"));
    assert.ok(reply.chips.includes("Legal Aid Clinic"));
});


/* === RESEARCH & PUBLICATIONS SUITE TESTS (100% PURE WEBSITE DATA) === */

runTest("Research Overview: Comprehensive hub from rvils.edu.in", () => {
    const res = classifyIntent("Tell me about research and publications at RVILS");
    assert.strictEqual(res.intent, 'research_publications');
    const reply = generateBotResponse(res.intent, "research and publications");
    assert.ok(reply.text.includes("Centre for Research and Publication"));
    assert.ok(reply.text.includes("RV Law Journal"));
    assert.ok(reply.text.includes("2583-5041"));
    assert.ok(reply.text.includes("Samarthana"));
    assert.ok(reply.chips.includes("RV Law Journal"));
    assert.ok(reply.chips.includes("Global Collaborations"));
});

runTest("RV Law Journal: ISSN, OSCOLA, Categories & Submission Email", () => {
    const res = classifyIntent("What is the ISSN of the RV Law Journal and how to submit a paper?");
    assert.strictEqual(res.intent, 'rv_law_journal');
    const reply = generateBotResponse(res.intent, "RV Law Journal submission and citation");
    assert.ok(reply.text.includes("2583-5041"));
    assert.ok(reply.text.includes("Biannual"));
    assert.ok(reply.text.includes("OSCOLA"));
    assert.ok(reply.text.includes("rvlawjournal.mkpmrvils@rvei.edu.in"));
    assert.ok(reply.text.includes("Volume 5"));
    assert.ok(reply.chips.includes("OSCOLA Citation"));
    assert.ok(reply.chips.includes("Contact Editorial"));
});

runTest("RV Law Journal: Resolves on Citation Query (OSCOLA)", () => {
    const res = classifyIntent("Does RV Law Journal follow OSCOLA citation?");
    assert.strictEqual(res.intent, 'rv_law_journal');
});

runTest("Magazine Samarthana: Student & Faculty Legal Reflections", () => {
    const res = classifyIntent("Tell me about Samarthana college magazine");
    assert.strictEqual(res.intent, 'magazine_samarthana');
    const reply = generateBotResponse(res.intent, "Samarthana magazine");
    assert.ok(reply.text.includes("Samarthana"));
    assert.ok(reply.text.includes("Volume 2025"));
    assert.ok(reply.chips.includes("RV Law Journal"));
});

runTest("RVILS Newsletter: Bi-Annual Chronicle & Recent Issues", () => {
    const res = classifyIntent("What are the recent issues of RVILS newsletter?");
    assert.strictEqual(res.intent, 'rvils_newsletter');
    const reply = generateBotResponse(res.intent, "RVILS newsletter");
    assert.ok(reply.text.includes("RVILS Newsletter"));
    assert.ok(reply.text.includes("July 2025 – January 2026"));
    assert.ok(reply.chips.includes("Institutional Events"));
});

runTest("Books & Edited Volumes: ISBN Registered Academic Compilations", () => {
    const res = classifyIntent("Does RVILS publish ISBN registered research books and edited volumes?");
    assert.strictEqual(res.intent, 'research_books');
    const reply = generateBotResponse(res.intent, "ISBN registered research books");
    assert.ok(reply.text.includes("Centre for Research and Publication"));
    assert.ok(reply.text.includes("ISBN"));
    assert.ok(reply.chips.includes("RV Law Journal"));
});

runTest("Faculty & Student Publications: Scholarly Journals & Conference Papers", () => {
    const res = classifyIntent("Where do faculty and students publish research papers and articles?");
    assert.strictEqual(res.intent, 'faculty_student_publications');
    const reply = generateBotResponse(res.intent, "faculty and student research papers");
    assert.ok(reply.text.includes("UGC-CARE"));
    assert.ok(reply.text.includes("Research Policy"));
});

runTest("Seminars, Conferences, Workshops & FDPs: High Profile Events", () => {
    const res = classifyIntent("Tell me about legal seminars, workshops and FDPs conducted at RVILS");
    assert.strictEqual(res.intent, 'research_seminars_fdps');
    const reply = generateBotResponse(res.intent, "seminars, workshops and FDPs");
    assert.ok(reply.text.includes("Role of Evidence in Criminal Justice"));
    assert.ok(reply.text.includes("Bharatiya Nyaya Sanhita"));
    assert.ok(reply.text.includes("Kamal Pant"));
    assert.ok(reply.chips.includes("Role of Evidence Workshop"));
});

runTest("Specific Workshop: Role of Evidence in Criminal Justice (DGP Kamal Pant)", () => {
    const res = classifyIntent("Tell me about the workshop on Role of Evidence in Criminal Justice");
    assert.strictEqual(res.intent, 'research_seminars_fdps');
});

runTest("Specific Seminar: Bharatiya Nyaya Sanhita (Senior Standing Counsel)", () => {
    const res = classifyIntent("Was there a seminar on Bharatiya Nyaya Sanhita (BNS)?");
    assert.strictEqual(res.intent, 'research_seminars_fdps');
});

runTest("Institutional & Global Collaborations: University of Leeds, DLSA, Kaale & Kaale", () => {
    const res = classifyIntent("What international and institutional partnerships does RVILS have with University of Leeds?");
    assert.strictEqual(res.intent, 'research_collaborations');
    const reply = generateBotResponse(res.intent, "institutional partnerships with University of Leeds");
    assert.ok(reply.text.includes("University of Leeds"));
    assert.ok(reply.text.includes("Ilaria Zavoli"));
    assert.ok(reply.text.includes("Kaale & Kaale Advisors"));
    assert.ok(reply.text.includes("District Legal Services Authority"));
    assert.ok(reply.chips.includes("University of Leeds (UK)"));
});

runTest("Research Policy: Centre for Research and Publication Mandate", () => {
    const res = classifyIntent("What is the RVILS research policy and ethics guideline?");
    assert.strictEqual(res.intent, 'research_policy');
    const reply = generateBotResponse(res.intent, "RVILS research policy");
    assert.ok(reply.text.includes("Centre for Research and Publication"));
    assert.ok(reply.text.includes("OSCOLA"));
    assert.ok(reply.text.includes("anti-plagiarism"));
    assert.ok(reply.chips.includes("RV Law Journal"));
});

runTest("Fuzzy Suggestions: Recommends RV Law Journal on 'jurnall' typo", () => {
    const suggestions = findSuggestions("law jurnall");
    assert.ok(suggestions.length > 0);
    assert.ok(suggestions.some(s => s.id === 'rv_law_journal'));
});

runTest("Fuzzy Suggestions: Recommends Samarthana on 'samarthan' typo", () => {
    const suggestions = findSuggestions("samarthan magazin");
    assert.ok(suggestions.length > 0);
    assert.ok(suggestions.some(s => s.id === 'magazine_samarthana'));
});

console.log("--------------------------------------------------");
console.log(`Results: ${testsPassed} / ${testsTotal} tests passed (${Math.round(testsPassed/testsTotal*100)}%)`);
console.log("==================================================");

if (testsPassed !== testsTotal) {
    process.exit(1);
}
