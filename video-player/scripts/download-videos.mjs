#!/usr/bin/env node
import { fileURLToPath } from 'url';
import { dirname, join, extname } from 'path';
import { promises as fs } from 'fs';
import { spawnSync } from 'child_process';
import YTDlpWrapModule from 'yt-dlp-wrap';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function readJson(path) {
  const text = await fs.readFile(path, 'utf-8');
  return JSON.parse(text);
}

function sanitizeTitle(title) {
  return title
    .replace(/[\n\r\t]/g, ' ')
    .replace(/[^\w\-\s\(\)\[\]\.&',]/g, '')
    .trim()
    .slice(0, 120);
}

async function main() {
  const projectRoot = join(__dirname, '..');
  const publicDir = join(projectRoot, 'public');
  const videoDir = join(publicDir, 'video');
  await ensureDir(videoDir);

  const linksPath = join(projectRoot, 'videos.remote.json');
  const links = await readJson(linksPath);
  if (!Array.isArray(links) || links.length === 0) {
    console.error('videos.remote.json must be a non-empty array of URLs');
    process.exit(1);
  }

  // Check if yt-dlp is available in PATH
  const ytVer = spawnSync('yt-dlp', ['--version'], { encoding: 'utf8' });
  const hasYtDlp = ytVer.status === 0;
  if (!hasYtDlp) {
    console.warn('[warn] yt-dlp not found in PATH. Skipping downloads and using existing local videos.\nInstall with: brew install yt-dlp ffmpeg');
  }

  // Initialize wrapper only if yt-dlp exists
  const YTDlpWrap = hasYtDlp ? (YTDlpWrapModule.default?.default || YTDlpWrapModule.default || YTDlpWrapModule) : null;
  const ytdlp = hasYtDlp ? new YTDlpWrap() : null;

  for (const url of links) {
    if (!hasYtDlp) break;
    console.log(`Downloading: ${url}`);
    // Download to a unique per-video subfolder: video/<id>/<id>.<ext>
    const outTemplate = join(videoDir, '%(id)s', '%(id)s.%(ext)s');
    try {
      await ytdlp.exec([
        '-o', outTemplate,
        // Prefer MP4 (H.264/AAC); will merge if needed (requires ffmpeg)
        '-f', "bv*[ext=mp4][vcodec*=avc1]+ba[ext=m4a]/bv*[vcodec*=avc1]+ba/best[ext=mp4]/best",
        '--merge-output-format', 'mp4',
        '--no-warnings',
        '--restrict-filenames=false',
        '--write-info-json',
        '--no-playlist',
        url,
      ]);
    } catch (e) {
      console.error('Failed to download', url, e?.stderr || e?.message || e);
      continue;
    }
  }

  // After downloads, scan subdirectories in videoDir and build videos.json
  const subitems = await fs.readdir(videoDir, { withFileTypes: true });
  const subdirs = subitems.filter(d => d.isDirectory()).map(d => d.name);

  const entries = [];
  for (const id of subdirs) {
    const dir = join(videoDir, id);
    const files = await fs.readdir(dir);
    const infoName = files.find(f => f.endsWith('.info.json'));
    const lower = files.map(f => f.toLowerCase());
    const mp4 = files[lower.findIndex(f => f.endsWith('.mp4'))];
    const webm = files[lower.findIndex(f => f.endsWith('.webm'))];
    const mkv = files[lower.findIndex(f => f.endsWith('.mkv'))];
    const m4v = files[lower.findIndex(f => f.endsWith('.m4v'))];
    const chosen = mp4 || webm || mkv || m4v || null;
    if (!chosen) continue;
    let titleSan = id;
    if (infoName) {
      try {
        const info = JSON.parse(await fs.readFile(join(dir, infoName), 'utf-8'));
        titleSan = sanitizeTitle(info.title || id);
      } catch {}
    }
    entries.push({ src: `video/${id}/${chosen}`, title: titleSan });
  }

  if (entries.length === 0) {
    // Fallback: scan root videoDir for any media if downloads failed
    const rootFiles = await fs.readdir(videoDir);
    const media = rootFiles.filter(f => /\.(mp4|webm|mkv|m4v)$/i.test(f));
    for (const f of media) {
      entries.push({ src: `video/${f}`, title: sanitizeTitle(f.replace(/\.[^.]+$/, '')) });
    }
  }

  if (entries.length === 0) {
    console.error('No videos found after download.');
    process.exit(1);
  }

  // Keep only first 12 entries; if fewer than 12, keep as many as exist
  const firstTwelve = entries.slice(0, 12);

  const videosJsonPath = join(projectRoot, 'videos.json');
  await fs.writeFile(videosJsonPath, JSON.stringify(firstTwelve, null, 2) + '\n');
  console.log(`Wrote ${firstTwelve.length} entries to videos.json`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
