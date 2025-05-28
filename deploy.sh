#!/bin/bash

echo "🚀 Развёртывание системы загрузки файлов на сервере..."
echo

# Проверяем наличие Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker не установлен. Устанавливаем..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    sudo usermod -aG docker $USER
    echo "✅ Docker установлен"
fi

# Проверяем наличие Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose не установлен. Устанавливаем..."
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "✅ Docker Compose установлен"
fi

# Создаём папку для загрузок
mkdir -p uploads
chmod 755 uploads

# Останавливаем старые контейнеры если есть
echo "🛑 Остановка старых контейнеров..."
docker-compose down

# Собираем и запускаем новые контейнеры
echo "📦 Сборка и запуск контейнеров..."
docker-compose up --build -d

# Проверяем статус
echo "📋 Проверка статуса..."
docker-compose ps

echo
echo "✅ Развёртывание завершено!"
echo
echo "🌐 Приложение доступно по адресу: http://$(hostname -I | awk '{print $1}')"
echo "🔧 Backend API: http://$(hostname -I | awk '{print $1}'):5000"
echo
echo "📋 Полезные команды:"
echo "  Логи: docker-compose logs -f"
echo "  Остановка: docker-compose down"
echo "  Перезапуск: docker-compose restart"
echo 