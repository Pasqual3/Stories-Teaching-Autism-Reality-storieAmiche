# ---- Stage 1: Installazione Dipendenze ----
FROM node:20-alpine AS builder
WORKDIR /app
# Copia solo package.json per sfruttare la cache dei layer
COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund && \
    find node_modules -type d -name "test" -exec rm -rf {} + || true && \
    find node_modules -type d -name "tests" -exec rm -rf {} + || true && \
    find node_modules -name "*.md" -delete && \
    find node_modules -name "*.ts" -delete && \
    find node_modules -name "*.map" -delete

# ---- Stage 2: Immagine di Produzione ----
FROM node:20-alpine
WORKDIR /app
# Copia solo le dipendenze di produzione dallo stage precedente
COPY --from=builder /app/node_modules ./node_modules
# Copia il codice sorgente
COPY . .

EXPOSE 4000
CMD ["node", "server.js"]
