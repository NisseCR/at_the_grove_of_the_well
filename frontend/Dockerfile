FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
ARG VITE_PROJECT_NAME
ENV VITE_PROJECT_NAME=$VITE_PROJECT_NAME
ARG VITE_ASSETS_BASE
ENV VITE_ASSETS_BASE=$VITE_ASSETS_BASE
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
