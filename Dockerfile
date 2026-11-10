# Stage 1: Build Vite React SPA
FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Production Nginx Server (Cloud Run & Self-Hosted Ready)
FROM nginx:1.27-alpine AS runner

# Configure Nginx for SPA routing, security headers, and compression on port 8080
RUN printf 'server {\n\
    listen 8080;\n\
    server_name _;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
\n\
    # Security Headers\n\
    add_header X-Frame-Options "SAMEORIGIN" always;\n\
    add_header X-Content-Type-Options "nosniff" always;\n\
    add_header X-XSS-Protection "1; mode=block" always;\n\
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;\n\
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;\n\
\n\
    # High-Performance Gzip Compression\n\
    gzip on;\n\
    gzip_vary on;\n\
    gzip_proxied any;\n\
    gzip_comp_level 6;\n\
    gzip_min_length 256;\n\
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;\n\
\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
    location /assets/ {\n\
        expires 1y;\n\
        add_header Cache-Control "public, immutable";\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]

