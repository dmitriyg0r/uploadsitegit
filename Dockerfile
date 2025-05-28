# Этап установки зависимостей (кэшируемый слой)
FROM node:18-alpine as deps

WORKDIR /app

# Устанавливаем зависимости для кэширования
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Этап сборки
FROM node:18-alpine as build

WORKDIR /app

# Копируем зависимости из предыдущего этапа
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./

# Устанавливаем только dev зависимости для сборки
RUN npm ci

# Копируем исходный код
COPY . .

# Собираем проект
RUN npm run build && npm prune --production

# Этап продакшена с оптимизированным nginx
FROM nginx:1.25-alpine

# Оптимизация nginx для быстрого запуска
RUN apk --no-cache add curl && \
    rm -rf /var/cache/apk/* && \
    rm -rf /usr/share/nginx/html/*

# Копируем собранное приложение
COPY --from=build /app/dist /usr/share/nginx/html

# Копируем оптимизированную конфигурацию nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Устанавливаем правильные права доступа
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# Добавляем healthcheck для быстрой проверки готовности
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:80/ || exit 1

# Открываем порт
EXPOSE 80

# Оптимизированный запуск nginx
CMD ["nginx", "-g", "daemon off;"]
