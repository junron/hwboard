FROM node:alpine

RUN adduser hwboard
USER hwboard

RUN apk update && apk upgrade && apk add bash git nano curl --no-cache

RUN mkdir -p /hwboard2
WORKDIR /hwboard2
COPY . .

RUN npm install && npm install --global pm2 && rm -r /hwboard2/node_modules/puppeteer
