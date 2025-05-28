#!/bin/bash

echo "🚀 Запуск UploadSite..."

# Проверяем наличие Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не установлен. Пожалуйста, установите Node.js версии 18 или выше."
    exit 1
fi

# Проверяем версию Node.js
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Требуется Node.js версии 18 или выше. Текущая версия: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) найден"

# Устанавливаем зависимости если нужно
if [ ! -d "node_modules" ]; then
    echo "📦 Устанавливаем зависимости frontend..."
    npm install
fi

if [ ! -d "server/node_modules" ]; then
    echo "📦 Устанавливаем зависимости backend..."
    cd server && npm install && cd ..
fi

# Создаем директорию для загрузок
mkdir -p uploads

echo "🎯 Запускаем проект в режиме разработки..."
echo "📱 Frontend будет доступен на: http://localhost:5173"
echo "🔧 Backend будет доступен на: http://localhost:5000"
echo ""
echo "Для остановки нажмите Ctrl+C"

# Запускаем проект
npm run dev:all 