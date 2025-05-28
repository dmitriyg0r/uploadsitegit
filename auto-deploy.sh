#!/bin/bash

# Автоматический деплой для uploadsite
echo "🚀 АВТОМАТИЧЕСКИЙ ДЕПЛОЙ"
echo "========================"

# Логирование
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a /opt/uploadsite/deploy.log
}

# Переходим в директорию проекта
cd /opt/uploadsite

log "📥 Подтягивание изменений из Git..."
git pull origin main

if [ $? -ne 0 ]; then
    log "❌ Ошибка при получении изменений из Git"
    exit 1
fi

log "🛑 Остановка контейнеров..."
docker-compose down

log "🔨 Пересборка и запуск..."
docker-compose up --build -d

if [ $? -eq 0 ]; then
    log "✅ Контейнеры успешно запущены"
else
    log "❌ Ошибка при запуске контейнеров"
    exit 1
fi

log "🧹 Очистка..."
docker system prune -f

log "✅ Автоматический деплой завершен!"

# Проверяем сайт
sleep 5
if curl -f -s https://space-point.ru > /dev/null; then
    log "🎉 Сайт работает: https://space-point.ru"
else
    log "⚠️ Проблема с доступностью сайта"
fi 