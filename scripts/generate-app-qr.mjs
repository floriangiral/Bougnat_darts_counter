import fs from 'node:fs';
import path from 'node:path';
import QRCode from 'qrcode';

const rootDir = process.cwd();
const envFiles = ['.env.local', '.env.local.example'];
const outputPath = path.join(rootDir, 'public', 'app-qr.svg');
const lifecycleEvent = process.env.npm_lifecycle_event ?? '';

if (lifecycleEvent === 'dev') {
  // Avoid dirtying the git worktree on every local dev startup.
  process.exit(0);
}

const readEnvValue = (name) => {
  for (const fileName of envFiles) {
    const filePath = path.join(rootDir, fileName);
    if (!fs.existsSync(filePath)) continue;
    const content = fs.readFileSync(filePath, 'utf8');
    const line = content
      .split(/\r?\n/)
      .find((entry) => entry.startsWith(`${name}=`));

    if (line) {
      return line.slice(name.length + 1).trim();
    }
  }

  return '';
};

const appUrl = process.env.VITE_APP_URL || readEnvValue('VITE_APP_URL') || 'https://play.bougnatdarts.fr';

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
const qrSvg = await QRCode.toString(appUrl, {
  type: 'svg',
  errorCorrectionLevel: 'M',
  margin: 1,
});

const temporaryDirectory = fs.mkdtempSync(path.join(path.dirname(outputPath), '.app-qr-'));
const temporaryPath = path.join(temporaryDirectory, 'app-qr.svg');

try {
  fs.writeFileSync(temporaryPath, qrSvg, { encoding: 'utf8', flag: 'wx' });
  fs.renameSync(temporaryPath, outputPath);
} finally {
  fs.rmSync(temporaryDirectory, { recursive: true, force: true });
}
