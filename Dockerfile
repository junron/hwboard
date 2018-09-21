FROM node:10-alpine

RUN apk update
RUN apk upgrade
RUN apk add bash
RUN apk add git
RUN apk add nano
RUN apk add curl

RUN mkdir -p /hwboard2
WORKDIR /hwboard2
COPY . .

RUN npm ci --production

RUN npm install --global pm2
