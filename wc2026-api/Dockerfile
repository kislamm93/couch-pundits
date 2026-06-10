FROM python:3.11-slim
WORKDIR /app
# Build context is the project root (see docker-compose.yml)
COPY wc2026-api/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY wc2026-api/ .
