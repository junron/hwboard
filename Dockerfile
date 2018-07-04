FROM node:10-alpine

RUN apk update
RUN apk upgrade
RUN apk add bash

RUN mkdir -p /hwboard2
WORKDIR /hwboard2
COPY . .

# Remove useless devDependencies
RUN npm install
RUN npm uninstall puppeteer

EXPOSE 3001