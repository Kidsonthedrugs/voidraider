import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TARGET_DIR = path.resolve(__dirname, '../public/assets/vibers');

const IMAGE_URLS = [
  "https://testnet.vibevibe.fun/vibevibe-header-lockup.png",
  "https://testnet.vibevibe.fun/vibers/collection/viber-6-480.webp",
  "https://testnet.vibevibe.fun/vibers/collection/viber-10-480.webp",
  "https://testnet.vibevibe.fun/vibers/collection/viber-32-480.webp",
  "https://testnet.vibevibe.fun/vibers/collection/viber-31-480.webp",
  "https://testnet.vibevibe.fun/vibers/collection/viber-42-480.webp",
  "https://testnet.vibevibe.fun/vibers/collection/viber-48-480.webp",
  "https://testnet.vibevibe.fun/vibers/collection/viber-63-480.webp",
  "https://testnet.vibevibe.fun/vibers/collection/viber-71-480.webp",
  "https://testnet.vibevibe.fun/vibers/collection/viber-103-480.webp",
  "https://testnet.vibevibe.fun/vibers/collection/viber-123-480.webp",
  "https://testnet.vibevibe.fun/vibers/collection/viber-141-480.webp",
  "https://testnet.vibevibe.fun/vibers/collection/viber-142-480.webp",
  "https://testnet.vibevibe.fun/vibers/collection/bureau-31-480.webp",
  "https://testnet.vibevibe.fun/vibers/collection/bureau-25-480.webp"
];

async function fetchWithRetry(url, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }
      return await response.arrayBuffer();
    } catch (err) {
      if (attempt === maxRetries) throw err;
      console.warn(`[Retry ${attempt}/${maxRetries}] Failed to fetch ${url} (${err.message}). Retrying in 1s...`);
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
}

async function downloadAssets() {
  console.log(`Ensuring destination directory exists: ${TARGET_DIR}`);
  fs.mkdirSync(TARGET_DIR, { recursive: true });

  console.log(`Starting download of ${IMAGE_URLS.length} assets...`);

  let successCount = 0;
  for (let i = 0; i < IMAGE_URLS.length; i++) {
    const url = IMAGE_URLS[i];
    const filename = `viber_${i + 1}.png`;
    const destPath = path.join(TARGET_DIR, filename);

    try {
      console.log(`[${i + 1}/${IMAGE_URLS.length}] Fetching ${url}...`);
      const arrayBuffer = await fetchWithRetry(url, 4);
      const buffer = Buffer.from(arrayBuffer);
      fs.writeFileSync(destPath, buffer);
      console.log(`Saved ${filename} (${buffer.length} bytes) to ${destPath}`);
      successCount++;
    } catch (err) {
      console.error(`Error downloading ${url}:`, err);
    }
  }

  console.log(`Asset ingestion complete! (${successCount}/${IMAGE_URLS.length} downloaded successfully)`);
}

downloadAssets().catch((err) => {
  console.error('Fatal error during asset download:', err);
  process.exit(1);
});
