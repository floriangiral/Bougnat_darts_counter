FROM node:24.22.3-alpine

WORKDIR /workspace

RUN --mount=type=secret,id=build_ca_bundle \
	if [ -f /run/secrets/build_ca_bundle ]; then \
		export SSL_CERT_FILE=/run/secrets/build_ca_bundle; \
	fi \
	&& apk upgrade --no-cache

COPY package*.json ./
RUN --mount=type=secret,id=build_ca_bundle \
	if [ -f /run/secrets/build_ca_bundle ]; then \
		export NODE_EXTRA_CA_CERTS=/run/secrets/build_ca_bundle; \
	fi \
	&& npm install --global npm@12.2.3 --no-audit --no-fund \
	&& npm ci --include=dev --no-audit --no-fund \
	&& rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx

COPY . .

EXPOSE 3000

CMD ["sh", "-c", "node scripts/generate-app-qr.mjs && node node_modules/vite/bin/vite.js --host 0.0.0.0 --port 3000"]
