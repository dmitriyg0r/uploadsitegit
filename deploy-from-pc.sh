#!/bin/bash

echo "🚀 ДЕПЛОЙ НА СЕРВЕР ИЗ ПК"
echo "========================="
echo

# Настройки сервера
SERVER_HOST="45.91.238.3"
SERVER_USER="root"
PROJECT_PATH="/opt/uploadsite"

echo "📤 Отправка изменений на GitHub..."
git add .
read -p "💬 Введите сообщение коммита: " commit_message
git commit -m "$commit_message"
git push origin main

echo "🔄 Деплой на сервер..."
ssh $SERVER_USER@$SERVER_HOST << EOF
cd $PROJECT_PATH
echo "📥 Получение изменений..."
git pull origin main

echo "🛑 Остановка контейнеров..."
docker-compose down

echo "🔨 Сборка и запуск..."
docker-compose up --build -d

echo "🧹 Очистка..."
docker system prune -f

echo "📊 Статус:"
docker-compose ps

echo "✅ Деплой завершен!"
EOF

echo "🎉 Готово! Проверьте сайт: https://space-point.ru" 