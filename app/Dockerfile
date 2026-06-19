FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
ARG PUBLIC_ASSETS_BASE
ENV PUBLIC_ASSETS_BASE=$PUBLIC_ASSETS_BASE
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json* ./
RUN npm ci --omit=dev
# adapter-node resolves import.meta.url from build/server/chunks/, so it looks for
# client assets at build/server/chunks/client instead of build/client. Symlink fixes this.
RUN ln -s /app/build/client /app/build/server/chunks/client
ENV PORT=3000
EXPOSE 3000
CMD ["node", "build/index.js"]
