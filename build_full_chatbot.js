const fs = require('fs');
const path = require('path');

const websiteData = JSON.parse(fs.readFileSync(path.join(__dirname, 'verified_website_data.json'), 'utf-8'));

// Build page corpus for deep fallback search
const pageCorpus = [];
for (const [url, data] of Object.entries(websiteData)) {
    // Extract clean body text (remove repetitive menu headers)
    let body = data.text.replace(/\r/g, '').replace(/\n\s*\n/g, '\n');
    const menuIdx = body.lastIndexOf('Contact Us');
    if (menuIdx !== -1 && menuIdx < 4000) {
        body = body.substring(menuIdx + 10);
    }
    const cleanBody = body.replace(/\s+/g, ' ').trim();
    if (cleanBody.length > 50) {
        pageCorpus.push({
            url: data.url,
            title: data.title,
            slug: data.slug,
            snippet: cleanBody.substring(0, 1800)
        });
    }
}

console.log(`Compiled page corpus with ${pageCorpus.length} searchable website pages.`);

const scriptTemplate = `/* RVILS Chatbot v3.1.0 — Enterprise Deterministic Client-Side NLP Engine
 * 100% PURE OFFICIAL WEBSITE DATASET from https://rvils.edu.in/
 * Verified Screen Records: 45 Unique Pages in screenshots/
 * Institution: MKPM RV Institute of Legal Studies (RVILS), Bengaluru
 * Affiliation: Karnataka State Law University (KSLU), Hubballi | Approved by Bar Council of India (BCI)
 * Governing Body: Rashtreeya Sikshana Samithi Trust (RSST)
 */

(function () {
    'use strict';

    // 1. Exit immediately if Elementor or page builder editor is active
    if (
        typeof window !== 'undefined' && (
            window.location.search.includes('elementor-preview') ||
            window.location.search.includes('action=elementor') ||
            window.location.search.includes('elementor_library') ||
            window.location.search.includes('fl_builder') ||
            window.location.search.includes('et_fb') ||
            window.location.search.includes('ct_builder') ||
            window.location.search.includes('bricks') ||
            (window.parent !== window && (window.location.search.includes('preview') || document.body?.classList?.contains('elementor-editor-active')))
        )
    ) {
        return;
    }

    // State Variables
    let tone = 'pro'; // 'pro' | 'funny'
    let chatOpen = false;
    let soundEnabled = true;
    let speechEnabled = false;
    const SESSION = {
        lastIntent: null,
        history: [],
        navStack: []
    };

    /* =============== NLP STOP WORDS & TOKENIZER =============== */
    const STOP_WORDS = new Set([
        "the", "is", "are", "was", "were", "be", "been", "being",
        "a", "an", "of", "to", "in", "for", "with", "on", "at", "by", "from",
        "up", "down", "into", "over", "after", "before", "between", "under", "and", "or", "but",
        "who", "whom", "whose", "which", "what", "whats", "where", "when", "why", "how",
        "tell", "give", "show", "want", "know", "need", "me", "you", "he", "she",
        "it", "they", "them", "my", "your", "his", "her", "i", "we", "do", "does", "did",
        "have", "has", "had", "having", "can", "could", "would", "should", "please", "pls",
        "plz", "sir", "madam", "curious", "urgent", "info", "details", "there", "about"
    ]);

    function tokenize(text) {
        if (!text) return [];
        return text.toLowerCase()
            .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'\[\]]/g, ' ')
            .split(/\\s+/)
            .filter(word => word.trim().length > 0);
    }

    function removeStopWords(tokens) {
        return tokens.filter(word => !STOP_WORDS.has(word));
    }

    function processNLPInput(input) {
        const tokens = tokenize(input);
        const cleanTokens = removeStopWords(tokens);
        return {
            tokens: cleanTokens,
            rawTokens: tokens,
            cleanString: cleanTokens.join(' ')
        };
    }

    /* =============== CONTENT MODERATION =============== */
    const BLOCKED = {
        abusive: [
            'fuck', 'shit', 'ass', 'bitch', 'bastard', 'damn', 'dick', 'pussy', 'slut', 'whore',
            'stupid', 'idiot', 'dumb', 'moron', 'retard', 'crap', 'screw you', 'shut up', 'suck',
            'hate you', 'loser', 'trash', 'worthless', 'ugly', 'go to hell', 'kill', 'murder',
            'rape', 'abuse', 'harass', 'molest', 'stalk', 'threat', 'bomb', 'attack', 'terror',
            'drug', 'weed', 'cocaine', 'heroin', 'alcohol', 'drunk', 'smoke', 'gambling', 'porn',
            'sex', 'nude', 'naked', 'obscene', 'vulgar', 'profanity', 'racist', 'sexist', 'bigot',
            'ass hole', 'wtf', 'stfu', 'lmao', 'lmfao', 'bloody', 'madarchod', 'behenchod',
            'chutiya', 'bc', 'mc', 'gaand', 'saala', 'kamina', 'haramkhor', 'bewakoof', 'gadha', 'hack'
        ],
        conspiracy: [
            'illuminati', 'flat earth', 'reptilian', 'chemtrail', '5g cause', 'qanon', 'deep state',
            'new world order', 'fake moon', 'area 51', 'aliens control', 'government mind control',
            'covid fake', 'vaccine microchip', 'bill gates chip', 'controlled demolition',
            'pizza gate', 'fake news media', 'rigged election', 'brainwash', 'propaganda',
            'freemason', 'secret society', 'population control', 'depopulation', 'mk ultra', 'political affiliation'
        ],
        private: [
            'student phone number', 'personal number', 'private email', 'home address',
            'student address', 'teacher address', 'salary of', 'faculty salary',
            'personal data', 'student marks', 'result of', 'cgpa of', 'gpa of',
            'marks of', 'percentage of', 'private detail', 'confidential', 'password',
            'bank detail', 'account number', 'aadhaar', 'pan card', 'dob of', 'date of birth of',
            'caste of', 'religion of', 'family of', 'father of', 'mother of', 'girlfriend',
            'boyfriend', 'relationship', 'married', 'wife of', 'husband of', 'someone\\'s phone',
            'whatsapp number', 'instagram id', 'social media of', 'facebook of'
        ]
    };

    function checkModeration(input) {
        const lower = input.toLowerCase();
        const isBlocked = (list) => {
            for (const word of list) {
                const escaped = word.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&');
                const regex = new RegExp('(?:^|\\\\s)' + escaped + '(?=\\\\s|$|[?!.])', 'i');
                if (regex.test(lower)) return true;
            }
            return false;
        };

        if (isBlocked(BLOCKED.abusive)) return { blocked: true, type: 'abusive' };
        if (isBlocked(BLOCKED.conspiracy)) return { blocked: true, type: 'conspiracy' };
        if (isBlocked(BLOCKED.private)) return { blocked: true, type: 'private' };

        return { blocked: false };
    }

    function getModerationResponse(type) {
        const responses = {
            abusive: {
                funny: "Whoa counsel! ⚖️ Let's uphold courtroom decorum! I'm here to provide verified RVILS legal education info, not trade objections! 😅",
                pro: "⚠️ I am unable to respond to inappropriate or offensive language. Please maintain professional courtesy. I am here to help you with official RVILS academic and admissions information."
            },
            conspiracy: {
                funny: "Nice theory! 🛸 But in legal studies we only rely on admissible evidence and verified RVILS website facts! Ask me about courses or admissions! 😄",
                pro: "⚠️ I am designed to provide factual, verified information from the official RVILS website only. I cannot engage with conspiracy theories or unverified claims. Please ask about our law programs, faculty, or admissions."
            },
            private: {
                funny: "That's privileged information under attorney-client privilege! 🔒 I protect private records and personal data. Let's discuss public campus info! 👨‍⚖️",
                pro: "⚠️ In compliance with data privacy regulations, personal contact details, grades, and confidential records of students, faculty, and staff are strictly protected. I can assist you with general institutional information."
            }
        };
        return responses[type][tone === 'funny' ? 'funny' : 'pro'];
    }

    /* =============== RVILS PURE WEBSITE KNOWLEDGE BASE =============== */
    const RVILS_DATA = {
        institution: {
            fullName: "MKPM RV Institute of Legal Studies (RVILS)",
            shortName: "RVILS",
            established: 2018,
            trust: "Rashtreeya Sikshana Samithi Trust (RSST)",
            trustEstablished: 1940,
            founder: "Late Sri M.C. Sivananda Sarma",
            namedAfter: "Dr. M.K. Panduranga Setty (President Emeritus of RSST)",
            motto: "Go, change the world",
            affiliation: "Karnataka State Law University (KSLU), Hubballi",
            approval: "Bar Council of India (BCI), New Delhi",
            address: "#45/1, 22nd Cross, 3rd Block, Jayanagar, Bengaluru - 560011, Karnataka, India",
            phone: "+91-80-69018952/53",
            email: "rvils@rvei.edu.in",
            website: "https://rvils.edu.in"
        },
        visionMission: {
            vision: "Imparting legal education to create globally competent and socially relevant professionals.",
            mission: [
                "To imbue students with professional ethics along with honing skills.",
                "To enable students to become the exponents of justice for common man.",
                "To provide appropriate academic ambience backed with intellectual and technical logistics to groom students for the profession.",
                "To ensure that students get the best legal education and optimum knowledge of legal skills.",
                "To inculcate values and pro bono commitment in students by involving them in legal aid programmes."
            ]
        },
        boardOfManagement: {
            chairman: "Dr. M.P. Shyam (President, RSST / RVEI)",
            members: [
                "Mr. A.C. Chandrashekar Raju",
                "Dr. C. Vinod Hayagriv",
                "Mr. P.S. Venkatesh Babu",
                "Dr.(h.c) A.V.S. Murthy",
                "Mr. D.P. Nagaraj",
                "Mr. Nikhil A Murthy"
            ]
        },
        programmes: [
            {
                id: "ba_llb",
                name: "5-Year Integrated B.A. LL.B.",
                title: "Integrated Law with Arts & Humanities",
                duration: "5 Years (10 Semesters)",
                maxCompletion: "7 Years from Admission",
                level: "Undergraduate Integrated",
                degree: "B.A. LL.B.",
                affiliation: "KSLU, Hubballi | Approved by Bar Council of India",
                eligibility: {
                    academic: "10+2 / Pre-University (PUC) or equivalent examination from a recognized board.",
                    marks: "General Merit: 45% | OBC Category: 42% | SC / ST / Cat-I: 40%"
                },
                careerPaths: [
                    "Litigation & Judiciary: Advocate (Civil, Criminal, Constitutional, Family Law), Judicial Services (Judge/Magistrate), Public Prosecutor, Government Pleader",
                    "Judicial Research & Courts: Research Clerk / Law Clerk (High Courts & Supreme Court of India), Legislative Research Assistant",
                    "Civil Services & Policy: UPSC / KPSC Civil Services, Policy Analyst, Human Rights Commissions, NGO & Social Justice Organisations",
                    "Academics & Universities: Assistant Professor (after LL.M & NET), Research Fellow, Ph.D. Scholar, Legal Researcher in Think Tanks",
                    "Specialised Fields: Constitutional Law, Labour Law, Environmental Law Specialist, Women & Child Rights Advocate, International Law & Diplomacy, Sports Law Advisor, Media & Entertainment Law",
                    "Armed Forces: JAG Branch – Indian Army (through entry exams)"
                ]
            },
            {
                id: "bba_llb",
                name: "5-Year Integrated B.B.A. LL.B.",
                title: "Integrated Law with Business & Management",
                duration: "5 Years (10 Semesters)",
                maxCompletion: "7 Years from Admission",
                level: "Undergraduate Integrated",
                degree: "B.B.A. LL.B.",
                affiliation: "KSLU, Hubballi | Approved by Bar Council of India",
                eligibility: {
                    academic: "10+2 / Pre-University (PUC) or equivalent from a recognized board.",
                    marks: "General Merit: 45% | OBC Category: 42% | SC / ST / Cat-I: 40%"
                },
                careerPaths: [
                    "Corporate Law & Advisory: In-House Legal Counsel, Corporate Law Firms, Commercial Arbitrator, M&A Advisory",
                    "Fintech & Compliance: Banking Regulations, Securities & Capital Markets Compliance",
                    "Business Leadership: Legal Consultant for Startups and Multinationals, Corporate Governance Specialist"
                ]
            },
            {
                id: "bcom_llb",
                name: "5-Year Integrated B.Com. LL.B.",
                title: "Integrated Law with Commerce & Finance",
                duration: "5 Years (10 Semesters)",
                maxCompletion: "7 Years from Admission",
                level: "Undergraduate Integrated",
                degree: "B.Com. LL.B.",
                affiliation: "KSLU, Hubballi | Approved by Bar Council of India",
                eligibility: {
                    academic: "10+2 / Pre-University (PUC) or equivalent from a recognized board.",
                    marks: "General Merit: 45% | OBC Category: 42% | SC / ST / Cat-I: 40%"
                },
                careerPaths: [
                    "Taxation & Financial Law: Direct & Indirect Tax Attorney, Corporate Tax Litigation, GST Specialist",
                    "Banking & Insolvency: Insolvency & Bankruptcy Code (IBC) Practitioner, Financial Crime Investigation, Banking Law Advisor"
                ]
            },
            {
                id: "llb_3yr",
                name: "3-Year LL.B.",
                title: "Postgraduate Professional Law Degree",
                duration: "3 Years (6 Semesters)",
                maxCompletion: "7 Years from Admission",
                level: "Postgraduate Professional Law",
                degree: "LL.B.",
                affiliation: "KSLU, Hubballi | Approved by Bar Council of India",
                eligibility: {
                    academic: "Graduation (Bachelor’s degree) in any discipline from a recognized University.",
                    marks: "General Merit: 45% | OBC Category: 42% | SC / ST / Cat-I: 40%"
                },
                careerPaths: [
                    "Chamber Practice & Litigation in High Courts & Supreme Court",
                    "Judicial Services Examination (Civil Judge / Judicial Magistrate)",
                    "Corporate Advisory, Legal Officers in Public & Private Sector Undertakings"
                ]
            }
        ],
        admissions: {
            status: "Admissions Open 2026 – 27",
            tagline: "Begin The Pursuit of Justice",
            theProcess: [
                { step: 1, title: "Application Submission", detail: "Submit the prescribed form with the required documents as per KSLU eligibility norms." },
                { step: 2, title: "RVILS–LAT", detail: "Appear for the entrance test assessing aptitude and reasoning skills." },
                { step: 3, title: "Institutional Interaction", detail: "Attend the briefing session with the admission team (with parents)." },
                { step: 4, title: "Personal Interview", detail: "Evaluation of interest in law along with clarity and communication skills." },
                { step: 5, title: "Offer of Admission", detail: "Issued based on cumulative performance." },
                { step: 6, title: "Admission Confirmation", detail: "Completion of fee payment and document verification." }
            ],
            onlineApplication: "Apply Online via SAP link on rvils.edu.in or visit admissions desk at Jayanagar campus.",
            feesNote: "Official tuition fee schedules and dues are determined strictly per Karnataka State Law University (KSLU) norms and RSST trust guidelines. For official fee structure breakdown by category/quota, please consult the RVILS Admissions Desk directly."
        },
        facultyDirectory: {
            principal: {
                name: "Prof. (Dr.) Anjina Reddy K.R.",
                role: "Professor of Law & Principal — Founder Principal",
                qualifications: "B.A.L., LL.M., M.Phil., Ph.D.",
                experience: "20 Years in Legal Academia & Administration",
                specialization: "Environmental Law · Constitutional Law"
            },
            coreFaculty: [
                { name: "Dr. Hanumaprakash K.S.", role: "Professor of Law", qualifications: "LL.M. (Commercial Law), Ph.D., KSET" },
                { name: "Mr. Thejesh K.M.", role: "Assistant Professor of Management", qualifications: "M.Com., MBA, PGDFM" },
                { name: "Ms. Chaitra M.D.", role: "Assistant Professor of Management", qualifications: "B.Com., M.Com." },
                { name: "Ms. Runjhun Sharma", role: "Assistant Professor of Law", qualifications: "B.A., LL.B., LL.M." },
                { name: "Mr. Aswin K.", role: "Assistant Professor of Law", qualifications: "B.B.A., LL.B., LL.M." },
                { name: "Ms. Anncy Flora", role: "Assistant Professor of Law", qualifications: "LL.M. in Law" },
                { name: "Ms. Shruthi M.S.", role: "Assistant Professor of Economics", qualifications: "M.A. in Economics" },
                { name: "Mr. Rahul Simha N.", role: "Assistant Professor of Law", qualifications: "B.A., LL.B., LL.M." },
                { name: "Mrs. Sheena Razdan", role: "Assistant Professor of Law", qualifications: "B.S.L. LL.B., LL.M." },
                { name: "Ms. Kruthika B.", role: "Assistant Professor of Law", qualifications: "B.A., LL.B., LL.M." },
                { name: "Ms. Paavana E.", role: "Assistant Professor of Law", qualifications: "LL.M. in Law" }
            ],
            staff: [
                { name: "Mr. Mohan Kumar N.N.", role: "Director of Physical Education" },
                { name: "Mr. Santosh Kumar Naragund", role: "Senior Library Executive (MLISc, BA, 8 yrs exp)" },
                { name: "Mr. Sagar S.", role: "Junior Library Executive (MLISc, B.Com., KSET)" },
                { name: "Anitha M.K.", role: "Library Attender" },
                { name: "Mr. N. Mahesh", role: "Assistant Manager - HR & Admin" },
                { name: "Ms. Sudha K.", role: "Sr. Executive Accounts" },
                { name: "Mrs. Asha P.", role: "Clerk" },
                { name: "Mr. Manoj Yadav", role: "Trainee - Accounts" },
                { name: "Mr. Rakshith Shetty", role: "Trainee - Accounts" },
                { name: "Mrs. Prema C.S.", role: "Attender" }
            ]
        },
        library: {
            title: "Library & Information Centre (Hybrid Knowledge Centre)",
            vision: "To be a vibrant knowledge centre that fosters academic excellence, research, and innovation by offering extensive resources and a collaborative environment.",
            mission: "Our mission is to diligently provide a wide range of resources and services to meet the academic, intellectual, and research needs of the scholarly community.",
            specialHighlight: "Copy of the original Manuscript of the Constitution of India housed in the library.",
            digitalDatabases: [
                "SCC Online – Leading legal research database since 1996 covering Supreme Court, High Courts, tribunals, and central/state acts.",
                "Manupatra – Premium comprehensive legal research and commentary database."
            ],
            systems: "KOHA and LIBSOFT automated library management software. Dewey Decimal & Library of Congress classification.",
            citationHandbooks: [
                "The Bluebook Uncovered - Legal Citation (22nd Edition)",
                "APA and MLA citation format 2024",
                "Bluebook Citation Primer",
                "OSCOLA 4th Edition 2012 & OSCOLA 2006 Citing International Law",
                "OSCOLA Style Citation Guide (2017)"
            ],
            questionPapers: "Previous Year KSLU Question Papers available for all 4 programmes."
        },
        internshipsAndPlacements: {
            title: "Where Your Legal Careers Begin",
            compulsoryInternshipDuration: "20 Weeks total for 5-Year Integrated Course and 3-Year LL.B. Course.",
            semesterLimits: "In any single semester: Internship must be at least 15 days and not exceed 4 consecutive weeks.",
            mandatoryExposures: [
                "1. An NGO",
                "2. A Trial Court Advocate",
                "3. An Appellate Court Advocate",
                "4. The District Legal Services Authority (DLSA)"
            ],
            requirements: "Students must maintain an internship diary in the prescribed format. Assessment based on internship records and viva voce evaluation.",
            placementCell: "Assists students in transition to professional practice, skill enhancement, networking, mock interviews, resume building, and employer engagement."
        },
        legalServicesClinic: {
            title: "Legal Services Clinic",
            aim: "To provide legal aid through human resource, knowledge resource & infrastructural resource to those who need it the most, purely on a pro-bono basis.",
            services: [
                "Free Legal Advice: Available on working days (Monday to Friday, 10:00 AM – 4:00 PM)",
                "Legal Literacy Programmes: In association with DLSA, KLSA, NALSA in villages, institutions, and community spaces."
            ],
            milestoneOutreach: [
                "Awareness Rally on International Day of the Girl Child at Gandhi Bazar, Bengaluru (with DLSA)",
                "World Environment Day at Mangala Mantapa inaugurated by Hon'ble Justice K. Somashekar, High Court of Karnataka",
                "Educational visits to Lok Adalat Bengaluru and Central Jail Bengaluru",
                "One-Day Legal Aid Camp and Socio-Legal Survey at Thattaguppe Village",
                "Visit to Amruthavani Vridh Seva Trust (Senior Citizens' Day)"
            ]
        },
        studentActivities: {
            initiatives: [
                "Moot Court Academy — Intensive appellate advocacy training, memorial drafting, and court simulation",
                "Mediation Centre — Alternative Dispute Resolution (ADR) and negotiation practice",
                "Nyaya Darpana Lecture Series — Continuing academic lecture series featuring leading advocates and judges (e.g., talk on Property Title Verification by Mr. Pradeep)",
                "Debate and Literary Society — Inter-collegiate debating, parliamentary debate format, and legal writing",
                "Environment Club — Green campus drives, environmental law symposiums, and plantation initiatives"
            ]
        },
        sportsAndCultural: {
            sportsHighlights: "Students represent RVILS in basketball, volleyball, cricket, badminton, chess, and yoga in KSLU tournaments. Mr. Mohankumar N.N. (Director of Physical Education) was appointed as Referee at Commonwealth Kabaddi Championship 2026.",
            culturalHighlights: "Cultural Committee coordinates Freshers’ Day, ethnic festivals, music, dance, theatre, and annual cultural competitions."
        },
        researchAndPublications: {
            publications: [
                "RV Law Journal — Biannual, blind peer-reviewed journal for scholarly legal discourse",
                "Magazine – Samarthana — Annual college magazine highlighting student expressions and achievements",
                "RVILS Newsletter — Regular updates on campus developments, guest lectures, and student activities",
                "Books and Faculty & Student Research Publications in reputed indexed journals"
            ],
            events: "Seminars, Conferences, Workshops & Faculty Development Programmes (FDPs)"
        },
        campusLife: {
            location: "#45/1, 22nd Cross, 3rd Block, Jayanagar, Bengaluru - 560011 (near South End Circle Metro)",
            facilities: [
                "Smart Classrooms & Audio-Visual Seminar Hall",
                "Air-Conditioned Moot Court Hall",
                "Hybrid Library & Digital Computer Lab",
                "Auditorium: Mangala Mantapa Auditorium on campus",
                "Sports Facilities (Badminton, Table Tennis, Chess, Athletics - directed by Mr. Mohan Kumar N.N.)",
                "National Service Scheme (NSS) Unit (rural outreach, school gift drives)",
                "Youth Red Cross Unit (health drives, blood donation)"
            ],
            institutionalCommittees: [
                "Internal Complaints Committee (ICC)",
                "Student Grievance Cell",
                "SC/ST Cell",
                "Anti-Ragging Committee"
            ]
        }
    };

    /* =============== DEEP IN-MEMORY WEBSITE CORPUS =============== */
    const PAGE_CORPUS = ${JSON.stringify(pageCorpus, null, 2)};

    function searchWebsiteCorpus(query) {
        const qTokens = tokenize(query).filter(w => !STOP_WORDS.has(w));
        if (qTokens.length === 0) return null;

        let bestMatch = null;
        let highestScore = 0;

        for (const page of PAGE_CORPUS) {
            let score = 0;
            const textLower = page.snippet.toLowerCase();
            const titleLower = page.title.toLowerCase();

            for (const token of qTokens) {
                if (titleLower.includes(token)) score += 5;
                if (textLower.includes(token)) score += 2;
            }

            if (score > highestScore) {
                highestScore = score;
                bestMatch = page;
            }
        }

        if (highestScore >= 3 && bestMatch) {
            return bestMatch;
        }
        return null;
    }

    /* =============== PRIORITY-BASED QA ROUTING TABLE =============== */
    const QA = [
        { k: ['hi', 'hello', 'hey', 'namaste', 'good morning', 'good afternoon', 'good evening', 'namaskara', 'greetings'], id: 'greet', p: 5 },
        { k: ['bye', 'goodbye', 'thank you', 'thanks', 'cya', 'exit', 'close'], id: 'bye', p: 5 },

        // Board & Leadership
        { k: ['board of management', 'board members', 'governing council', 'trustees', 'who runs rvils', 'management board', 'shyam'], id: 'board_of_management', p: 1.5 },
        { k: ['principal', 'who is principal', 'head of college', 'director of rvils', 'anjina reddy', 'anjina reddy kr', 'dr anjina reddy', 'principal profile', 'principal name'], id: 'principal', p: 1.5 },
        { k: ['faculty', 'professors', 'teachers', 'lecturers', 'teaching staff', 'core faculty', 'faculty directory', 'who teaches'], id: 'faculty', p: 1.2 },

        // Specific Faculty Lookups
        { k: ['hanumaprakash', 'dr hanumaprakash', 'commercial law professor'], id: 'faculty_hanumaprakash', p: 0.8 },
        { k: ['thejesh', 'thejesh km', 'management professor'], id: 'faculty_thejesh', p: 0.8 },
        { k: ['chaitra', 'chaitra md'], id: 'faculty_chaitra', p: 0.8 },
        { k: ['runjhun', 'runjhun sharma', 'international law professor'], id: 'faculty_runjhun', p: 0.8 },
        { k: ['aswin', 'aswin k', 'corporate law professor'], id: 'faculty_aswin', p: 0.8 },
        { k: ['anncy', 'anncy flora'], id: 'faculty_anncy', p: 0.8 },
        { k: ['shruthi', 'shruthi ms', 'economics professor'], id: 'faculty_shruthi', p: 0.8 },
        { k: ['rahul simha', 'rahul simha n', 'constitutional law professor'], id: 'faculty_rahul_simha', p: 0.8 },
        { k: ['sheena', 'sheena razdan', 'family law professor'], id: 'faculty_sheena', p: 0.8 },
        { k: ['kruthika', 'kruthika b', 'ipr professor', 'cyber law professor'], id: 'faculty_kruthika', p: 0.8 },
        { k: ['paavana', 'paavana e'], id: 'faculty_paavana', p: 0.8 },
        { k: ['mohankumar', 'mohan kumar', 'sports director', 'physical education director', 'kabaddi referee', 'commonwealth kabaddi'], id: 'director_sports', p: 0.8 },
        { k: ['santosh kumar', 'naragund', 'librarian', 'sagar', 'library staff'], id: 'library_staff', p: 0.8 },

        // Academic Programmes
        { k: ['ba llb', 'b.a. ll.b.', 'b.a llb', '5-year ba llb', 'arts and law', 'humanities law', '5 year ba llb'], id: 'program_ba_llb', p: 1 },
        { k: ['bba llb', 'b.b.a. ll.b.', 'b.b.a llb', '5-year bba llb', 'business law', 'management law', '5 year bba llb'], id: 'program_bba_llb', p: 1 },
        { k: ['bcom llb', 'b.com. ll.b.', 'b.com llb', '5-year bcom llb', 'commerce law', 'taxation law', '5 year bcom llb'], id: 'program_bcom_llb', p: 1 },
        { k: ['3 year llb', '3-year llb', '3 yr llb', 'three year llb', 'llb after graduation', 'llb for graduates', 'postgraduate law'], id: 'program_3yr_llb', p: 1 },
        { k: ['courses', 'programmes', 'all programs', 'degrees offered', 'what courses', 'law degrees'], id: 'all_programs', p: 1.2 },

        // Career Pathways
        { k: ['career', 'career options', 'jobs after ba llb', 'placements scope', 'future prospects', 'judicial services', 'jag army'], id: 'career_paths', p: 1.2 },

        // Admissions & Entrance
        { k: ['rvils-lat', 'rvils lat', 'lat exam', 'entrance test', 'aptitude test', 'entrance syllabus', 'lat pattern', 'law aptitude test'], id: 'rvils_lat', p: 1 },
        { k: ['admissions', 'admission 2026', 'admission process', 'how to apply', 'selection process', '6 steps', 'admission steps', 'apply online', 'sap link'], id: 'admissions', p: 1 },
        { k: ['eligibility', 'percentage required', 'marks criteria', 'minimum marks', 'cut off marks', 'general merit marks', 'obc marks', 'sc st marks'], id: 'eligibility', p: 1 },
        { k: ['fees', 'fee structure', 'tuition fees', 'how much fees', 'course fee', 'cost', 'fee details'], id: 'fees', p: 1 },
        { k: ['scholarship', 'scholarships', 'financial aid', 'fee concession', 'ssp portal', 'vidyasiri'], id: 'scholarships', p: 1 },

        // Practical Clinical Advocacy
        { k: ['moot court', 'moot court academy', 'moot courtroom', 'moot court hall', 'advocacy training', 'memorial drafting', 'mock trial'], id: 'moot_court', p: 1 },
        { k: ['legal services clinic', 'legal aid', 'legal aid clinic', 'free legal advice', 'pro bono', 'lok adalat', 'thattaguppe', 'gandhi bazar rally', 'girl child rally', 'amruthavani'], id: 'legal_aid', p: 1 },
        { k: ['internship', 'internships', '20 weeks', 'mandatory internship', 'internship diary', 'dlsa internship', 'advocate internship'], id: 'internships', p: 1 },
        { k: ['placements', 'placement cell', 'campus recruitment', 'recruiters', 'salary package', 'career guidance'], id: 'placements', p: 1 },

        // Knowledge Centre & Library
        { k: ['library', 'books', 'knowledge centre', 'reading room', 'koha', 'libsoft', 'dewey decimal'], id: 'library', p: 1 },
        { k: ['constitution manuscript', 'original constitution', 'manuscript of constitution', 'copy of constitution'], id: 'constitution_manuscript', p: 0.8 },
        { k: ['scc online', 'manupatra', 'legal databases', 'e-learning resources', 'online databases'], id: 'legal_databases', p: 0.8 },
        { k: ['citation', 'bluebook', 'oscola', 'citation handbook', 'apa citation', 'mla citation'], id: 'citation_guides', p: 0.8 },
        { k: ['question papers', 'kslu question papers', 'previous year papers', 'past papers', 'exam papers'], id: 'question_papers', p: 0.8 },

        // Campus, Facilities & Societies
        { k: ['campus', 'campus facilities', 'infrastructure', 'classrooms', 'seminar hall', 'mangala mantapa', 'auditorium'], id: 'campus_facilities', p: 1 },
        { k: ['hostel', 'hostels', 'accommodation', 'dorm', 'stay', 'where to stay', 'hostel facility'], id: 'hostels', p: 1 },
        { k: ['sports', 'games', 'badminton', 'table tennis', 'chess', 'athletics', 'gym', 'sports ground', 'yoga'], id: 'sports', p: 1 },
        { k: ['cultural activities', 'cultural committee', 'freshers day', 'ethnic day', 'dance', 'music', 'theatre'], id: 'cultural_activities', p: 1 },
        { k: ['student activities', 'nyaya darpana', 'debate society', 'literary society', 'mediation centre', 'environment club'], id: 'student_activities', p: 1 },
        { k: ['nss', 'national service scheme', 'community extension'], id: 'nss', p: 1 },
        { k: ['red cross', 'youth red cross', 'yrc', 'blood donation'], id: 'youth_red_cross', p: 1 },

        // Statutory Committees
        { k: ['anti-ragging', 'anti ragging policy', 'ragging'], id: 'anti_ragging', p: 0.8 },
        { k: ['internal complaints committee', 'icc', 'women safety', 'harassment cell'], id: 'icc', p: 0.8 },
        { k: ['student grievance', 'grievance cell', 'grievance redressal'], id: 'grievance_cell', p: 0.8 },
        { k: ['sc st cell', 'sc/st cell', 'equal opportunity'], id: 'sc_st_cell', p: 0.8 },

        // Research & Publications
        { k: ['rv law journal', 'law journal', 'journal', 'blind peer-reviewed', 'research journal'], id: 'rv_law_journal', p: 0.8 },
        { k: ['samarthana', 'magazine', 'college magazine'], id: 'samarthana_magazine', p: 0.8 },
        { k: ['newsletter', 'rvils newsletter'], id: 'rvils_newsletter', p: 0.8 },
        { k: ['research', 'research policy', 'conferences', 'workshops', 'fdp', 'faculty publications'], id: 'research', p: 1 },

        // Institutional Governance & Trust
        { k: ['about', 'about rvils', 'about college', 'history of rvils', 'established', 'rvei', 'who founded'], id: 'about_rvils', p: 1 },
        { k: ['trust', 'rsst', 'rashtreeya sikshana samithi trust', 'sivananda sarma', 'motto', 'go change the world'], id: 'trust_rsst', p: 1 },
        { k: ['vision', 'mission', 'goals', 'aim of rvils'], id: 'vision_mission', p: 1 },
        { k: ['kslu', 'bci', 'affiliation', 'accreditation', 'bar council of india', 'karnataka state law university', 'approved by bci'], id: 'affiliation', p: 1 },
        { k: ['alumni', 'alumni network', 'graduates', 'past students', 'alumni association'], id: 'alumni', p: 1 },

        // Contact & Location
        { k: ['contact', 'contact us', 'phone number', 'email', 'address', 'location', 'reach', 'how to reach', 'jayanagar', 'metro'], id: 'contact', p: 1 },
        { k: ['callback', 'enquiry', 'counsellor', 'consultation', 'talk to admissions'], id: 'lead_inquiry', p: 1 }
    ];

    function matchIntent(input) {
        const text = input.toLowerCase().trim();
        const p = processNLPInput(text);
        const tokens = p.tokens;
        const raw = p.rawTokens;

        let bestMatch = null;
        let highestPriority = 99;

        for (const item of QA) {
            for (const key of item.k) {
                // Exact key substring check or token match
                const keyTokens = tokenize(key);
                const isExactPhrase = text.includes(key);
                const isTokenMatch = keyTokens.length === 1 && (raw.includes(key) || tokens.includes(key));

                if (isExactPhrase || isTokenMatch) {
                    if (item.p < highestPriority) {
                        highestPriority = item.p;
                        bestMatch = item.id;
                    }
                    break;
                }
            }
        }

        return bestMatch || 'fallback';
    }

    /* =============== RESPONSE GENERATOR =============== */
    function generateResponse(intent, query) {
        SESSION.lastIntent = intent;

        switch (intent) {
            case 'greet':
                return {
                    text: tone === 'funny'
                        ? "Hello there, future legal luminary! ⚖️ Welcome to **MKPM RV Institute of Legal Studies (RVILS)**! All my data is 100% verified from our official portal (\`rvils.edu.in\`). Whether you're curious about our 5-Year Integrated Law courses, 3-Year LL.B., moot courts, or admissions 2026, I have all the briefs ready. What can I help you explore?"
                        : "Welcome to **MKPM RV Institute of Legal Studies (RVILS)**, Bengaluru. Affiliated with Karnataka State Law University (KSLU) and approved by the Bar Council of India (BCI). All information provided is 100% verified from our official website (\`rvils.edu.in\`). How may I assist your inquiry today?",
                    chips: ["Admissions 2026", "5-Yr B.A. LL.B.", "5-Yr B.B.A. LL.B.", "3-Yr LL.B.", "RVILS-LAT", "Faculty", "Library", "Contact Us"]
                };

            case 'bye':
                return {
                    text: tone === 'funny'
                        ? "Court adjourned! 👨‍⚖️ Have a wonderful day, and best of luck with your legal journey at RVILS!"
                        : "Thank you for reaching out to **MKPM RV Institute of Legal Studies (RVILS)**. If you require further assistance, please contact our Admissions Office at \`+91-80-69018952/53\` or email \`rvils@rvei.edu.in\`.",
                    chips: ["Admissions 2026", "Contact Us", "All Programmes"]
                };

            case 'about_rvils':
                return {
                    text: `### 🏛️ About MKPM RV Institute of Legal Studies (RVILS)
