FROM node:22-alpine

WORKDIR /workspace

RUN apk upgrade --no-cache

COPY package*.json ./
RUN npm install --global npm@11.6.4 --no-audit --no-fund \
	&& npm ci --include=dev --no-audit --no-fund \
	&& rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx

COPY . .

EXPOSE 3000

CMD ["sh", "-c", "node scripts/generate-app-qr.mjs && node node_modules/vite/bin/vite.js --host 0.0.0.0 --port 3000"]
