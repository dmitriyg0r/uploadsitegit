#!/bin/bash

echo "🐳 УПРАВЛЕНИЕ DOCKER КОНТЕЙНЕРАМИ"
echo "=================================="
echo

show_help() {
    echo "Доступные команды:"
    echo "  start     - Запустить контейнеры"
    echo "  stop      - Остановить контейнеры"
    echo "  restart   - Перезапустить контейнеры"
    echo "  rebuild   - Пересобрать и запустить"
    echo "  logs      - Показать логи"
    echo "  status    - Показать статус"
    echo "  clean     - Очистить неиспользуемые образы"
    echo "  backup    - Создать бэкап загрузок"
    echo "  update    - Обновить и пересобрать"
    echo "  monitor   - Запустить мониторинг"
    echo
}

case "$1" in
    "start")
        echo "🚀 Запуск контейнеров..."
        docker-compose up -d
        ;;
    "stop")
        echo "🛑 Остановка контейнеров..."
        docker-compose down
        ;;
    "restart")
        echo "🔄 Перезапуск контейнеров..."
        docker-compose restart
        ;;
    "rebuild")
        echo "🔨 Пересборка и запуск..."
        docker-compose down
        docker-compose up --build -d
        ;;
    "logs")
        if [ -n "$2" ]; then
            echo "📝 Логи сервиса $2:"
            docker-compose logs -f "$2"
        else
            echo "📝 Логи всех сервисов:"
            docker-compose logs -f
        fi
        ;;
    "status")
        echo "📊 Статус контейнеров:"
        docker-compose ps
        echo
        echo "💻 Использование ресурсов:"
        docker stats --no-stream
        ;;
    "clean")
        echo "🧹 Очистка неиспользуемых образов..."
        docker system prune -f
        docker image prune -f
        ;;
    "backup")
        echo "💾 Создание бэкапа загрузок..."
        BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
        mkdir -p "$BACKUP_DIR"
        cp -r uploads "$BACKUP_DIR/"
        echo "Бэкап создан в: $BACKUP_DIR"
        ;;
    "update")
        echo "⬆️ Обновление проекта..."
        git pull
        docker-compose down
        docker-compose up --build -d
        ;;
    "monitor")
        echo "📊 Запуск мониторинга..."
        ./monitor.sh
        ;;
    *)
        show_help
        ;;
esac 