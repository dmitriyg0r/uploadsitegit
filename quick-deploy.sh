#!/bin/bash

echo "🚀 БЫСТРЫЙ ДЕПЛОЙ UPLOADSITE"
echo "============================="
echo

# Функция логирования
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Проверяем, что мы в правильной директории
if [ ! -f "docker-compose.yml" ]; then
    log "❌ Файл docker-compose.yml не найден. Убедитесь, что вы в директории проекта."
    exit 1
fi

log "📥 Получение последних изменений из Git..."
git pull origin main

if [ $? -ne 0 ]; then
    log "❌ Ошибка при получении изменений из Git"
    exit 1
fi

log "🛑 Остановка текущих контейнеров..."
docker-compose down

log "🔨 Сборка и запуск новых контейнеров..."
docker-compose up --build -d

if [ $? -eq 0 ]; then
    log "✅ Контейнеры успешно запущены"
else
    log "❌ Ошибка при запуске контейнеров"
    exit 1
fi

log "🧹 Очистка неиспользуемых образов..."
docker system prune -f

log "📊 Проверка статуса контейнеров..."
docker-compose ps

log "🌐 Проверка доступности сайта..."
sleep 5  # Даем время контейнерам запуститься

if curl -f -s https://space-point.ru > /dev/null; then
    log "✅ Сайт доступен: https://space-point.ru"
else
    log "⚠️ Сайт пока недоступен, возможно еще запускается..."
fi

log "🎉 Деплой завершен!"
echo
echo "📋 Полезные команды:"
echo "   Логи frontend: docker-compose logs -f frontend"
echo "   Логи backend:  docker-compose logs -f backend"
echo "   Статус:        docker-compose ps"
echo "   Мониторинг:    ./monitor.sh" 