FROM node:12.14.1

RUN apk add \
        --no-cache \
        grpc \
        python
