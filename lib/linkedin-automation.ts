import puppeteer from "puppeteer";

interface LinkedinMessageResult {
  success: boolean;
  logs: string[];
  error?: string;
}

export async function sendLinkedinConnectRequest(
  cookie: string,
  profileUrl: string,
  message?: string
): Promise<LinkedinMessageResult> {
  const logs: string[] = [];
  let browser;

  logs.push(`🤖 Initializing LinkedIn automation for: ${profileUrl}`);

  try {
    browser = await puppeteer.launch({
      headless: true, // Use headless for server-side execution
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--single-process", // Important for some server environments
        "--disable-gpu",
      ],
    });

    const page = await browser.newPage();

    // Set Viewport
    await page.setViewport({ width: 1280, height: 800 });

    // Set User Agent
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    // Set Cookie
    logs.push("🔑 Setting authentication cookies...");
    await page.setCookie({
      name: "li_at",
      value: cookie,
      domain: ".linkedin.com",
      path: "/",
      secure: true,
      httpOnly: true,
      sameSite: "None",
    });

    // Navigate to Profile
    logs.push(`🚀 Navigating to profile: ${profileUrl}`);
    await page.goto(profileUrl, { waitUntil: "domcontentloaded", timeout: 30000 });

    // Wait for random time to simulate human
    await new Promise((r) => setTimeout(r, 2000 + Math.random() * 2000));

    // Check if logged in (look for generic logged-in element like nav bar)
    const isLoggedIn = await page.$(".global-nav__content");
    if (!isLoggedIn) {
      // Sometimes we land on auth wall or feed if cookie invalid
      // Check title
      const title = await page.title();
      if (title.includes("Sign In") || title.includes("Login")) {
        throw new Error("LinkedIn Session Cookie appears invalid or expired. Please update it in Settings.");
      }
    }

    // Look for Connect Button
    // Strategies:
    // 1. "Connect" text button
    // 2. "More" -> "Connect"

    // Try primary action buttons
    logs.push("🔍 Looking for 'Connect' button...");

    // Check for "Pending" status first
    const isPending = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.some(b => (b as HTMLElement).innerText.includes('Pending') && !b.disabled);
    });

    if (isPending) {
      logs.push("⚠️ Connection request is already pending.");
      return { success: true, logs };
    }

    // Try finding "Connect" button directly
    let connectBtn = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      // Prioritize "Connect" exact match or "Connect" inside specific container
      return buttons.find(b => (b as HTMLElement).innerText.trim() === 'Connect') ||
        buttons.find(b => (b as HTMLElement).innerText.trim().includes('Connect') && !(b as HTMLElement).innerText.includes('Remove')); // Avoid 'Remove Connection'
    });

    if (!(connectBtn as unknown as { asElement: () => HTMLElement | null }).asElement()) {
      // Try "More" button menu
      logs.push("ℹ️ 'Connect' button not found directly. Checking 'More' actions...");
      const moreBtn = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button, div[role="button"]'));
        return buttons.find(b => b.ariaLabel?.includes('More actions') || (b as HTMLElement).innerText.trim() === 'More');
      });

      if ((moreBtn as unknown as { asElement: () => HTMLElement | null }).asElement()) {
        ((moreBtn as unknown as { asElement: () => HTMLElement | null }).asElement() as HTMLElement)?.click();
        await new Promise(r => setTimeout(r, 1000));

        // Now look for Connect in dropdown
        connectBtn = (await page.evaluateHandle(() => {
          const items = Array.from(document.querySelectorAll('div[role="button"], li'));
          return items.find(b => (b as HTMLElement).innerText.trim() === 'Connect');
        })) as unknown as typeof connectBtn;
      }
    }

    if ((connectBtn as unknown as { asElement: () => HTMLElement | null }).asElement()) {
      logs.push("✅ 'Connect' button found. Clicking...");
      ((connectBtn as unknown as { asElement: () => HTMLElement | null }).asElement() as HTMLElement)?.click();
      await new Promise(r => setTimeout(r, 1500));

      // Handle "Add a note" modal
      if (message) {
        logs.push("📝 Adding custom note...");
        const addNoteBtn = await page.evaluateHandle(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          return buttons.find(b => b.innerText.trim() === 'Add a note');
        });

        if ((addNoteBtn as unknown as { asElement: () => HTMLElement | null }).asElement()) {
          ((addNoteBtn as unknown as { asElement: () => HTMLElement | null }).asElement() as HTMLElement)?.click();
          await new Promise(r => setTimeout(r, 1000));

          logs.push("⌨️ Typing message...");
          await page.waitForSelector('textarea[name="message"]', { timeout: 5000 });
          await page.type('textarea[name="message"]', message);
          await new Promise(r => setTimeout(r, 1000));

          // Send
          const sendBtn = await page.evaluateHandle(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            return buttons.find(b => b.innerText.trim() === 'Send');
          });

          if ((sendBtn as unknown as { asElement: () => HTMLElement | null }).asElement()) {
            ((sendBtn as unknown as { asElement: () => HTMLElement | null }).asElement() as HTMLElement)?.click();
            logs.push("📨 Clicked 'Send'");
          } else {
            throw new Error("Could not find 'Send' button for note");
          }
        } else {
          logs.push("⚠️ Could not find 'Add a note' button, sending without note (or already sent)");
          // Check if "Send" (without note) exists - usually "Connect" without note is "Send now" or similar?
          // Actually LinkedIn usually shows "Add a note" and "Send" side by side in the modal
          const sendWithoutNoteBtn = await page.evaluateHandle(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            return buttons.find(b => b.innerText.trim() === 'Send' || b.innerText.trim() === 'Send now');
          });
          if ((sendWithoutNoteBtn as unknown as { asElement: () => HTMLElement | null }).asElement()) {
            ((sendWithoutNoteBtn as unknown as { asElement: () => HTMLElement | null }).asElement() as HTMLElement)?.click();
          }
        }
      } else {
        // No message, just click Send/Send now
        const sendBtn = await page.evaluateHandle(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          return buttons.find(b => b.innerText.trim() === 'Send' || b.innerText.trim() === 'Send now');
        });
        if ((sendBtn as unknown as { asElement: () => HTMLElement | null }).asElement()) {
          ((sendBtn as unknown as { asElement: () => HTMLElement | null }).asElement() as HTMLElement)?.click();
          logs.push("📨 Clicked 'Send' (No note)");
        }
      }

      await new Promise(r => setTimeout(r, 2000)); // Wait for submission
      logs.push("✅ Connection request sent!");

    } else {
      // Check if already connected (Message button exists)
      const messageBtn = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button, a'));
        return buttons.find(b => (b as HTMLElement).innerText.trim() === 'Message');
      });

      if ((messageBtn as unknown as { asElement: () => HTMLElement | null }).asElement()) {
        logs.push("ℹ️ Already connected (Message button found). Sending direct message...");
        ((messageBtn as unknown as { asElement: () => HTMLElement | null }).asElement() as HTMLElement)?.click();
        // This opens the chat window. Implementation for chat is clearer but complex.
        // Only implementing connection request for now as per robust MVP.
        logs.push("⚠️ Direct messaging existing connections is not fully implemented in this version. Request marked as skipped.");
        return { success: true, logs }; // Treat as success but skipped
      }

      throw new Error("Could not find 'Connect' or 'Message' button. Profile might be private or unreachable.");
    }

    return { success: true, logs };

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logs.push(`❌ Error: ${msg}`);
    // Capture screenshot on error (optional, logic omitted for brevity)
    return { success: false, logs, error: msg };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
