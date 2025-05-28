# Этап установки зависимостей (кэшируемый слой)
FROM node:18-alpine as deps

WORKDIR /app

# Устанавливаем зависимости для кэширования
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Основной этап с минимальным размером
FROM node:18-alpine

# Создаем пользователя без дополнительных пакетов
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Копируем зависимости из кэшированного слоя
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./

# Копируем исходный код
COPY --chown=nodejs:nodejs . .

# Создаём папку для загрузок
RUN mkdir -p uploads && chown -R nodejs:nodejs uploads

# Переключаемся на непривилегированного пользователя
USER nodejs

# Открываем порт
EXPOSE 5000

# Запускаем сервер
CMD ["node", "server.js"] 