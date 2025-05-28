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