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
RUN pip install --no-cache-dir --requirement requirements.txt
COPY backend/ ./
COPY --from=frontend-build /build/frontend/dist /app/frontend_dist

RUN addgroup --system plenalitik \
    && adduser --system --ingroup plenalitik plenalitik \
    && mkdir -p /app/backend/uploads \
    && chown -R plenalitik:plenalitik /app

USER plenalitik
EXPOSE 8000

CMD ["sh", "-c", "exec uvicorn server:app --host 0.0.0.0 --port ${PORT:-8000}"]
