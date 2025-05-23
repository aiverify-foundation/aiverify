FROM node:23-alpine AS build

# to move this to production stage when PR #566 is merged
ARG APIGW_HOST=http://host.docker.internal:4000
ENV APIGW_HOST=$APIGW_HOST
ARG NEXT_PUBLIC_APIGW_HOST=http://127.0.0.1:4000

WORKDIR /app

# copy files
COPY aiverify-portal/ ./aiverify-portal/
COPY aiverify-shared-library/ ./aiverify-shared-library/
COPY common/ ./common/


# build aiverify-shared-library
WORKDIR /app/aiverify-shared-library
RUN npm install && npm run build

# build portal
WORKDIR /app/aiverify-portal
RUN npm install && npm link ../aiverify-shared-library && npm run build

# production
FROM node:23-alpine

ARG NEXT_PUBLIC_APIGW_HOST=http://127.0.0.1:4000

RUN apk update && apk upgrade

# copy files from build
WORKDIR /app
COPY --from=build /app/common ./common
COPY --from=build /app/aiverify-shared-library/dist ./aiverify-shared-library/dist
# COPY --from=build /app/aiverify-shared-library/node_modules ./aiverify-shared-library/node_modules
COPY --from=build /app/aiverify-shared-library/package.json ./aiverify-shared-library/package.json
COPY --from=build /app/aiverify-portal/.next ./aiverify-portal/.next
COPY --from=build /app/aiverify-portal/public ./aiverify-portal/public
COPY --from=build /app/aiverify-portal/node_modules ./aiverify-portal/node_modules
COPY --from=build /app/aiverify-portal/package.json ./aiverify-portal/package.json

# Change ownership of the application and directory
RUN chown -R node:node /app

# Switch to the non-root user
USER node

WORKDIR /app/aiverify-portal

ENV NEXT_PUBLIC_APIGW_HOST=$NEXT_PUBLIC_APIGW_HOST
EXPOSE 3000

ENTRYPOINT ["npm", "start"]
