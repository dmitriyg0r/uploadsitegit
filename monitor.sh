#!/bin/bash

echo "🐳 МОНИТОРИНГ DOCKER КОНТЕЙНЕРОВ"
echo "================================="
echo

# Функция для цветного вывода
print_status() {
    if [ "$2" = "Up" ]; then
        echo -e "✅ $1: \033[32m$2\033[0m"
    else
        echo -e "❌ $1: \033[31m$2\033[0m"
    fi
}

# Проверка статуса контейнеров
echo "📋 СТАТУС КОНТЕЙНЕРОВ:"
echo "---------------------"
docker-compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
echo

# Использование ресурсов
echo "💻 ИСПОЛЬЗОВАНИЕ РЕСУРСОВ:"
echo "--------------------------"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
echo

# Проверка доступности сайта
echo "🌐 ПРОВЕРКА ДОСТУПНОСТИ:"
echo "------------------------"
if curl -s -o /dev/null -w "%{http_code}" https://space-point.ru | grep -q "200"; then
    echo "✅ HTTPS сайт: Доступен"
else
    echo "❌ HTTPS сайт: Недоступен"
fi

if curl -s -o /dev/null -w "%{http_code}" https://space-point.ru/api/ | grep -q "404"; then
    echo "✅ API: Доступен (404 - нормально для /api/)"
else
    echo "❌ API: Недоступен"
fi
echo

# Размер логов
echo "📝 РАЗМЕР ЛОГОВ:"
echo "----------------"
echo "Frontend логи: $(docker logs uploadsite-frontend 2>&1 | wc -l) строк"
echo "Backend логи: $(docker logs uploadsite-backend 2>&1 | wc -l) строк"
echo

# Последние ошибки
echo "⚠️  ПОСЛЕДНИЕ ОШИБКИ:"
echo "--------------------"
echo "Frontend:"
docker logs uploadsite-frontend 2>&1 | grep -i error | tail -3 || echo "Нет ошибок"
echo
echo "Backend:"
docker logs uploadsite-backend 2>&1 | grep -i error | tail -3 || echo "Нет ошибок"
echo

echo "🕐 Обновлено: $(date)" 