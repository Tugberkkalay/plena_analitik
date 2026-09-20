FROM node:22-alpine AS frontend-build

WORKDIR /build/frontend
COPY frontend/package.json frontend/yarn.lock ./
RUN corepack enable && yarn install --frozen-lockfile
COPY frontend/ ./
ENV VITE_BACKEND_URL=""
RUN yarn build


FROM python:3.13-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    FRONTEND_DIST=/app/frontend_dist

WORKDIR /app/backend
COPY backend/requirements.txt ./requirements.txt
RUN apt-get update \
    && apt-get install -y --no-install-recommends gosu \
    && rm -rf /var/lib/apt/lists/* \
    && pip install --no-cache-dir --requirement requirements.txt
COPY backend/ ./
COPY --from=frontend-build /build/frontend/dist /app/frontend_dist
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

RUN addgroup --system plenalitik \
    && adduser --system --ingroup plenalitik plenalitik \
    && mkdir -p /app/backend/uploads \
    && chown -R plenalitik:plenalitik /app \
    && chmod 0755 /usr/local/bin/docker-entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
