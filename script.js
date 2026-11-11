/* RVILS Chatbot v3.1.0 — Smart Client-Side NLP Engine & Knowledge Base
 * 100% PURE OFFICIAL WEBSITE EXTRACTION from https://rvils.edu.in/
 * Verified Screen Records: 44 Unique Pages Captured in screenshots/
 * Institution: MKPM RV Institute of Legal Studies (RVILS), Bengaluru
 * Affiliation: Karnataka State Law University (KSLU), Hubballi | Approved by Bar Council of India (BCI)
 * Governing Body: Rashtreeya Sikshana Samithi Trust (RSST)
 */

(function () {
    'use strict';

    // 1. Exit immediately if Elementor or any page builder editor is active
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
            .split(/\s+/)
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
            'boyfriend', 'relationship', 'married', 'wife of', 'husband of', 'someone\'s phone',
            'whatsapp number', 'instagram id', 'social media of', 'facebook of'
        ]
    };

    function checkModeration(input) {
        const lower = input.toLowerCase();
        const isBlocked = (list) => {
            for (const word of list) {
                const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp('(?:^|\\s)' + escaped + '(?=\\s|$|[?!.])', 'i');
                if (regex.test(lower)) return true;
            }
            return false;
        };

        if (isBlocked(BLOCKED.abusive)) return { blocked: true, type: 'abusive' };
        if (isBlocked(BLOCKED.conspiracy)) return { blocked: true, type: 'conspiracy' };
        if (isBlocked(BLOCKED.private)) return { blocked: true, type: 'private' };

        // Privacy Guard: Block unrequested 10-digit personal mobile numbers (excluding official RVILS helpline)
        const strippedDigits = lower.replace(/[^0-9]/g, '');
        if (strippedDigits.length >= 10 && !lower.includes('69018952') && !lower.includes('69018953')) {
            return { blocked: true, type: 'private' };
        }

        return { blocked: false };
    }

    function getModerationResponse(type) {
        const responses = {
            abusive: {
                funny: "Whoa counsel! ⚖️ Let's uphold courtroom decorum! I'm here to provide verified RVILS legal education info, not trade objections! 😅",
                pro: "⚠️ I am unable to respond to inappropriate or offensive language. Please maintain professional courtesy. I am here to assist with legitimate academic enquiries regarding verified MKPM RV Institute of Legal Studies programmes and admissions."
            },
            conspiracy: {
                funny: "Nice theory! 🛸 But in legal studies we only rely on admissible evidence and verified RVILS website facts! Ask me about courses or admissions! 😄",
                pro: "⚠️ I am designed to provide factual, verified information from the official RVILS website only. I cannot engage with conspiracy theories or unverified claims. Please ask about our law programs, faculty, or admissions."
            },
            private: {
                funny: "That's privileged information under attorney-client privilege! 🔒 I protect private records and personal data. Let's discuss public campus info! 👨‍⚖️",
                pro: "⚠️ In compliance with student privacy protection guidelines, personal contact numbers and private details cannot be processed in public chat. Please use the official Admissions Office contact form or visit our campus desk directly."
            }
        };
        return responses[type][tone === 'funny' ? 'funny' : 'pro'];
    }

    /* =============== RVILS 100% VERIFIED WEBSITE KNOWLEDGE BASE =============== */
    const RVILS_DATA = {
        institution: {
            fullName: "MKPM RV Institute of Legal Studies (RVILS)",
            shortName: "RVILS",
            established: 2018,
            trust: "Rashtreeya Sikshana Samithi Trust (RSST)",
            affiliation: "Karnataka State Law University (KSLU), Hubballi",
            approval: "Bar Council of India (BCI), New Delhi",
            address: "#45/1, 22nd Cross, 3rd Block, Jayanagar, Bengaluru - 560011, Karnataka, India",
            phone: "+91-80-69018952/53",
            email: "rvils@rvei.edu.in",
            website: "https://rvils.edu.in"
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
                    "Academics & Universities: Assistant Professor (after LL.M & NET), Research Fellow, Ph.D. Scholar",
                    "Specialised Fields: Constitutional Law, Labour Law, Environmental Law, Women & Child Rights Advocate, International Law & Diplomacy",
                    "Armed Forces: JAG Branch – Indian Army"
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
                    "Business Leadership: Legal Consultant for Startups and Multinationals, Corporate Governance"
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
                    academic: "Graduation (Bachelor’s degree) in any discipline from a recognized University (including Arts, Commerce, Science, Management, Engineering, Medicine).",
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
            feesNote: "Official fee details and payment schedules are governed strictly by KSLU norms and RSST trust guidelines. For official breakdown by category/quota, please consult the RVILS Admissions Desk directly."
        },
        facultyDirectory: {
            principal: {
                name: "Prof. (Dr.) Anjina Reddy K.R.",
                role: "Professor of Law & Principal — Founder Principal",
                qualifications: "B.A.L., LL.M., M.Phil., Ph.D.",
                experience: "20 Years",
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
            vision: "To be a vibrant knowledge centre that fosters academic excellence, research, and innovation.",
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
        researchAndPublications: {
            centre: {
                name: "Centre for Research and Publication (CRP)",
                objective: "Fostering empirical, doctrinal, comparative, and interdisciplinary legal research, scholarly publications, conferences, and faculty-student academic writing across law, public policy, and social sciences.",
                policy: "RVILS Research Policy promotes ethical research, anti-plagiarism standards, research incentives, and collaborative institutional partnerships."
            },
            rvLawJournal: {
                title: "RV Law Journal",
                issn: "2583-5041",
                frequency: "Biannual (Two issues per year)",
                type: "Blind Peer-Reviewed Law Journal",
                citationStyle: "OSCOLA (Oxford University Standard for the Citation of Legal Authorities)",
                publisher: "MKPM RV Institute of Legal Studies (RVILS), Bengaluru",
                submissionEmail: "rvlawjournal.mkpmrvils@rvei.edu.in",
                categories: [
                    "Research Articles & Papers (Comprehensive scholarly legal inquiry)",
                    "Short & Long Articles (Analytical legal and policy studies)",
                    "Case Comments (Critical appraisal of landmark judgments)",
                    "Book Reviews (Scholarly critique of contemporary legal treatises)"
                ],
                recentVolumes: [
                    "Volume 5, Issue 2 (2026)",
                    "Volume 5, Issue 1 (2026)",
                    "Volume 4, Issue 2 (2025)",
                    "Volume 4, Issue 1 (2025)",
                    "Volume 3, Issue 2 (2024)",
                    "Volume 3, Issue 1 (2024)"
                ]
            },
            samarthanaMagazine: {
                title: "Magazine – Samarthana",
                description: "Institutional annual college magazine featuring legal essays, reflections, critical perspectives, creative writing, and student achievements reflecting the intellectual vibrancy of RVILS.",
                volumes: ["Volume 2025", "Volume 2023-24", "Volume 2023", "Volume 2018-2022"]
            },
            newsletter: {
                title: "RVILS Newsletter",
                description: "Periodic institutional chronicle documenting moot court victories, guest lectures, legal aid village camps, national seminars, faculty achievements, and student awards.",
                issues: [
                    "July 2025 – January 2026",
                    "October 2023 – March 2024",
                    "April – September 2023",
                    "November 2022 – March 2023",
                    "June – October 2022"
                ]
            },
            booksAndVolumes: {
                title: "Books & Edited Volumes",
                description: "ISBN-registered books and edited reference volumes compiled from national seminars, conferences, and symposia published through the Centre for Research and Publication.",
                focus: "Contemporary statutory reforms, criminal justice jurisprudence, human rights, and constitutional governance."
            },
            collaborations: [
                {
                    partner: "University of Leeds, United Kingdom",
                    topic: "International Criminal Law: Origin and Development",
                    speaker: "Dr. Ilaria Zavoli (Lecturer in Law, University of Leeds)"
                },
                {
                    partner: "Kaale & Kaale Advisors Pvt. Ltd.",
                    topic: "Career Prospects in General Corporate & Investment Funds Practice",
                    speakers: "Mr. Ajith N. Kale (Corporate Associate, Trust Law) & Mr. Amith N. Kale (Director)"
                },
                {
                    partner: "District Legal Services Authority (DLSA) Bengaluru Urban & KSLSA",
                    topic: "Compensation Schemes for Victims/Survivors of Crime & Lok Adalat",
                    coordinator: "Prof. (Dr.) Hanuma Prakash K.S. & Adv. Vanishree R."
                },
                {
                    partner: "Bangalore Political Action Committee (B.PAC)",
                    topic: "Voters Awareness Forum & Voter Registration Drives"
                },
                {
                    partner: "Indo-Tibetan Friendship Society & Human Rights Cell",
                    topic: "Human Rights and its Role in International Relations",
                    dignitaries: "Mrs. Norzin Dolma (Minister, CTA) & Sri Madabhushi Madan Gopal (IAS Retd.)"
                },
                {
                    partner: "The Indian Ploggers Army & RV PU College",
                    topic: "Cyclothon 2025 – Rally for Clean Air & Sustainability (Sri G. Nagaraj 'Plogman')"
                }
            ],
            seminarsAndWorkshops: [
                {
                    title: "One-Day Workshop on 'Role of Evidence in Criminal Justice'",
                    venue: "Shashwathi Auditorium",
                    dignitaries: "Shri Kamal Pant (DGP Recruitment), Dr. Dinesh Rao (HOD Forensic Medicine, AIIMS Jammu), Sri K.B.K. Swamy (Senior Advocate)"
                },
                {
                    title: "National Seminar on 'Bharatiya Nyaya Sanhita (BNS)'",
                    partner: "INDGenius Bengaluru South",
                    speaker: "Sri Madhukar M. Deshpande (Senior Standing Counsel for Govt. of India, High Court of Karnataka)"
                },
                {
                    title: "State-Level Symposium 'LEAD INDIA: Youth Towards Ethical Leadership'",
                    partner: "Disha Bharat",
                    speakers: "Dr. Aruna Shyam (Senior Advocate), Sri Vivek Alva (Trustee, Alva's Foundation), Sri Ashwin D. Gowda (IRS)"
                },
                {
                    title: "State-Level Conference on 'Human Rights and Everyday Life'",
                    venue: "Karnataka Judicial Academy",
                    delegation: "Principal Prof. (Dr.) Anjina Reddy K.R., Asst. Prof. Aswin K. & 3rd Sem LL.B. students"
                },
                {
                    title: "Faculty Development Programmes (FDPs)",
                    topics: "Ethics of a Teacher (Sri Baramappa Mysore), Art of Classroom Management (Prof. H.S. Ganesha Bhatta), Professional Excellence for Teachers (Dr. T.V. Raju, Dr. S. Ranganath)"
                }
            ]
        },
        campusLife: {
            location: "#45/1, 22nd Cross, 3rd Block, Jayanagar, Bengaluru - 560011 (near South End Circle Metro)",
            facilities: [
                "Smart Classrooms & Audio-Visual Seminar Hall",
                "Air-Conditioned Moot Court Hall",
                "Hybrid Library & Digital Computer Lab",
                "Sports Facilities (Badminton, Table Tennis, Chess, Athletics - directed by Mr. Mohan Kumar N.N.)",
                "Cultural & Literary Societies",
                "National Service Scheme (NSS) Unit",
                "Youth Red Cross Unit"
            ],
            institutionalCommittees: [
                "Internal Complaints Committee (ICC)",
                "Student Grievance Cell",
                "SC/ST Cell",
                "Anti-Ragging Committee"
            ]
        }
    };


    /* =============== DEEP IN-MEMORY 43-PAGE WEBSITE CORPUS =============== */
    const PAGE_CORPUS = [
    {
        "url": "https://rvils.edu.in/",
        "title": "Best Law Courses in Bangalore | RVILS",
        "slug": "homepage",
        "snippet": "Shaping Tomorrow\u2019s Legal Leaders Aspiring Lawyers 290 Academic Mentors 13 Moot Court Wins 10 Apply Now Circular & Notifications Stay informed with the latest circulars, notices and event updates Know More About MKPM RV Institute of Legal Studies Established in 2018 by RV Educational Institutions (RVEI), MKPM RV Institute of Legal Studies was founded in response to the increasing complexity of disputes, evolving legal systems and emerging challenges such as cybercrime Established in 2018 by the RV Educational Institutions (RVEI), MKPM RV Institute of Legal Studies (RVILS) was founded in response to the growing complexity of disputes, rising crime and emerging challenges such as cybercrime within an evolving legal landscape. Integration of courtroom training, legal research and advocacy Located in Bengaluru \u2013 India\u2019s legal and corporate hub Focus on experiential legal learning Read More Accreditation & Affiliation Affiliated to Karnataka State Law University (KSLU) Approved by Bar Council of India (BCI) Know More Law Programmes at RVILS B.A. LL.B. (5-year Integrated Course) Know More B.B.A. LL.B.(5-year Integrated Course) Know More B.Com. LL.B.(5-year Integrated Course) Know More LL.B.(3-year Integrated Course) Know More Admissions 2026 \u2013 Begin Your Legal Journey Apply Now Learning Beyond the Classroom Moot Court Training Legal Services Clinic Research & Publications Guest Lectures & Workshops Moot Court Training Moot court training simulates real courtroom proceedings, allowing students to develop legal research, drafting and oral advocacy skills. Through structured competitions and guided practice, students gain practical experience with litigation processes while building confidence in presenting arguments to judges and legal professionals. Know More Legal Services Cli"
    },
    {
        "url": "https://rvils.edu.in/3_year_ll_b/",
        "title": "3-Year LL.B Course | RVILS Bangalore",
        "slug": "3_year_ll_b",
        "snippet": "3-year LL.B. Postgraduate Professional Law Degree LL.B. (3-years) Admissions Open 2026 \u2013 27 APPLY NOW Postgraduate Professional Law Degree 3-Year LL.B. 3 Years \u00b7 Six Semesters ADMISSIONS OPEN 2026-27 APPLY NOW 6 Semesters 7yrs Max Period BCI Approved 3-Year LL.B. Postgraduate Professional Law Degree Admissions Open for 2026\u201327 APPLY NOW About the Programme The LL.B (3-year) Programme is a postgraduate professional law degree designed for graduates seeking to pursue a career in law after graduation. Conducted over six semesters, the programme provides a structured foundation in substantive and procedural law. The curriculum emphasises constitutional, criminal, civil and commercial law while fostering analytical engagement and professional responsibility. Academic study is supported by practical components including moot courts, internships, legal aid initiatives, court visits and drafting exercises, ensuring meaningful exposure to the practice of law. Graduates of the programme are eligible to enrol as advocates in accordance with applicable regulatory norms and may pursue careers in litigation, judiciary, corporate practice and related legal fields. View Career Prospects Programme Details Degree LL.B. (Bachelor of Laws) Type Postgraduate Professional Duration 3 Years (6 Semesters) Affiliation KSLU, Hubballi Approved By Bar Council of India View Career Prospects Programme Outcomes 01To provide students with an in-depth and comprehensive legal education that covers various aspects of law, including both general and specialised areas. 01To foster a culture of legal research, scholarly writing and critical analysis, encouraging students to contribute to legal academia. 01To equip students with the necessary skills and knowledge to excel in the legal profession, including le"
    },
    {
        "url": "https://rvils.edu.in/5_year_b_a_ll_b/",
        "title": "B.A. LL.B College in Bangalore | RVILS",
        "slug": "5_year_b_a_ll_b",
        "snippet": "5-year B.A. LL.B. Integrated Law with Humanities 5-year B.A. LL.B. Admissions Open 2026 \u2013 27 APPLY NOW Integrated Law with Humanities 5-year B.A. LL.B. Duration 5 Years (10 semesters) Max Completion 7 Years from Admission ADMISSIONS OPEN 2026-27 APPLY NOW 10 Semesters 7yrs Max Period BCI Approved 5-Year B.A. LL.B. INTEGRATED LAW WITH HUMANITIES Admissions Open for 2026\u201327 APPLY NOW About the Programme The B.A. LL.B (5-year Integrated Degree) Programme combines legal education with humanities and social sciences, offering a structured pathway for students seeking to pursue careers in litigation, judiciary, civil services and public law.The integrated curriculum provides grounding in constitutional and criminal law while fostering critical engagement with questions of governance, rights and social justice. This academic learning is supported by moot courts, internships and legal aid activities, ensuring practical exposure alongside doctrinal study.Graduates of the programme are prepared for professional practice, judicial services examinations, civil services, academia and related roles within the legal profession. View Career Prospects Programme Details Degree B.A. LL.B. Type Undergraduate Duration 5 Years (10 semesters) Affiliation KSLU, Hubballi Approved By Bar Council of India View Career Prospects Programme Outcomes 01To allow students to explore a wide range of disciplines to develop a comprehensive understanding of society, politics, and culture, in addition to the law. 01To provide students with an in-depth and comprehensive legal education that covers various aspects of law, including both general and specialised areas. 01To foster a culture of legal research, scholarly writing and critical analysis, encouraging students to contribute to legal academia. 01To equi"
    },
    {
        "url": "https://rvils.edu.in/5_year_b_b_a_ll_b/",
        "title": "B.B.A. LL.B College in Bangalore | RVILS",
        "slug": "5_year_b_b_a_ll_b",
        "snippet": "5-year B.B.A. LL.B. Integrated Law with Business & Management 5-year B.B.A. LL.B. Admissions Open 2026 \u2013 27 APPLY NOW Integrated Law with Business & Management 5-year B.B.A. LL.B. Duration 5 Years (10 semesters) Max Completion 7 Years from Admission ADMISSIONS OPEN 2026-27 APPLY NOW 10 Semesters 7yrs Max Period BCI Approved 5-year B.B.A. LL.B. Integrated Law with Business & Management Admissions Open for 2026\u201327 APPLY NOW About the Programme The B.B.A. LL.B. (5-year Integrated Degree) Programme combines legal education with business and management studies, providing a structured pathway for students seeking careers in corporate and commercial law.The integrated curriculum offers grounding in core legal principles alongside an understanding of corporate governance, compliance and commercial regulation. Practical exposure through internships with law firms, corporate entities and legal departments ensures that academic learning is complemented by professional experience.Graduates of the programme are prepared to pursue professional roles in corporate advisory, commercial litigation, compliance and related areas of legal practice. View Career Prospects Programme Details Degree B.B.A. LL.B. Type Undergraduate Duration 5 Years (10 semesters) Affiliation KSLU, Hubballi Approved By Bar Council of India View Career Prospects Programme Outcomes 01It develops legal professionals with a strong understanding of business practices and corporate legal skills, making them valuable in legal departments of corporations or law firms specialising in business law. 01To provide students with an in-depth and comprehensive legal education that covers various aspects of law, including both general and specialised areas. 01To foster a culture of legal research, scholarly writing and critical an"
    },
    {
        "url": "https://rvils.edu.in/5_year_b_com_ll_b/",
        "title": "RVILS Law Programs | B.Com. LL.B Course",
        "slug": "5_year_b_com_ll_b",
        "snippet": "5-year B.Com. LL.B. Integrated Law with Commerce & Finance 5-year B.Com. LL.B. Admissions Open 2026 \u2013 27 APPLY NOW Integrated Law with Commerce & Finance 5-year B.Com. LL.B. Duration 5 Years (10 semesters) Max Completion 7 Years from Admission ADMISSIONS OPEN 2026-27 APPLY NOW 10 Semesters 7yrs Max Period BCI Approved 5-year B.Com. LL.B. Integrated Law with Commerce & Finance Admissions Open for 2026\u201327 APPLY NOW About the Programme The B.Com. LL.B. (5-year Integrated Degree) Programme combines legal education with the study of commerce and finance, enabling students to understand the interface between law, business and financial systems.In addition to core areas of law, the curriculum incorporates subjects that provide grounding in accounting, taxation, corporate finance and economic regulation. This integrated structure supports engagement with legal issues relating to corporate governance, banking, insurance, securities regulation and fiscal compliance.The programme includes practical components such as internships with law firms, corporate entities and financial institutions, ensuring exposure to professional environments alongside academic study. Graduates are equipped to pursue professional pathways in corporate advisory, taxation practice, financial compliance and related commercial sectors. View Career Prospects Programme Details Degree B.Com. LL.B. Type Undergraduate Duration 5 Years (10 semesters) Affiliation KSLU, Hubballi Approved By Bar Council of India View Career Prospects Programme Objectives 01To impart foundational and advanced knowledge in commerce and legal studies. 01To cultivate analytical and critical thinking skills applicable to legal and commercial challenges. 01To provide students with an in-depth and comprehensive legal education that covers "
    },
    {
        "url": "https://rvils.edu.in/about_college/",
        "title": "RV Institute of Legal Studies | About Us",
        "slug": "about_college",
        "snippet": "ABOUT College ABOUT college Established in 2018 by the RV Educational Institutions (RVEI), MKPM RV Institute of Legal Studies (RVILS) was founded in response to the growing complexity of disputes, rising crime and emerging challenges such as cybercrime within an evolving legal landscape. Situated in Bengaluru, a leading centre for professional education, the Institute was conceived with a distinct and contemporary approach to legal training.Renamed in honour of Dr. M.K. Panduranga Setty, President Emeritus of RSST, the institution reflects a legacy of service and academic responsibility. RVILS is affiliated with Karnataka State Law University (KSLU) and approved by the Bar Council of India (BCI).The Institute offers the B.A., LL.B., B.B.A., LL.B. and B.Com., LL.B. 5-year integrated programmes, along with the 3-year LL.B. programme. It is committed to producing competent legal professionals capable of contributing meaningfully to the courts, the profession and society at large. About RVEI Late Sri M.C. Sivananda Sharma Founder Secretary Rashtreeya Sikahana Samithi Trust RV Educational Institutions (RVEI) was founded in 1940 by the late Sri M.C. Sivananda Sarma, on a conviction that education is not a privilege, but a right. What began as a single school has, over eight decades, grown into a network of 28+ institutions serving more than 24,000 students and supported by over 3,000 staff members. The academic framework spans kindergarten to postgraduate education across technology, health sciences, management, humanities, natural sciences, social sciences and legal studies.RVEI has always believed that a well-rounded institution must serve a wide cross-section of society. That includes education for students with special needs and sustained outreach to the less privileged. "
    },
    {
        "url": "https://rvils.edu.in/academic_calender/",
        "title": "Academic Calendar 2026 | RVILS",
        "slug": "academic_calender",
        "snippet": "Academic Calendar Overview The Academic Calendar outlines semester schedules, examinations, internships and key academic activities for each programme, ensuring structured and timely academic progression. 2024-25 2023-24 2022-23 Earlier 2024-25 2023-24 2022-23 Earlier May \u2013 August 2024 Download (PDF) November 2023 \u2013 March 2024 Download (PDF) November \u2013 March 2023 Download (PDF) May \u2013 September 2023 Download (PDF) 2021-22 Download (PDF) Quick Links About College Admissions Placements Privacy Policy Mandatory Disclosure Anti-Ragging Policy Internal Complaints Committee (ICC) Student Grievance Cell SC/ST Cell Reach us at Address #45/1, 22nd Cross, 3rd Block, Jayanagar, Bengaluru - 560011, Karnataka, India Phone No. +91-80-69018952/53 E-mail rvils@rvei.edu.in Follow Us Designed and Developed by Department of Media and Alumni Affairs, RSST"
    },
    {
        "url": "https://rvils.edu.in/accreditations_affiliations/",
        "title": "RVILS Affiliations | Law College Bangalore",
        "slug": "accreditations_affiliations",
        "snippet": "Accreditations & Affiliations Affiliation notification (3-year LL.B & 5-year LL.B) Change of college name Government order BCI approval (all courses).pdf GoK affiliation B.Com_LLB KSLU per affiliation_B.A. LL.B & B.B.A. LL.B BCI affiliation B.A. LL.B & B.B.A. LL.B GoK B.A. LL.B & B.B.A. LL.B. affiliation Explore Academic Programmes Quick Links About College Admissions Placements Privacy Policy Mandatory Disclosure Anti-Ragging Policy Internal Complaints Committee (ICC) Student Grievance Cell SC/ST Cell Reach us at Address #45/1, 22nd Cross, 3rd Block, Jayanagar, Bengaluru - 560011, Karnataka, India Phone No. +91-80-69018952/53 E-mail rvils@rvei.edu.in Follow Us Designed and Developed by Department of Media and Alumni Affairs, RSST"
    },
    {
        "url": "https://rvils.edu.in/admissions/",
        "title": "RVILS Admission 2026 | Law College",
        "slug": "admissions",
        "snippet": "Admissions Begin The Pursuit of Justice Enquiry Form Please drop your message below for general enquiries or to share feedback and we will contact you. Select State * Andhra Pradesh Arunachal Pradesh Assam Bihar Chhattisgarh Goa Gujarat Haryana Himachal Pradesh Jharkhand Karnataka Kerala Madhya Pradesh Maharashtra Manipur Meghalaya Mizoram Nagaland Odisha Punjab Rajasthan Sikkim Tamil Nadu Telangana Tripura Uttar Pradesh Uttarakhand West Bengal Select City * Delhi Mumbai Kolkata Bengaluru Hyderabad Chennai Ahmedabad Pune Surat Jaipur Lucknow Kanpur Nagpur Mysuru Indore Visakhapatnam Select Programme* LL.B. (3-years) 5-year B.A. LL.B. 5-year B.B.A. LL.B. 5-year B.Com. LL.B. I agree to receive information regarding my submitted enquiry on MKPM RV Institute of Legal Studies. SUBMIT The Process The admission process is transparent, merit-based and designed to identify committed individuals aspiring to excel in the legal profession. Application Submission Submit the prescribed form with the required documents as per KSLU eligibility norms. RVILS\u2013LAT Appear for the entrance test assessing aptitude and reasoning skills. Institutional Interaction Attend the briefing session with the admission team (with parents). Personal Interview Evaluation of interest in law along with clarity and communication skills. Offer of Admission Issued based on cumulative performance. Admission Confirmation Completion of fee payment and document verification. Application SubmissionSubmit the prescribed form with the required documents as per KSLU eligibility norms. RVILS\u2013LATAppear for the entrance test assessing aptitude and reasoning skills. Institutional InteractionAttend the briefing session with the admission team (with parents). Personal InterviewEvaluation of interest in law along with clarity"
    },
    {
        "url": "https://rvils.edu.in/alumni/",
        "title": "RVILS Alumni | Alumni Network & Achievements",
        "slug": "alumni",
        "snippet": "Alumni Testimonials Hear from the graduates of MKPM RV Institute of Legal Studies (RVILS) their journeys, transformations and reflections on five years of legal education, friendships and growth. 2020-2025 Batch Aryan Shetty B.B.A. LL.B.\u201cLooking back, RVILS gave me more than just a legal education. It gave me clarity, confidence, and community. What truly sets this college apart is its culture, from moot courts and scholarly discussions on contemporary legal topics with visiting scholars to the unwavering commitment of the faculty. The environment here constantly pushed me to grow, not just as a law student, but as a confident individual ready to face anything in the legal world. Every corner of this campus holds a lesson, a memory, or a mentor who shaped my journey. It\u2019s here that I found my voice, learned to think fearlessly, and realised that law is a powerful tool to create meaningful change.\" Taskeen Shaikh B.A.LLB.\u201cI joined MKPM RV Institute of Legal Studies in 2020 as a B.A., LL.B. student, and looking back, it\u2019s been an amazing journey. When I first started, I was very shy and unsure of myself. But over the years, I slowly came out of my shell. I got involved in various activities, participated in moots, and even won a few competitions, which really boosted my confidence. The atmosphere at college always pushed me to do better and explore my potential beyond academics. What made my experience even better were the people around me. I made some great friends who stood by me through everything, and my teachers were always supportive and encouraging. They guided me not just in academics but throughout the entire course of my legal education. Today, I feel much more confident and outgoing than I was when I first walked into the campus. I\u2019m grateful for the experience"
    },
    {
        "url": "https://rvils.edu.in/board_of_management/",
        "title": "RVILS Management Board | Bangalore",
        "slug": "board_of_management",
        "snippet": "Board of Management Dr. M.P. ShyamPresident, RVEI Mr. A.C. Chandrashekar RajuVice-President, RVEI Dr. C. Vinod HayagrivVice-President, RVEI Mr. P.S. Venkatesh BabuTreasurer, RVEI Dr.(h.c) A.V.S. MurthyHon. Secretary, RVEI Mr. D.P. NagarajHon. Joint Secretary, RVEI Mr. Nikhil A MurthyAssistant Secretary, RVEI Governing Council Members - RVILS Chairman: Sri. N.R. Nandish Members: Dr.(h.c.) A.V.S. MurthyMr. P.S. Venkatesh BabuMr. D.P. Nagaraj Mr. P.S. NandakumarMr. A.S. Vishnu BharathSmt. Savithramma (University Nominee) Prof. (Dr.) Anjina Reddy K.R. (Principal/Ex.Officio) Trustees as on 06-09-2026 Dr. M.P. ShyamDr. A.C. Chandrashekar RajuDr. C. Vinod HayagrivMr. P.S. Venkatesh BabuDr.(h.c.) A.V.S. MurthyMr. D.P. NagarajMr. Nikhil A MurthyMr. K.S. Akhilesh Babu Mr. R. Anantha RamanMr. M.R. ArvindMr. S.M. BalakrishnaMr. C.V. HayagrivMr. M.K. DattarajMr. Dev Darshan Banad ViswanathMr. C. Ganesh NarayanMs. Maya Chandra Mr. P.S. Nanda KumarMr. N.R. NandishDr. M.S. PrakashMr. N.P KarthikMr. S. SureshMr. K. LakshmanMr. K.A. Sujit ChandanMr. A.S. Vishnu Bharath Ms. Pramila Vijayakumar Mr. M.R. GurudattMs. M.S. NiveditaMr. Manadi RameshMr. Naveen K PasuparthyMr. P.S. Sanjay as on 06-09-2026 Dr. M.P. ShyamDr. A.C. Chandrashekar RajuDr. C. Vinod HayagrivMr. P.S. Venkatesh BabuDr.(h.c.) A.V.S. MurthyMr. D.P. NagarajMr. Nikhil A MurthyMr. K.S. Akhilesh Babu Mr. P.S. Nanda KumarMr. N.R. NandishDr. M.S. PrakashMr. N.P KarthikMr. S. SureshMr. K. LakshmanMr. K.A. Sujit ChandanMr. A.S. Vishnu Bharath Mr. R. Anantha RamanMr. M.R. ArvindMr. S.M. BalakrishnaMr. C.V. HayagrivMr. M.K. DattarajMr. Dev Darshan Banad ViswanathMr. C. Ganesh NarayanMs. Maya Chandra Ms. Pramila Vijayakumar Mr. M.R. GurudattMs. M.S. NiveditaMr. Manadi RameshMr. Naveen K PasuparthyMr. P.S. Sanjay Quick Links About Coll"
    },
    {
        "url": "https://rvils.edu.in/campus_facilities/",
        "title": "RVILS Campus Facilities | Student Amenities",
        "slug": "campus_facilities",
        "snippet": "Campus Facilities Built for the Practice of Law MKPM RV Institute of Legal Studies (RVILS) offers a well-equipped campus environment designed to support academic learning, legal research and student development. Whether it is technology-enabled classrooms and dedicated legal research facilities or sports infrastructure and student amenities, the campus provides the resources required for a comprehensive law school experience in Bengaluru. Campus Facilities Campus Facilities MKPM RV Institute of Legal Studies (RVILS) offers a well-equipped campus environment designed to support academic learning, legal research and student development. Whether it is technology-enabled classrooms and dedicated legal research facilities or sports infrastructure and student amenities, the campus provides the resources required for a comprehensive law school experience in Bengaluru. Library Library RVILS houses a dedicated law library supporting academic research and legal scholarship. The library provides access to extensive legal texts, journals, reference materials and digital research databases. Key Resources Include SSC Online Manupatra National and International Law Journals Constituent Assembly Debates and Law Commission Reports Explore Library Resources Library RVILS houses a dedicated law library supporting academic research and legal scholarship. The library provides access to extensive legal texts, journals, reference materials and digital research databases. Key Resources Include SSC Online Manupatra National and International Law Journals Constituent Assembly Debates and Law Commission Reports Explore Library Resources Technology-Enabled Classrooms Technology-Enabled Classrooms RVILS classrooms are designed to support interactive and technology-assisted learning. The classrooms "
    },
    {
        "url": "https://rvils.edu.in/circular_and_notification/",
        "title": "RVILS Circular Updates | Bangalore",
        "slug": "circular_and_notification",
        "snippet": "Circular and Notification Circular and Notification LL.B. (3 years) Download (PDF) 5-year LL.B. Download (PDF) Quick Links About College Admissions Placements Privacy Policy Mandatory Disclosure Anti-Ragging Policy Internal Complaints Committee (ICC) Student Grievance Cell SC/ST Cell Reach us at Address #45/1, 22nd Cross, 3rd Block, Jayanagar, Bengaluru - 560011, Karnataka, India Phone No. +91-80-69018952/53 E-mail rvils@rvei.edu.in Follow Us Designed and Developed by Department of Media and Alumni Affairs, RSST"
    },
    {
        "url": "https://rvils.edu.in/contact_us/",
        "title": "RVILS Contact Us | Admissions & Enquiry",
        "slug": "contact_us",
        "snippet": "Call Us+91-80-69018952/53 Emailrvils@rvei.edu.in Address#45/1, 22nd Cross, 3rd Block, Jayanagar, Bengaluru - 560011, Karnataka, India Office Hours9.00 to 5.00 PM Call Us+91-80-69018952/53 Emailrvils@rvei.edu.in Address#45/1, 22nd Cross, 3rd Block, Jayanagar, Bengaluru - 560011, Karnataka, India Office Hours9.00 to 5.00 PM Legal Services Clinic Working hoursMonday to Friday \u2013 10.00 AM to 4.00 PM Saturday \u2013 10.00 AM to 1.30 PM Visit Legal Services Clinic Enquiry Form Please fill in the details below to seek legal guidance or assistance. Our team will contact you at the earliest. Full Name Contact Number Email ID (if available) Nature of Query / Legal Issue SUBMIT Careers Be a Part of RVILS Share your profile to be considered for academic and administrative roles.For further queries, contact: (+91-80-69018952/53) Full Name Contact Number Email ID SUBMIT Quick Links About College Admissions Placements Privacy Policy Mandatory Disclosure Anti-Ragging Policy Internal Complaints Committee (ICC) Student Grievance Cell SC/ST Cell Reach us at Address #45/1, 22nd Cross, 3rd Block, Jayanagar, Bengaluru - 560011, Karnataka, India Phone No. +91-80-69018952/53 E-mail rvils@rvei.edu.in Follow Us Designed and Developed by Department of Media and Alumni Affairs, RSST"
    },
    {
        "url": "https://rvils.edu.in/faculty/",
        "title": "RVILS Bangalore | Faculty Members",
        "slug": "faculty",
        "snippet": "Our Faculty & Staff Core Faculty Non-Teaching Staff Core Faculty Prof. (Dr.) Anjina Reddy K.R. Professor of Law & Principal \u2014 Founder Principal Qualification : B.A.L., LL.M., M.Phil., Ph.D. Experience : 20 Years Specialisation : Environmental Law \u00b7 Constitutional Law View Full Profile Dr. Hanumaprakash K.S. Professor of Law Qualification : LL.M. (Commercial Law), Ph.D., KSET View Full Profile Mr. Thejesh K.M. Assistant Professor of Management Qualification : M.Com., MBA, PGDFM View Full Profile Ms. Chaitra M.D. Assistant Professor of Management Qualification : B.Com., M.Com. View Full Profile Ms. Runjhun Sharma Assistant Professor of Law Qualification : B.A., LL.B., LL.M. View Full Profile Mr. Aswin K. Assistant Professor of Law Qualification : B.B.A., LL.B., LL.M. View Full Profile Ms. Anncy Flora Assistant Professor of Law Qualification : View Full Profile Ms. Shruthi M.S. Assistant Professor of Economics Qualification : M.A. in Economics View Full Profile Mr. Rahul Simha N. Assistant Professor of Law Qualification : B.A., LL.B., LL.M. View Full Profile Mrs. Sheena Razdan Assistant Professor of Law Qualification : B.S.L. LL.B., LL.M. View Full Profile Ms. Kruthika B. Assistant Professor of Law Qualification : B.A., LL.B., LL.M. View Full Profile Ms. Paavana E. Assistant Professor of Law Qualification : LL.M. (Business Law), B.A. LL.B. View Full Profile Mr. Mohan Kumar N.N. Director of Physical Education Qualification : View Full Profile Non-Teaching Staff Non-Teaching Faculty Mr. Santosh Kumar N. Sr. Library Executive Mr. Sagar S. Library Executive Mr. N. Mahesh Assistant Manager - HR & Admin Ms. Sudha K. Sr. Executive Accounts Mrs. Asha P. Clerk Mr. Manoj Yadav Trainee - Accounts Mr. Rakshith Shetty Trainee - Accounts Mrs. Prema C.S. Attender Quick Links About Colleg"
    },
    {
        "url": "https://rvils.edu.in/faculty_student_publications/",
        "title": "RVILS Research Publications | Bangalore",
        "slug": "faculty_student_publications",
        "snippet": "Faculty & Student Publications Publications Faculty & Student Publications Faculty members and students at RVILS actively contribute to legal scholarship through research papers, articles and conference presentations in reputed journals and academic forums. These publications reflect the institution\u2019s commitment to encouraging academic research, critical inquiry and scholarly writing within legal education. Faculty Publications Student Publications Quick Links About College Admissions Placements Privacy Policy Mandatory Disclosure Anti-Ragging Policy Internal Complaints Committee (ICC) Student Grievance Cell SC/ST Cell Reach us at Address #45/1, 22nd Cross, 3rd Block, Jayanagar, Bengaluru - 560011, Karnataka, India Phone No. +91-80-69018952/53 E-mail rvils@rvei.edu.in Follow Us Designed and Developed by Department of Media and Alumni Affairs, RSST"
    },
    {
        "url": "https://rvils.edu.in/institutional_events/",
        "title": "RVILS Institutional Events | Campus Activities",
        "slug": "institutional_events",
        "snippet": "Institutional Events Institutional Events This section showcases key institutional events organised by MKPM RV Institute of Legal Studies (RVILS), including academic programmes, competitions and outreach initiatives. Defining the RVILS Experience MKPM RV Institute of Legal Studies (RVILS) offers a well-equipped campus environment designed to support academic learning, legal research and student development. Whether it is technology-enabled classrooms and dedicated legal research facilities or sports infrastructure and student amenities, the campus provides the resources required for a comprehensive law school experience in Bengaluru. Institutional Events This section showcases key institutional events organised by MKPM RV Institute of Legal Studies (RVILS), including academic programmes, competitions and outreach initiatives. 2026 2025 2024 2023 2022 2026 6th Sep 2026 Inauguration of 1st Semester Classes and Orientation Programme 2026-27 MKPM RV Institute of Legal Studies conducted the Inauguration of the 1st Semester classes and Orientation Programme 2026- 27 for the Students for the B.A., LL.B., B.B.A., LL.B., B.Com., LL.B., 5 Year Integrated Degree Courses and 3-Year LL.B. on 6th September, 2026 at 11:00 AM at Mangala Mantapa, MKPM RVILS. The Chief Guest of the day was Hon\u2019ble Shri Justice Venkatesh Naik T, Judge, High Court of Karnataka, Bengaluru. The Guest of Honour for the day was Dr. Manju Naik B T, Associate Professor, Government Law College, Ramanagara and Sri.N.R. Nandish, Chairman, governing Council, MKPM RVILS & Trustee, Rashtreeya Sikshana Samithi Trust and the programme was presided over by Dr. M P Shyam, President, Rashtreeya Sikshana Samithi Trust and Prof. (Dr.) Anjina Reddy K. R., Principal of MKPM RV Institute of Legal Studies, delivered a heartfelt "
    },
    {
        "url": "https://rvils.edu.in/legal_services_clinic/",
        "title": "RVILS Legal Services Clinic | Community Outreach",
        "slug": "legal_services_clinic",
        "snippet": "Community Extension Activities Legal Services Clinic The Legal Services Clinic of MKPM RV Institute of Legal Studies (RVILS) provides students with practical exposure to legal aid and community outreach activities. Under the guidance of faculty members, students participate in initiatives such as legal awareness programmes, legal aid camps, socio-legal surveys and educational visits to courts and legal institutions.The Clinic also collaborates with organisations such as the District Legal Services Authority to conduct programmes that promote legal awareness among the public. These activities help students understand how law operates in real social contexts while encouraging a sense of professional responsibility towards access to justice. Visit Legal Services Clinic Aim, Mission & Objectives Aim To provide legal aid through human resource, knowledge resource & infrastructural resource to those who need it the most, purely on a pro- bono basis. Mission The Legal Services Clinic operates in line with the institutional commitment of RVILS towards social responsibility. It seeks to foster sensitivity to community issues, encourage meaningful engagement with society, and promote ethical, value-based legal education through practice and outreach. Objectives To promote legal awareness and literacy within the community To organise legal aid and literacy programmes in collaboration with relevant authorities To provide free legal assistance to socially and economically disadvantaged sections To facilitate access to the justice system for those facing practical or financial barriers To develop practical legal skills and professional competence among students To support initiatives relating to legal policy and institutional frameworks in association with statutory bodies To encoura"
    },
    {
        "url": "https://rvils.edu.in/library/",
        "title": "RVILS Library | Law Books & Digital Resources",
        "slug": "library",
        "snippet": "Library Library & Information Centre The RVILS Library supports rigorous legal study through an extensive collection of books, leading law reports, National and International journals, and premium legal databases such as SSC Online and Manupatra. Designed as a hybrid knowledge centre, it combines physical collections with digital access to support research, citation practice and academic excellence. Explore the Library Infrastructure Library & Information Centre The RVILS Library supports rigorous legal study through an extensive collection of books, leading law reports, National and International journals, and premium legal databases such as SSC Online and Manupatra. Designed as a hybrid knowledge centre, it combines physical collections with digital access to support research, citation practice and academic excellence. Explore the Library Infrastructure Vision & Mission Vision To be a vibrant knowledge centre that fosters academic excellence, research, and innovation by offering extensive resources and a collaborative environment for students, faculty, and researchers. Mission Our mission is to diligently provide a wide range of resources and services to meet the academic, intellectual, and research needs of the scholarly community. Highlights Copy of the original Manuscript of the Constitution of India Lorem ipsum dolor sit amet, consectetur adipisi cing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. E-learning resources (SCC Online, Manupatra) SCC Online \u2013 Legal Research Database SSC Online is one of India\u2019s leading online legal research databases, established in 1996. It provides RVILS students, researchers and legal professionals wi"
    },
    {
        "url": "https://rvils.edu.in/life_at_rvils/campus_facilities/",
        "title": "RVILS Campus Facilities | Student Amenities",
        "slug": "life_at_rvils_campus_facilities",
        "snippet": "Campus Facilities Built for the Practice of Law MKPM RV Institute of Legal Studies (RVILS) offers a well-equipped campus environment designed to support academic learning, legal research and student development. Whether it is technology-enabled classrooms and dedicated legal research facilities or sports infrastructure and student amenities, the campus provides the resources required for a comprehensive law school experience in Bengaluru. Campus Facilities Campus Facilities MKPM RV Institute of Legal Studies (RVILS) offers a well-equipped campus environment designed to support academic learning, legal research and student development. Whether it is technology-enabled classrooms and dedicated legal research facilities or sports infrastructure and student amenities, the campus provides the resources required for a comprehensive law school experience in Bengaluru. Library Library RVILS houses a dedicated law library supporting academic research and legal scholarship. The library provides access to extensive legal texts, journals, reference materials and digital research databases. Key Resources Include SSC Online Manupatra National and International Law Journals Constituent Assembly Debates and Law Commission Reports Explore Library Resources Library RVILS houses a dedicated law library supporting academic research and legal scholarship. The library provides access to extensive legal texts, journals, reference materials and digital research databases. Key Resources Include SSC Online Manupatra National and International Law Journals Constituent Assembly Debates and Law Commission Reports Explore Library Resources Technology-Enabled Classrooms Technology-Enabled Classrooms RVILS classrooms are designed to support interactive and technology-assisted learning. The classrooms "
    },
    {
        "url": "https://rvils.edu.in/life_at_rvils/community_extension_activities/legal_services_clinic/",
        "title": "RVILS Legal Services Clinic | Community Outreach",
        "slug": "life_at_rvils_community_extension_activities_legal_services_clinic",
        "snippet": "Community Extension Activities Legal Services Clinic The Legal Services Clinic of MKPM RV Institute of Legal Studies (RVILS) provides students with practical exposure to legal aid and community outreach activities. Under the guidance of faculty members, students participate in initiatives such as legal awareness programmes, legal aid camps, socio-legal surveys and educational visits to courts and legal institutions.The Clinic also collaborates with organisations such as the District Legal Services Authority to conduct programmes that promote legal awareness among the public. These activities help students understand how law operates in real social contexts while encouraging a sense of professional responsibility towards access to justice. Visit Legal Services Clinic Aim, Mission & Objectives Aim To provide legal aid through human resource, knowledge resource & infrastructural resource to those who need it the most, purely on a pro- bono basis. Mission The Legal Services Clinic operates in line with the institutional commitment of RVILS towards social responsibility. It seeks to foster sensitivity to community issues, encourage meaningful engagement with society, and promote ethical, value-based legal education through practice and outreach. Objectives To promote legal awareness and literacy within the community To organise legal aid and literacy programmes in collaboration with relevant authorities To provide free legal assistance to socially and economically disadvantaged sections To facilitate access to the justice system for those facing practical or financial barriers To develop practical legal skills and professional competence among students To support initiatives relating to legal policy and institutional frameworks in association with statutory bodies To encoura"
    },
    {
        "url": "https://rvils.edu.in/life_at_rvils/community_extension_activities/national_service_scheme/",
        "title": "RVILS NSS Programs | Student Activities",
        "slug": "life_at_rvils_community_extension_activities_national_service_scheme",
        "snippet": "Community Extension Activities National Service Scheme The National Service Scheme (NSS) Unit of MKPM RV Institute of Legal Studies (RVILS) encourages students to participate in community service and social outreach activities. NSS is a programme of the Ministry of Youth Affairs and Sports, Government of India, created to involve students in initiatives that benefit society while building a sense of civic responsibility. Through the NSS Unit, students of RVILS take part in awareness programmes, community engagement activities, and volunteer initiatives organised on campus and in nearby communities. These programmes allow students to understand social issues closely and contribute through meaningful service.The activities of the unit reflect the spirit of the NSS motto \u201cNot Me, But You.\u201d 2026 2024 2026 3rd October 2026 Gandhi Jayanti On 3rd October 2026, the National Service Scheme (NSS) Unit of MKPM RV Institute of Legal Studies observed Gandhi Jayanti along with the birth anniversary of former Prime Minister Bharat Ratna Lal Bahadur Shastri. Faculty members and students offered floral tributes to the portraits of both revered national leaders, reflecting on their enduring legacies of truth, non-violence, simplicity, and dedicated public service. In alignment with the ethos of community welfare and Swachh Bharat, NSS volunteers participated in a campus cleanliness drive and pledged to uphold national unity and civic responsibility. 24th Sept 2026 NSS Day In View of NSS Day on 24th Sept 2026, NSS Unit of MKPM RVILS Conducted Cleanliness Drive around the college campus. The event commenced at 02:45 PM. It aimed to honour Mahatma Gandhi\u2019s ideals of cleanliness, simplicity, and service to the nation. The celebration brought together students, faculty, and volunteers under t"
    },
    {
        "url": "https://rvils.edu.in/life_at_rvils/cultural_activities/",
        "title": "RVILS Cultural Activities | Campus Life",
        "slug": "life_at_rvils_cultural_activities",
        "snippet": "Cultural Activities Where Expression Takes the Stage Where Expression Takes the Stage Cultural Activities Cultural Activities The Cultural Committee of MKPM RV Institute of Legal Studies (RVILS) coordinates cultural programmes and student events conducted throughout the academic year. These activities provide students with opportunities to participate in music, dance, theatre and other creative performances alongside their academic pursuits.The committee organises programmes such as Freshers\u2019 Day, cultural competitions, festive celebrations and institutional events, encouraging students to showcase their talents and contribute to the campus\u2019s cultural life. 2026 2025 2024 2026 Ministry of Kannada and Culture The MKPM RV Institute of Legal Studies, in association with the Ministry of Kannada and Culture, organized a Cultural Programme on 19 June 2026 with the objective of promoting and preserving the rich cultural heritage, traditions, and artistic expressions of Karnataka.The programme was conducted under the guidance of Prof. (Dr.) Anjina Reddy K. R., Principal of the institution, who highlighted the significance of cultural activities in nurturing creativity, fostering social harmony, and preserving the state\u2019s vibrant heritage among the younger generation.The programme featured a variety of cultural performances showcasing the richness and diversity of Karnataka\u2019s art and culture. Students enthusiastically participated in the event, displaying their talents and contributing to the festive atmosphere of the celebration.The event provided an excellent platform for students to engage with the cultural heritage of the state and reinforced the institution\u2019s commitment to promoting holistic education through academic as well as cultural activities.The programme concluded w"
    },
    {
        "url": "https://rvils.edu.in/life_at_rvils/events/institutional_events/",
        "title": "RVILS Institutional Events | Campus Activities",
        "slug": "life_at_rvils_events_institutional_events",
        "snippet": "Institutional Events Institutional Events This section showcases key institutional events organised by MKPM RV Institute of Legal Studies (RVILS), including academic programmes, competitions and outreach initiatives. Defining the RVILS Experience MKPM RV Institute of Legal Studies (RVILS) offers a well-equipped campus environment designed to support academic learning, legal research and student development. Whether it is technology-enabled classrooms and dedicated legal research facilities or sports infrastructure and student amenities, the campus provides the resources required for a comprehensive law school experience in Bengaluru. Institutional Events This section showcases key institutional events organised by MKPM RV Institute of Legal Studies (RVILS), including academic programmes, competitions and outreach initiatives. 2026 2025 2024 2023 2022 2026 6th Sep 2026 Inauguration of 1st Semester Classes and Orientation Programme 2026-27 MKPM RV Institute of Legal Studies conducted the Inauguration of the 1st Semester classes and Orientation Programme 2026- 27 for the Students for the B.A., LL.B., B.B.A., LL.B., B.Com., LL.B., 5 Year Integrated Degree Courses and 3-Year LL.B. on 6th September, 2026 at 11:00 AM at Mangala Mantapa, MKPM RVILS. The Chief Guest of the day was Hon\u2019ble Shri Justice Venkatesh Naik T, Judge, High Court of Karnataka, Bengaluru. The Guest of Honour for the day was Dr. Manju Naik B T, Associate Professor, Government Law College, Ramanagara and Sri.N.R. Nandish, Chairman, governing Council, MKPM RVILS & Trustee, Rashtreeya Sikshana Samithi Trust and the programme was presided over by Dr. M P Shyam, President, Rashtreeya Sikshana Samithi Trust and Prof. (Dr.) Anjina Reddy K. R., Principal of MKPM RV Institute of Legal Studies, delivered a heartfelt "
    },
    {
        "url": "https://rvils.edu.in/life_at_rvils/events/media-coverage/",
        "title": "RVILS Media & Press Coverage",
        "slug": "life_at_rvils_events_media-coverage",
        "snippet": "Media Coverage Media Coverage MKPM RV Institute of Legal Studies (RVILS) has been featured in newspapers and media platforms for its academic initiatives, institutional events and student activities.This section presents selected newspaper clippings and media mentions highlighting important programmes and initiatives of the institute. Quick Links About College Admissions Placements Privacy Policy Mandatory Disclosure Anti-Ragging Policy Internal Complaints Committee (ICC) Student Grievance Cell SC/ST Cell Reach us at Address #45/1, 22nd Cross, 3rd Block, Jayanagar, Bengaluru - 560011, Karnataka, India Phone No. +91-80-69018952/53 E-mail rvils@rvei.edu.in Follow Us Designed and Developed by Department of Media and Alumni Affairs, RSST"
    },
    {
        "url": "https://rvils.edu.in/life_at_rvils/sports_activities/",
        "title": "RVILS Sports Programs | Law College",
        "slug": "life_at_rvils_sports_activities",
        "snippet": "Sports Activities Make Your Case, on Every Field Sports Activities Sports Activities Sports and recreational activities form an important part of campus life at MKPM RV Institute of Legal Studies (RVILS). Students actively participate in inter-collegiate tournaments organised by Karnataka State Law University (KSLU) and other institutions, representing the college in various sports including basketball, volleyball, cricket, badminton, chess and yoga.Through participation in competitive tournaments and university selection trials, RVILS students develop teamwork, discipline, resilience and competitive spirit while achieving recognition at the university and national levels. 2026 2024-25 2023-24 2022-23 2022 2021 2026 Mr. Mohankumar N.N. Appointed as Referee at Commonwealth Kabaddi Championship 2026 Event Details:\u2013 Official Appointed: Mr. Mohankumar N.N., Physical Education Director,MKPM RVILS\u2013 Role: Referee / International Technical Official\u2013 Event: 1st Commonwealth Kabaddi Championship \u2013 2026\u2013 Venue: Veer Savarkar Sports Complex, Ahmedabad, Gujarat\u2013 Dates: 23rd to 31st October 2026Brief Write-Up:The Management, Principal, and Staff of MKPM RV Institute of Legal Studies take immense pride in announcing that our Physical Education Director, Mr. Mohankumar N.N., has been selected as an International Technical Official (Referee) for the ongoing 1st Commonwealth Kabaddi Championship 2026. Held at the Veer Savarkar Sports Complex in Ahmedabad, Gujarat, this prestigious international sporting event features top athletes from across the Commonwealth nations. Mr. Mohankumar\u2019s selection to officiate at such a high-profile international tournament is a testament to his expertise, dedication, and excellence in sports administration. We congratulate him on this stellar achievement a"
    },
    {
        "url": "https://rvils.edu.in/life_at_rvils/student_activities/",
        "title": "RVILS Co-Curricular Activities | Bangalore",
        "slug": "life_at_rvils_student_activities",
        "snippet": "Student Activities Student Activities At MKPM RV Institute of Legal Studies (RVILS), Bengaluru, student life extends far beyond the classroom. The institution encourages active participation in academic forums, legal training initiatives, cultural programmes and leadership platforms that help students develop practical skills alongside their legal education.Through initiatives such as the Moot Court Academy, Mediation Centre, Nyaya Darpana Lecture Series, Debate and Literary Society, and Environment Club, RVILS provides students with opportunities to engage with contemporary legal issues, develop advocacy and research skills, and participate in discussions that shape their professional outlook. Nyaya Darpana Lecture Series Nyaya Darpana Lecture Series is a continuing academic initiative at RVILS that brings distinguished speakers from law and allied fields to engage with students on contemporary issues and professional development. The series creates a space for reflection, discussion and exposure to different perspectives that extend beyond the classroom. Nyaya Darpana Lecture Series The Nyaya Darpana Lecture Series of MKPM RV Institute of Legal Studies (M. K. Panduranga Setty Memorial RV Institute of Legal Studies) organised a guest talk on \u201cBeyond Section 54: Practical Property Title Verification & Land Due Diligence\u201d on 25 Sept 2026 (Tuesday) in the Mangala Mantapa Auditorium, MKPM RVILS Campus. The programme was conducted under the guidance of Prof. (Dr.) Anjina Reddy K. R., Principal, and Mr. Anirudh Venkatesh, Nyaya Darpana Lecture Series Coordinator, MKPM RV Institute of Legal Studies.The session provided our students with a valuable opportunity to look beyond the provisions of property law and understand how legal principles operate in the context of actual pro"
    },
    {
        "url": "https://rvils.edu.in/life_at_rvils/youth_red_cross_unit/",
        "title": "RVILS Youth Red Cross Unit | Community Service",
        "slug": "life_at_rvils_youth_red_cross_unit",
        "snippet": "Community Extension Activities Youth Red Cross Unit The Youth Red Cross Unit at MKPM RV Institute of Legal Studies (RVILS) promotes humanitarian values and encourages students to participate in activities related to health awareness, blood donation and community welfare. The unit organises programmes such as health camps, awareness drives and voluntary service initiatives, fostering a spirit of social responsibility among students. Vision & Mission Vision To instil a sense of social responsibility among students and encourage selfless service towards society. Mission To engage students in initiatives that support communities during times of need, while promoting health, care and social well-being, particularly among vulnerable groups. 2025 2024 2023 2025 21st March, 2025 Samvedna 2 \u2013 Blood Donation and Health Camp in Commemoration of International Women\u2019s Day The programme included a blood donation camp, eye screening and dental check-up, promoting health awareness and community service. Approximately 100 units of blood were collected during the camp.The event was presided over by our Principal, with Smt. R. Pramila Naidu (Advocate & Notary Public and Former Chairperson, Karnataka State Commission for Women, Bengaluru) attending as Chief Guest, and Lion T.P. Leelavathi (PMJF Member District GST, Bengaluru) as Guest of Honour. 2024 14th October, 2024 Awareness Programme on Disaster Preparedness Practical demonstrations on disaster response and emergency preparedness were conducted by officers from the Jayanagar Fire Station, including guidance on assisting injured persons, using fire extinguishers and understanding the functioning of fire engines during fire emergencies.These demonstrations were part of an awareness programme organised by the Red Cross Unit of MKPM RV In"
    },
    {
        "url": "https://rvils.edu.in/placements/",
        "title": "RVILS Bangalore | Placements & Careers",
        "slug": "placements",
        "snippet": "Where Your Legal Careers Begin 5-year Integrated Course \u2013 20 Weeks 3-Year LL.B Course \u2013 20 Weeks Students Placed 0 + Placements 0 % Internships & Placements Internship Frameworks Internships form a compulsory component of the LL.B. programme and are an essential part of professional legal training. It ensures that students gain practical exposure throughout the 5-year and 3-year law courses.As part of the internship requirement, students undertake internships in courts, law firms, corporate legal departments, regulatory authorities and non-governmental organisations. This exposure enables students to understand the functioning of the legal system and develop skills relevant to litigation, corporate practice and public service.During their law internships, students engage in legal research, drafting pleadings and opinions, preparing cases and observing court proceedings under academic supervision, in accordance with university regulations. Objectives To help the students gain first-hand experience of a particular place of work.To assist students in being more receptive to market needs, and in deciding their area of specialisation in the future.To assist students in developing professional skills and a broader understanding of the legal profession and legal processes.To enhance students' learning of a particular area of law.To enable students to participate more effectively in law school classes to bring real-world experience back to the classroom.To make students aware of career alternatives.To further develop and integrate personal characteristics such as self-awareness problem-solving skills, professional ethics and behaviour.To gain a better understanding of the relation of law to society, economics, psychology and social science to develop new knowledge and skills. I"
    },
    {
        "url": "https://rvils.edu.in/programmes/3_year_ll_b/",
        "title": "3-Year LL.B Course | RVILS Bangalore",
        "slug": "programmes_3_year_ll_b",
        "snippet": "3-year LL.B. Postgraduate Professional Law Degree LL.B. (3-years) Admissions Open 2026 \u2013 27 APPLY NOW Postgraduate Professional Law Degree 3-Year LL.B. 3 Years \u00b7 Six Semesters ADMISSIONS OPEN 2026-27 APPLY NOW 6 Semesters 7yrs Max Period BCI Approved 3-Year LL.B. Postgraduate Professional Law Degree Admissions Open for 2026\u201327 APPLY NOW About the Programme The LL.B (3-year) Programme is a postgraduate professional law degree designed for graduates seeking to pursue a career in law after graduation. Conducted over six semesters, the programme provides a structured foundation in substantive and procedural law. The curriculum emphasises constitutional, criminal, civil and commercial law while fostering analytical engagement and professional responsibility. Academic study is supported by practical components including moot courts, internships, legal aid initiatives, court visits and drafting exercises, ensuring meaningful exposure to the practice of law. Graduates of the programme are eligible to enrol as advocates in accordance with applicable regulatory norms and may pursue careers in litigation, judiciary, corporate practice and related legal fields. View Career Prospects Programme Details Degree LL.B. (Bachelor of Laws) Type Postgraduate Professional Duration 3 Years (6 Semesters) Affiliation KSLU, Hubballi Approved By Bar Council of India View Career Prospects Programme Outcomes 01To provide students with an in-depth and comprehensive legal education that covers various aspects of law, including both general and specialised areas. 01To foster a culture of legal research, scholarly writing and critical analysis, encouraging students to contribute to legal academia. 01To equip students with the necessary skills and knowledge to excel in the legal profession, including le"
    },
    {
        "url": "https://rvils.edu.in/programmes/5_year_b_a_ll_b/",
        "title": "B.A. LL.B College in Bangalore | RVILS",
        "slug": "programmes_5_year_b_a_ll_b",
        "snippet": "5-year B.A. LL.B. Integrated Law with Humanities 5-year B.A. LL.B. Admissions Open 2026 \u2013 27 APPLY NOW Integrated Law with Humanities 5-year B.A. LL.B. Duration 5 Years (10 semesters) Max Completion 7 Years from Admission ADMISSIONS OPEN 2026-27 APPLY NOW 10 Semesters 7yrs Max Period BCI Approved 5-Year B.A. LL.B. INTEGRATED LAW WITH HUMANITIES Admissions Open for 2026\u201327 APPLY NOW About the Programme The B.A. LL.B (5-year Integrated Degree) Programme combines legal education with humanities and social sciences, offering a structured pathway for students seeking to pursue careers in litigation, judiciary, civil services and public law.The integrated curriculum provides grounding in constitutional and criminal law while fostering critical engagement with questions of governance, rights and social justice. This academic learning is supported by moot courts, internships and legal aid activities, ensuring practical exposure alongside doctrinal study.Graduates of the programme are prepared for professional practice, judicial services examinations, civil services, academia and related roles within the legal profession. View Career Prospects Programme Details Degree B.A. LL.B. Type Undergraduate Duration 5 Years (10 semesters) Affiliation KSLU, Hubballi Approved By Bar Council of India View Career Prospects Programme Outcomes 01To allow students to explore a wide range of disciplines to develop a comprehensive understanding of society, politics, and culture, in addition to the law. 01To provide students with an in-depth and comprehensive legal education that covers various aspects of law, including both general and specialised areas. 01To foster a culture of legal research, scholarly writing and critical analysis, encouraging students to contribute to legal academia. 01To equi"
    },
    {
        "url": "https://rvils.edu.in/programmes/5_year_b_b_a_ll_b/",
        "title": "B.B.A. LL.B College in Bangalore | RVILS",
        "slug": "programmes_5_year_b_b_a_ll_b",
        "snippet": "5-year B.B.A. LL.B. Integrated Law with Business & Management 5-year B.B.A. LL.B. Admissions Open 2026 \u2013 27 APPLY NOW Integrated Law with Business & Management 5-year B.B.A. LL.B. Duration 5 Years (10 semesters) Max Completion 7 Years from Admission ADMISSIONS OPEN 2026-27 APPLY NOW 10 Semesters 7yrs Max Period BCI Approved 5-year B.B.A. LL.B. Integrated Law with Business & Management Admissions Open for 2026\u201327 APPLY NOW About the Programme The B.B.A. LL.B. (5-year Integrated Degree) Programme combines legal education with business and management studies, providing a structured pathway for students seeking careers in corporate and commercial law.The integrated curriculum offers grounding in core legal principles alongside an understanding of corporate governance, compliance and commercial regulation. Practical exposure through internships with law firms, corporate entities and legal departments ensures that academic learning is complemented by professional experience.Graduates of the programme are prepared to pursue professional roles in corporate advisory, commercial litigation, compliance and related areas of legal practice. View Career Prospects Programme Details Degree B.B.A. LL.B. Type Undergraduate Duration 5 Years (10 semesters) Affiliation KSLU, Hubballi Approved By Bar Council of India View Career Prospects Programme Outcomes 01It develops legal professionals with a strong understanding of business practices and corporate legal skills, making them valuable in legal departments of corporations or law firms specialising in business law. 01To provide students with an in-depth and comprehensive legal education that covers various aspects of law, including both general and specialised areas. 01To foster a culture of legal research, scholarly writing and critical an"
    },
    {
        "url": "https://rvils.edu.in/programmes/5_year_b_com_ll_b/",
        "title": "RVILS Law Programs | B.Com. LL.B Course",
        "slug": "programmes_5_year_b_com_ll_b",
        "snippet": "5-year B.Com. LL.B. Integrated Law with Commerce & Finance 5-year B.Com. LL.B. Admissions Open 2026 \u2013 27 APPLY NOW Integrated Law with Commerce & Finance 5-year B.Com. LL.B. Duration 5 Years (10 semesters) Max Completion 7 Years from Admission ADMISSIONS OPEN 2026-27 APPLY NOW 10 Semesters 7yrs Max Period BCI Approved 5-year B.Com. LL.B. Integrated Law with Commerce & Finance Admissions Open for 2026\u201327 APPLY NOW About the Programme The B.Com. LL.B. (5-year Integrated Degree) Programme combines legal education with the study of commerce and finance, enabling students to understand the interface between law, business and financial systems.In addition to core areas of law, the curriculum incorporates subjects that provide grounding in accounting, taxation, corporate finance and economic regulation. This integrated structure supports engagement with legal issues relating to corporate governance, banking, insurance, securities regulation and fiscal compliance.The programme includes practical components such as internships with law firms, corporate entities and financial institutions, ensuring exposure to professional environments alongside academic study. Graduates are equipped to pursue professional pathways in corporate advisory, taxation practice, financial compliance and related commercial sectors. View Career Prospects Programme Details Degree B.Com. LL.B. Type Undergraduate Duration 5 Years (10 semesters) Affiliation KSLU, Hubballi Approved By Bar Council of India View Career Prospects Programme Objectives 01To impart foundational and advanced knowledge in commerce and legal studies. 01To cultivate analytical and critical thinking skills applicable to legal and commercial challenges. 01To provide students with an in-depth and comprehensive legal education that covers "
    },
    {
        "url": "https://rvils.edu.in/research/collaborations_institutional_partnerships/",
        "title": "RVILS Institutional Partnerships | Bengaluru",
        "slug": "research_collaborations_institutional_partnerships",
        "snippet": "Collaborations & Institutional Partnerships research Collaborations & Institutional Partnerships RVILS collaborates with universities, government bodies, legal authorities and professional organisations to deliver academic lectures, awareness programmes and community initiatives. These partnerships strengthen legal education through expert interaction, public engagement and interdisciplinary learning. Explore Student Life Beyond Classroom Know More Initiatives Undertaken Through Collaborations 2024-25 2023-24 2022-23 2022 2021 2024-25 2023-24 2022-23 2022 2021 Collaborating Institution: University of Leeds, United Kingdom Introduction to International Criminal Law: Origin and Development Dr. Ilaria Zavoli, Lecturer in Law, University of Leeds The Career Guidance and Placement Cell organised a lecture \u201cIntroduction to International Criminal Law: Origin and Development\u201d, delivered by Dr. Ilaria Zavoli, Lecturer in Law at the University of Leeds, United Kingdom. The session addressed the evolution of International Criminal Law and the development of legal frameworks dealing with International crimes. Collaborating Organisation: Kaale & Kaale Advisors Pvt. Ltd. Career Prospects in General Corporate & Investment Funds Practice Mr. Ajith N. Kale, Corporate Associate, Trust Law Mr. Amith N. Kale, Director, Kaale & Kaale Advisors Pvt. Ltd. The Career Guidance and Placement Cell organised a talk on \u201cCareer Prospects in General Corporate & Investment Funds Practice\u201d. The session was delivered by Mr. Ajith N. Kale, Corporate Associate at Trust Law, and Mr. Amith N. Kale, Director of Kaale & Kaale Advisors Pvt. Ltd., who discussed professional opportunities and career pathways in corporate law and investment funds practice. Collaborating Organisation: District Legal Services Author"
    },
    {
        "url": "https://rvils.edu.in/research/publications/books/",
        "title": "RVILS Books & Publications | Legal Research",
        "slug": "research_publications_books",
        "snippet": "Books Publications Books The Centre for Research and Publication at RVILS publishes ISBN-registered books and edited volumes that document scholarly work emerging from seminars, conferences and academic initiatives organised by the institution. These publications include contributions from faculty members, legal professionals and students, reflecting ongoing engagement with contemporary developments in law and public policy.Through these publications, the Centre encourages academic writing and provides students and faculty with opportunities to contribute to legal scholarship. Published Volumes View Faculty & Student Publications Quick Links About College Admissions Placements Privacy Policy Mandatory Disclosure Anti-Ragging Policy Internal Complaints Committee (ICC) Student Grievance Cell SC/ST Cell Reach us at Address #45/1, 22nd Cross, 3rd Block, Jayanagar, Bengaluru - 560011, Karnataka, India Phone No. +91-80-69018952/53 E-mail rvils@rvei.edu.in Follow Us Designed and Developed by Department of Media and Alumni Affairs, RSST"
    },
    {
        "url": "https://rvils.edu.in/research/publications/faculty_student_publications/",
        "title": "RVILS Research Publications | Bangalore",
        "slug": "research_publications_faculty_student_publications",
        "snippet": "Faculty & Student Publications Publications Faculty & Student Publications Faculty members and students at RVILS actively contribute to legal scholarship through research papers, articles and conference presentations in reputed journals and academic forums. These publications reflect the institution\u2019s commitment to encouraging academic research, critical inquiry and scholarly writing within legal education. Faculty Publications Student Publications Quick Links About College Admissions Placements Privacy Policy Mandatory Disclosure Anti-Ragging Policy Internal Complaints Committee (ICC) Student Grievance Cell SC/ST Cell Reach us at Address #45/1, 22nd Cross, 3rd Block, Jayanagar, Bengaluru - 560011, Karnataka, India Phone No. +91-80-69018952/53 E-mail rvils@rvei.edu.in Follow Us Designed and Developed by Department of Media and Alumni Affairs, RSST"
    },
    {
        "url": "https://rvils.edu.in/research/publications/magazine-samarthana/",
        "title": "Samarthana Magazine | RVILS Publications",
        "slug": "research_publications_magazine-samarthana",
        "snippet": "Magazine \u2013 Samarthana Publications Magazine - Samarthana Samarthana, the institutional magazine of RVILS, features articles, reflections and creative contributions by students and faculty on contemporary legal, social and public policy issues. The magazine highlights academic perspectives, student voices and campus initiatives, reflecting the intellectual and cultural life of the institution. Issue Volume \u2014 2025 Download (PDF) Volume \u2014 2023-24 Download (PDF) Volume \u2014 2023 Download (PDF) Volume \u2014 2018-2022 Download (PDF) View Student Clubs & Activities Quick Links About College Admissions Placements Privacy Policy Mandatory Disclosure Anti-Ragging Policy Internal Complaints Committee (ICC) Student Grievance Cell SC/ST Cell Reach us at Address #45/1, 22nd Cross, 3rd Block, Jayanagar, Bengaluru - 560011, Karnataka, India Phone No. +91-80-69018952/53 E-mail rvils@rvei.edu.in Follow Us Designed and Developed by Department of Media and Alumni Affairs, RSST"
    },
    {
        "url": "https://rvils.edu.in/research/publications/rv_law_journal/",
        "title": "RV Law Journal | RVILS Research Publications",
        "slug": "research_publications_rv_law_journal",
        "snippet": "RV Law Journal Publications RV Law Journal RV Law Journal is a blind peer-reviewed, biannual law journal with an ISSN, published by MKPM RV Institute of Legal Studies (RVILS). The journal provides an academic platform for scholars, practitioners, researchers and students to publish original research and critical analysis on contemporary legal issues relevant to the Indian legal system.It encourages doctrinal, empirical, comparative and interdisciplinary research that advances legal scholarship and promotes informed discussion on developments in law and public policy. Journal Details ISSN 2583-5041 Publication Frequency Biannual Citation Style OSCOLA Publisher MKPM RV Institute of Legal Studies Latest Issue Volume \u2014 2026 Download (PDF) Volume 5, Issue 2 \u2014 2026 Download (PDF) Volume 5, Issue 1 \u2014 2026 Download (PDF) Volume 4, Issue 2 \u2014 2025 Download (PDF) Volume 4, Issue 1 \u2014 2025 Download (PDF) Archive Volume 3, Issue 2 \u2014 2024 Download (PDF) Volume 3, Issue 1 \u2014 2024 Download (PDF) Oscola Reference Guide Download (PDF) Subscription Form for RV Law Journal Download (PDF) Categories of Submission Research Articles & Papers Short & Long Articles Case Comments Book Reviews submit your work Send your submissions to the editorial team. Ensure your work follow the submission guidelines before writing in. Submission Email - rvlawjournal.mkpmrvils@rvei.edu.in Quick Links About College Admissions Placements Privacy Policy Mandatory Disclosure Anti-Ragging Policy Internal Complaints Committee (ICC) Student Grievance Cell SC/ST Cell Reach us at Address #45/1, 22nd Cross, 3rd Block, Jayanagar, Bengaluru - 560011, Karnataka, India Phone No. +91-80-69018952/53 E-mail rvils@rvei.edu.in Follow Us Designed and Developed by Department of Media and Alumni Affairs, RSST"
    },
    {
        "url": "https://rvils.edu.in/research/publications/rvils_newsletter/",
        "title": "RVILS Newsletter -",
        "slug": "research_publications_rvils_newsletter",
        "snippet": "RVILS Newsletter Publications RVILS Newsletter The RVILS Newsletter documents the academic, research and co-curricular activities of the institution. Published periodically, it highlights seminars, conferences, moot court achievements, research initiatives, guest lectures and student accomplishments, providing a record of the institution\u2019s intellectual engagement. Latest Issue July, 2025 - January, 2026 Download (PDF) Archive October 2023 - March 2024 Download (PDF) April - September 2023 Download (PDF) November 2022 \u2013 March 2023 Download (PDF) Newsletter June - October 2022 Download (PDF) Quick Links About College Admissions Placements Privacy Policy Mandatory Disclosure Anti-Ragging Policy Internal Complaints Committee (ICC) Student Grievance Cell SC/ST Cell Reach us at Address #45/1, 22nd Cross, 3rd Block, Jayanagar, Bengaluru - 560011, Karnataka, India Phone No. +91-80-69018952/53 E-mail rvils@rvei.edu.in Follow Us Designed and Developed by Department of Media and Alumni Affairs, RSST"
    },
    {
        "url": "https://rvils.edu.in/research/research-policy/",
        "title": "RVILS Research Policy | Legal Research Standards",
        "slug": "research_research-policy",
        "snippet": "Research Policy Publications Research Policy MKPM RV Institute of Legal Studies (RVILS) is committed to fostering a strong culture of research and scholarly publication in the fields of law, public policy, social sciences and allied disciplines. The institution recognises research as an integral component of academic excellence, quality teaching and intellectual development.Through its Centre for Research and Publication, the institution encourages faculty members and students to participate in research activities, academic writing, conferences and collaborative research initiatives that contribute to legal scholarship and informed public discourse. Download the Full Research Policy Download (PDF) Quick Links About College Admissions Placements Privacy Policy Mandatory Disclosure Anti-Ragging Policy Internal Complaints Committee (ICC) Student Grievance Cell SC/ST Cell Reach us at Address #45/1, 22nd Cross, 3rd Block, Jayanagar, Bengaluru - 560011, Karnataka, India Phone No. +91-80-69018952/53 E-mail rvils@rvei.edu.in Follow Us Designed and Developed by Department of Media and Alumni Affairs, RSST"
    },
    {
        "url": "https://rvils.edu.in/research/seminars_conferences_workshops_fdps/",
        "title": "RVILS Seminars & Conferences | Bangalore",
        "slug": "research_seminars_conferences_workshops_fdps",
        "snippet": "Seminars, Conferences, Workshops & FDPs research Seminars, Conferences, Workshops & FDPs MKPM RV Institute of Legal Studies (RVILS) regularly organises seminars, conferences, workshops and Faculty Development Programme (FDP) to promote academic dialogue and engagement with contemporary legal issues. These initiatives provide opportunities for students and faculty to interact with legal professionals, scholars and subject experts. Seminars Workshops FDPs Seminars Seminars 2024-25 2023-24 2022-23 2022 2021 2024-25 2023-24 2022-23 2022 2021 Seminar on Bharatiya Nyaya Sanhita Organised by: RVILSIn association with: INDGenius Bengaluru South Speaker:Sri Madhukar M. Deshpande \u2014 Advocate & Senior Standing Counsel, GOI, High Court of Karnataka View Details RVILS organised a seminar on \u201cBharatiya Nyaya Sanhita\u201d in association with INDGenius Bengaluru South. The session was delivered by Sri Madhukar M. Deshpande, Advocate and Senior Standing Counsel for the Government of India, High Court of Karnataka.The seminar examined key aspects of the Bharatiya Nyaya Sanhita, including the new nomenclature introduced in the legislation and provisions relating to offences such as snatching, community service and protections concerning women and children.As part of the programme, a short film titled \u201cKargil Vijay Diwas \u2013 20 Years of Kargil Victory\u201d, produced by the Indian Army in 2019, was screened in observance of Kargil Vijay Diwas. RVILS organised a seminar on \u201cBharatiya Nyaya Sanhita\u201d in association with INDGenius Bengaluru South. The session was delivered by Sri Madhukar M. Deshpande, Advocate and Senior Standing Counsel for the Government of India, High Court of Karnataka.The seminar examined key aspects of the Bharatiya Nyaya Sanhita, including the new nomenclature introduced in the le"
    },
    {
        "url": "https://rvils.edu.in/seminars_conferences_workshops_fdps/",
        "title": "RVILS Seminars & Conferences | Bangalore",
        "slug": "seminars_conferences_workshops_fdps",
        "snippet": "Seminars, Conferences, Workshops & FDPs research Seminars, Conferences, Workshops & FDPs MKPM RV Institute of Legal Studies (RVILS) regularly organises seminars, conferences, workshops and Faculty Development Programme (FDP) to promote academic dialogue and engagement with contemporary legal issues. These initiatives provide opportunities for students and faculty to interact with legal professionals, scholars and subject experts. Seminars Workshops FDPs Seminars Seminars 2024-25 2023-24 2022-23 2022 2021 2024-25 2023-24 2022-23 2022 2021 Seminar on Bharatiya Nyaya Sanhita Organised by: RVILSIn association with: INDGenius Bengaluru South Speaker:Sri Madhukar M. Deshpande \u2014 Advocate & Senior Standing Counsel, GOI, High Court of Karnataka View Details RVILS organised a seminar on \u201cBharatiya Nyaya Sanhita\u201d in association with INDGenius Bengaluru South. The session was delivered by Sri Madhukar M. Deshpande, Advocate and Senior Standing Counsel for the Government of India, High Court of Karnataka.The seminar examined key aspects of the Bharatiya Nyaya Sanhita, including the new nomenclature introduced in the legislation and provisions relating to offences such as snatching, community service and protections concerning women and children.As part of the programme, a short film titled \u201cKargil Vijay Diwas \u2013 20 Years of Kargil Victory\u201d, produced by the Indian Army in 2019, was screened in observance of Kargil Vijay Diwas. RVILS organised a seminar on \u201cBharatiya Nyaya Sanhita\u201d in association with INDGenius Bengaluru South. The session was delivered by Sri Madhukar M. Deshpande, Advocate and Senior Standing Counsel for the Government of India, High Court of Karnataka.The seminar examined key aspects of the Bharatiya Nyaya Sanhita, including the new nomenclature introduced in the le"
    },
    {
        "url": "https://rvils.edu.in/student_activities/",
        "title": "RVILS Co-Curricular Activities | Bangalore",
        "slug": "student_activities",
        "snippet": "Student Activities Student Activities At MKPM RV Institute of Legal Studies (RVILS), Bengaluru, student life extends far beyond the classroom. The institution encourages active participation in academic forums, legal training initiatives, cultural programmes and leadership platforms that help students develop practical skills alongside their legal education.Through initiatives such as the Moot Court Academy, Mediation Centre, Nyaya Darpana Lecture Series, Debate and Literary Society, and Environment Club, RVILS provides students with opportunities to engage with contemporary legal issues, develop advocacy and research skills, and participate in discussions that shape their professional outlook. Nyaya Darpana Lecture Series Nyaya Darpana Lecture Series is a continuing academic initiative at RVILS that brings distinguished speakers from law and allied fields to engage with students on contemporary issues and professional development. The series creates a space for reflection, discussion and exposure to different perspectives that extend beyond the classroom. Nyaya Darpana Lecture Series The Nyaya Darpana Lecture Series of MKPM RV Institute of Legal Studies (M. K. Panduranga Setty Memorial RV Institute of Legal Studies) organised a guest talk on \u201cBeyond Section 54: Practical Property Title Verification & Land Due Diligence\u201d on 25 Sept 2026 (Tuesday) in the Mangala Mantapa Auditorium, MKPM RVILS Campus. The programme was conducted under the guidance of Prof. (Dr.) Anjina Reddy K. R., Principal, and Mr. Anirudh Venkatesh, Nyaya Darpana Lecture Series Coordinator, MKPM RV Institute of Legal Studies.The session provided our students with a valuable opportunity to look beyond the provisions of property law and understand how legal principles operate in the context of actual pro"
    }
];

    function searchWebsiteCorpus(query) {
        if (!query) return null;
        const qTokens = tokenize(query).filter(w => !STOP_WORDS.has(w));
        if (qTokens.length === 0) return null;

        let bestMatch = null;
        let highestScore = 0;

        for (const page of PAGE_CORPUS) {
            let score = 0;
            const textLower = (page.snippet || '').toLowerCase();
            const titleLower = (page.title || '').toLowerCase();

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
            return {
                page: bestMatch,
                score: highestScore
            };
        }
        return null;
    }


    /* =============== FUZZY "DID YOU MEAN?" (LEVENSHTEIN PARITY) =============== */
    function levenshtein(a, b) {
        if (!a || !b) return (a || b).length;
        const m = a.length, n = b.length;
        const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
        for (let i = 0; i <= m; i++) dp[i][0] = i;
        for (let j = 0; j <= n; j++) dp[0][j] = j;
        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                dp[i][j] = Math.min(
                    dp[i - 1][j] + 1,
                    dp[i][j - 1] + 1,
                    dp[i - 1][j - 1] + (a[i - 1] !== b[j - 1] ? 1 : 0)
                );
            }
        }
        return dp[m][n];
    }

    const QA_SUGGESTIONS = [
        { id: 'rvce_engineering_clarification', label: 'RVILS vs RVCE Clarification', keywords: ['rvce', 'engineering', 'btech', 'tech', 'branch'] },
                { id: 'stream_matcher', label: 'Legal Stream Matcher', keywords: ['matcher', 'quiz', 'choose', 'stream', 'suggest', 'which', 'confused'] },
        { id: 'internship_roadmap', label: '20-Week Internship Roadmap', keywords: ['internship', 'roadmap', 'phases', 'weeks', 'stages', 'timeline'] },
        { id: 'legal_glossary', label: 'Latin Maxims & Legal Glossary', keywords: ['latin', 'maxims', 'glossary', 'terms', 'dictionary', 'probono', 'maxim'] },
        { id: 'rv_law_journal', label: 'RV Law Journal (ISSN: 2583-5041)', keywords: ['journal', 'issn', 'oscola', 'peer', 'reviewed', 'biannual'] },
        { id: 'magazine_samarthana', label: 'Samarthana College Magazine', keywords: ['samarthana', 'magazine', 'articles', 'reflections'] },
        { id: 'rvils_newsletter', label: 'RVILS Newsletter', keywords: ['newsletter', 'bulletin', 'news', 'chronicle'] },
        { id: 'research_collaborations', label: 'Institutional Collaborations & Leeds', keywords: ['collaboration', 'leeds', 'dlsa', 'partnerships'] },
        { id: 'research_publications', label: 'Research & Publications', keywords: ['research', 'publication', 'crp', 'scholarly', 'seminar'] },
        { id: 'program_ba_llb', label: '5-Yr B.A. LL.B.', keywords: ['ba', 'llb', 'ballb', 'arts', 'humanities'] },
        { id: 'program_bba_llb', label: '5-Yr B.B.A. LL.B.', keywords: ['bba', 'bballb', 'management', 'business'] },
        { id: 'program_bcom_llb', label: '5-Yr B.Com. LL.B.', keywords: ['bcom', 'bcomllb', 'commerce', 'finance', 'accounts'] },
        { id: 'program_3yr_llb', label: '3-Year LL.B.', keywords: ['three', 'year', 'graduate', 'degree'] },
        { id: 'rvils_lat', label: 'RVILS-LAT Entrance Test', keywords: ['lat', 'rvils-lat', 'entrance', 'aptitude', 'test', 'exam'] },
        { id: 'admissions', label: 'Admissions 2026', keywords: ['admission', 'apply', 'application', 'seat', 'process', 'selection'] },
        { id: 'fees_scholarships', label: 'Fees & Scholarships', keywords: ['fee', 'fees', 'cost', 'tuition', 'scholarship', 'ssp'] },
        { id: 'principal', label: 'Principal Profile', keywords: ['principal', 'head', 'anjina', 'reddy'] },
        { id: 'faculty', label: 'Faculty Directory', keywords: ['faculty', 'professors', 'teachers', 'lecturers', 'hanumaprakash', 'runjhun'] },
        { id: 'moot_court', label: 'Moot Court Academy', keywords: ['moot', 'court', 'academy', 'hall', 'advocacy', 'memorial'] },
        { id: 'legal_aid', label: 'Legal Services Clinic', keywords: ['legal', 'aid', 'clinic', 'pro', 'bono', 'lok', 'adalat', 'thattaguppe'] },
        { id: 'library', label: 'Knowledge Centre & Library', keywords: ['library', 'books', 'manupatra', 'scc', 'online', 'manuscript', 'koha'] },
        { id: 'placements', label: 'Internships & Placements', keywords: ['internship', 'placement', 'weeks', 'recruiters', 'career', 'job'] },
        { id: 'campus_facilities', label: 'Campus & Facilities', keywords: ['campus', 'sports', 'hostel', 'gym', 'auditorium', 'jayanagar'] },
        { id: 'accreditation_trust', label: 'BCI & KSLU Affiliation', keywords: ['kslu', 'bci', 'affiliation', 'approval', 'trust', 'rsst'] },
        { id: 'contact', label: 'Contact & Location', keywords: ['contact', 'address', 'phone', 'email', 'metro', 'location', 'reach'] }
    ];

    function findSuggestions(query) {
        if (!query) return [];
        const words = query.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(w => w.length > 2);
        if (words.length === 0) return [];

        const scored = new Map();
        for (const item of QA_SUGGESTIONS) {
            let minDist = Infinity;
            for (const kw of item.keywords) {
                for (const w of words) {
                    const d = levenshtein(w, kw);
                    const threshold = Math.max(1, Math.floor(kw.length * 0.4));
                    if (d <= threshold && d < minDist) {
                        minDist = d;
                    }
                }
            }
            if (minDist < Infinity) {
                scored.set(item, minDist);
            }
        }

        const sorted = [...scored.entries()].sort((a, b) => a[1] - b[1]);
        return sorted.slice(0, 3).map(entry => entry[0]);
    }

    /* =============== MULTI-TURN CONTEXT & DEEP INFO =============== */
    function isMultiTurnContinuation(text) {
        return /\b(tell me more|more info|more details|elaborate|what else|continue|expand|in depth|tell more)\b/i.test(text);
    }

    function getDeepInfo(intentId) {
        switch (intentId) {
            case 'program_ba_llb':
                return {
                    text: `### ⚖️ Comprehensive Curriculum: 5-Year Integrated B.A. LL.B.
* **Integrated Arts & Law Synergies:** Integrates Sociology of Law, Political Science, Economics, and History with core Substantive & Procedural Laws.
* **10-Semester Architecture:** Accredited by KSLU, Hubballi. Includes Civil Procedure Code, Criminal Procedure Code, Law of Evidence, and Jurisprudence.
* **Mandatory Clinical Papers:** Drafting, Pleading & Conveyance, Professional Ethics, Alternative Dispute Resolution (ADR), and Moot Court advocacy.
* **Judicial & Public Policy Careers:** Tailored for Union/State Judicial Services, Civil Services, High Court litigation, and international human rights advocacy.`,
                    chips: ["Admissions 2026", "RVILS-LAT", "Internships", "Fee Guidance", "Contact Us"]
                };

            case 'program_bba_llb':
                return {
                    text: `### 🏢 Comprehensive Curriculum: 5-Year Integrated B.B.A. LL.B.
* **Management & Corporate Law Synergy:** Combines Strategic Management, Corporate Governance, Financial Accounting, and Organizational Behavior with Mergers & Acquisitions, IPR, and Securities Law.
* **Career Focus:** Designed for students aiming for Tier-1 Law Firms, In-House Corporate Legal Departments, Investment Banking compliance, and Cross-Border Arbitration.
* **KSLU Eligibility:** 10 Semesters (Max 7 years). General Merit: 45%, OBC: 42%, SC/ST: 40%.`,
                    chips: ["Admissions 2026", "Corporate Internships", "Faculty Directory", "Contact Us"]
                };

            case 'program_bcom_llb':
                return {
                    text: `### 📊 Comprehensive Curriculum: 5-Year Integrated B.Com. LL.B.
* **Commerce & Taxation Specialization:** Blends Corporate Auditing, Indirect Tax (GST), Direct Tax Jurisprudence, and Commercial Banking Law.
* **Practice Readiness:** Financial fraud forensic investigation, corporate insolvency (IBC), and commercial dispute resolution.`,
                    chips: ["Admissions 2026", "RVILS-LAT", "Internships", "Contact Us"]
                };

            case 'program_3yr_llb':
                return {
                    text: `### 🏛️ Comprehensive Details: 3-Year LL.B. (Postgraduate Law Degree)
* **Graduate Professional Path:** Open to graduates in any discipline from a recognized university in India or equivalent qualification.
* **6 Semesters (3 Academic Years):** Intensive clinical curriculum with trial advocacy, legal aid clinic counseling, and senior advocate chamber attachments.
* **Percentage Cut-offs:** GM: 45%, OBC: 42%, SC/ST: 40% in qualifying graduation degree.`,
                    chips: ["Admissions 2026", "RVILS-LAT", "Chamber Internships", "Contact Us"]
                };

            case 'rvils_lat':
                return {
                    text: `### 📝 RVILS-LAT Entrance Test Pattern & Preparation
* **Assessment Domains:** Legal Aptitude, Logical Reasoning, General Knowledge, English Comprehension, and Current Legal Affairs.
* **Selection Sequence:** 
  1. LAT Entrance Examination
  2. Institutional Interaction Session (accompanied by parents)
  3. Personal Interview assessing legal acumen and articulation
  4. Provisional Offer Letter & Verification
* **Helpline for Admissions:** Call \`+91-80-69018952/53\` or email \`rvils@rvei.edu.in\`.`,
                    chips: ["Admissions 2026", "Eligibility Criteria", "Online Application", "Campus Address"]
                };

            case 'moot_court':
                return {
                    text: `### 🏛️ RVILS Moot Court Academy & Clinical Advocacy
* **State-of-the-Art Courtroom:** Realistic high-court tier chamber with judge's bench, witness stand, jury box, and automated audio-visual recording.
* **Moot Court Society:** Coordinates intra-college trials, orientation workshops with High Court advocates, and trains student teams for National and International Moot Court Competitions.
* **Memorial Drafting & Research:** SCC Online and Manupatra stations integrated for citation training and appellate advocacy preparation.`,
                    chips: ["Nyaya Darpana", "Legal Aid Clinic", "Faculty", "Library Overview"]
                };

            case 'library':
                return {
                    text: `### 📚 RVILS Knowledge Centre: Advanced Digital & Archive Assets
* **Original Constitution Manuscript:** Certified collector's replica of the original 1950 Indian Constitution manuscript calligraphed by Prem Behari Narain Raizada with Nandalal Bose illustrations.
* **Digital Legal Databases:** Full institutional access to **SCC Online** (comprehensive case law since 1996) and **Manupatra** across campus LAN and remote terminals.
* **Automated Systems:** KOHA Open Source Integrated Library Management and LIBSOFT automation.
* **Citation Standards:** Official research handbooks for Bluebook 22nd Edition, OSCOLA 4th Edition, and APA/MLA styles.`,
                    chips: ["Faculty Directory", "Moot Court Hall", "Contact Us"]
                };

            case 'placements':
            case 'internships':
                return {
                    text: `### 💼 Internships & Career Development Cell
* **Mandatory 20-Week Clinical Requirement:** As mandated by BCI and KSLU, students must complete a minimum of 20 weeks of internships throughout the course (maximum 4 weeks per academic term).
* **Four Mandatory Exposure Pillars:**
  1. Non-Governmental Organizations (NGOs) & Human Rights
  2. Trial Courts (Criminal & Civil Jurisdiction)
  3. Appellate Courts (High Court & Supreme Court)
  4. District Legal Services Authority (DLSA) / Statutory Commissions
* **Official Placement Desk:** Guides final-year students into law firms, corporate legal teams, independent advocate chambers, and judicial clerkships.`,
                    chips: ["Programmes", "Admissions 2026", "Legal Aid Clinic", "Contact Us"]
                };

            default:
                return null;
        }
    }

    /* =============== DYNAMIC CONTEXTUAL FOLLOW-UP CHIPS =============== */
    function getFollowUps(intentId) {
        const followUpMap = {
            'rvce_engineering_clarification': ["5-Yr B.A. LL.B.", "3-Yr LL.B.", "Admissions 2026", "Contact Us"],
            'greeting': ["Admissions 2026", "5-Yr B.A. LL.B.", "3-Yr LL.B.", "RVILS-LAT", "Faculty", "Contact Us"],
            'program_ba_llb': ["Legal Stream Matcher", "20-Week Internship Roadmap", "RVILS-LAT", "Diverse Career Paths", "Contact Us"],
            'program_bba_llb': ["Legal Stream Matcher", "20-Week Internship Roadmap", "RVILS-LAT", "Latin Maxims", "Contact Us"],
            'program_bcom_llb': ["RVILS-LAT", "Taxation & Finance Law", "Admissions 2026", "Contact Us"],
            'program_3yr_llb': ["Eligibility Criteria", "RVILS-LAT", "Chamber Internships", "Contact Us"],
            'all_programs': ["5-Yr B.A. LL.B.", "5-Yr B.B.A. LL.B.", "5-Yr B.Com. LL.B.", "3-Yr LL.B.", "RVILS-LAT"],
            'admissions': ["RVILS-LAT", "Eligibility Criteria", "Open Enquiry Form", "Fee Guidance", "Contact Us"],
            'rvils_lat': ["Selection Process", "Admissions 2026", "Eligibility Criteria", "Open Enquiry Form"],
            'fees_scholarships': ["SSP Scholarship Portal", "Admissions 2026", "Open Enquiry Form", "Contact Desk"],
            'principal': ["Faculty Directory", "Board of Management", "About RVILS", "Contact Us"],
            'faculty': ["Dr. Hanumaprakash", "Principal Profile", "Library Staff", "Sports Director"],
            'moot_court': ["Nyaya Darpana", "Legal Aid Clinic", "Library Databases", "Contact Us"],
            'legal_aid': ["Thattaguppe Survey", "Lok Adalat", "Moot Court Academy", "Contact Us"],
            'library': ["Constitution Manuscript", "SCC Online & Manupatra", "Citation Guides", "Library Staff"],
            'placements': ["20-Week Internship Roadmap", "Career Paths", "Law Firms", "Legal Stream Matcher", "Admissions 2026"],
            'campus_facilities': ["Sports Facilities", "Hostels", "Mangala Mantapa", "Location & Metro"],
            'contact': ["Open Enquiry Form", "Admissions 2026", "South End Circle Metro", "Principal"]
        };
        return followUpMap[intentId] || ["Admissions 2026", "Programmes", "Faculty", "Library", "Contact Us"];
    }

    /* =============== SAFE STORAGE & STATE PERSISTENCE =============== */
    const SafeStorage = {
        mem: {},
        setItem: function(k, v) { try { localStorage.setItem(k, v); } catch(e) { this.mem[k] = v; } },
        getItem: function(k) { try { return localStorage.getItem(k) || this.mem[k]; } catch(e) { return this.mem[k]; } },
        removeItem: function(k) { try { localStorage.removeItem(k); } catch(e) { delete this.mem[k]; } }
    };

    function saveChatState() {
        const stream = document.getElementById('rvilsMessages');
        if (!stream) return;
        SafeStorage.setItem('rvils_chat_html', stream.innerHTML);
        SafeStorage.setItem('rvils_chat_tone', tone);
        SafeStorage.setItem('rvils_chat_open', chatOpen ? '1' : '0');
        SafeStorage.setItem('rvils_chat_time', Date.now().toString());
        if (SESSION.lastIntent) {
            SafeStorage.setItem('rvils_last_intent', SESSION.lastIntent);
        }
    }

    function restoreChatState() {
        const stream = document.getElementById('rvilsMessages');
        if (!stream) return false;
        const savedTime = SafeStorage.getItem('rvils_chat_time');
        // Clear history if older than 2 hours (7200000ms)
        if (!savedTime || (Date.now() - parseInt(savedTime, 10) > 7200000)) {
            SafeStorage.removeItem('rvils_chat_html');
            SafeStorage.removeItem('rvils_chat_tone');
            SafeStorage.removeItem('rvils_chat_open');
            SafeStorage.removeItem('rvils_chat_time');
            SafeStorage.removeItem('rvils_last_intent');
            return false;
        }

        const savedHtml = SafeStorage.getItem('rvils_chat_html');
        if (savedHtml && savedHtml.trim().length > 0) {
            stream.innerHTML = savedHtml;
            const savedTone = SafeStorage.getItem('rvils_chat_tone');
            if (savedTone) {
                tone = savedTone;
                const toneLabel = document.getElementById('rvilsToneLabel');
                if (toneLabel) toneLabel.textContent = tone.toUpperCase();
            }
            const savedIntent = SafeStorage.getItem('rvils_last_intent');
            if (savedIntent) SESSION.lastIntent = savedIntent;

            if (SafeStorage.getItem('rvils_chat_open') === '1') {
                const win = document.getElementById('rvilsChatWindow');
                const fab = document.getElementById('rvilsChatFab');
                if (win && fab) {
                    chatOpen = true;
                    win.style.display = 'flex';
                    const openIcon = fab.querySelector('.rvils-fab-open-icon');
                    const closeIcon = fab.querySelector('.rvils-fab-close-icon');
                    const badge = fab.querySelector('.rvils-fab-badge');
                    if (openIcon) openIcon.style.display = 'none';
                    if (closeIcon) closeIcon.style.display = 'inline-block';
                    if (badge) badge.style.display = 'none';
                }
            }
            return true;
        }
        return false;
    }

    /* =============== INTENT MATCHER & CLASSIFIER =============== */
    function classifyIntent(input) {
        const text = input.toLowerCase().trim();
        // Multi-Turn Context Continuation ("tell me more", "more details", etc.)
        if (isMultiTurnContinuation(text) && SESSION.lastIntent) {
            return { intent: 'multi_turn_continuation', confidence: 0.96, contextIntent: SESSION.lastIntent };
        }

        const p = processNLPInput(text);
        const tokens = p.tokens;
        const raw = p.rawTokens;

        const has = (w) => raw.includes(w) || tokens.includes(w);
        const contains = (phrase) => text.includes(phrase);


        // 1. Legal Stream Matcher (Quiz / Decision Tree)
        if (contains('stream matcher') || contains('course matcher') || contains('help me choose') || contains('which course') || contains('which stream') || contains('suggest course') || contains('which law degree') || contains('course quiz') || contains('which program') || contains('recommend course') || (contains('confused') && contains('law')) || contains('ba vs bba') || contains('bba vs bcom')) {
            return { intent: 'stream_matcher_start', confidence: 0.98 };
        }
        // Matcher Answers (Step 1 - Qualification)
        if (contains('12th / puc (arts)') || contains('12th arts') || contains('puc arts')) return { intent: 'matcher_q_arts', confidence: 0.98 };
        if (contains('12th / puc (commerce)') || contains('12th commerce') || contains('puc commerce')) return { intent: 'matcher_q_commerce', confidence: 0.98 };
        if (contains('12th / puc (science)') || contains('12th science') || contains('puc science')) return { intent: 'matcher_q_science', confidence: 0.98 };
        if (contains('university graduate') || contains('graduate background') || contains('completed graduation')) return { intent: 'matcher_q_graduate', confidence: 0.98 };
        // Matcher Answers (Step 2 - Career Destination)
        if (contains('judiciary / civil litigation') || contains('judiciary') || contains('judge') || contains('litigation practice')) return { intent: 'matcher_ans_judiciary', confidence: 0.98 };
        if (contains('corporate law & m&a') || contains('corporate law') || contains('m&a') || contains('law firm practice')) return { intent: 'matcher_ans_corporate', confidence: 0.98 };
        if (contains('taxation, banking & fintech') || ((contains('taxation') || contains('tax law') || contains('banking law')) && !contains('bcom') && !contains('b.com') && !contains('b com'))) return { intent: 'matcher_ans_taxation', confidence: 0.98 };
        if (contains('civil services (upsc)') || contains('civil services') || (has('upsc') && has('law'))) return { intent: 'matcher_ans_upsc', confidence: 0.98 };

        // 2. BCI 20-Week Mandatory Internship Roadmap
        if (contains('internship roadmap') || contains('20 weeks') || contains('20 week') || contains('internship phases') || contains('internship stages') || contains('internship timeline') || contains('mandatory internship') || contains('internship guide') || contains('where to intern') || contains('internship diary') || contains('internship pillars')) {
            return { intent: 'internship_roadmap', confidence: 0.98 };
        }

        // 3. Legal Terms & Latin Maxims Glossary
        if (contains('latin maxim') || contains('latin terms') || contains('legal glossary') || contains('legal dictionary') || contains('legal maxims') || contains('latin words') || contains('maxims list')) {
            return { intent: 'legal_glossary', confidence: 0.98 };
        }
        // Specific individual Latin maxims and clinical legal terms
        if (contains('pro bono') || contains('pro-bono')) return { intent: 'maxim_pro_bono', confidence: 0.98 };
        if (contains('suo motu') || contains('suo moto')) return { intent: 'maxim_suo_motu', confidence: 0.98 };
        if (contains('locus standi')) return { intent: 'maxim_locus_standi', confidence: 0.98 };
        if (contains('amicus curiae') || contains('amicus curie')) return { intent: 'maxim_amicus_curiae', confidence: 0.98 };
        if (contains('audi alteram partem') || contains('natural justice')) return { intent: 'maxim_audi_alteram_partem', confidence: 0.98 };
        if (contains('habeas corpus')) return { intent: 'maxim_habeas_corpus', confidence: 0.98 };
        if (contains('res judicata')) return { intent: 'maxim_res_judicata', confidence: 0.98 };
        if (contains('ultra vires')) return { intent: 'maxim_ultra_vires', confidence: 0.98 };
        if (contains('caveat emptor')) return { intent: 'maxim_caveat_emptor', confidence: 0.98 };
        if (contains('de minimis')) return { intent: 'maxim_de_minimis', confidence: 0.98 };
        if ((contains('lok adalat') || contains('national lok adalat')) && !contains('legal aid') && !contains('clinic')) return { intent: 'concept_lok_adalat', confidence: 0.95 };

        // Greetings (word boundary safe)
        if (/\b(hello|hi|hey|namaste|good morning|good afternoon)\b/i.test(text)) {
            return { intent: 'greeting', confidence: 0.95 };
        }

        // Programmes - BBA, BCom before BA to avoid substring overlap
        if (contains('bba') || contains('b.b.a') || contains('business law') || contains('management law')) {
            return { intent: 'program_bba_llb', confidence: 0.95 };
        }
        if (contains('bcom') || contains('b.com') || contains('commerce law') || contains('accounting law')) {
            return { intent: 'program_bcom_llb', confidence: 0.95 };
        }
        if (contains('b.a') || contains('ba.llb') || contains('b.a.llb') || contains('arts and law') || contains('humanities') || (/\bba\b/i.test(text) && contains('llb'))) {
            return { intent: 'program_ba_llb', confidence: 0.95 };
        }
        if (contains('3 year') || contains('3 yr') || contains('3-year') || (contains('llb') && !contains('5') && !contains('ba') && !contains('bba') && !contains('bcom') && (contains('graduat') || contains('degree') || contains('after')))) {
            return { intent: 'program_3yr_llb', confidence: 0.95 };
        }

        // RVCE / Engineering / Non-Law Clarification Intent (Prioritized before general intents)
        const isRVCE = /\brvce\b/i.test(text) || contains('rv college of engineering');
        const isEngg = /\b(engineering|btech|b\.tech|b\.e\b|mtech|m\.tech|polytechnic|mechanical|civil engg|computer science|cse|ise|electronics|ece)\b/i.test(text);
        if (isRVCE || (isEngg && !contains('cyber law') && !contains('ipr'))) {
            return { intent: 'rvce_engineering_clarification', confidence: 0.98 };
        }
        if (contains('courses') || contains('programs') || contains('programmes') || contains('degrees') || (has('what') && has('offer'))) {
            return { intent: 'all_programs', confidence: 0.9 };
        }

        // Admissions & Entrance (RVILS-LAT) - word boundary safe
        if (contains('rvils-lat') || contains('rvils lat') || /\blat\b/i.test(text) || contains('entrance') || contains('aptitude test') || contains('exam pattern')) {
            return { intent: 'rvils_lat', confidence: 0.95 };
        }
        if (contains('admiss') || contains('apply') || contains('application') || contains('eligib') || contains('how to join') || contains('seat') || contains('selection')) {
            return { intent: 'admissions', confidence: 0.92 };
        }

        // Fees & Scholarships
        if (contains('fee') || contains('cost') || contains('tuition') || contains('scholarship') || contains('concession') || contains('financial aid')) {
            return { intent: 'fees_scholarships', confidence: 0.92 };
        }

        // Principal & Leadership
        if (contains('principal') || contains('head of') || contains('anjina reddy') || (contains('director') && !contains('sports') && !contains('physical') && !contains('pe') && !contains('kabaddi'))) {
            return { intent: 'principal', confidence: 0.95 };
        }

        // Board of Management / RSST
        if (contains('board') || contains('management') || contains('trust') || contains('rsst') || contains('shyam') || contains('trustees')) {
            return { intent: 'board_of_management', confidence: 0.95 };
        }


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
        if (contains('mohankumar') || contains('mohan kumar') || contains('sports director') || contains('kabaddi')) return { intent: 'director_sports', confidence: 0.95 };
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

        // Faculty & Student Research Publications (Prioritized over general faculty list)
        if ((contains('faculty') || contains('student')) && (contains('publication') || contains('research') || contains('paper') || contains('article') || contains('scholarship'))) {
            return { intent: 'faculty_student_publications', confidence: 0.98 };
        }

        // Faculty Directory
        if (contains('faculty') || contains('professor') || contains('teacher') || contains('lecturer') || contains('staff')) {
            return { intent: 'faculty', confidence: 0.9 };
        }

        // Moot Court
        if (contains('moot') || contains('moot court') || contains('courtroom') || contains('advocacy') || contains('memorial')) {
            return { intent: 'moot_court', confidence: 0.95 };
        }

        // Legal Aid Clinic / Community Outreach
        if (contains('legal aid') || contains('clinic') || contains('lok adalat') || contains('free legal') || contains('nss') || contains('red cross') || contains('thattaguppe') || contains('gandhi bazar')) {
            return { intent: 'legal_aid', confidence: 0.92 };
        }

        // Library & Legal Databases (SCC Online, Manupatra)
        if (contains('library') || contains('scc online') || contains('manupatra') || contains('koha') || contains('bluebook') || contains('library books') || contains('library databases') || contains('e-library')) {
            return { intent: 'library', confidence: 0.92 };
        }

        // Placements & Mandatory Internships
        if (contains('placement') || contains('internship') || contains('job') || contains('career') || contains('package') || contains('law firm') || contains('20 weeks')) {
            return { intent: 'placements', confidence: 0.92 };
        }

        // Dedicated Research & Publication Intents
        // 1. RV Law Journal (ISSN 2583-5041, OSCOLA)
        if (contains('rv law journal') || contains('law journal') || contains('2583-5041') || contains('oscola') || contains('submit paper') || contains('submit article') || contains('submit to journal') || contains('journal submission') || contains('journal archive') || contains('journal volume') || contains('journal frequency') || contains('rvlawjournal')) {
            return { intent: 'rv_law_journal', confidence: 0.98 };
        }

        // 2. Samarthana Institutional Magazine
        if (contains('samarthana') || contains('college magazine') || contains('institutional magazine') || contains('student magazine')) {
            return { intent: 'magazine_samarthana', confidence: 0.98 };
        }

        // 3. RVILS Newsletter
        if (contains('newsletter') || contains('news letter') || contains('rvils newsletter')) {
            return { intent: 'rvils_newsletter', confidence: 0.98 };
        }

        // 4. Books & ISBN Volumes
        if (contains('research books') || contains('books publication') || contains('isbn registered') || contains('isbn books') || contains('edited volumes') || contains('published volumes')) {
            return { intent: 'research_books', confidence: 0.98 };
        }

        // 5. Faculty & Student Publications
        if (contains('faculty publication') || contains('student publication') || contains('faculty research paper') || contains('student research paper') || contains('published papers') || contains('faculty scholarship')) {
            return { intent: 'faculty_student_publications', confidence: 0.98 };
        }

        // 6. Seminars, Conferences, Workshops & FDPs
        if (contains('seminar') || contains('conference') || contains('symposium') || contains('fdp') || contains('faculty development') || contains('role of evidence') || contains('bharatiya nyaya sanhita seminar') || contains('bns seminar') || contains('lead india') || contains('workshop on')) {
            return { intent: 'research_seminars_fdps', confidence: 0.96 };
        }

        // 7. Institutional & Global Collaborations
        if (contains('collaboration') || contains('institutional partnership') || contains('international partnership') || contains('university of leeds') || contains('leeds') || contains('kaale & kaale') || contains('kaale and kaale') || contains('b.pac') || contains('indo-tibetan') || contains('ilaria zavoli')) {
            return { intent: 'research_collaborations', confidence: 0.98 };
        }

        // 8. Research Policy & Centre for Research and Publication
        if (contains('research policy') || contains('centre for research and publication') || contains('crp') || contains('research culture')) {
            return { intent: 'research_policy', confidence: 0.98 };
        }

        // 9. Research & Publications General Overview
        if (contains('research') || contains('publication') || contains('journal') || contains('scholarly') || contains('scholarship')) {
            return { intent: 'research_publications', confidence: 0.92 };
        }

        // Hostels & Accommodation
        if (contains('hostel') || contains('accommodation') || contains('room') || contains('stay') || contains('mess')) {
            return { intent: 'hostel', confidence: 0.92 };
        }

        // Affiliation & Approvals (KSLU, BCI, RSST)
        if (contains('kslu') || contains('bci') || contains('affiliation') || contains('bar council') || contains('recogni') || contains('accredit')) {
            return { intent: 'accreditation_trust', confidence: 0.92 };
        }

        // Contact, Phone, Email, Location & Address (High Specificity)
        if (contains('contact') || contains('phone') || contains('email') || contains('address') || contains('location') || contains('reach') || contains('metro')) {
            return { intent: 'contact', confidence: 0.95 };
        }

        // Campus Facilities & Sports
        if (contains('campus') || contains('facilit') || contains('sports') || contains('gym') || contains('auditorium') || contains('jayanagar')) {
            return { intent: 'campus_facilities', confidence: 0.9 };
        }

        // Lead Inquiry
        if (contains('callback') || contains('enquiry') || contains('talk to counsellor') || contains('contact me') || contains('call me')) {
            return { intent: 'lead_inquiry', confidence: 0.9 };
        }

        return { intent: 'fallback', confidence: 0.2 };
    }

    /* =============== RESPONSE GENERATOR (WEBSITE DATA ONLY) =============== */
    function generateResponse(intentObj, originalQuery) {
        const intent = typeof intentObj === "string" ? intentObj : (intentObj && intentObj.intent ? intentObj.intent : "");
        const prevIntent = SESSION.lastIntent;
        if (intent !== 'multi_turn_continuation') {
            SESSION.lastIntent = intent;
        }

        switch (intent) {
            case 'multi_turn_continuation': {
                const targetIntent = prevIntent || (intentObj && intentObj.contextIntent) || 'all_programs';
                const deepRes = getDeepInfo(targetIntent);
                if (deepRes) return deepRes;
                return {
                    text: `Would you like more details on **${targetIntent}**? Feel free to ask specific questions about curriculum, entrance requirements, or career opportunities!`,
                    chips: getFollowUps(targetIntent)
                };
            }


            /* =============== 1. INTERACTIVE LEGAL STREAM MATCHER =============== */
            case 'stream_matcher_start':
                return {
                    text: `### ⚖️ RVILS Interactive Law Stream Matcher (Step 1 of 2)
Choosing the right legal degree defines your entire jurisprudence journey! Let's match your passions to our four distinguished BCI-approved programmes:

**Step 1: What is your current academic background?**
Select from the options below:`,
                    chips: ["12th / PUC (Arts)", "12th / PUC (Commerce)", "12th / PUC (Science)", "University Graduate"]
                };

            case 'matcher_q_arts':
            case 'matcher_q_science':
                return {
                    text: `### ⚖️ RVILS Interactive Law Stream Matcher (Step 2 of 2)
Great! With your background, you are eligible for all 5-Year Integrated Law programmes under **KSLU norms**!

**Step 2: What is your dream legal career destination?**
Choose the path that excites you most:`,
                    chips: ["Judiciary / Civil Litigation", "Corporate Law & M&A", "Taxation, Banking & Fintech", "Civil Services (UPSC)"]
                };

            case 'matcher_q_commerce':
                return {
                    text: `### ⚖️ RVILS Interactive Law Stream Matcher (Step 2 of 2)
Excellent! With your Commerce background, you have a natural advantage in commercial and financial jurisprudence!

**Step 2: What is your dream legal career destination?**
Select your preferred arena:`,
                    chips: ["Taxation, Banking & Fintech", "Corporate Law & M&A", "Judiciary / Civil Litigation", "Civil Services (UPSC)"]
                };

            case 'matcher_q_graduate':
                return {
                    text: `### 🎓 Your Recommended Degree: 3-Year LL.B. (Postgraduate Professional Law)
Since you already hold a Bachelor's Degree in Arts, Science, Commerce, Management, or Engineering:

* **Degree:** **3-Year LL.B.** (6 Semesters)
* **Affiliation:** Affiliated to **Karnataka State Law University (KSLU)** & Approved by the **Bar Council of India (BCI)**.
* **Why this is your ideal path:** You do not need to repeat 5 years of undergraduate study. You complete an intensive, practice-oriented professional law degree in 3 years.
* **Curriculum Focus:** Trial advocacy, substantive & procedural laws (CPC, CrPC, Evidence), drafting, and chamber attachments with practicing advocates.
* **Percentage Cut-offs:** General Merit: **45%** | OBC: **42%** | SC/ST: **40%** in graduation degree.`,
                    chips: ["Admissions 2026", "RVILS-LAT", "Chamber Internships", "Open Enquiry Form", "Contact Desk"]
                };

            case 'matcher_ans_judiciary':
            case 'matcher_ans_upsc':
                return {
                    text: `### ⚖️ Your Recommended Match: 5-Year Integrated B.A. LL.B.
Based on your goal of **Judiciary, Litigation & Civil Services**:

* **Degree:** **B.A. LL.B.** (Integrated Law with Arts & Humanities | 10 Semesters)
* **Curriculum Synergy:** Seamlessly integrates Political Science, Sociology, Economics, and History of Courts with Constitutional Law, Criminal Jurisprudence, and Human Rights.
* **Why it fits you best:**
  • Prepares you directly for the **Judicial Magistrate / Civil Judge Exam** and **UPSC Civil Services** (Law Optional).
  • Strongest foundation for appellate advocacy in High Courts and the Supreme Court of India.
  • Intensive clinical training in the RVILS **Moot Court Hall** and **Legal Services Clinic**.
* **Percentage Eligibility:** GM: **45%** | OBC: **42%** | SC/ST/Cat-I: **40%** in 10+2 / PUC.`,
                    chips: ["Admissions 2026", "Apply for B.A. LL.B.", "RVILS-LAT", "Moot Court Academy", "Open Enquiry Form"]
                };

            case 'matcher_ans_corporate':
                return {
                    text: `### 🏢 Your Recommended Match: 5-Year Integrated B.B.A. LL.B.
Based on your ambition for **Corporate Law & M&A**:

* **Degree:** **B.B.A. LL.B.** (Integrated Law with Business & Management | 10 Semesters)
* **Curriculum Synergy:** Combines Strategic Management, Corporate Governance, Financial Analysis, and Marketing with Corporate Laws, Mergers & Acquisitions, IPR, and International Trade Law.
* **Why it fits you best:**
  • Direct trajectory into **Tier-1 / Tier-2 Law Firms** (Cyril Amarchand Mangaldas, Shardul Amarchand Mangaldas, Trilegal, Khaitan & Co).
  • High demand for **In-House Legal Counsel** in multinational corporations, fintech startups, and venture capital funds.
  • Training in international commercial arbitration and contract lifecycle drafting.
* **Percentage Eligibility:** GM: **45%** | OBC: **42%** | SC/ST/Cat-I: **40%** in 10+2 / PUC.`,
                    chips: ["Admissions 2026", "Apply for B.B.A. LL.B.", "Corporate Internships", "RVILS-LAT", "Open Enquiry Form"]
                };

            case 'matcher_ans_taxation':
                return {
                    text: `### 📊 Your Recommended Match: 5-Year Integrated B.Com. LL.B.
Based on your passion for **Taxation, Corporate Finance & Banking**:

* **Degree:** **B.Com. LL.B.** (Integrated Law with Commerce & Finance | 10 Semesters)
* **Curriculum Synergy:** Advanced Financial Accounting, Auditing, Direct Tax Codes, and Indirect Taxes (GST & Customs) fused with Commercial Arbitration, Securities Regulations, and Company Law.
* **Why it fits you best:**
  • High-paying niche in **Corporate Tax Advisory**, Big 4 consulting firms (Deloitte, PwC, EY, KPMG), and forensic financial law.
  • Practice readiness before the National Company Law Tribunal (NCLT) and Debt Recovery Tribunals (DRT).
  • Uniquely positioned for Insolvency and Bankruptcy Code (IBC) dispute resolution.
* **Percentage Eligibility:** GM: **45%** | OBC: **42%** | SC/ST/Cat-I: **40%** in 10+2 / PUC.`,
                    chips: ["Admissions 2026", "Apply for B.Com. LL.B.", "RVILS-LAT", "Internships", "Open Enquiry Form"]
                };

            /* =============== 2. BCI 20-WEEK MANDATORY INTERNSHIP ROADMAP =============== */
            case 'internship_roadmap':
                return {
                    text: `### 🗺️ BCI & KSLU Mandatory 20-Week Clinical Internship Roadmap
The Bar Council of India (BCI) mandates a minimum of **20 Weeks of clinical internships** for 5-Year programmes (12 Weeks for 3-Year LL.B.). At RVILS, this is structured across four progressive pillars:

* **Phase 1: Social Welfare & Legal Literacy (Semesters 1 to 4)**
  • Focus: NGOs, Human Rights Commissions, Women & Child Welfare organizations, and Environmental groups.
  • RVILS Practical: Participation in RVILS **Legal Services Clinic village surveys** (e.g. Thattaguppe) and public legal awareness campaigns.

* **Phase 2: Trial Court Advocacy (Semesters 5 & 6)**
  • Focus: Attachment with practicing advocates at Metropolitan Magistrate Courts and City Civil Courts.
  • Skills: FIR drafting, bail petitions, civil plaints, written statements, and client interviewing.

* **Phase 3: Appellate Courts & Judicial Research (Semesters 7 & 8)**
  • Focus: High Courts & Supreme Court of India registry, Senior Advocate chambers, or Judicial Clerks.
  • Skills: Appellate research, writ petitions, SLPs, and computer-assisted legal research via **SCC Online** and **Manupatra**.

* **Phase 4: Corporate Desks, DLSA & Law Firms (Semesters 9 & 10)**
  • Focus: District Legal Services Authority (DLSA), Tier-1/Tier-2 Law Firms, NCLT, or Corporate In-House Counsel.
  • Culmination: Bar Council of India enrollment readiness & AIBE preparation.

**Key Institutional Regulations:**
• Minimum 15 days to maximum 4 weeks per vacation period.
• Mandatory submission of authenticated **Internship Diary** and certification to the RVILS Placement & Internship Cell.`,
                    chips: ["Placements & Careers", "Moot Court Academy", "Legal Aid Clinic", "Admissions 2026", "Contact Us"]
                };

            /* =============== 3. LEGAL TERMS & LATIN MAXIMS GLOSSARY =============== */
            case 'legal_glossary':
                return {
                    text: `### 🏛️ Essential Latin Maxims & Legal Terms Glossary
Latin maxims form the bedrock of statutory interpretation and courtroom advocacy. Here are foundational principles practiced at RVILS:

1. ***Pro Bono Publico* (For the public good)**
   • Meaning: Professional legal service rendered gratuitously to underprivileged litigants.
   • RVILS Anchor: The core ethos of the **RVILS Legal Services Clinic** offering free advice Mon–Fri.

2. ***Audi Alteram Partem* (Listen to the other side)**
   • Meaning: First pillar of Natural Justice; no person shall be condemned or judged without a fair hearing.

3. ***Suo Motu* (On its own motion)**
   • Meaning: When a High Court or Supreme Court takes legal action on its own initiative without a formal petition.

4. ***Locus Standi* (Right to stand)**
   • Meaning: The legal capacity of a petitioner to invoke the jurisdiction of a court in a dispute.

5. ***Amicus Curiae* (Friend of the court)**
   • Meaning: An impartial legal expert appointed by the judge to advise the court on complex points of law.

6. ***Habeas Corpus* (Produce the body)**
   • Meaning: Constitutional prerogative writ (Article 32/226) against unlawful executive or private detention.

7. ***Res Judicata* (A matter decided)**
   • Meaning: Section 11 CPC principle barring re-litigation of an issue definitively adjudicated between the same parties.

8. ***Caveat Emptor* (Let the buyer beware)**
   • Meaning: Fundamental rule of commercial and consumer transactions placing due diligence duty on purchasers.`,
                    chips: ["Moot Court Academy", "Library Databases", "5-Yr B.A. LL.B.", "Admissions 2026", "Contact Us"]
                };

            case 'maxim_pro_bono':
                return {
                    text: `### ⚖️ *Pro Bono Publico* ("For the Public Good")
* **Literal Translation:** Undertaken without charge for the welfare of the public.
* **Courtroom Application:** Legal assistance, representation, or research provided by advocates free of cost to indigent or marginalized citizens who cannot afford counsel.
* **RVILS Clinical Connection:** Directly reflected in the **RVILS Legal Services Clinic**, where students and faculty provide free legal consultations, conduct Lok Adalat outreach, and organize rural awareness surveys in Karnataka.`,
                    chips: ["Legal Aid Clinic", "Moot Court Academy", "Latin Maxims Glossary", "Contact Us"]
                };

            case 'maxim_suo_motu':
                return {
                    text: `### ⚖️ *Suo Motu* ("On Its Own Motion")
* **Literal Translation:** Taken on one's own initiative.
* **Constitutional Application:** Powers exercised by Constitutional Courts (Supreme Court under Article 32, High Courts under Article 226) to register a Public Interest Litigation (PIL) upon reading newspaper reports, letters, or observing gross violations of fundamental rights without a formal applicant.`,
                    chips: ["Latin Maxims Glossary", "Constitution Manuscript", "5-Yr B.A. LL.B.", "Library"]
                };

            case 'maxim_locus_standi':
                return {
                    text: `### ⚖️ *Locus Standi* ("Place of Standing")
* **Literal Translation:** The right or capacity to appear before a court of law.
* **Jurisprudential Relevance:** Traditionally required that only an aggrieved party directly affected by an injury could approach the court. In India, Justice P.N. Bhagwati and Justice V.R. Krishna Iyer relaxed this rule to birth **Public Interest Litigation (PIL)**, allowing any citizen to advocate for disadvantaged groups.`,
                    chips: ["Latin Maxims Glossary", "5-Yr B.A. LL.B.", "Legal Aid Clinic", "Library"]
                };

            case 'maxim_amicus_curiae':
                return {
                    text: `### ⚖️ *Amicus Curiae* ("Friend of the Court")
* **Literal Translation:** An impartial advisor to the judiciary.
* **Courtroom Application:** A senior advocate or scholar invited by the court to offer objective assistance and legal perspective in matters of monumental public importance or intricate constitutional complexity.
* **RVILS Training:** Modeled extensively during clinical advocacy trials in the **RVILS Moot Court Hall**.`,
                    chips: ["Moot Court Academy", "Latin Maxims Glossary", "Faculty Directory", "Library"]
                };

            case 'maxim_audi_alteram_partem':
                return {
                    text: `### ⚖️ *Audi Alteram Partem* ("Listen to the Other Side")
* **Literal Translation:** Hear the other party; no one should be judged unheard.
* **Constitutional Weight:** The sacred cornerstone of **Natural Justice** and procedural fairness under Article 14 and 21 of the Constitution of India. Any executive order or quasi-judicial decision passed without giving fair opportunity to show cause is *void ab initio*.`,
                    chips: ["Constitution Manuscript", "Latin Maxims Glossary", "5-Yr B.A. LL.B.", "Library"]
                };

            case 'maxim_habeas_corpus':
                return {
                    text: `### 📜 *Habeas Corpus* ("Produce the Body")
* **Literal Translation:** You shall have the body brought before the court.
* **Prerogative Writ:** The supreme guardian of personal liberty guaranteed under Article 21 of the Indian Constitution. Issued under Article 32 (Supreme Court) and Article 226 (High Court) to command an authority or individual to produce an illegally detained person before the bench immediately.`,
                    chips: ["Constitution Manuscript", "Latin Maxims Glossary", "5-Yr B.A. LL.B.", "Library"]
                };

            case 'maxim_res_judicata':
                return {
                    text: `### ⚖️ *Res Judicata* ("A Matter Already Judged")
* **Statutory Authority:** Governed under Section 11 of the Code of Civil Procedure (CPC), 1908.
* **Legal Principle:** Once a matter has been directly and substantially heard and conclusively decided by a court of competent jurisdiction, the same parties cannot institute a fresh suit on the same cause of action. Ensures finality of litigation (*interest reipublicae ut sit finis litium*).`,
                    chips: ["Latin Maxims Glossary", "5-Yr B.A. LL.B.", "Moot Court Hall", "Library"]
                };

            case 'maxim_ultra_vires':
                return {
                    text: `### ⚖️ *Ultra Vires* ("Beyond the Powers")
* **Jurisprudence:** An act, law, statute, or corporate resolution passed in excess of the legal power granted by the Constitution, legislature, or company articles.
* **Consequence:** Any *ultra vires* subordinate legislation or corporate act is considered null, void, and unenforceable.`,
                    chips: ["Latin Maxims Glossary", "5-Yr B.B.A. LL.B.", "Constitution Manuscript", "Library"]
                };

            case 'maxim_caveat_emptor':
                return {
                    text: `### ⚖️ *Caveat Emptor* ("Let the Buyer Beware")
* **Commercial Law Foundation:** Governed under the Sale of Goods Act, 1930 and evolving Consumer Protection Jurisprudence.
* **Principle:** The purchaser carries the duty to examine goods and satisfy themselves regarding quality before entering binding purchase agreements, subject to statutory warranties and unfair trade practice exceptions.`,
                    chips: ["5-Yr B.Com. LL.B.", "5-Yr B.B.A. LL.B.", "Latin Maxims Glossary", "Library"]
                };

            case 'maxim_de_minimis':
                return {
                    text: `### ⚖️ *De Minimis Non Curat Lex* ("The Law Cares Not for Trifles")
* **Substantive Principle:** Found in Section 95 of the Indian Penal Code (IPC) / Bharatiya Nyaya Sanhita (BNS).
* **Legal Effect:** Protects individuals from frivolous litigation where the alleged injury or infraction is negligible or harmless.`,
                    chips: ["Latin Maxims Glossary", "5-Yr B.A. LL.B.", "Library Staff", "Contact Us"]
                };

            case 'concept_lok_adalat':
                return {
                    text: `### 🤝 National & State Lok Adalat (People's Court)
* **Statutory Framework:** Constituted under the Legal Services Authorities Act, 1987.
* **Distinct Features:** Informal, participatory dispute resolution forum where pending civil suits, matrimonial disputes, and compoundable criminal cases are settled amicably with zero court fees and final awards that cannot be appealed.
* **RVILS Involvement:** RVILS students and faculty collaborate with the District Legal Services Authority (DLSA) to observe and facilitate Lok Adalat sessions in Bengaluru.`,
                    chips: ["Legal Aid Clinic", "Moot Court Academy", "Latin Maxims Glossary", "Contact Us"]
                };

            case 'greeting':
                return {
                    text: tone === 'funny'
                        ? "Hello there, legal eagle! ⚖️ Welcome to **MKPM RV Institute of Legal Studies (RVILS)**! All my data is 100% verified from the official RVILS website (`rvils.edu.in`). What can I help you with today?"
                        : "Welcome to **MKPM RV Institute of Legal Studies (RVILS)**, Bengaluru. Affiliated with Karnataka State Law University (KSLU) and approved by the Bar Council of India (BCI). All information provided is 100% verified from our official website (`rvils.edu.in`). How may I assist your inquiry?",
                    chips: ["Admissions 2026", "Legal Stream Matcher", "5-Yr B.A. LL.B.", "3-Yr LL.B.", "Internship Roadmap", "Latin Maxims", "Contact Us"]
                };

            case 'all_programs':
                return {
                    text: `### 🎓 Law Degree Programmes at RVILS (Official Website Details)
RVILS offers four distinguished law degree courses affiliated with **KSLU, Hubballi** and approved by the **Bar Council of India (BCI)**:

1. **5-Year B.A. LL.B.** — Integrated Law with Arts & Humanities (10 Semesters | Max 7 years to complete)
2. **5-Year B.B.A. LL.B.** — Integrated Law with Business & Management (10 Semesters | Max 7 years to complete)
3. **5-Year B.Com. LL.B.** — Integrated Law with Commerce & Finance (10 Semesters | Max 7 years to complete)
4. **3-Year LL.B.** — Postgraduate Professional Law Degree (6 Semesters | Max 7 years to complete)

**Official Percentage Eligibility (per KSLU Norms):**
• General Merit: **45%**  
• OBC Category: **42%**  
• SC / ST / Cat-I: **40%**`,
                    chips: ["5-Yr B.A. LL.B.", "5-Yr B.B.A. LL.B.", "3-Yr LL.B.", "Admissions 2026", "RVILS-LAT", "Internships"]
                };

            case 'program_ba_llb':
                const ba = RVILS_DATA.programmes.find(p => p.id === 'ba_llb');
                return {
                    text: `### ⚖️ ${ba.name} — ${ba.title}
* **Duration:** ${ba.duration}
* **Maximum Period:** ${ba.maxCompletion}
* **Degree Level:** ${ba.level}
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
* **Degree Level:** ${bba.level}
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
* **Degree Level:** ${bcom.level}
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

            case 'admissions':
            case 'rvils_lat':
                return {
                    text: `### 📋 Admissions 2026 – 27: The Process (Official Website)
*"The admission process is transparent, merit-based and designed to identify committed individuals aspiring to excel in the legal profession."*

**Statutory Minimum Eligibility Percentages (KSLU / BCI Norms):**
• **General Merit (GM):** Minimum **45%** aggregate marks in qualifying exam (10+2 / PUC / Degree).
• **OBC Categories:** Minimum **42%** aggregate marks in qualifying exam.
• **SC / ST / Category-I:** Minimum **40%** aggregate marks in qualifying exam.

**The 6-Step Selection Lifecycle:**
1. **Application Submission:** Submit the prescribed form with the required documents as per KSLU eligibility norms.
2. **RVILS–LAT (Law Aptitude Test):** Appear for the entrance test assessing aptitude and reasoning skills.
3. **Institutional Interaction:** Attend the briefing session with the admission team (with parents).
4. **Personal Interview:** Evaluation of interest in law along with clarity and communication skills.
5. **Offer of Admission:** Issued based on cumulative performance.
6. **Admission Confirmation:** Completion of fee payment and document verification.

📞 **Admissions Helpline:** \`+91-80-69018952/53\`  
✉️ **Email:** \`rvils@rvei.edu.in\``,
                    chips: ["Open Enquiry Form", "Eligibility Criteria", "Programmes", "Campus Address"]
                };

            case 'fees_scholarships':
                return {
                    text: `### 💰 Official Fee Structure Guidance (from rvils.edu.in)
* **Official Policy:** Tuition fees, examination dues, and registration charges are determined strictly according to **Karnataka State Law University (KSLU)** norms and **RSST Trust** guidelines.
* **No Speculative Figures:** In accordance with our official website guidelines, exact fee slabs for Karnataka vs Non-Karnataka quotas are shared directly through official prospectus and admission counselling.
* **Contact the Admissions & Finance Desk:** Call \`+91-80-69018952/53\` or email \`rvils@rvei.edu.in\` to receive the official fee schedule for 2026–27.`,
                    chips: ["Admissions 2026", "Open Enquiry Form", "Programmes", "Contact Desk"]
                };

            case 'board_of_management':
                return {
                    text: `### 🏛️ RVILS Board of Management (RSST Trust)
**Chairman:**
• **${RVILS_DATA.boardOfManagement.chairman}**

**Distinguished Board Members:**
${RVILS_DATA.boardOfManagement.members.map(m => '• ' + m).join('\n')}

Under RSST's governance (founded in 1940 by Sri M.C. Sivananda Sarma), RV Educational Institutions (RVEI) has grown into a network of 28+ institutions serving over 24,000 students.`,
                    chips: ["Principal Profile", "Faculty", "About RVILS", "Admissions 2026"]
                };

            case 'principal':
                const pr = RVILS_DATA.facultyDirectory.principal;
                return {
                    text: `### 👨‍⚖️ Principal of RVILS (Official Profile)
**${pr.name}**  
*${pr.role}*

* **Qualifications:** ${pr.qualifications}
* **Experience:** ${pr.experience}
* **Specialisation:** ${pr.specialization}

Prof. (Dr.) Anjina Reddy K.R. leads RVILS with a distinguished focus on environmental jurisprudence, constitutional law, and empirical legal training.`,
                    chips: ["Board of Management", "Faculty Directory", "Admissions 2026", "Moot Court"]
                };

            case 'faculty':
                return {
                    text: `### 👥 RVILS Faculty Directory & Academic Staff (from rvils.edu.in)
**Founder Principal:**
• **Prof. (Dr.) Anjina Reddy K.R.** — Professor of Law & Principal *(B.A.L., LL.M., M.Phil., Ph.D.)*

**Core Teaching Faculty:**
${RVILS_DATA.facultyDirectory.coreFaculty.map(f => `• **${f.name}** — ${f.role} *(${f.qualifications})*`).join('\n')}

**Library & Administrative Leadership:**
• **Mr. Mohan Kumar N.N.** — Director of Physical Education  
• **Mr. Santosh Kumar Naragund** — Senior Library Executive *(MLISc, BA)*  
• **Mr. Sagar S.** — Junior Library Executive *(MLISc, B.Com., KSET)*  
• **Mr. N. Mahesh** — Assistant Manager - HR & Admin`,
                    chips: ["Principal Profile", "Board of Management", "Library", "Contact Us"]
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
                    chips: ["Faculty", "Moot Court", "Programmes", "Admissions 2026"]
                };

            case 'placements':
                const pl = RVILS_DATA.internshipsAndPlacements;
                return {
                    text: `### 💼 Internships & Placements (Official Framework)
* **Total Mandatory Duration:** **${pl.compulsoryInternshipDuration}**
* **Semester Limit:** ${pl.semesterLimits}

**Mandatory Exposure Requirements (During Course Period):**
${pl.mandatoryExposures.map(me => '• ' + me).join('\n')}

**Academic Evaluation:**
${pl.requirements}

**Placement Cell:**
${pl.placementCell}`,
                    chips: ["5-Yr B.A. LL.B.", "3-Yr LL.B.", "Moot Court", "Admissions 2026"]
                };

            case 'moot_court':
                return {
                    text: `### ⚖️ RVILS Moot Court Hall & Society
* **Courtroom Infrastructure:** Air-conditioned, state-of-the-art Moot Court Hall specifically designed to replicate appellate and trial courtrooms.
* **Advocacy Training:** Regular memorial drafting bootcamps, citation indexing workshops, trial advocacy simulations, and mock bail hearings.
* **Competitions:** Annual internal ranking moots and institutional representation in national and international moot court competitions.`,
                    chips: ["Legal Aid Clinic", "Library", "5-Yr B.A. LL.B.", "Admissions 2026"]
                };

            case 'legal_aid':
                const lac = RVILS_DATA.legalServicesClinic;
                return {
                    text: `### 🤝 ${lac.title} (Official Details)
* **Aim:** *"${lac.aim}"*

**Services Provided:**
${lac.services.map(s => '• ' + s).join('\n')}

**Key Outreach Activities:**
${lac.milestoneOutreach.map(mo => '• ' + mo).join('\n')}`,
                    chips: ["Moot Court", "Campus Facilities", "Programmes", "Contact Us"]
                };

            /* =============== RESEARCH & PUBLICATIONS SUITE =============== */
            case 'research_publications':
                return {
                    text: `### 📚 Research & Publications at RVILS (Official Portals)
MKPM RV Institute of Legal Studies actively cultivates legal scholarship, critical enquiry, and policy research under its **Centre for Research and Publication (CRP)**:

* **Flagship Academic Journal:** **RV Law Journal** (ISSN: 2583-5041) — Biannual blind peer-reviewed journal following **OSCOLA** citation.
* **Institutional Magazine:** **Samarthana** — Annual college magazine highlighting student scholarship, legal essays, and creative perspectives.
* **Bi-Annual Chronicle:** **RVILS Newsletter** — Documentation of national seminars, moot court achievements, and guest lectures.
* **Scholarly Books:** ISBN-registered edited volumes emerging from national conferences and symposia.
* **Faculty & Student Scholarship:** Research papers published in UGC-CARE, Scopus, and reputed national/international law journals.
* **Conferences & Workshops:** Annual symposiums (e.g. *Bharatiya Nyaya Sanhita*, *Role of Evidence in Criminal Justice*).
* **Global & Industry Collaborations:** Partnerships with the **University of Leeds (UK)**, **DLSA**, **Kaale & Kaale Advisors**, and **B.PAC**.`,
                    chips: ["RV Law Journal", "Samarthana Magazine", "RVILS Newsletter", "Books & Volumes", "Conferences & FDPs", "Global Collaborations"]
                };

            case 'rv_law_journal':
                const rlj = RVILS_DATA.researchAndPublications.rvLawJournal;
                return {
                    text: `### ⚖️ RV Law Journal (Official Institutional Journal)
The **RV Law Journal** is a blind peer-reviewed, biannual legal publication indexed with an official ISSN, published directly by **MKPM RV Institute of Legal Studies**:

* **ISSN:** \`${rlj.issn}\`
* **Publication Frequency:** ${rlj.frequency}
* **Citation Standard:** **${rlj.citationStyle}**
* **Publisher:** ${rlj.publisher}
* **Aim & Scope:** Academic platform for scholars, judges, advocates, and law students for doctrinal, empirical, comparative, and interdisciplinary legal research.

**Categories of Submissions Accepted:**
${rlj.categories.map(c => '• ' + c).join('\n')}

**Published Issues & Archives:**
${rlj.recentVolumes.map(v => '• ' + v).join('\n')}

📧 **Paper Submissions:** \`${rlj.submissionEmail}\``,
                    chips: ["OSCOLA Citation", "Research Policy", "Samarthana Magazine", "RVILS Newsletter", "Contact Editorial"]
                };

            case 'magazine_samarthana':
                const sm = RVILS_DATA.researchAndPublications.samarthanaMagazine;
                return {
                    text: `### 📖 Magazine – Samarthana (RVILS Student & Faculty Magazine)
**Samarthana** is the official institutional magazine of MKPM RV Institute of Legal Studies:

* **Editorial Vision:** ${sm.description}
* **Campus Expression:** Serves as a creative and intellectual outlet showcasing student achievements, literary expressions, and society activities.
* **Published Editions:**
${sm.volumes.map(v => '• ' + v).join('\n')}`,
                    chips: ["RV Law Journal", "RVILS Newsletter", "Cultural Activities", "Moot Court Academy"]
                };

            case 'rvils_newsletter':
                const nl = RVILS_DATA.researchAndPublications.newsletter;
                return {
                    text: `### 📰 RVILS Newsletter (Bi-Annual Chronicle)
The **RVILS Newsletter** is the official periodic chronicle documenting academic, research, and campus milestones:

* **Documentation Focus:** ${nl.description}
* **Archived Issues:**
${nl.issues.map(i => '• ' + i).join('\n')}`,
                    chips: ["RV Law Journal", "Institutional Events", "Placements & Careers", "Legal Aid Clinic"]
                };

            case 'research_books':
                const rb = RVILS_DATA.researchAndPublications.booksAndVolumes;
                return {
                    text: `### 📚 Books & Edited Volumes (Centre for Research and Publication)
The **Centre for Research and Publication (CRP)** at RVILS regularly compiles and publishes scholarly books and conference proceedings:

* **ISBN Registration:** ${rb.description}
* **Thematic Focus:** ${rb.focus}
* **Scholarly Pedigree:** Compiles peer-reviewed research papers and keynote addresses presented during national seminars, symposia, and academic colloquia.
* **Faculty & Student Opportunities:** Provides students and faculty a formal platform to co-author chapters with leading legal academics.`,
                    chips: ["RV Law Journal", "Research Policy", "Conferences & FDPs", "Library Databases"]
                };

            case 'faculty_student_publications':
                return {
                    text: `### 🎓 Faculty & Student Research Publications
RVILS actively fosters a culture of empirical and doctrinal research among its teaching faculty and student fraternity:

* **Research Focus:** Faculty and students contribute original research papers, critical articles, and case commentaries to UGC-CARE, Scopus-indexed, and national/international law journals.
* **Conference Presentations:** Regular paper presentations at prestigious national law universities (NLUs), judicial academies, and international legal colloquia.
* **Institutional Support:** RVILS provides financial and academic backing through its **Research Policy** for faculty presenting research at national and international conferences.`,
                    chips: ["RV Law Journal", "Books & Volumes", "Faculty Directory", "Research Policy"]
                };

            case 'research_seminars_fdps':
                const sems = RVILS_DATA.researchAndPublications.seminarsAndWorkshops;
                return {
                    text: `### 🏛️ Seminars, Conferences, Workshops & FDPs at RVILS
RVILS regularly hosts high-level academic seminars, hands-on workshops, and Faculty Development Programmes:

${sems.map(s => `* **${s.title || s.topics}:**\n  ${s.dignitaries ? '• Speakers/Dignitaries: ' + s.dignitaries : ''}${s.speaker ? '• Speaker: ' + s.speaker : ''}${s.venue ? '\n  • Venue: ' + s.venue : ''}${s.partner ? '\n  • Collaborator: ' + s.partner : ''}${s.delegation ? '• Delegation: ' + s.delegation : ''}`).join('\n\n')}`,
                    chips: ["Role of Evidence Workshop", "BNS Seminar", "Global Collaborations", "Faculty Directory"]
                };

            case 'research_collaborations':
                const collabs = RVILS_DATA.researchAndPublications.collaborations;
                return {
                    text: `### 🌐 Institutional & International Collaborations
RVILS collaborates with premier global universities, judicial bodies, and industry leaders to enrich legal education:

${collabs.map(c => `* **${c.partner}:**\n  • Topic / Initiative: ${c.topic}${c.speaker ? '\n  • Resource Person: ' + c.speaker : ''}${c.speakers ? '\n  • Resource Persons: ' + c.speakers : ''}${c.coordinator ? '\n  • Key Persons: ' + c.coordinator : ''}${c.dignitaries ? '\n  • Dignitaries: ' + c.dignitaries : ''}`).join('\n\n')}`,
                    chips: ["University of Leeds (UK)", "Kaale & Kaale Corporate", "DLSA Bengaluru Urban", "Research Overview"]
                };

            case 'research_policy':
                const crp = RVILS_DATA.researchAndPublications.centre;
                return {
                    text: `### 📜 RVILS Research Policy & Centre for Research and Publication
* **Governing Body:** Administered through the **${crp.name}** at MKPM RVILS.
* **Core Mandate:** ${crp.objective}
* **Key Policy Pillars:**
  1. ${crp.policy}
  2. Encourages both doctrinal analysis and empirical field research.
  3. Strict adherence to academic integrity, citation standards (**OSCOLA**), and anti-plagiarism guidelines.
  4. Publication of high-impact research through the **RV Law Journal** (ISSN 2583-5041) and ISBN edited volumes.`,
                    chips: ["RV Law Journal", "Centre for Research & Publication", "Books & Volumes", "Global Collaborations"]
                };

            case 'campus_facilities':
                const cf = RVILS_DATA.campusLife;
                return {
                    text: `### 🏛️ Campus Infrastructure & Facilities (from rvils.edu.in)
**Campus Location:** ${cf.location}

**Infrastructure & Facilities:**
${cf.facilities.map(f => '• ' + f).join('\n')}

**Statutory Institutional Committees:**
${cf.institutionalCommittees.map(c => '• ' + c).join('\n')}`,
                    chips: ["Hostel Accommodation", "Hybrid Library", "Moot Court Hall", "Admissions 2026"]
                };

            case 'hostel':
                return {
                    text: `### 🏠 Hostel Accommodation (Official Website Details)
Separate hostel accommodation for boys and girls is available for students of RVILS.
* **Rooms:** Spacious, furnished, and well-ventilated rooms providing a comfortable residential environment.
* **Amenities:** Hygienic food, clean dining facilities, and essential amenities for outstation students.
* **Campus Proximity:** Located with convenient access to the RVILS campus in Jayanagar, Bengaluru.`,
                    chips: ["Campus Facilities", "Admissions 2026", "Campus Location", "Contact Us"]
                };

            case 'accreditation_trust':
                return {
                    text: `### 🏛️ Affiliation, Approvals & Trust
* **Governing Body:** **Rashtreeya Sikshana Samithi Trust (RSST)**, established in 1940.
* **University Affiliation:** **Karnataka State Law University (KSLU)**, Hubballi.
* **Statutory Approval:** **Bar Council of India (BCI)**, New Delhi.
* **Degrees Recognized:** Conferred degrees enable enrollment as an Advocate with any State Bar Council across India.`,
                    chips: ["Board of Management", "Admissions 2026", "Programmes", "Contact Us"]
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
                    chips: ["Open Enquiry Form", "Admissions 2026", "Programmes", "Board of Management"]
                };

            case 'rvce_engineering_clarification':
                return {
                    text: `### ⚖️ RVILS Institution Clarification
* **Institution:** **MKPM RV Institute of Legal Studies (RVILS)** is an institution dedicated exclusively to **Legal Education** under the Rashtreeya Sikshana Samithi Trust (RSST).
* **Law Programmes Offered at RVILS:**
  • 5-Year Integrated B.A. LL.B.
  • 5-Year Integrated B.B.A. LL.B.
  • 5-Year Integrated B.Com. LL.B.
  • 3-Year LL.B. (for graduates in any discipline)
* **Engineering / RVCE Notice:**
  • RVILS does **not** offer Engineering (B.E. / B.Tech / M.Tech) or Polytechnic programs.
  • For engineering admissions, cutoffs, or placements, please consult our sister institution **RV College of Engineering (RVCE)** directly at [rvce.edu.in](https://rvce.edu.in).
  • *Note for Engineering Graduates:* If you hold a B.E./B.Tech degree, you are fully eligible to apply for the **3-Year LL.B.** here at RVILS!`,
                    chips: ["5-Yr B.A. LL.B.", "5-Yr B.B.A. LL.B.", "5-Yr B.Com. LL.B.", "3-Yr LL.B.", "Admissions 2026", "Contact Us"]
                };

            case 'lead_inquiry':
                return {
                    text: `### 📝 Connect with RVILS Admissions Office
To receive official prospectus information or verify course eligibility, click the button below to submit your details. Our admissions counsellors will contact you directly.`,
                    chips: ["Open Enquiry Form", "Admissions 2026", "Programmes", "Campus Location"]
                };


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

            default: {
                // 1. Levenshtein Fuzzy Matching Suggestions (Prioritized for typos)
                const suggestions = findSuggestions(originalQuery);
                if (suggestions && suggestions.length > 0) {
                    return {
                        text: tone === 'funny'
                            ? `Objection overruled! ⚖️ I couldn't find an exact official record for "${originalQuery}". Did you mean one of these verified topics?`
                            : `I could not find an exact record for "${originalQuery}" on the official portal. Did you mean one of these verified topics?`,
                        chips: suggestions.map(s => s.label).concat(["Admissions 2026", "Contact Us"])
                    };
                }

                // 2. Deep Scraped 43-Page Website Corpus Search
                const searchResult = searchWebsiteCorpus(originalQuery);
                if (searchResult && searchResult.page) {
                    const p = searchResult.page;
                    return {
                        text: `### 📄 Verified Official Website Record: ${p.title}
*Extracted directly from the official portal (\`rvils.edu.in\`):*

> "${p.snippet.substring(0, 420)}..."

🔗 **Official Source Page:** [${p.title}](${p.url})`,
                        chips: ["Admissions 2026", "Programmes", "Faculty", "Library", "Contact Us"]
                    };
                }

                return {
                    text: tone === 'funny'
                        ? "Hmm, that specific motion isn't recorded on the official RVILS website! 🧐 Could you rephrase your question, or select from one of our verified topics below?"
                        : "I am designed to provide information verified strictly from the official RVILS website (`rvils.edu.in`). I could not find a matching record for that inquiry. You can select one of our verified academic topics below.",
                    chips: ["Admissions 2026", "5-Yr B.A. LL.B.", "3-Yr LL.B.", "RVILS-LAT", "Faculty", "Contact Us"]
                };
            }
        }
    }

    /* =============== UI DOM BUILDER & WIDGET INJECTION =============== */
    function injectChatbotDOM() {
        if (document.getElementById('rvils-chatbot-root')) return;

        const root = document.createElement('div');
        root.id = 'rvils-chatbot-root';
        root.innerHTML = `
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
        `;
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
            .replace(/### (.*?)\n/g, '<h4 class="rvils-msg-title">$1</h4>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`([^`]+)`/g, '<code class="rvils-code">$1</code>')
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
            .replace(/\n\n/g, '<br><br>')
            .replace(/\n/g, '<br>');
        return html;
    }

    /* =============== MESSAGE APPENDER =============== */
    function appendMessage(sender, text, chips = []) {
        const stream = document.getElementById('rvilsMessages');
        if (!stream) return;

        const msgDiv = document.createElement('div');
        msgDiv.className = `rvils-message rvils-message-${sender}`;

        const bubble = document.createElement('div');
        bubble.className = 'rvils-bubble';
        bubble.innerHTML = renderMarkdown(text);
        msgDiv.appendChild(bubble);

        if (sender === 'bot') {
            const timeSpan = document.createElement('div');
            timeSpan.className = 'rvils-msg-meta';
            const now = new Date();
            timeSpan.innerHTML = `
                <span>${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}</span>
                <span class="rvils-feedback-actions">
                    <button class="rvils-fb-btn" title="Helpful" onclick="this.classList.add('active');">👍</button>
                    <button class="rvils-fb-btn" title="Needs Improvement" onclick="this.classList.add('active');">👎</button>
                </span>
            `;
            msgDiv.appendChild(timeSpan);
        }

        stream.appendChild(msgDiv);
        stream.scrollTop = stream.scrollHeight;

        renderChips(chips);
        saveChatState();

        if (window.rvilsTelemetry && typeof window.rvilsTelemetry.logEvent === 'function') {
            window.rvilsTelemetry.logEvent(sender === 'bot' ? 'bot_reply' : 'user_message', {
                text: text.substring(0, 150),
                sender: sender
            });
        }

        if (sender === 'bot' && speechEnabled && 'speechSynthesis' in window) {
            try {
                const plainText = text.replace(/[#*`_\[\]()]/g, '');
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
                appendMessage('bot', getModerationResponse(mod.type), ["Admissions 2026", "Programmes", "Faculty", "Contact Us"]);
            }, 300);
            return;
        }

        const intentObj = classifyIntent(clean);

        const stream = document.getElementById('rvilsMessages');
        const typingIndicator = document.createElement('div');
        typingIndicator.id = 'rvilsTyping';
        typingIndicator.className = 'rvils-message rvils-message-bot rvils-typing-wrap';
        typingIndicator.innerHTML = `
            <div class="rvils-bubble rvils-typing-bubble">
                <span class="rvils-dot"></span>
                <span class="rvils-dot"></span>
                <span class="rvils-dot"></span>
            </div>
        `;
        stream.appendChild(typingIndicator);
        stream.scrollTop = stream.scrollHeight;

        setTimeout(() => {
            if (document.getElementById('rvilsTyping')) {
                document.getElementById('rvilsTyping').remove();
            }
            const res = generateResponse(intentObj, clean);
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

        let transcript = `========================================\n`;
        transcript += `MKPM RV Institute of Legal Studies (RVILS)\n`;
        transcript += `Official Helpdesk Transcript (100% Website Verified)\n`;
        transcript += `Date: ${new Date().toLocaleString()}\n`;
        transcript += `========================================\n\n`;

        messages.forEach(m => {
            const isUser = m.classList.contains('rvils-message-user');
            const bubble = m.querySelector('.rvils-bubble');
            const text = bubble ? bubble.innerText : '';
            transcript += `${isUser ? '[VISITOR]' : '[RVILS BOT]'}: ${text}\n\n`;
        });

        const blob = new Blob([transcript], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `RVILS_Consultation_${Date.now()}.txt`;
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
                    appendMessage('bot', `Hello! Welcome to **MKPM RV Institute of Legal Studies (RVILS)**. ⚖️

All information is 100% verified directly from our official portal (\`rvils.edu.in\`). We are affiliated with **Karnataka State Law University (KSLU)** and approved by the **Bar Council of India (BCI)**.

How can I assist you with your legal education today?`, [
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
                toneBtn.title = `Switch to ${tone === 'pro' ? 'Friendly' : 'Professional'} Tone`;
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
                appendMessage('bot', `Thank you, **${leadData.name}**! 🎓 Your enquiry for **${leadData.program}** has been received. Our RVILS Admissions Office will contact you at \`${leadData.phone}\`.`, ["Admissions 2026", "Campus Address", "Faculty"]);
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

    
    window.rvilsSendFeedback = function(btn, rating) {
        if (!btn || btn.classList.contains('active')) return;
        btn.classList.add('active');
        if (window.rvilsTelemetry && typeof window.rvilsTelemetry.logEvent === 'function') {
            window.rvilsTelemetry.logEvent('bot_feedback', {
                rating: rating,
                lastIntent: SESSION.lastIntent,
                timestamp: Date.now()
            });
        }
    };

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
        classifyIntent: classifyIntent,
        matchIntent: classifyIntent,
        generateResponse: generateResponse,
        checkModeration: checkModeration,
        knowledgeBase: RVILS_DATA,
        pageCorpus: PAGE_CORPUS,
        searchCorpus: searchWebsiteCorpus,
        levenshtein: levenshtein,
        findSuggestions: findSuggestions,
        getDeepInfo: getDeepInfo,
        getFollowUps: getFollowUps,
        safeStorage: SafeStorage,
        session: SESSION
    };

})();
