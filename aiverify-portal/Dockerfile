FROM node:23-alpine AS base
RUN apk update && apk upgrade
ARG TARGETARCH

ARG APIGW_HOST=http://host.docker.internal:4000

WORKDIR /app

# copy files
COPY aiverify-portal/ ./aiverify-portal/
COPY aiverify-shared-library/ ./aiverify-shared-library/
COPY common/ ./common/

# install aiverify-shared-library
WORKDIR /app/aiverify-shared-library
RUN npm install
RUN npm run build

# install dependencies
# RUN npm run build

# ENV NODE_ENV=production
ENV APIGW_HOST=$APIGW_HOST
EXPOSE 3000

# development build
FROM base AS development

WORKDIR /app/aiverify-portal

RUN npm install
RUN npm link ../aiverify-shared-library

# ENTRYPOINT ["npm", "run", "start"]
ENTRYPOINT ["npm", "run", "dev"]

# production build
FROM base AS production

WORKDIR /app/aiverify-portal

RUN npm install
RUN npm link ../aiverify-shared-library
RUN npm run build

ENTRYPOINT ["npm", "start"]
