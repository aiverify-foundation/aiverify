ARG DEVCONTAINER_VERSION=bullseye
FROM mcr.microsoft.com/devcontainers/base:${DEVCONTAINER_VERSION}

ENV REDIS_URI=redis://redis:6379
ENV REDIS_SERVER_HOSTNAME="redis"
ENV REDIS_HOST=redis

ENV DB_USERNAME="aiverify"
ENV DB_PASSWORD="aiverify"
ENV DB_HOST=db
ENV DB_PORT=27017

ENV PORTAL_URL=http://localhost
ENV WS_URL=ws://localhost
ENV APIGW_URL=http://localhost:4000

ENV PYTHONPATH="/app/aiverify/test-engine-core:/app/aiverify/test-engine-app"

COPY scripts/ /docker-entrypoint/
RUN chmod -R +x /docker-entrypoint/

WORKDIR /app/aiverify/

CMD [ "sleep", "infinity" ]
