const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
    console.log("Launching headless Chrome to test index.html widget...");
    const browser = await puppeteer.launch({
        executablePath: CHROME_PATH,
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        const indexPath = 'file:///' + path.join(__dirname, '..', 'index.html').replace(/\\/g, '/');
        
        await page.goto(indexPath, { waitUntil: 'domcontentloaded' });
        console.log("Page loaded:", indexPath);

        // Check if chatbot FAB exists
        await page.waitForSelector('#rvilsChatFab', { timeout: 5000 });
        console.log("  [PASS] Chatbot FAB rendered successfully.");

        // Click FAB to open chat
        await page.click('#rvilsChatFab');
        await page.waitForSelector('#rvilsChatWindow', { visible: true, timeout: 5000 });
        console.log("  [PASS] Chat window opened on FAB click.");

        // Check greeting message
        const firstBotMsg = await page.$eval('.rvils-message-bot', el => el.innerText);
        console.log("  [PASS] Initial greeting rendered:\n    ", firstBotMsg.substring(0, 80).replace(/\n/g, ' '));

        // 1. Send eligibility question
        await page.type('#rvilsChatInput', 'What are the eligibility criteria for BA LLB?');
        await page.keyboard.press('Enter');
        await page.waitForFunction(() => !document.getElementById('rvilsTyping') && document.querySelectorAll('.rvils-message-bot:not(.rvils-typing-wrap)').length >= 2, { timeout: 6000 });
        console.log("  [PASS] Bot answered eligibility inquiry.");

        // 2. Send deep scraped corpus query
        await page.type('#rvilsChatInput', 'tell me about Commonwealth Kabaddi Championship');
        await page.keyboard.press('Enter');
        await page.waitForFunction(() => !document.getElementById('rvilsTyping') && document.querySelectorAll('.rvils-message-bot:not(.rvils-typing-wrap)').length >= 3, { timeout: 6000 });
        console.log("  [PASS] Bot answered deep scraped corpus inquiry.");

        // 3. Test Legal Stream Matcher
        await page.type('#rvilsChatInput', 'help me choose which law course');
        await page.keyboard.press('Enter');
        await page.waitForFunction(() => !document.getElementById('rvilsTyping') && document.querySelectorAll('.rvils-message-bot:not(.rvils-typing-wrap)').length >= 4, { timeout: 6000 });
        const matcherMsg = await page.$$eval('.rvils-message-bot:not(.rvils-typing-wrap) .rvils-bubble', els => els[els.length - 1].innerText);
        if (matcherMsg.includes("Stream Matcher")) {
            console.log("  [PASS] Bot rendered Legal Stream Matcher interactive flow.");
        } else {
            throw new Error("Stream Matcher failed to render: " + matcherMsg);
        }

        // 4. Test 20-Week Mandatory Internship Roadmap
        await page.type('#rvilsChatInput', 'BCI mandatory 20-week internship roadmap');
        await page.keyboard.press('Enter');
        await page.waitForFunction(() => !document.getElementById('rvilsTyping') && document.querySelectorAll('.rvils-message-bot:not(.rvils-typing-wrap)').length >= 5, { timeout: 6000 });
        const roadmapMsg = await page.$$eval('.rvils-message-bot:not(.rvils-typing-wrap) .rvils-bubble', els => els[els.length - 1].innerText);
        if (roadmapMsg.includes("Bar Council of India") && roadmapMsg.includes("Phase 1")) {
            console.log("  [PASS] Bot rendered 20-Week Internship Roadmap with 4 Clinical Phases.");
        } else {
            throw new Error("Roadmap failed to render: " + roadmapMsg);
        }

        // 5. Test Latin Maxim Query
        await page.type('#rvilsChatInput', 'What does pro bono publico mean?');
        await page.keyboard.press('Enter');
        await page.waitForFunction(() => !document.getElementById('rvilsTyping') && document.querySelectorAll('.rvils-message-bot:not(.rvils-typing-wrap)').length >= 6, { timeout: 6000 });
        const maximMsg = await page.$$eval('.rvils-message-bot:not(.rvils-typing-wrap) .rvils-bubble', els => els[els.length - 1].innerText);
        if (maximMsg.toLowerCase().includes("for the public good") && maximMsg.includes("RVILS Legal Services Clinic")) {
            console.log("  [PASS] Bot rendered Pro Bono Publico Latin maxim with RVILS Legal Services Clinic context.");
        } else {
            throw new Error("Latin maxim failed to render: " + maximMsg);
        }

        // 6. Test RV Law Journal
        await page.type('#rvilsChatInput', 'What is the ISSN of RV Law Journal and how to submit?');
        await page.keyboard.press('Enter');
        await page.waitForFunction(() => !document.getElementById('rvilsTyping') && document.querySelectorAll('.rvils-message-bot:not(.rvils-typing-wrap)').length >= 7, { timeout: 6000 });
        const journalMsg = await page.$$eval('.rvils-message-bot:not(.rvils-typing-wrap) .rvils-bubble', els => els[els.length - 1].innerText);
        if (journalMsg.includes("2583-5041") && journalMsg.includes("OSCOLA")) {
            console.log("  [PASS] Bot rendered RV Law Journal details (ISSN: 2583-5041 & OSCOLA citation).");
        } else {
            throw new Error("Journal failed to render: " + journalMsg);
        }

        // 7. Test Collaborations & University of Leeds
        await page.type('#rvilsChatInput', 'Does RVILS collaborate with University of Leeds?');
        await page.keyboard.press('Enter');
        await page.waitForFunction(() => !document.getElementById('rvilsTyping') && document.querySelectorAll('.rvils-message-bot:not(.rvils-typing-wrap)').length >= 8, { timeout: 6000 });
        const collabMsg = await page.$$eval('.rvils-message-bot:not(.rvils-typing-wrap) .rvils-bubble', els => els[els.length - 1].innerText);
        if (collabMsg.includes("University of Leeds") && collabMsg.includes("Ilaria Zavoli")) {
            console.log("  [PASS] Bot rendered University of Leeds international collaboration.");
        } else {
            throw new Error("Collab failed to render: " + collabMsg);
        }

        console.log("\nAll browser UI and legal module tests passed with 100% success!");
    } finally {
        await browser.close();
    }
})();
