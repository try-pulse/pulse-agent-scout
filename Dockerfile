FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
COPY test ./test
RUN npm run build

FROM node:22-alpine
ENV NODE_ENV=production PORT=3000 TOKEN_FILE=/data/pulse-tokens.json
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && mkdir -p /data && chown node:node /data
COPY --from=build /app/dist ./dist
USER node
VOLUME /data
EXPOSE 3000
CMD ["node", "dist/src/main.js"]
