const { GoogleGenerativeAI } = require('@google/generative-ai');
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

puppeteer.use(StealthPlugin());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Controller for 2-line summary
const getSummary = async (req, res) => {
  const { mediumLink } = req.body;
  
  if (!mediumLink) {
    return res.status(400).json({ error: "Medium link is required." });
  }

  const prompt = `Summarize this Medium blog post in 2 lines: ${mediumLink}`;
  console.log("🔹 Prompt sent to Gemini (/summary):", prompt);

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(prompt);
    const text = await result.response.text();
    console.log("  Gemini /summary response:", text);
    res.json({ summary: text.trim() });
  } catch (err) {
    console.error(" Error in /summary:", err);
    res.status(500).json({ error: "Something went wrong with Gemini Summary API." });
  }
};

// Controller for autofill
const getAutofill = async (req, res) => {
  const { mediumLink } = req.body;
  
  if (!mediumLink) {
    return res.status(400).json({ error: "Medium link is required." });
  }

  let browser;
  try {
    console.log("🕵️ Launching Puppeteer to scrape article & banner...");
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    );

    await page.goto(mediumLink, { waitUntil: "networkidle2", timeout: 0 });

    await page.waitForSelector('article', { timeout: 15000 });
    await page.waitForTimeout ? page.waitForTimeout(2000) : new Promise(r => setTimeout(r, 2000));

    const blogText = await page.$eval('article', el => el.innerText).catch(() => '');
    console.log("📄 Scraped blog content length:", blogText.length);

    // Extract banner image
    await page.waitForSelector("img", { timeout: 15000 });
    const imageSrcs = await page.$$eval("img", imgs =>
      imgs.map(img => img.src).filter(src =>
        src && src.includes("https://miro.medium.com"))
    );

    console.log("🖼️ All <img> src values:");
    imageSrcs.forEach((src, i) => console.log(`  ${i + 1}: ${src}`));

    const bannerImage = imageSrcs.find(
      src =>
        src.includes("resize:fit") &&
        !src.includes("da:true") &&
        !src.includes("resize:fill:")
    );

    if (bannerImage) {
      console.log("  Picked banner image:", bannerImage);
    } else {
      console.warn("⚠️ No suitable banner image found.");
    }

    // Extract publication date
    let publishedDate = null;
    try {
      const dateText = await page.$eval('[data-testid="storyPublishDate"]', el => el.textContent.trim());
      console.log("📆 Found publish date text:", dateText);

      if (dateText.includes("ago")) {
        const match = dateText.match(/(\d+)\s+days?\s+ago/);
        if (match) {
          const daysAgo = parseInt(match[1]);
          const date = new Date();
          date.setDate(date.getDate() - daysAgo);
          publishedDate = date.toISOString().split("T")[0];
        }
      } else {
        const parsedDate = new Date(dateText);
        if (!isNaN(parsedDate)) {
          const pad = n => n.toString().padStart(2, "0");
          publishedDate = `${parsedDate.getFullYear()}-${pad(parsedDate.getMonth() + 1)}-${pad(parsedDate.getDate())}`;
        }
      }
    } catch (err) {
      console.warn("⚠️ Could not extract publication date.");
    }

    await browser.close();

    if (!blogText || blogText.length < 100) {
      return res.status(500).json({ error: "Blog content is too short or not extractable." });
    }

    // Prompt Gemini
    const prompt = `
Extract the following details from this blog content:
1. Blog title
2. Author's name (look for "Written by:" or author block)
3. A 3-line summary (description)

Format the output as JSON like this:
{
  "title": "...",
  "author": "...",
  "description": "..."
}

--- BLOG CONTENT START ---
${blogText}
--- BLOG CONTENT END ---
`.trim();

    console.log("🟢 Prompt sent to Gemini (/autofill):", prompt.slice(0, 300) + "...");

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(prompt);
    const responseText = await result.response.text();
    console.log("  Gemini /autofill response:", responseText);

    // 🧠 Parse Gemini response
    let parsed;
    try {
      const cleaned = responseText.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.error("⚠️ Failed to parse Gemini response as JSON:", responseText);
      return res.status(500).json({
        error: "Gemini response was not in valid JSON format.",
        raw: responseText
      });
    }

    // Send everything
    console.log("📤 Final formatted publishedDate being sent:", publishedDate);
    res.json({
      title: parsed.title || "",
      author: parsed.author || "",
      description: parsed.description || "",
      thumbnail: bannerImage || "",
      publishedDate: publishedDate || ""  
    });

  } catch (err) {
    console.error(" Error in /autofill:", err);
    if (browser) await browser.close();
    res.status(500).json({ error: "Something went wrong with Gemini Autofill." });
  }
};

module.exports = {
  getSummary,
  getAutofill
};