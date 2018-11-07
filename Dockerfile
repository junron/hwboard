FROM node:alpine

RUN apk update && apk upgrade && apk add bash git nano curl --no-cache
RUN adduser -S hwboard

USER hwboard
RUN mkdir -p /home/hwboard/hwboard2
WORKDIR /home/hwboard/hwboard2
COPY --chown=hwboard:root . .
ENV IS_DOCKER=true
RUN npm install && rm -r /home/hwboard/hwboard2/node_modules/puppeteer

USER root
RUN ln -s /home/hwboard/hwboard2/node_modules/pm2/bin/pm2 /usr/local/bin/pm2
USER hwboard