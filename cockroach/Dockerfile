FROM alpine
RUN wget -qO- https://binaries.cockroachdb.com/cockroach-latest.linux-musl-amd64.tgz | tar  xvz

ENV COCKROACH_CHANNEL=official-docker
RUN cp cockroach-latest.linux-musl-amd64/cockroach /usr/local/bin/cockroach

RUN apk add bash

EXPOSE 26257 8080