FROM node:14.13-alpine AS DEV_BUILD

ENV NODE_ENV dev

WORKDIR /src

COPY package*.json ./

RUN npm ci

COPY . .

RUN TS_NODE_PROJECT="tsconfig-for-webpack-config.json" && ./node_modules/.bin/webpack

FROM node:14.13-alpine AS DEV_IMAGE

ENV NODE_ENV dev

ENV PORT 8080

WORKDIR /app

COPY --from=DEV_BUILD /src/ .

EXPOSE 8080

CMD  [ "npm", "run", "start-ts-node-dev" ]

FROM node:14.13-alpine AS PRODUCTION_BUILD

ENV NODE_ENV production

WORKDIR /src

COPY package*.json ./

RUN npm ci --production

COPY . .

RUN TS_NODE_PROJECT="tsconfig-for-webpack-config.json" && ./node_modules/.bin/webpack

RUN npm install --no-package-lock --no-save typescript@^4.1.3 ts-node@^8.1.0 tslib@2.2.0
# TODO move this into the package.json?

FROM node:14.13-alpine AS PRODUCTION_IMAGE

ENV NODE_ENV production

ENV PORT 8080

WORKDIR /app

COPY --from=PRODUCTION_BUILD /src/ .

EXPOSE 8080

CMD  [ "npm", "run", "start-production" ]