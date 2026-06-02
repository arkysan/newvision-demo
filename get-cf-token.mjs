import { chromium } from '@playwright/test';
import { execSync } from 'child_process';
import path from 'path';
import os from 'os';
import fs from 'fs';

const CHROME_PROFILE = 'C:\\Users\\ARKAI\\AppData\\Local\\Google\\Chrome\\User Data';
const TMP_PROFILE   = path.join(os.tmpdir(), 'cf-pw-profile');

// ── Copy just the Default profile (cookies/session) not the whole thing ──
function copyProfile() {
  const src = path.join(CHROME_PROFILE, 'Default');
  const dst = path.join(TMP_PROFILE, 'Default');
  if (!fs.existsSync(TMP_PROFILE)) {
    fs.mkdirSync(TMP_PROFILE, { recursive: true });
    // Copy just cookies + local storage (fast, ~10MB vs ~2GB full profile)
    const filesToCopy = ['Cookies', 'Local State', 'Preferences'];
    fs.mkdirSync(dst, { recursive: true });
    for (const f of filesToCopy) {
      const s = path.join(src, f);
      const d = path.join(dst, f);
      if (fs.existsSync(s)) { try { fs.copyFileSync(s, d); } catch {} }
    }
    // Copy Local Storage
    const lsSrc = path.join(src, 'Local Storage');
    const lsDst = path.join(dst, 'Local Storage');
    if (fs.existsSync(lsSrc)) {
      try { fs.cpSync(lsSrc, lsDst, { recursive: true }); } catch {}
    }
    // Copy IndexedDB
    const idbSrc = path.join(src, 'IndexedDB');
    const idbDst = path.join(dst, 'IndexedDB');
    if (fs.existsSync(idbSrc)) {
      try { fs.cpSync(idbSrc, idbDst, { recursive: true }); } catch {}
    }
    // Copy Local State to root
    const ls = path.join(CHROME_PROFILE, 'Local State');
    if (fs.existsSync(ls)) { try { fs.copyFileSync(ls, path.join(TMP_PROFILE, 'Local State')); } catch {} }
    console.log('Profile copied.');
  } else {
    console.log('Using existing temp profile.');
  }
}

(async () => {
  console.log('Copying Chrome session (cookies only)...');
  copyProfile();

  const browser = await chromium.launchPersistentContext(TMP_PROFILE, {
    headless: false,
    channel: 'chrome',
    args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'],
    viewport: { width: 1280, height: 800 },
  });

  const page = browser.pages()[0] || await browser.newPage();

  console.log('Navigating to Cloudflare API tokens...');
  await page.goto('https://dash.cloudflare.com/profile/api-tokens', {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });

  // Check if we need to log in
  await page.waitForTimeout(3000);
  const url = page.url();
  if (url.includes('login') || url.includes('sign-in')) {
    console.log('\n⚠️  Not logged in. Please log in to Cloudflare in the browser window.');
    console.log('Waiting 30 seconds for you to log in...');
    await page.waitForURL('**/profile/api-tokens', { timeout: 60000 });
  }

  console.log('On API tokens page. Looking for Edit Cloudflare Workers template...');
  await page.waitForTimeout(2000);

  // Find and click "Use template" for Edit Cloudflare Workers
  const rows = await page.locator('li, tr, [role="listitem"]').all();
  let clicked = false;
  for (const row of rows) {
    const text = await row.textContent().catch(() => '');
    if (text.includes('Edit Cloudflare Workers')) {
      const btn = row.getByRole('button', { name: /use template/i });
      if (await btn.isVisible().catch(() => false)) {
        await btn.click();
        clicked = true;
        console.log('Clicked "Use template" for Edit Cloudflare Workers.');
        break;
      }
    }
  }

  if (!clicked) {
    // Take screenshot to debug
    await page.screenshot({ path: 'debug-screenshot.png' });
    console.log('Could not find template button. Screenshot saved as debug-screenshot.png');
    console.log('Current URL:', page.url());
    await page.waitForTimeout(15000);
    await browser.close();
    process.exit(1);
  }

  await page.waitForTimeout(2000);

  // Continue to summary
  console.log('Clicking Continue to summary...');
  await page.getByRole('button', { name: /continue to summary/i }).click();
  await page.waitForTimeout(2000);

  // Create Token
  console.log('Creating token...');
  await page.getByRole('button', { name: /create token/i }).click();
  await page.waitForTimeout(3000);

  // Extract the token
  console.log('Reading token value...');
  let token = '';

  // Try multiple selectors
  const selectors = [
    'input[type="text"][readonly]',
    '[class*="token"] input',
    'input[value*="ey"]',
    'code',
    '[data-testid*="token"]',
  ];

  for (const sel of selectors) {
    try {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 2000 })) {
        token = await el.inputValue().catch(() => '') || await el.textContent().catch(() => '');
        if (token && token.length > 20) break;
      }
    } catch {}
  }

  // Try clicking copy button and reading clipboard
  if (!token || token.length < 20) {
    try {
      await page.locator('button:has-text("Copy"), [aria-label*="copy"], [title*="copy"]').first().click();
      await page.waitForTimeout(500);
      // Read via JS clipboard
      token = await page.evaluate(() => navigator.clipboard.readText()).catch(() => '');
    } catch {}
  }

  if (token && token.length > 20) {
    console.log('\n✅ TOKEN CREATED SUCCESSFULLY:');
    console.log('━'.repeat(60));
    console.log(token);
    console.log('━'.repeat(60));
    console.log('\nToken saved. Closing in 10 seconds...');
    // Save token to file so we can read it
    fs.writeFileSync('cf-token.txt', token);
    console.log('Also saved to: cf-token.txt');
  } else {
    console.log('\n⚠️  Token page is open — copy it manually from the browser.');
    console.log('    Keeping browser open for 30 seconds...');
    await page.screenshot({ path: 'token-page.png' });
  }

  await page.waitForTimeout(10000);
  await browser.close();

  // Clean up temp profile
  try { fs.rmSync(TMP_PROFILE, { recursive: true, force: true }); } catch {}
})();
