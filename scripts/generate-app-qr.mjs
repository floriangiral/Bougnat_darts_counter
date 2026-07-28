import fs from 'node:fs';
import path from 'node:path';
import QRCode from 'qrcode';

const rootDir = process.cwd();
const envFiles = ['.env.local', '.env.local.example'];
const outputPath = path.join(rootDir, 'public', 'app-qr.svg');

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
const appEnv = (process.env.VITE_APP_ENV || readEnvValue('VITE_APP_ENV') || '').trim().toLowerCase();
const isLocalDev =
  process.env.CI !== 'true' &&
  process.env.CF_PAGES !== '1' &&
  (appEnv === 'local' || appEnv === 'dev' || appEnv === 'development' || /localhost|127\.0\.0\.1/.test(appUrl));

if (isLocalDev) {
  console.log('[generate-app-qr] Skip SVG generation in local development.');
  process.exit(0);
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
const qrSvg = await QRCode.toString(appUrl, {
  type: 'svg',
  errorCorrectionLevel: 'M',
  margin: 1,
});

fs.writeFileSync(outputPath, qrSvg, 'utf8');