Established in **2018** by **RV Educational Institutions (RVEI)**, MKPM RVILS was founded in response to the growing complexity of disputes, corporate governance challenges, and emerging fields such as cyber law.

* **Named in Honour of:** Dr. M.K. Panduranga Setty, President Emeritus of RSST.
* **Governing Body:** Rashtreeya Sikshana Samithi Trust (RSST), established in 1940.
* **University Affiliation:** Affiliated with **Karnataka State Law University (KSLU)**, Hubballi.
* **Statutory Approval:** Approved by the **Bar Council of India (BCI)**, New Delhi.
* **Location:** Centrally situated at Jayanagar 3rd Block, Bengaluru, a premier academic hub.
* **Academic Programmes:** 5-Year B.A. LL.B., 5-Year B.B.A. LL.B., 5-Year B.Com. LL.B., and 3-Year LL.B.`,
                    chips: ["Board of Management", "Vision & Mission", "All Programmes", "Admissions 2026"]
                };

            case 'trust_rsst':
                return {
                    text: `### 🏛️ Rashtreeya Sikshana Samithi Trust (RSST) & RVEI Legacy
* **Founding Year:** Founded in **1940** by the late **Sri M.C. Sivananda Sarma**, on the fundamental conviction that *"education is not a privilege, but a right."*
* **Growth:** Over eight decades, RVEI has grown into a distinguished network of **28+ premier institutions** serving more than **24,000 students** supported by over **3,000 staff members**.
* **Enduring Motto:** *"Go, change the world"* — the standard RVEI has upheld across technology, legal studies, health sciences, management, and humanities.
* **RVEI Network:** Academic framework spanning kindergarten to postgraduate education serving 24,000+ students across Karnataka.`,
                    chips: ["Board of Management", "About RVILS", "Admissions 2026", "Contact Us"]
                };

            case 'vision_mission':
                return {
                    text: `### 🎯 Vision, Mission & Goals (from rvils.edu.in)
