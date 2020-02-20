FROM node:12.16.0

RUN apk add \
        --no-cache \
        grpc \
        python
