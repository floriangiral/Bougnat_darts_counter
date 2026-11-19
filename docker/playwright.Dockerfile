FROM mcr.microsoft.com/playwright:v1.65.1-noble

WORKDIR /workspace

COPY . .

CMD ["npm", "exec", "--", "playwright", "test", "tests/e2e/tablet-layout.smoke.spec.ts", "--project=tablet-portrait", "--project=tablet-landscape", "--project=tablet-compact-landscape"]
