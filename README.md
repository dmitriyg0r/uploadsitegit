# 📚 Система загрузки файлов для студентов

Современное веб-приложение для загрузки программ (.exe) и документации (.docx) студентами. Включает React frontend, Node.js backend и полную контейнеризацию с Docker.

## ✨ Возможности

- 📝 Форма для ввода ФИО, группы и предмета
- 📤 Загрузка .exe и .docx файлов
- 📋 Просмотр всех загруженных работ
- 🗂️ Автоматическая организация файлов по студентам
- 🚀 Готовая Docker контейнеризация
- 📱 Адаптивный дизайн
- ✅ Валидация файлов

## 🚀 Быстрый запуск с Docker

### Предварительные требования
- Docker
- Docker Compose

### 1. Клонирование и запуск
```bash
# Клонируйте репозиторий
git clone <ваш-репозиторий>
cd uploadsite

# Запустите весь стек
docker-compose up -d

# Проверьте состояние контейнеров
docker-compose ps
```

### 2. Доступ к приложению
- **Фронтенд**: http://localhost
- **Backend API**: http://localhost:5000

### 3. Остановка
```bash
docker-compose down
```

## 🛠️ Разработка без Docker

### Backend
```bash
cd server
npm install
npm run dev
```

### Frontend
```bash
npm install
npm run dev
```

### Переменные окружения
Создайте файл `.env` в корне проекта:
```
# Backend
PORT=5000
NODE_ENV=development

# Frontend
VITE_API_URL=http://localhost:5000
```

## 📁 Структура проекта

```
uploadsite/
├── src/                    # React frontend
│   ├── App.jsx            # Основной компонент
│   ├── App.css            # Стили
│   └── main.jsx           # Точка входа
├── server/                # Node.js backend
│   ├── server.js          # Express сервер
│   ├── package.json       # Backend зависимости
│   ├── Dockerfile         # Docker образ backend
│   └── uploads/           # Папка для загруженных файлов
├── public/                # Статические файлы
├── docker-compose.yml     # Оркестрация контейнеров
├── Dockerfile            # Docker образ frontend
├── nginx.conf            # Конфигурация nginx
└── package.json          # Frontend зависимости
```

## 🐳 Развёртывание на сервере

### 1. Подготовка сервера
```bash
# Установите Docker и Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Установите Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Загрузка и запуск
```bash
# Скопируйте файлы на сервер
scp -r uploadsite/ user@your-server:/path/to/app/

# На сервере
cd /path/to/app/uploadsite
docker-compose up -d
```

### 3. Настройка домена (опционально)
Обновите `nginx.conf` и добавьте SSL:
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # ... остальная конфигурация
}
```

## 📋 API Документация

### POST /api/upload
Загрузка файлов
- **Body**: FormData с полями:
  - `fullName` (обязательно): ФИО студента
  - `group` (опционально): Группа
  - `subject` (опционально): Предмет
  - `exeFile` (обязательно): .exe файл
  - `docxFile` (обязательно): .docx файл

### GET /api/uploads
Получение списка всех загрузок

## 🔧 Конфигурация

### Лимиты загрузки
В `server/server.js`:
```javascript
limits: {
  fileSize: 100 * 1024 * 1024 // 100MB максимум
}
```

### Разрешённые типы файлов
```javascript
const allowedTypes = ['.exe', '.docx'];
```

## 🗂️ Организация файлов

Файлы сохраняются в структуре:
```
uploads/
├── Иванов Иван Иванович/
│   ├── program_2024-01-15T10-30-00-000Z.exe
│   ├── documentation_2024-01-15T10-30-00-000Z.docx
│   └── upload_info.json
└── Петров Пётр Петрович/
    ├── ...
```

## 🔒 Безопасность

- ✅ Валидация типов файлов
- ✅ Ограничение размера файлов
- ✅ Защита от path traversal
- ✅ CORS настройки
- ⚠️ **Добавьте аутентификацию для продакшена!**

## 🐛 Отладка

### Логи контейнеров
```bash
# Все логи
docker-compose logs

# Только backend
docker-compose logs backend

# Только frontend
docker-compose logs frontend

# В реальном времени
docker-compose logs -f
```

### Подключение к контейнерам
```bash
# Backend
docker exec -it uploadsite-backend sh

# Frontend
docker exec -it uploadsite-frontend sh
```

## 🤝 Участие в разработке

1. Форк проекта
2. Создайте ветку функциональности
3. Внесите изменения
4. Отправьте Pull Request

## 📄 Лицензия

MIT License

## 🆘 Поддержка

При возникновении проблем:
1. Проверьте логи: `docker-compose logs`
2. Убедитесь что все порты свободны
3. Проверьте права доступа к папке uploads
4. Создайте issue в репозитории
