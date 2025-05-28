#!/bin/bash

echo "🚀 Быстрая оптимизированная пересборка контейнеров..."

# Установка BuildKit для ускорения сборки
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# Функция для логирования времени
log_time() {
    echo "⏰ $(date '+%H:%M:%S') - $1"
}

log_time "Запуск процесса..."

# Остановка контейнеров
log_time "Остановка контейнеров..."
docker-compose down --remove-orphans

# Очистка старых образов для освобождения места
log_time "Очистка старых образов..."
docker image prune -f --filter "until=24h"

# Параллельная сборка с кэшированием
log_time "Сборка образов с кэшированием..."
docker-compose build --parallel --build-arg BUILDKIT_INLINE_CACHE=1

# Быстрый запуск с оптимизированными настройками
log_time "Запуск контейнеров..."
docker-compose up -d

# Ожидание готовности сервисов
log_time "Ожидание готовности сервисов..."
echo "Проверяем backend..."
timeout 60 bash -c 'until wget --spider --quiet http://localhost:5001/health 2>/dev/null; do sleep 2; done'
echo "✅ Backend готов!"

echo "Проверяем frontend..."
timeout 60 bash -c 'until wget --spider --quiet http://localhost:8081/nginx-health 2>/dev/null; do sleep 2; done'
echo "✅ Frontend готов!"

# Показываем статус
log_time "Проверка статуса..."
docker-compose ps

# Показываем использование ресурсов
echo -e "\n📊 Использование ресурсов:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"

# Проверяем доступность сайта
echo -e "\n🌐 Проверка доступности:"
if wget --spider --quiet http://localhost:8081 2>/dev/null; then
    echo "✅ Сайт доступен на http://localhost:8081"
else
    echo "❌ Сайт недоступен"
fi

# Показываем логи последних ошибок если есть
echo -e "\n📋 Последние логи:"
docker-compose logs --tail=5

log_time "Готово! 🎉"

echo -e "\n🔗 Полезные ссылки:"
echo "   - Сайт: http://localhost:8081"
echo "   - Backend API: http://localhost:5001"
echo "   - Health check: http://localhost:5001/health"

echo -e "\n📝 Управление:"
echo "   - Логи: docker-compose logs -f"
echo "   - Остановка: docker-compose down"
echo "   - Перезапуск: docker-compose restart" 