FROM node:12.16.0

RUN apt-get update && apt-get -y install \
        build-essential \
        grpc \
        python
