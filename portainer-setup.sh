#!/bin/bash

echo "🐳 УСТАНОВКА PORTAINER - ВЕБ-ИНТЕРФЕЙС ДЛЯ DOCKER"
echo "================================================="
echo

# Создаем том для данных Portainer
echo "📦 Создание тома для данных..."
docker volume create portainer_data

# Запускаем Portainer
echo "🚀 Запуск Portainer..."
docker run -d \
  -p 9000:9000 \
  -p 9443:9443 \
  --name portainer \
  --restart=always \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce:latest

echo
echo "✅ Portainer установлен!"
echo
echo "🌐 Доступ к веб-интерфейсу:"
echo "   HTTP:  http://45.91.238.3:9000"
echo "   HTTPS: https://45.91.238.3:9443"
echo
echo "📋 При первом входе:"
echo "   1. Создайте admin пользователя"
echo "   2. Выберите 'Docker' как environment"
echo "   3. Нажмите 'Connect'"
echo
echo "🔧 Возможности Portainer:"
echo "   • Мониторинг контейнеров в реальном времени"
echo "   • Просмотр логов"
echo "   • Управление образами"
echo "   • Статистика использования ресурсов"
echo "   • Управление сетями и томами"
echo "   • Терминал для подключения к контейнерам" 