# API Juru Speedtest (Cloud Run). Build dari folder server/.
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src ./src

# Jalankan sebagai user non-root
USER node
EXPOSE 8080
CMD ["node", "src/index.js"]