**Vision:**
*"${RVILS_DATA.visionMission.vision}"*

**Mission:**
${RVILS_DATA.visionMission.mission.map(m => '• ' + m).join('\n')}`,
                    chips: ["About RVILS", "Board of Management", "All Programmes", "Faculty"]
                };

            case 'board_of_management':
                return {
                    text: `### 👥 Board of Management (RSST / RVEI Leadership)
**Chairman:**
• **${RVILS_DATA.boardOfManagement.chairman}**

**Distinguished Board Members:**
${RVILS_DATA.boardOfManagement.members.map(m => '• ' + m).join('\n')}

The Board steers the governance, academic standards, and institutional development of RVILS under RSST's pioneering educational umbrella.`,
                    chips: ["Principal Profile", "Faculty Directory", "About RVILS", "Admissions 2026"]
                };

            case 'principal':
                const pr = RVILS_DATA.facultyDirectory.principal;
                return {
                    text: `### 👨‍⚖️ Institutional Leadership — Principal
**${pr.name}**  
*${pr.role}*

* **Qualifications:** ${pr.qualifications}
* **Academic Experience:** ${pr.experience}
* **Specialisation:** ${pr.specialization}

Under Prof. (Dr.) Anjina Reddy K.R.'s leadership, RVILS integrates appellate courtroom simulation, clinical legal outreach, and high-impact legal scholarship into the curriculum.`,
                    chips: ["Board of Management", "Faculty Directory", "Admissions 2026", "Moot Court"]
                };

            case 'faculty':
                return {
                    text: `### 👥 Core Faculty & Academic Staff (from rvils.edu.in)
**Founder Principal:**
• **Prof. (Dr.) Anjina Reddy K.R.** — Professor of Law & Principal *(B.A.L., LL.M., M.Phil., Ph.D.)*

**Core Teaching Faculty:**
${RVILS_DATA.facultyDirectory.coreFaculty.map(f => `• **${f.name}** — ${f.role} *(${f.qualifications})*`).join('\n')}

**Library & Physical Education Staff:**
• **Mr. Mohan Kumar N.N.** — Director of Physical Education  
• **Mr. Santosh Kumar Naragund** — Senior Library Executive *(MLISc, BA)*  
• **Mr. Sagar S.** — Junior Library Executive *(MLISc, B.Com., KSET)*  
• **Mr. N. Mahesh** — Assistant Manager - HR & Admin`,
                    chips: ["Principal Profile", "Library Staff", "All Programmes", "Contact Us"]
                };

            case 'faculty_hanumaprakash':
                return {
                    text: `### 👨‍🏫 Dr. Hanumaprakash K.S.
* **Designation:** Professor of Law
* **Qualifications:** LL.M. (Commercial Law), Ph.D., KSET
* **Specialisation:** Commercial Law, Business Law Jurisprudence`,
                    chips: ["All Faculty", "5-Yr B.B.A. LL.B.", "5-Yr B.Com. LL.B."]
                };

            case 'faculty_thejesh':
                return {
                    text: `### 👨‍🏫 Mr. Thejesh K.M.
* **Designation:** Assistant Professor of Management
* **Qualifications:** M.Com., MBA, PGDFM
* **Specialisation:** Business Studies, Financial Management, Corporate Strategy`,
                    chips: ["All Faculty", "5-Yr B.B.A. LL.B."]
                };

            case 'faculty_runjhun':
                return {
                    text: `### 👩‍🏫 Ms. Runjhun Sharma
* **Designation:** Assistant Professor of Law
* **Qualifications:** B.A., LL.B., LL.M.
* **Specialisation:** Public International Law, Human Rights Jurisprudence`,
                    chips: ["All Faculty", "5-Yr B.A. LL.B."]
                };

            case 'director_sports':
                return {
                    text: `### 🏅 Mr. Mohan Kumar N.N. — Director of Physical Education
* **Role:** Director of Physical Education, RVILS
* **Official Recognition:** Appointed as **Referee at the Commonwealth Kabaddi Championship 2026**!
* **Campus Sports:** Oversees university selection trials and state/national tournaments in basketball, volleyball, cricket, badminton, chess, and yoga for KSLU competitions.`,
                    chips: ["Sports Activities", "Campus Facilities", "Faculty Directory"]
                };

            case 'library_staff':
                return {
                    text: `### 📚 RVILS Library Executives & Staff
* **Mr. Santosh Kumar Naragund** — Senior Library Executive *(MLISc, BA, 8 years experience, KOHA & LIBSOFT specialist, citation research trainer)*
* **Mr. Sagar S.** — Junior Library Executive *(MLISc, B.Com., KSET, Dewey Decimal & LC classification expert)*
* **Anitha M.K.** — Library Attender`,
                    chips: ["Library Overview", "SCC Online & Manupatra", "Faculty"]
                };

            case 'all_programs':
                return {
                    text: `### 🎓 Law Degree Programmes at RVILS (Affiliated to KSLU, Approved by BCI)
RVILS offers four distinguished law degree programmes:

1. **5-Year Integrated B.A. LL.B.** — Arts & Humanities with Law (10 Semesters | Max 7 years to complete)
2. **5-Year Integrated B.B.A. LL.B.** — Business Administration & Corporate Law (10 Semesters | Max 7 years to complete)
3. **5-Year Integrated B.Com. LL.B.** — Commerce, Taxation & Financial Law (10 Semesters | Max 7 years to complete)
4. **3-Year LL.B.** — Postgraduate Professional Law Degree for Graduates (6 Semesters | Max 7 years to complete)

**Official Percentage Criteria (per KSLU Norms):**
• General Merit: **45%** | OBC: **42%** | SC / ST / Cat-I: **40%**`,
                    chips: ["5-Yr B.A. LL.B.", "5-Yr B.B.A. LL.B.", "5-Yr B.Com. LL.B.", "3-Yr LL.B.", "Admissions 2026", "RVILS-LAT"]
                };

            case 'program_ba_llb':
                const ba = RVILS_DATA.programmes.find(p => p.id === 'ba_llb');
                return {
                    text: `### ⚖️ ${ba.name} — ${ba.title}
* **Duration:** ${ba.duration}
* **Maximum Period:** ${ba.maxCompletion}
* **Level:** ${ba.level}
* **Affiliation:** ${ba.affiliation}

**Official Eligibility Criteria (from rvils.edu.in):**
* **Academic:** ${ba.eligibility.academic}
* **Minimum Marks:** General Merit: **45%** | OBC: **42%** | SC/ST/Cat-I: **40%**

**Diverse Career Paths:**
${ba.careerPaths.map(cp => '• ' + cp).join('\n')}`,
                    chips: ["Admissions 2026", "RVILS-LAT", "3-Yr LL.B.", "Internships", "Contact Admissions"]
                };

            case 'program_bba_llb':
                const bba = RVILS_DATA.programmes.find(p => p.id === 'bba_llb');
                return {
                    text: `### 🏢 ${bba.name} — ${bba.title}
* **Duration:** ${bba.duration}
* **Maximum Period:** ${bba.maxCompletion}
* **Level:** ${bba.level}
* **Affiliation:** ${bba.affiliation}

**Official Eligibility Criteria (from rvils.edu.in):**
* **Academic:** ${bba.eligibility.academic}
* **Minimum Marks:** General Merit: **45%** | OBC: **42%** | SC/ST/Cat-I: **40%**

**Diverse Career Paths:**
${bba.careerPaths.map(cp => '• ' + cp).join('\n')}`,
                    chips: ["Admissions 2026", "RVILS-LAT", "5-Yr B.A. LL.B.", "Internships", "Contact Admissions"]
                };

            case 'program_bcom_llb':
                const bcom = RVILS_DATA.programmes.find(p => p.id === 'bcom_llb');
                return {
                    text: `### 📊 ${bcom.name} — ${bcom.title}
* **Duration:** ${bcom.duration}
* **Maximum Period:** ${bcom.maxCompletion}
* **Level:** ${bcom.level}
* **Affiliation:** ${bcom.affiliation}

**Official Eligibility Criteria (from rvils.edu.in):**
* **Academic:** ${bcom.eligibility.academic}
* **Minimum Marks:** General Merit: **45%** | OBC: **42%** | SC/ST/Cat-I: **40%**

**Diverse Career Paths:**
${bcom.careerPaths.map(cp => '• ' + cp).join('\n')}`,
                    chips: ["Admissions 2026", "RVILS-LAT", "All Programmes", "Contact Admissions"]
                };

            case 'program_3yr_llb':
                const llb = RVILS_DATA.programmes.find(p => p.id === 'llb_3yr');
                return {
                    text: `### 🏛️ ${llb.name} — ${llb.title}
* **Duration:** ${llb.duration}
* **Maximum Period:** ${llb.maxCompletion}
* **Degree Level:** ${llb.level}
* **Affiliation:** ${llb.affiliation}

**Official Eligibility Criteria (from rvils.edu.in):**
* **Academic:** ${llb.eligibility.academic}
* **Minimum Marks:** General Merit: **45%** | OBC: **42%** | SC/ST/Cat-I: **40%**

**Diverse Career Paths:**
${llb.careerPaths.map(cp => '• ' + cp).join('\n')}`,
                    chips: ["Admissions 2026", "RVILS-LAT", "Moot Court", "Library", "Contact Admissions"]
                };

            case 'career_paths':
                return {
                    text: `### 🚀 Diverse Career Pathways for RVILS Graduates
Legal education at RVILS prepares graduates for multifaceted career trajectories:

• **Litigation & Judiciary:** Advocate (Civil, Criminal, Constitutional, Family Law), Civil Judge / Judicial Magistrate, Public Prosecutor, Government Pleader.
• **Judicial Research & Courts:** Law Clerk / Research Assistant to Hon'ble Judges of High Courts and the Supreme Court of India.
• **Corporate Legal Advisory:** In-House Legal Counsel, M&A Specialist, Compliance Officer, Commercial Arbitrator in Tier-1 & Tier-2 law firms.
• **Civil Services & Public Policy:** UPSC / KPSC civil services, public policy analyst, Human Rights Commission advisory.
• **Armed Forces:** Judge Advocate General (JAG) Branch – Indian Army.
• **Academics & Research:** Assistant Professor (after LL.M. & NET), Research Fellow, Ph.D. Scholar in international law reviews.`,
                    chips: ["All Programmes", "Internships", "Placement Cell", "Admissions 2026"]
                };

            case 'admissions':
            case 'rvils_lat':
                return {
                    text: `### 📋 Admissions 2026 – 27: The Process (Official Website)
*"The admission process is transparent, merit-based and designed to identify committed individuals aspiring to excel in the legal profession."*

**The 6-Step Selection Lifecycle:**
1. **Application Submission:** Submit the prescribed form with the required documents as per KSLU eligibility norms.
2. **RVILS–LAT (Law Aptitude Test):** Entrance assessment measuring:
   • Legal Aptitude & Reasoning
   • General Awareness & Constitution of India
   • Analytical & Logical Reasoning
   • English Proficiency & Comprehension
3. **Institutional Interaction:** Attend briefing session with admissions panel (accompanied by parents).
4. **Personal Interview:** Evaluation of interest in law along with clarity and communication skills.
5. **Offer of Admission:** Issued based on cumulative performance.
6. **Admission Confirmation:** Completion of fee payment and document verification.

📞 **Admissions Helpline:** \`+91-80-69018952/53\`  
✉️ **Email:** \`rvils@rvei.edu.in\``,
                    chips: ["Open Enquiry Form", "Eligibility Criteria", "All Programmes", "Campus Address"]
                };

            case 'eligibility':
                return {
                    text: `### ⚖️ Official Eligibility Criteria (from rvils.edu.in)
**For 5-Year Integrated Courses (B.A. LL.B., B.B.A. LL.B., B.Com. LL.B.):**
* **Academic:** 10+2 / Pre-University (PUC) or equivalent from a recognized board (Arts, Science, or Commerce).
* **General Merit (GM):** Minimum **45%** aggregate marks.
* **OBC Category:** Minimum **42%** aggregate marks.
* **SC / ST / Cat-I:** Minimum **40%** aggregate marks.

**For 3-Year LL.B. Course:**
* **Academic:** Bachelor's Degree in any discipline from a recognized University.
* **General Merit (GM):** Minimum **45%** aggregate marks.
* **OBC Category:** Minimum **42%** aggregate marks.
* **SC / ST / Cat-I:** Minimum **40%** aggregate marks.

*Maximum completion period: 7 Years from admission for both 5-year and 3-year programs.*`,
                    chips: ["Admissions 2026", "RVILS-LAT", "All Programmes", "Contact Desk"]
                };

            case 'fees':
                return {
                    text: `### 💰 Official Fee Structure Guidance (from rvils.edu.in)
* **Official Policy:** Tuition fees, examination dues, and registration charges are determined strictly according to **Karnataka State Law University (KSLU)** norms and **RSST Trust** guidelines.
* **No Speculative Figures:** In accordance with our official website guidelines, exact fee slabs for Karnataka vs Non-Karnataka quotas are shared directly through official prospectus and admission counselling.
* **Contact the Admissions & Finance Desk:** Call \`+91-80-69018952/53\` or email \`rvils@rvei.edu.in\` to receive the official fee schedule for 2026–27.`,
                    chips: ["Admissions 2026", "Open Enquiry Form", "Scholarships", "Contact Desk"]
                };

            case 'scholarships':
                return {
                    text: `### 🎓 Scholarships & Concessions (Official Portals)
RVILS facilitates multiple government and institutional scholarship schemes:
• **Government Post-Matric Scholarships:** For SC/ST and OBC students through the Karnataka State Scholarship Portal (SSP).
• **National Scholarship Portal (NSP):** Central schemes for minority and merit-cum-means scholars.
• **Vidyasiri Scheme:** Fee concession and hostel stipend schemes for eligible Karnataka students.
• **RSST Trust Concessions:** Need-based and merit-based institutional fee assistance for deserving law students.`,
                    chips: ["Fees Guidance", "Admissions 2026", "Contact Us"]
                };

            case 'moot_court':
                return {
                    text: `### ⚖️ RVILS Moot Court Academy & Hall
* **Air-Conditioned Moot Court Hall:** State-of-the-art facility replicating appellate and trial courtrooms.
* **Hands-on Advocacy:** Memorial drafting bootcamps, citation indexing, oral argument delivery, and courtroom decorum training.
* **Competitions:** Annual internal ranking moots and institutional sponsorship in prestigious national and international moot court competitions.
* **Judicial Mentorship:** Sitting and retired High Court judges participate as guest bench evaluators during simulated court trials.`,
                    chips: ["Legal Aid Clinic", "Library", "5-Yr B.A. LL.B.", "Admissions 2026"]
                };

            case 'legal_aid':
                const lac = RVILS_DATA.legalServicesClinic;
                return {
                    text: `### 🤝 ${lac.title} (Official Details)
* **Aim:** *"${lac.aim}"*

**Services Provided:**
${lac.services.map(s => '• ' + s).join('\n')}

**Key Milestone Outreach:**
${lac.milestoneOutreach.map(mo => '• ' + mo).join('\n')}`,
                    chips: ["Moot Court", "Campus Facilities", "All Programmes", "Contact Us"]
                };

            case 'internships':
            case 'placements':
                const pl = RVILS_DATA.internshipsAndPlacements;
                return {
                    text: `### 💼 Internships & Placements (Official Framework)
* **Total Mandatory Duration:** **${pl.compulsoryInternshipDuration}**
* **Semester Limit:** ${pl.semesterLimits}

**Mandatory 4 Exposures (During Course Period):**
${pl.mandatoryExposures.map(me => '• ' + me).join('\n')}

**Evaluation:** Maintenance of internship diary in prescribed format with viva voce evaluation.

**Placement Cell:**
${pl.placementCell}`,
                    chips: ["Career Paths", "5-Yr B.A. LL.B.", "3-Yr LL.B.", "Moot Court"]
                };

            case 'library':
                const lib = RVILS_DATA.library;
                return {
                    text: `### 📚 ${lib.title}
*${lib.vision}*

**Unique Highlight:**
• **${lib.specialHighlight}**

**Electronic Legal Databases:**
${lib.digitalDatabases.map(db => '• ' + db).join('\n')}

**Classification & Automation Systems:**
• ${lib.systems}

**Citation Handbooks Available:**
${lib.citationHandbooks.map(ch => '• ' + ch).join('\n')}

**Previous Question Papers:**
• ${lib.questionPapers}`,
                    chips: ["Library Staff", "Moot Court", "All Programmes", "Admissions 2026"]
                };

            case 'constitution_manuscript':
                return {
                    text: `### 📜 Original Manuscript of the Constitution of India
The RVILS Library houses a rare and esteemed **copy of the original Manuscript of the Constitution of India**, complete with illustrations and signatures of the framers of the Constitution. It serves as an inspirational historical centerpiece for our legal scholars.`,
                    chips: ["Library Overview", "Legal Databases", "Faculty"]
                };

            case 'legal_databases':
                return {
                    text: `### 💻 Digital Legal Research Databases (from rvils.edu.in)
The RVILS Library & Information Centre provides institutional subscriptions to:
1. **SCC Online** — Established in 1996, India’s leading online legal research database covering judgments of the Supreme Court, High Courts, tribunals, commissions, and central/state statutes.
2. **Manupatra** — Comprehensive digital legal database with analytical case trackers, commentaries, and international law reviews.
3. Accessible through high-speed computer terminals in the digital legal research lab.`,
                    chips: ["Library Overview", "Citation Guides", "Moot Court"]
                };

            case 'citation_guides':
                return {
                    text: `### 📖 Citation Handbooks & Reference Manuals in RVILS Library
The library provides standardized citation handbooks to support research and moot court memorial drafting:
• **The Bluebook Uncovered - Legal Citation (22nd Edition)**
• **APA and MLA Citation Format 2024**
• **Bluebook Citation Primer**
• **OSCOLA (4th Edition 2012 & 2006 Citing International Law)**
• **OSCOLA Style Citation Guide (2017)**`,
                    chips: ["Library Overview", "Moot Court", "Legal Databases"]
                };

            case 'question_papers':
                return {
                    text: `### 📑 Previous Year KSLU Question Papers Repository
The RVILS Library maintains an active archive of previous year question papers from Karnataka State Law University (KSLU) for:
• B.A. LL.B. (5-Year Degree Course)
• B.B.A. LL.B. (5-Year Degree Course)
• B.Com. LL.B. (5-Year Degree Course)
• LL.B. (3-Year Degree Course)
Students can consult digital or physical copies at the library circulation desk.`,
                    chips: ["Library Overview", "All Programmes", "Faculty"]
                };

            case 'campus_facilities':
            case 'hostels':
                const cf = RVILS_DATA.campusLife;
                return {
                    text: `### 🏛️ Campus Infrastructure & Student Amenities
**Location:** ${cf.location}

**Campus Facilities:**
${cf.facilities.map(f => '• ' + f).join('\n')}

**Statutory Institutional Committees:**
${cf.institutionalCommittees.map(c => '• ' + c).join('\n')}`,
                    chips: ["Location & Directions", "Sports Activities", "Library", "Admissions 2026"]
                };

            case 'sports':
                return {
                    text: `### 🏅 Sports & Athletics at RVILS
*"Make Your Case, on Every Field"*
* Students represent RVILS in basketball, volleyball, cricket, badminton, chess, table tennis, and yoga in KSLU inter-collegiate tournaments.
* Under the leadership of **Mr. Mohan Kumar N.N.** (Director of Physical Education), who was appointed as **Referee at the Commonwealth Kabaddi Championship 2026**.
* Annual sports day, athletic meets, and intra-college tournaments.`,
                    chips: ["Campus Facilities", "Cultural Activities", "Faculty Directory"]
                };

            case 'cultural_activities':
                return {
                    text: `### 🎭 Cultural Activities & Expression
*"Where Expression Takes the Stage"*
The Cultural Committee of RVILS coordinates dynamic campus events:
• **Freshers' Day & Ethnic Celebrations**
• **Music, Dance & Theatrical Performances**
• **Annual College Fest & Talent Shows**
• Inter-collegiate participation across Bengaluru legal institutions.`,
                    chips: ["Student Activities", "Campus Facilities", "Alumni Reflections"]
                };

            case 'student_activities':
                return {
                    text: `### 🌟 Co-Curricular Student Initiatives
Student life at RVILS extends far beyond classroom boundaries:
${RVILS_DATA.studentActivities.initiatives.map(i => '• **' + i).join('\n')}

*Regular academic events are held in the Mangala Mantapa Auditorium on campus.*`,
                    chips: ["Moot Court", "Legal Services Clinic", "Sports", "Campus Facilities"]
                };

            case 'nss':
                return {
                    text: `### 🤝 National Service Scheme (NSS) Unit
The NSS Unit at RVILS leads community outreach and rural development:
• Educational visits and stationery distribution at Government Urdu Higher Primary School, Gurupanna Palya, Bengaluru (presided over by Principal Dr. Anjina Reddy K.R.).
• Village socio-legal surveys, environmental sanitation, and social awareness drives.`,
                    chips: ["Youth Red Cross", "Legal Aid Clinic", "Student Activities"]
                };

            case 'youth_red_cross':
                return {
                    text: `### 🩸 Youth Red Cross (YRC) Unit
The Youth Red Cross Unit at RVILS conducts humanitarian drives:
• Regular voluntary blood donation camps in association with certified blood banks.
• First-aid training workshops and health hygiene awareness programs.`,
                    chips: ["NSS Unit", "Legal Aid Clinic", "Campus Facilities"]
                };

            case 'anti_ragging':
            case 'icc':
            case 'grievance_cell':
            case 'sc_st_cell':
                return {
                    text: `### 🛡️ Statutory Student Committees & Welfare
RVILS maintains a zero-tolerance policy towards harassment and inequality:
• **Anti-Ragging Committee:** Strictly implements UGC and BCI anti-ragging mandates.
• **Internal Complaints Committee (ICC):** Ensures gender sensitization and redressal of gender-based grievances.
• **Student Grievance Redressal Cell:** Handles student academic and administrative complaints.
• **SC / ST Cell:** Monitors implementation of reservation policies and student welfare.`,
                    chips: ["Campus Facilities", "Board of Management", "Principal Profile"]
                };

            case 'rv_law_journal':
            case 'samarthana_magazine':
            case 'rvils_newsletter':
            case 'research':
                const r = RVILS_DATA.researchAndPublications;
                return {
                    text: `### 📖 Research & Publications (from rvils.edu.in)
**Official Institutional Publications:**
${r.publications.map(p => '• ' + p).join('\n')}

**Conferences & Faculty Development:**
• Regular Seminars, National Conferences, Workshops, and Faculty Development Programmes (FDPs).
• Active collaborations with Karnataka State Legal Services Authority and judicial bodies.`,
                    chips: ["All Programmes", "Library", "Faculty Directory"]
                };

            case 'affiliation':
                return {
                    text: `### 🏛️ University Affiliation & Statutory Approvals
* **Affiliating University:** **Karnataka State Law University (KSLU)**, Hubballi — Karnataka’s apex legal university.
* **Statutory Body Approval:** **Bar Council of India (BCI)**, New Delhi.
* **Degree Conferred:** Recognized across all courts of law in India, allowing enrollment as an Advocate with any State Bar Council.
* **Governing Body:** Rashtreeya Sikshana Samithi Trust (RSST).`,
                    chips: ["Board of Management", "All Programmes", "Admissions 2026", "Contact Us"]
                };

            case 'alumni':
                return {
                    text: `### 🎓 RVILS Alumni Network & Reflections
RVILS graduates have built distinguished careers in the High Courts, District Courts, corporate law firms, and civil services.

**Alumni Voice:**
*"RVILS gave me more than just a legal education. It gave me clarity, confidence, and community. From moot courts and scholarly discussions with visiting scholars to supportive faculty, the environment constantly pushed me to grow."*  
— *B.B.A. LL.B. Graduate*`,
                    chips: ["All Programmes", "Placement Cell", "Admissions 2026"]
                };

            case 'contact':
                const inst = RVILS_DATA.institution;
                return {
                    text: `### 📍 Contact RVILS (Official Website Details)
* **Address:** ${inst.address}
* **Landmarks:** 22nd Cross, 3rd Block, Jayanagar (near South End Circle Metro Station)
* **Phone No.:** \`${inst.phone}\`
* **E-mail:** \`${inst.email}\`
* **Official Website:** [rvils.edu.in](https://rvils.edu.in)`,
                    chips: ["Open Enquiry Form", "Admissions 2026", "All Programmes", "Board of Management"]
                };

            case 'lead_inquiry':
                return {
                    text: `### 📝 Request Information & Admissions Call
To receive official prospectus information, verify course eligibility, or schedule a campus visit, click the button below to submit your details. Our admissions counsellors will contact you directly.`,
                    chips: ["Open Enquiry Form", "Admissions 2026", "All Programmes", "Campus Address"]
                };

            default:
                // Fallback: Deep In-Memory Search over 44 Scraped Website Pages
                const searchResult = searchWebsiteCorpus(query);
                if (searchResult) {
                    return {
                        text: `### 🔎 Verified Record from \`rvils.edu.in\`
**Source Page:** [${searchResult.title}](${searchResult.url})

> "${searchResult.snippet.substring(0, 420)}..."

*This record was retrieved directly from the official RVILS website portal.*`,
                        chips: ["Admissions 2026", "All Programmes", "Faculty Directory", "Contact Us"]
                    };
                }

                return {
                    text: tone === 'funny'
                        ? "Hmm, that specific motion isn't recorded on the official RVILS website! 🧐 Could you rephrase your question, or pick from our verified topics below?"
                        : "I am designed to provide factual information verified strictly from the official RVILS website (\`rvils.edu.in\`). I could not find a verified record for that query. You can select one of our verified academic topics below.",
                    chips: ["Admissions 2026", "5-Yr B.A. LL.B.", "3-Yr LL.B.", "RVILS-LAT", "Faculty", "Contact Us"]
                };
        }
    }

    /* =============== UI DOM BUILDER & WIDGET INJECTION =============== */
    function injectChatbotDOM() {
        if (document.getElementById('rvils-chatbot-root')) return;

        const root = document.createElement('div');
        root.id = 'rvils-chatbot-root';
        root.innerHTML = \`
            <!-- Floating Action Button -->
            <button id="rvilsChatFab" class="rvils-chat-fab" aria-label="Open RVILS Chatbot" title="Chat with RVILS Assistant">
                <span class="rvils-fab-badge">1</span>
                <span class="rvils-fab-open-icon">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                </span>
                <span class="rvils-fab-close-icon" style="display:none;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </span>
            </button>

            <!-- Chat Window Container -->
            <div id="rvilsChatWindow" class="rvils-chat-window" style="display:none;" role="dialog" aria-modal="true" aria-label="RVILS Virtual Assistant">
                <!-- Header -->
                <div class="rvils-chat-header">
                    <div class="rvils-header-info">
                        <div class="rvils-avatar-wrapper">
                            <img src="rvils_logo.png" alt="RVILS Logo" class="rvils-header-logo" onerror="this.src='logo.png'; this.onerror=null;">
                            <span class="rvils-status-indicator"></span>
                        </div>
                        <div>
                            <div class="rvils-header-title">RVILS Legal Assistant</div>
                            <div class="rvils-header-subtitle">Official Verified Helpdesk · rvils.edu.in</div>
                        </div>
                    </div>
                    <div class="rvils-header-actions">
                        <button id="rvilsToneToggle" class="rvils-action-btn" title="Toggle Tone (Professional / Friendly)">
                            <span id="rvilsToneLabel">PRO</span>
                        </button>
                        <button id="rvilsSoundToggle" class="rvils-action-btn" title="Toggle Sound">
                            <svg id="rvilsSoundIcon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                            </svg>
                        </button>
                        <button id="rvilsExportBtn" class="rvils-action-btn" title="Export Conversation">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                        </button>
                        <button id="rvilsChatClose" class="rvils-action-btn" title="Close Chat">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- Messages Stream -->
                <div id="rvilsMessages" class="rvils-messages"></div>

                <!-- Quick Replies Section -->
                <div id="rvilsChips" class="rvils-chips-container"></div>

                <!-- Input Footer -->
                <form id="rvilsChatForm" class="rvils-chat-footer">
                    <button type="button" id="rvilsVoiceBtn" class="rvils-voice-btn" title="Voice Input">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                            <line x1="12" y1="19" x2="12" y2="23"></line>
                            <line x1="8" y1="23" x2="16" y2="23"></line>
                        </svg>
                    </button>
                    <input type="text" id="rvilsChatInput" class="rvils-chat-input" placeholder="Ask about B.A. LL.B, 3-Yr LL.B, admissions..." autocomplete="off">
                    <button type="submit" id="rvilsSendBtn" class="rvils-send-btn" title="Send Message">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13"></line>
                            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                        </svg>
                    </button>
                </form>
            </div>

            <!-- Lead Capture Modal -->
            <div id="rvilsLeadModal" class="rvils-modal-backdrop" style="display:none;">
                <div class="rvils-modal-card">
                    <div class="rvils-modal-header">
                        <div>
                            <div class="rvils-modal-title">Request RVILS Information & Call</div>
                            <div class="rvils-modal-subtitle">Official Admissions Desk Contact</div>
                        </div>
                        <button id="rvilsModalClose" class="rvils-modal-close-btn">&times;</button>
                    </div>
                    <form id="rvilsLeadForm" class="rvils-lead-form">
                        <div class="rvils-form-group">
                            <label>Full Name *</label>
                            <input type="text" id="rvilsLeadName" required placeholder="e.g. Adv. Rahul Sharma">
                        </div>
                        <div class="rvils-form-group">
                            <label>Phone Number *</label>
                            <input type="tel" id="rvilsLeadPhone" required placeholder="+91 98765 43210" pattern="[0-9+ ]{10,14}">
                        </div>
                        <div class="rvils-form-group">
                            <label>Email Address *</label>
                            <input type="email" id="rvilsLeadEmail" required placeholder="rahul@example.com">
                        </div>
                        <div class="rvils-form-group">
                            <label>Programme of Interest *</label>
                            <select id="rvilsLeadProgram" required>
                                <option value="5-Year B.A. LL.B.">5-Year B.A. LL.B.</option>
                                <option value="5-Year B.B.A. LL.B.">5-Year B.B.A. LL.B.</option>
                                <option value="5-Year B.Com. LL.B.">5-Year B.Com. LL.B.</option>
                                <option value="3-Year LL.B. (Graduates)">3-Year LL.B. (Graduates)</option>
                            </select>
                        </div>
                        <div class="rvils-form-group">
                            <label>Current City / State</label>
                            <input type="text" id="rvilsLeadCity" placeholder="e.g. Bengaluru, Karnataka">
                        </div>
                        <button type="submit" id="rvilsLeadSubmit" class="rvils-lead-submit-btn">Submit Enquiry</button>
                    </form>
                </div>
            </div>
        \`;
        document.body.appendChild(root);
    }

    /* =============== AUDIO FEEDBACK =============== */
    function playBeep(freq = 600, duration = 0.08) {
        if (!soundEnabled) return;
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;
            const ctx = new AudioCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            gain.gain.setValueAtTime(0.04, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + duration);
        } catch (e) {}
    }

    /* =============== MARKDOWN FORMATTER =============== */
    function renderMarkdown(md) {
        if (!md) return '';
        let html = md
            .replace(/### (.*?)\\n/g, '<h4 class="rvils-msg-title">$1</h4>')
            .replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>')
            .replace(/\\*(.*?)\\*/g, '<em>$1</em>')
            .replace(/\`([^\`]+)\`/g, '<code class="rvils-code">$1</code>')
            .replace(/\\[([^\\]]+)\\]\\(([^)]+)\\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
            .replace(/\\n\\n/g, '<br><br>')
            .replace(/\\n/g, '<br>');
        return html;
    }

    /* =============== MESSAGE APPENDER =============== */
    function appendMessage(sender, text, chips = []) {
        const stream = document.getElementById('rvilsMessages');
        if (!stream) return;

        const msgDiv = document.createElement('div');
        msgDiv.className = \`rvils-message rvils-message-\${sender}\`;

        const bubble = document.createElement('div');
        bubble.className = 'rvils-bubble';
        bubble.innerHTML = renderMarkdown(text);
        msgDiv.appendChild(bubble);

        if (sender === 'bot') {
            const timeSpan = document.createElement('div');
            timeSpan.className = 'rvils-msg-meta';
            const now = new Date();
            timeSpan.innerHTML = \`
                <span>\${now.getHours().toString().padStart(2, '0')}:\${now.getMinutes().toString().padStart(2, '0')}</span>
                <span class="rvils-feedback-actions">
                    <button class="rvils-fb-btn" title="Helpful" onclick="this.classList.add('active');">👍</button>
                    <button class="rvils-fb-btn" title="Needs Improvement" onclick="this.classList.add('active');">👎</button>
                </span>
            \`;
            msgDiv.appendChild(timeSpan);
        }

        stream.appendChild(msgDiv);
        stream.scrollTop = stream.scrollHeight;

        renderChips(chips);

        if (window.rvilsTelemetry && typeof window.rvilsTelemetry.logEvent === 'function') {
            window.rvilsTelemetry.logEvent(sender === 'bot' ? 'bot_reply' : 'user_message', {
                text: text.substring(0, 150),
                sender: sender
            });
        }

        if (sender === 'bot' && speechEnabled && 'speechSynthesis' in window) {
            try {
                const plainText = text.replace(/[#*\`_\\[\\]()]/g, '');
                const utterance = new SpeechSynthesisUtterance(plainText.substring(0, 200));
                utterance.lang = 'en-IN';
                window.speechSynthesis.speak(utterance);
            } catch (e) {}
        }
    }

    function renderChips(chips = []) {
        const container = document.getElementById('rvilsChips');
        if (!container) return;
        container.innerHTML = '';
        if (!chips || chips.length === 0) return;

        chips.forEach(chip => {
            const btn = document.createElement('button');
            btn.className = 'rvils-chip-btn';
            btn.textContent = chip;
            btn.type = 'button';
            btn.onclick = () => {
                playBeep(700, 0.05);
                if (chip === 'Open Enquiry Form' || chip === 'Book a Consultation') {
                    openLeadModal();
                    return;
                }
                const input = document.getElementById('rvilsChatInput');
                if (input) {
                    input.value = chip;
                    handleUserSubmit(chip);
                }
            };
            container.appendChild(btn);
        });
    }

    /* =============== MESSAGE SUBMISSION HANDLER =============== */
    function handleUserSubmit(query) {
        if (!query || !query.trim()) return;
        const clean = query.trim();

        appendMessage('user', clean);
        const input = document.getElementById('rvilsChatInput');
        if (input) input.value = '';

        playBeep(450, 0.08);

        const mod = checkModeration(clean);
        if (mod.blocked) {
            setTimeout(() => {
                appendMessage('bot', getModerationResponse(mod.type), ["Admissions 2026", "All Programmes", "Faculty Directory", "Contact Us"]);
            }, 300);
            return;
        }

        const intent = matchIntent(clean);

        const stream = document.getElementById('rvilsMessages');
        const typingIndicator = document.createElement('div');
        typingIndicator.id = 'rvilsTyping';
        typingIndicator.className = 'rvils-message rvils-message-bot rvils-typing-wrap';
        typingIndicator.innerHTML = \`
            <div class="rvils-bubble rvils-typing-bubble">
                <span class="rvils-dot"></span>
                <span class="rvils-dot"></span>
                <span class="rvils-dot"></span>
            </div>
        \`;
        stream.appendChild(typingIndicator);
        stream.scrollTop = stream.scrollHeight;

        setTimeout(() => {
            if (document.getElementById('rvilsTyping')) {
                document.getElementById('rvilsTyping').remove();
            }
            const res = generateResponse(intent, clean);
            appendMessage('bot', res.text, res.chips);
            playBeep(850, 0.09);
        }, 350);
    }

    /* =============== LEAD MODAL HELPERS =============== */
    function openLeadModal() {
        const modal = document.getElementById('rvilsLeadModal');
        if (modal) {
            modal.style.display = 'flex';
            if (window.rvilsTelemetry) {
                window.rvilsTelemetry.logEvent('lead_modal_opened', {});
            }
        }
    }

    function closeLeadModal() {
        const modal = document.getElementById('rvilsLeadModal');
        if (modal) modal.style.display = 'none';
    }

    /* =============== SPEECH RECOGNITION =============== */
    function initVoice() {
        const btn = document.getElementById('rvilsVoiceBtn');
        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRec || !btn) {
            if (btn) btn.style.display = 'none';
            return;
        }

        const recognition = new SpeechRec();
        recognition.continuous = false;
        recognition.lang = 'en-IN';
        recognition.interimResults = false;

        btn.onclick = () => {
            try {
                recognition.start();
                btn.classList.add('rvils-voice-listening');
            } catch (e) {
                recognition.stop();
                btn.classList.remove('rvils-voice-listening');
            }
        };

        recognition.onresult = (e) => {
            const transcript = e.results[0][0].transcript;
            const input = document.getElementById('rvilsChatInput');
            if (input) {
                input.value = transcript;
                handleUserSubmit(transcript);
            }
            btn.classList.remove('rvils-voice-listening');
        };

        recognition.onerror = () => {
            btn.classList.remove('rvils-voice-listening');
        };

        recognition.onend = () => {
            btn.classList.remove('rvils-voice-listening');
        };
    }

    /* =============== EXPORT CHAT TRANSCRIPT =============== */
    function exportTranscript() {
        const messages = document.querySelectorAll('.rvils-message');
        if (!messages || messages.length === 0) return;

        let transcript = \`========================================\\n\`;
        transcript += \`MKPM RV Institute of Legal Studies (RVILS)\\n\`;
        transcript += \`Official Helpdesk Transcript (100% Website Verified)\\n\`;
        transcript += \`Date: \${new Date().toLocaleString()}\\n\`;
        transcript += \`========================================\\n\\n\`;

        messages.forEach(m => {
            const isUser = m.classList.contains('rvils-message-user');
            const bubble = m.querySelector('.rvils-bubble');
            const text = bubble ? bubble.innerText : '';
            transcript += \`\${isUser ? '[VISITOR]' : '[RVILS BOT]'}: \${text}\\n\\n\`;
        });

        const blob = new Blob([transcript], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = \`RVILS_Consultation_\${Date.now()}.txt\`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /* =============== INITIALIZATION & EVENT BINDINGS =============== */
    function initChatbot() {
        injectChatbotDOM();

        const fab = document.getElementById('rvilsChatFab');
        const win = document.getElementById('rvilsChatWindow');
        const closeBtn = document.getElementById('rvilsChatClose');
        const form = document.getElementById('rvilsChatForm');
        const input = document.getElementById('rvilsChatInput');
        const toneBtn = document.getElementById('rvilsToneToggle');
        const toneLabel = document.getElementById('rvilsToneLabel');
        const soundBtn = document.getElementById('rvilsSoundToggle');
        const exportBtn = document.getElementById('rvilsExportBtn');
        const modalClose = document.getElementById('rvilsModalClose');
        const leadForm = document.getElementById('rvilsLeadForm');

        function toggleChat(open) {
            chatOpen = (typeof open === 'boolean') ? open : !chatOpen;
            if (chatOpen) {
                win.style.display = 'flex';
                fab.querySelector('.rvils-fab-open-icon').style.display = 'none';
                fab.querySelector('.rvils-fab-close-icon').style.display = 'inline-block';
                fab.querySelector('.rvils-fab-badge').style.display = 'none';
                if (input) setTimeout(() => input.focus(), 150);
                playBeep(520, 0.08);

                const stream = document.getElementById('rvilsMessages');
                if (stream && stream.children.length === 0) {
                    appendMessage('bot', \`Hello! Welcome to **MKPM RV Institute of Legal Studies (RVILS)**. ⚖️

All information is 100% verified directly from our official portal (\`rvils.edu.in\`). We are affiliated with **Karnataka State Law University (KSLU)** and approved by the **Bar Council of India (BCI)**.

How can I assist you with your legal education today?\`, [
                        "Admissions 2026",
                        "5-Yr B.A. LL.B.",
                        "5-Yr B.B.A. LL.B.",
                        "3-Yr LL.B.",
                        "RVILS-LAT",
                        "Faculty",
                        "Library",
                        "Contact Us"
                    ]);
                }

                if (window.rvilsTelemetry) {
                    window.rvilsTelemetry.logEvent('widget_opened', {});
                }
            } else {
                win.style.display = 'none';
                fab.querySelector('.rvils-fab-open-icon').style.display = 'inline-block';
                fab.querySelector('.rvils-fab-close-icon').style.display = 'none';
                playBeep(380, 0.08);

                if (window.rvilsTelemetry) {
                    window.rvilsTelemetry.logEvent('widget_closed', {});
                }
            }
        }

        if (fab) fab.onclick = () => toggleChat();
        if (closeBtn) closeBtn.onclick = () => toggleChat(false);

        if (form) {
            form.onsubmit = (e) => {
                e.preventDefault();
                if (input && input.value) {
                    handleUserSubmit(input.value);
                }
            };
        }

        if (toneBtn && toneLabel) {
            toneBtn.onclick = () => {
                tone = (tone === 'pro') ? 'funny' : 'pro';
                toneLabel.textContent = tone.toUpperCase();
                toneBtn.title = \`Switch to \${tone === 'pro' ? 'Friendly' : 'Professional'} Tone\`;
                playBeep(650, 0.05);
            };
        }

        if (soundBtn) {
            soundBtn.onclick = () => {
                soundEnabled = !soundEnabled;
                soundBtn.style.opacity = soundEnabled ? '1' : '0.4';
                playBeep(soundEnabled ? 750 : 300, 0.06);
            };
        }

        if (exportBtn) exportBtn.onclick = exportTranscript;
        if (modalClose) modalClose.onclick = closeLeadModal;

        if (leadForm) {
            leadForm.onsubmit = (e) => {
                e.preventDefault();
                const leadData = {
                    name: document.getElementById('rvilsLeadName')?.value || '',
                    phone: document.getElementById('rvilsLeadPhone')?.value || '',
                    email: document.getElementById('rvilsLeadEmail')?.value || '',
                    program: document.getElementById('rvilsLeadProgram')?.value || '',
                    city: document.getElementById('rvilsLeadCity')?.value || '',
                    source: 'chatbot_modal',
                    timestamp: new Date().toISOString()
                };

                if (window.rvilsTelemetry && typeof window.rvilsTelemetry.submitLead === 'function') {
                    window.rvilsTelemetry.submitLead(leadData);
                }

                closeLeadModal();
                appendMessage('bot', \`Thank you, **\${leadData.name}**! 🎓 Your enquiry for **\${leadData.program}** has been received. Our RVILS Admissions Office will contact you at \\\`\${leadData.phone}\\\`.\`, ["Admissions 2026", "Campus Address", "Faculty"]);
                playBeep(900, 0.15);
            };
        }

        initVoice();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initChatbot);
    } else {
        initChatbot();
    }

    window.RVILSChatbot = {
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
        matchIntent: matchIntent,
        checkModeration: checkModeration,
        knowledgeBase: RVILS_DATA,
        pageCorpus: PAGE_CORPUS
    };

})();
`;

fs.writeFileSync(path.join(__dirname, 'script.js'), scriptTemplate, 'utf-8');
console.log('Successfully generated full production script.js!');

