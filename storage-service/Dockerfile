# ---- Stage 1: Dipendenze ----
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund && \
    find node_modules -type d -name "test" -exec rm -rf {} + || true && \
    find node_modules -type d -name "tests" -exec rm -rf {} + || true && \
    find node_modules -name "*.md" -delete && \
    find node_modules -name "*.ts" -delete && \
    find node_modules -name "*.map" -delete

# ---- Stage 2: Produzione ----
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .

EXPOSE 5006
CMD ["node", "server.js"]
