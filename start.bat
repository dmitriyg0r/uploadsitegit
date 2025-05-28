@echo off
echo 🚀 Запуск системы загрузки файлов...
echo.

echo 📦 Сборка и запуск контейнеров...
docker-compose up --build -d

echo.
echo ✅ Приложение запущено!
echo.
echo 🌐 Фронтенд: http://localhost
echo 🔧 Backend API: http://localhost:5000
echo.
echo 📋 Для просмотра логов: docker-compose logs -f
echo 🛑 Для остановки: docker-compose down
echo.
pause 