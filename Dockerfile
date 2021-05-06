FROM node:14.13-alpine

ENV PORT 8080

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --only=production && npm install ts-node

COPY . .

EXPOSE 8080

CMD  [ "npm", "run", "start-production" ]