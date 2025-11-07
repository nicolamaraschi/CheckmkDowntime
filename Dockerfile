# ==========================================
# STAGE 1: Build Backend
# ==========================================
FROM python:3.9-slim AS backend-builder

WORKDIR /backend
COPY backend/requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt
COPY backend/app ./app

# ==========================================
# STAGE 2: Build Frontend
# ==========================================
FROM node:18-alpine AS frontend-builder

WORKDIR /frontend
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY public ./public
COPY src ./src
RUN npm run build

# ==========================================
# STAGE 3: Runtime Finale
# ==========================================
FROM nginx:alpine

# Installa Python e dipendenze
RUN apk add --no-cache python3 py3-pip supervisor curl

# Crea directory
RUN mkdir -p /backend /var/log/supervisor /app/logs /etc/supervisor/conf.d

# Copia backend
COPY --from=backend-builder /backend /backend
COPY --from=backend-builder /usr/local/lib/python3.9/site-packages /usr/local/lib/python3.9/site-packages

# Installa dipendenze Python runtime
RUN pip3 install --no-cache-dir --break-system-packages \
    uvicorn fastapi python-jose httpx requests python-multipart python-dotenv pydantic

# Copia frontend
COPY --from=frontend-builder /frontend/build /usr/share/nginx/html

# Configurazione Nginx con TIMEOUT ALTI
RUN cat > /etc/nginx/conf.d/default.conf << 'EOF'
server {
    listen 80;
    server_name _;
    
    # Buffer grandi
    proxy_buffer_size 128k;
    proxy_buffers 4 256k;
    proxy_busy_buffers_size 256k;
    
    # TIMEOUT ALTISSIMI (10 minuti = 600s)
    proxy_connect_timeout 600s;
    proxy_send_timeout 600s;
    proxy_read_timeout 600s;
    send_timeout 600s;
    
    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://127.0.0.1:8000/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
        proxy_cache_bypass $http_upgrade;
        
        # TIMEOUT ALTISSIMI per API lente
        proxy_connect_timeout 600s;
        proxy_send_timeout 600s;
        proxy_read_timeout 600s;
    }
}
EOF

# Configurazione Supervisor
RUN cat > /etc/supervisor/conf.d/supervisord.conf << 'EOF'
[supervisord]
nodaemon=true
logfile=/var/log/supervisor/supervisord.log
pidfile=/var/run/supervisord.pid
loglevel=info

[program:nginx]
command=/usr/sbin/nginx -g "daemon off;"
autostart=true
autorestart=true
priority=10
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0

[program:backend]
command=/usr/bin/python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --log-level info --timeout-keep-alive 0
directory=/backend
autostart=true
autorestart=true
priority=20
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0
environment=PYTHONUNBUFFERED=1
EOF

# Script entrypoint
RUN cat > /entrypoint.sh << 'EOF'
#!/bin/sh
set -e

echo "=========================================="
echo "  CHECKMK DOWNTIME APP STARTING"
echo "=========================================="

if [ -z "$CHECKMK_PASSWORD" ]; then
    echo "❌ ERRORE: CHECKMK_PASSWORD non impostata!"
    exit 1
fi

echo "✓ Configurazione:"
echo "  - CHECKMK_HOST: $CHECKMK_HOST"
echo "  - CHECKMK_SITE: $CHECKMK_SITE"
echo "  - CHECKMK_USER: $CHECKMK_USER"
echo "  - Backend: http://localhost:8000"
echo "  - Frontend: http://localhost:80"
echo "=========================================="

exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
EOF

RUN chmod +x /entrypoint.sh

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost/api/connection-test || exit 1

EXPOSE 80
ENTRYPOINT ["/entrypoint.sh"]