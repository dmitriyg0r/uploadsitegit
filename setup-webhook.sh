#!/bin/bash

echo "🔧 НАСТРОЙКА АВТОМАТИЧЕСКОГО ДЕПЛОЯ"
echo "===================================="
echo

# Устанавливаем зависимости для webhook
echo "📦 Установка зависимостей..."
cp webhook-package.json package-webhook.json
npm install --prefix /opt/uploadsite/webhook express

# Создаем директорию для webhook
mkdir -p /opt/uploadsite/webhook
cp webhook-server.js /opt/uploadsite/webhook/
cp webhook-package.json /opt/uploadsite/webhook/package.json

# Устанавливаем зависимости в директории webhook
cd /opt/uploadsite/webhook
npm install

# Создаем systemd сервис
echo "⚙️ Создание systemd сервиса..."
cat > /etc/systemd/system/uploadsite-webhook.service << EOF
[Unit]
Description=Uploadsite Webhook Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/uploadsite/webhook
ExecStart=/usr/bin/node webhook-server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

# Перезагружаем systemd и запускаем сервис
systemctl daemon-reload
systemctl enable uploadsite-webhook
systemctl start uploadsite-webhook

# Создаем nginx конфигурацию для webhook
echo "🌐 Настройка nginx для webhook..."
cat > /etc/nginx/sites-available/webhook.space-point.ru << EOF
server {
    listen 80;
    server_name webhook.space-point.ru;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Активируем сайт
ln -sf /etc/nginx/sites-available/webhook.space-point.ru /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

echo
echo "✅ Webhook сервер настроен!"
echo
echo "🌐 Доступные endpoints:"
echo "   Webhook: http://webhook.space-point.ru/webhook"
echo "   Статус:  http://webhook.space-point.ru/status"
echo "   Деплой:  http://webhook.space-point.ru/deploy"
echo
echo "📋 Настройка GitHub:"
echo "   1. Идите в Settings > Webhooks вашего репозитория"
echo "   2. Добавьте webhook URL: http://webhook.space-point.ru/webhook"
echo "   3. Content type: application/json"
echo "   4. Выберите 'Just the push event'"
echo "   5. Secret: your-webhook-secret-key (опционально)"
echo
echo "🔍 Проверка статуса:"
echo "   systemctl status uploadsite-webhook"
echo "   tail -f /opt/uploadsite/deploy.log" 