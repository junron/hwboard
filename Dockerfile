FROM node:10

RUN apt-get update
RUN apt-get upgrade -y

RUN mkdir -p /hwboard2
WORKDIR /hwboard2
COPY . .

RUN npm install

EXPOSE 3001
