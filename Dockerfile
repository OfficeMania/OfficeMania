FROM node:14.13-alpine

ENV PORT 8080

WORKDIR /app

COPY package*.json ./

RUN npm ci --production=true

RUN npm install concurrently

COPY . .

EXPOSE 8080

CMD  [ "npm", "start"]