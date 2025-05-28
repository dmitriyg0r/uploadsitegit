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

# Очистка nginx для быстрого запуска
RUN rm -rf /usr/share/nginx/html/*

# Копируем собранное приложение
COPY --from=build /app/dist /usr/share/nginx/html

# Копируем оптимизированную конфигурацию nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Устанавливаем правильные права доступа
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# Открываем порт
EXPOSE 80

# Оптимизированный запуск nginx
CMD ["nginx", "-g", "daemon off;"]
