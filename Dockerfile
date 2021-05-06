FROM node:14.13

ENV PORT 8080

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

EXPOSE 8080

CMD  [ "npm", "start"]