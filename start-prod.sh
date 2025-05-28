#!/bin/bash

echo "🚀 Запуск UploadSite в продакшен режиме..."

# Проверяем наличие Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не установлен. Пожалуйста, установите Node.js версии 18 или выше."
    exit 1
fi

echo "✅ Node.js $(node -v) найден"

# Устанавливаем зависимости
echo "📦 Устанавливаем зависимости..."
npm install
cd server && npm install && cd ..

# Создаем директорию для загрузок
mkdir -p uploads

# Собираем frontend
echo "🔨 Собираем frontend..."
npm run build

# Запускаем backend
echo "🔧 Запускаем backend сервер..."
cd server
NODE_ENV=production npm start &
BACKEND_PID=$!
cd ..

echo "✅ Проект запущен в продакшен режиме!"
echo "🔧 Backend: http://localhost:5000"
echo "📁 Статические файлы собраны в dist/"
echo ""
echo "Для остановки нажмите Ctrl+C"

# Ждем сигнала для остановки
trap "echo '🛑 Останавливаем сервер...'; kill $BACKEND_PID; exit" INT TERM

# Ждем завершения процесса
wait 