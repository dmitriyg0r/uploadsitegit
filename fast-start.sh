#!/bin/bash

echo "⚡ Максимально быстрый запуск контейнеров..."

# Установка BuildKit для ускорения сборки
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

echo "🛑 Остановка старых контейнеров..."
docker-compose -f docker-compose.simple.yml down --remove-orphans

echo "🔨 Быстрая сборка..."
docker-compose -f docker-compose.simple.yml build --parallel

echo "🚀 Запуск контейнеров..."
docker-compose -f docker-compose.simple.yml up -d

echo "⏳ Ожидание 10 секунд для запуска..."
sleep 10

echo "📊 Статус контейнеров:"
docker-compose -f docker-compose.simple.yml ps

echo "✅ Готово! Контейнеры запущены."
echo ""
echo "🔗 Ссылки:"
echo "   - Сайт: http://localhost:8081"
echo "   - Backend: http://localhost:5001"
echo "   - Health: http://localhost:5001/health"
echo ""
echo "📝 Команды:"
echo "   - Логи: docker-compose -f docker-compose.simple.yml logs -f"
echo "   - Остановка: docker-compose -f docker-compose.simple.yml down" 