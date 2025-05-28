# 📁 UploadSite

Веб-приложение для загрузки файлов с React frontend и Express.js backend.

## ✨ Возможности

- 📤 Загрузка файлов (.exe, .docx и других)
- 📱 Современный React интерфейс
- 🔧 Express.js backend
- 📁 Организованное хранение файлов

### Требования

- Node.js (версия 18 или выше)
- npm

### Установка и запуск

```bash
# Клонируйте репозиторий
git clone <your-repo-url>
cd uploadsite

# Установите зависимости для frontend
npm install

# Установите зависимости для backend
cd server
npm install
cd ..

# Запустите проект в режиме разработки
npm run dev:all
```

Приложение будет доступно по адресам:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:5000

## 🛠️ Разработка

### Структура проекта

```
uploadsite/
├── src/                  # React frontend
│   ├── components/       # React компоненты
│   ├── App.jsx          # Главный компонент
│   └── main.jsx         # Точка входа
├── server/              # Express backend
│   ├── server.js        # Основной сервер
│   └── package.json     # Зависимости backend
├── uploads/             # Загруженные файлы
├── public/              # Статические файлы
├── package.json         # Зависимости frontend
└── vite.config.js       # Конфигурация Vite
```

### Команды разработки

```bash
# Запуск только frontend (в режиме разработки)
npm run dev

# Запуск только backend (в режиме разработки)
cd server && npm run dev

# Сборка frontend для продакшена
npm run build

# Предварительный просмотр собранного frontend
npm run preview

# Линтинг кода
npm run lint
```

## 🌐 Продакшен

### Сборка и запуск

```bash
# Соберите frontend
npm run build

# Запустите backend в продакшен режиме
cd server
npm start
```

### Настройка веб-сервера

Для продакшена рекомендуется использовать nginx или Apache для раздачи статических файлов и проксирования API запросов к backend серверу.

Пример конфигурации nginx:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # Статические файлы frontend
    location / {
        root /path/to/uploadsite/dist;
        try_files $uri $uri/ /index.html;
    }
    
    # API запросы к backend
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 🔧 API Endpoints

- `POST /upload` - Загрузка файла
- `GET /files` - Список загруженных файлов
- `GET /health` - Проверка состояния сервера

## 📝 Логи

Логи backend сервера выводятся в консоль. В продакшене рекомендуется настроить логирование в файлы.

## 🐛 Отладка

### Проблемы с запуском

1. Убедитесь, что установлен Node.js версии 18+
2. Проверьте, что порты 5000 и 5173 свободны
3. Убедитесь, что все зависимости установлены (`npm install`)

### Проблемы с загрузкой файлов

1. Проверьте права доступа к директории `uploads/`
2. Убедитесь, что backend сервер запущен и доступен

## 📄 Лицензия

MIT License
