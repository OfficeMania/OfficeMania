FROM node:16.13-alpine AS DEV

ENV NODE_ENV dev

ENV PORT 8080

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build-webpack

EXPOSE 8080

CMD  [ "npm", "run", "start-ts-node-dev" ]

FROM node:16.13-alpine AS PRODUCTION

ENV NODE_ENV production

ENV PORT 8080

WORKDIR /app

COPY . .

RUN npm ci --production=false && npm run build-webpack && npm prune --production

EXPOSE 8080

CMD  [ "npm", "run", "start-production" ]
