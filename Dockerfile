FROM node:14.13-alpine AS BUILD_IMAGE

ENV PORT 8080

WORKDIR /src

COPY package*.json ./

RUN npm ci

COPY . .

RUN TS_NODE_PROJECT="tsconfig-for-webpack-config.json" && ./node_modules/.bin/webpack

RUN npm prune --production

FROM node:14.13-alpine

ENV PORT 8080

WORKDIR /app

COPY --from=BUILD_IMAGE /src/ .

RUN ls -lah /app

RUN npm install --no-package-lock --no-save typescript@^4.1.3 ts-node@^8.1.0 tslib@2.2.0

EXPOSE 8080

CMD  [ "npm", "run", "start-production" ]