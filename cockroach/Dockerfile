FROM alpine:3.8
RUN wget -qO- https://binaries.cockroachdb.com/cockroach-latest.linux-musl-amd64.tgz | tar  xvz && cp cockroach-latest.linux-musl-amd64/cockroach /usr/local/bin/cockroach

RUN apk add bash --no-cache
RUN adduser -S hwboard
USER hwboard

COPY --chown=hwboard:root cockroach cockroach

CMD "./cockroach/run.sh"