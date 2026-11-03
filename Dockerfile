# syntax=docker/dockerfile:1

FROM node:26-alpine AS builder
ENV HUSKY=0
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:26-alpine AS runtime
ENV NODE_ENV=production
ENV HUSKY=0
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/main.js"]
