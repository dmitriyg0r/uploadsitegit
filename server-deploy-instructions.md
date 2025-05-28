# 🚀 Инструкция развертывания на сервере

## 1. Подключитесь к серверу
```bash
ssh root@45.91.238.3
# Пароль: sGLTccA_Na#9zC
```

## 2. Установите необходимые компоненты

### Установка Docker и Docker Compose
```bash
# Обновляем систему
apt update && apt upgrade -y

# Устанавливаем Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Устанавливаем Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Проверяем установку
docker --version
docker-compose --version
```

## 3. Создайте структуру проекта
```bash
# Создаем папку проекта
mkdir -p /opt/uploadsite
cd /opt/uploadsite

# Создаем структуру папок
mkdir -p src/components server public
```

## 4. Создайте файлы проекта

### package.json (корневой)
```bash
cat > package.json << 'EOF'
{
  "name": "uploadsite",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "react-router-dom": "^6.26.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "@eslint/js": "^9.25.0",
    "@types/react": "^19.1.2",
    "@types/react-dom": "^19.1.2",
    "@vitejs/plugin-react": "^4.4.1",
    "eslint": "^9.25.0",
    "eslint-plugin-react-hooks": "^5.2.0",
    "eslint-plugin-react-refresh": "^0.4.19",
    "globals": "^16.0.0",
    "vite": "^6.3.5"
  }
}
EOF
```

### server/package.json
```bash
cat > server/package.json << 'EOF'
{
  "name": "uploadsite-backend",
  "version": "1.0.0",
  "description": "Backend сервер для загрузки файлов",
  "main": "server.js",
  "type": "module",
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "multer": "^2.0.0-rc.4",
    "cors": "^2.8.5",
    "path": "^0.12.7",
    "fs": "^0.0.1-security"
  }
}
EOF
```

### docker-compose.yml
```bash
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  # Backend сервер
  backend:
    build: ./server
    container_name: uploadsite-backend
    ports:
      - "5000:5000"
    volumes:
      - ./uploads:/app/uploads
    environment:
      - NODE_ENV=production
      - PORT=5000
    restart: unless-stopped
    networks:
      - uploadsite-network

  # Frontend с nginx
  frontend:
    build: .
    container_name: uploadsite-frontend
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - backend
    restart: unless-stopped
    networks:
      - uploadsite-network
    environment:
      - VIRTUAL_HOST=space-point.ru,www.space-point.ru

volumes:
  uploads:

networks:
  uploadsite-network:
    driver: bridge
EOF
```

### nginx.conf
```bash
cat > nginx.conf << 'EOF'
server {
    listen 80;
    server_name space-point.ru www.space-point.ru;

    # Фронтенд - главная страница просмотра файлов
    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }

    # Страница загрузки
    location /upload {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }

    # API проксирование к backend
    location /api/ {
        proxy_pass http://backend:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Увеличиваем лимиты для загрузки файлов
        client_max_body_size 100M;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }

    # Безопасность - скрываем версию nginx
    server_tokens off;
    
    # Gzip сжатие для лучшей производительности
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;
}
EOF
```

### Dockerfile (для frontend)
```bash
cat > Dockerfile << 'EOF'
# Этап сборки
FROM node:18-alpine as build

WORKDIR /app

# Устанавливаем зависимости
COPY package*.json ./
RUN npm install

# Копируем исходный код и собираем
COPY . .
RUN npm run build

# Этап продакшена с nginx
FROM nginx:alpine

# Копируем собранное приложение
COPY --from=build /app/dist /usr/share/nginx/html

# Копируем конфигурацию nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Открываем порт
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
EOF
```

### server/Dockerfile
```bash
cat > server/Dockerfile << 'EOF'
FROM node:18-alpine

WORKDIR /app

# Устанавливаем зависимости
COPY package*.json ./
RUN npm install

# Копируем исходный код
COPY . .

# Создаём папку для загрузок
RUN mkdir -p uploads

# Открываем порт
EXPOSE 5000

# Запускаем сервер
CMD ["npm", "start"]
EOF
```

## 5. Создайте остальные файлы

Следующие файлы нужно создать аналогично:
- src/App.jsx
- src/App.css  
- src/components/HomePage.jsx
- src/components/UploadPage.jsx
- src/main.jsx
- server/server.js
- vite.config.js
- public/vite.svg
- index.html

## 6. Запуск
```bash
# Создаем папку для загрузок
mkdir -p uploads

# Запускаем проект
docker-compose up --build -d

# Проверяем статус
docker-compose ps

# Проверяем логи
docker-compose logs -f
```

## 7. Проверка
- Сайт: http://45.91.238.3
- Загрузка: http://45.91.238.3/upload

## DNS настройка
Для работы домена space-point.ru настройте A-запись:
- space-point.ru → 45.91.238.3
- www.space-point.ru → 45.91.238.3 