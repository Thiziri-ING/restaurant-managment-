# ============================================================
# Stage 1 — Build React app
# ============================================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build

# ============================================================
# Stage 2 — Nginx server
# ============================================================
FROM nginx:1.25-alpine AS production

# Remove default config
RUN rm /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html

# SPA routing — tous les routes → index.html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
