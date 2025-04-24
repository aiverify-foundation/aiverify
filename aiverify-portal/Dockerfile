FROM node:23-alpine as base
ARG TARGETARCH

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
ENV APIGW_HOST=http://host.docker.internal:4000
ENV NEXT_PUBLIC_APIGW_HOST=http://127.0.0.1:4000
EXPOSE 3000

# development build
FROM base as development

WORKDIR /app/aiverify-portal

RUN npm install
RUN npm link ../aiverify-shared-library

# ENTRYPOINT ["npm", "run", "start"]
ENTRYPOINT ["npm", "run", "dev"]

# production build
FROM base as production

WORKDIR /app/aiverify-portal

RUN npm install
RUN npm link ../aiverify-shared-library
RUN npm run build

ENTRYPOINT ["npm", "start"]
