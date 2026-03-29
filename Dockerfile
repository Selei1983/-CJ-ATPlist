FROM node:20-alpine AS builder

WORKDIR /app/admin
COPY admin/package.json admin/package-lock.json* ./
RUN npm install
COPY admin/ .
RUN npm run build

# ---- Runtime ----
FROM node:20-alpine

WORKDIR /app

COPY server/package.json server/package-lock.json* ./server/
RUN cd server && npm install --omit=dev

COPY server/ ./server/
COPY --from=builder /app/admin/dist ./admin/dist/
COPY site/ ./site/

ENV NODE_ENV=production
ENV PORT=3001

VOLUME ["/app/server/data"]

EXPOSE 3001

WORKDIR /app/server
CMD ["node", "src/index.js"]
