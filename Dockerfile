FROM node:14.13-alpine AS BASE_BUILD

ENV PORT 8080

WORKDIR /src

COPY package*.json ./

RUN npm ci

COPY . .

RUN TS_NODE_PROJECT="tsconfig-for-webpack-config.json" && ./node_modules/.bin/webpack

FROM node:14.13-alpine AS DEBUG_IMAGE

ENV PORT 8080

WORKDIR /app

COPY --from=BASE_BUILD /src/ .

EXPOSE 8080

CMD  [ "npm", "run", "start-ts-node-dev" ]

FROM node:14.13-alpine AS PRODUCTION_BUILD

WORKDIR /src

COPY --from=BASE_BUILD /src/ .

RUN npm prune --production

RUN npm install --no-package-lock --no-save typescript@^4.1.3 ts-node@^8.1.0 tslib@2.2.0

FROM node:14.13-alpine AS PRODUCTION_IMAGE

ENV PORT 8080

WORKDIR /app

COPY --from=PRODUCTION_BUILD /src/ .

EXPOSE 8080

CMD  [ "npm", "run", "start-production" ]