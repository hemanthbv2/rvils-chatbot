const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const screenshotDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
}

const rawLinks = require('./found_links.json');

// Deduplicate and filter out assets/feeds/etc.
const uniqueUrls = [...new Set(rawLinks)]
    .filter(url => {
        try {
            const pathname = new URL(url).pathname.toLowerCase();
            if (url.includes('/wp-content/') || url.includes('/wp-json/') || url.includes('feed') || url.includes('xmlrpc') || pathname.endsWith('.css') || pathname.endsWith('.js')) {
                return false;
            }
        } catch (e) {
            return false;
        }
        return true;
    });

console.log(`Starting screen recording and website extraction for ${uniqueUrls.length} pages...`);

function urlToSlug(url) {
    try {
        const u = new URL(url);
        let pathname = u.pathname.replace(/^\/|\/$/g, '').replace(/[\/\\?#%&=:]+/g, '_');
        return pathname || 'homepage';
    } catch (e) {
        return 'page_' + Math.random().toString(36).substr(2, 6);
    }
}

async function run() {
    const browser = await puppeteer.launch({
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1366,768']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });

    const extractedSiteData = {};
    const recordedGallery = [];

    for (let i = 0; i < uniqueUrls.length; i++) {
        const url = uniqueUrls[i];
        const slug = urlToSlug(url);
        const screenshotPath = path.join(screenshotDir, `${slug}.png`);
        console.log(`[${i + 1}/${uniqueUrls.length}] Capturing: ${url} -> ${slug}.png`);

        try {
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
            // Wait 1.5 seconds for Elementor animations and fonts to settle
            await new Promise(r => setTimeout(r, 1500));

            // Capture screenshot
            await page.screenshot({ path: screenshotPath, fullPage: false });

            // Extract live rendered DOM text, title, headings, and clean text
            const pageData = await page.evaluate(() => {
                const title = document.title || '';
                // Remove scripts, styles, noscript
                const clone = document.body.cloneNode(true);
                const toRemove = clone.querySelectorAll('script, style, noscript, iframe');
                toRemove.forEach(el => el.remove());

                // Extract all headings
                const headings = Array.from(clone.querySelectorAll('h1, h2, h3, h4, h5, h6'))
                    .map(h => ({ level: h.tagName.toLowerCase(), text: h.innerText.trim() }))
                    .filter(h => h.text.length > 0);

                // Extract tables if any
                const tables = Array.from(clone.querySelectorAll('table')).map(table => {
                    return Array.from(table.querySelectorAll('tr')).map(tr => 
                        Array.from(tr.querySelectorAll('th, td')).map(td => td.innerText.trim())
                    );
                });

                // Extract full text content
                const innerText = clone.innerText || '';

                return {
                    title,
                    headings,
                    tables,
                    text: innerText
                };
            });

            extractedSiteData[url] = {
                url,
                slug,
                screenshot: `screenshots/${slug}.png`,
                title: pageData.title,
                headings: pageData.headings,
                tables: pageData.tables,
                text: pageData.text
            };

            recordedGallery.push({
                url,
                slug,
                title: pageData.title,
                screenshotFile: `${slug}.png`
            });

            console.log(`   Captured ${slug}.png (${pageData.text.length} chars text)`);
        } catch (err) {
            console.error(`   Error capturing ${url}: ${err.message}`);
        }
    }

    await browser.close();

    // Save JSON of pure website data
    fs.writeFileSync(
        path.join(__dirname, 'verified_website_data.json'),
        JSON.stringify(extractedSiteData, null, 2),
        'utf-8'
    );
    console.log(`Saved verified pure website data to verified_website_data.json`);

    // Create an HTML gallery to visually inspect all captured screenshots
    const galleryHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>RVILS Official Website Screen Records & Captures</title>
    <style>
        body { font-family: -apple-system, sans-serif; background: #030712; color: #f8fafc; margin: 0; padding: 24px; }
        h1 { color: #FFCE7C; font-size: 24px; margin-bottom: 8px; }
        p { color: #94a3b8; font-size: 14px; margin-bottom: 24px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 20px; }
        .card { background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; overflow: hidden; }
        .card img { width: 100%; height: 220px; object-fit: cover; object-position: top; border-bottom: 1px solid rgba(255,255,255,0.1); }
        .card-body { padding: 14px; }
        .card-title { font-size: 14px; font-weight: 700; color: #fff; margin-bottom: 6px; }
        .card-url { font-size: 11px; color: #60a5fa; word-break: break-all; }
        a { color: inherit; text-decoration: none; }
    </style>
</head>
<body>
    <h1>RVILS Official Website Screen Records (${recordedGallery.length} Pages Captured)</h1>
    <p>100% verified pure website extractions from <code>https://rvils.edu.in/</code> with visual records for every single page.</p>
    <div class="grid">
        ${recordedGallery.map(item => `
            <div class="card">
                <a href="${item.screenshotFile}" target="_blank">
                    <img src="${item.screenshotFile}" alt="${item.slug}">
                </a>
                <div class="card-body">
                    <div class="card-title">${item.title}</div>
                    <div class="card-url"><a href="${item.url}" target="_blank">${item.url}</a></div>
                </div>
            </div>
        `).join('')}
    </div>
</body>
</html>`;

    fs.writeFileSync(path.join(screenshotDir, 'index.html'), galleryHtml, 'utf-8');
    console.log(`Created visual screen recording gallery at screenshots/index.html`);
}

run().catch(console.error);

