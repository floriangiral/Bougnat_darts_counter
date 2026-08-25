FROM node:22-trixie-slim

WORKDIR /workspace

RUN apt-get update \
	&& apt-get upgrade -y \
	&& rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install --global npm@11.6.4 --no-audit --no-fund \
	&& npm ci --include=dev --no-audit --no-fund

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]
