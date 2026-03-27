FROM node:22-bookworm-slim

WORKDIR /workspace

COPY package*.json ./
RUN corepack enable \
  && corepack prepare pnpm@10.18.3 --activate \
  && pnpm install --no-frozen-lockfile --config.node-linker=hoisted

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]
