# 🚀 Система автоматического развертывания

Этот проект настроен для автоматического развертывания при коммитах в GitHub с помощью webhook'ов.

## 🎯 Что делает система

При каждом коммите в ветку `main` автоматически:
1. Выполняется `git pull origin main`
2. Перезапускается PM2 процесс `spacehub`
3. Запускается `npm run start`
4. Все действия логируются

## 📋 Настройка GitHub Webhook

### 1. В настройках GitHub репозитория:

1. Перейдите в **Settings** → **Webhooks**
2. Нажмите **Add webhook**
3. Заполните поля:
   - **Payload URL**: `https://ваш-домен.com/webhook/github`
   - **Content type**: `application/json`
   - **Which events**: выберите "Just the push event"
   - **Active**: ✅ включено

### 2. Безопасность (опционально)

Для дополнительной безопасности можете добавить секретный ключ:

1. В настройках webhook'а GitHub добавьте **Secret**
2. В файле `server.js` раскомментируйте и настройте проверку подписи:

```javascript
const secret = process.env.GITHUB_WEBHOOK_SECRET;
if (secret && signature) {
  const expectedSignature = 'sha256=' + crypto.createHmac('sha256', secret).update(payload).digest('hex');
  if (signature !== expectedSignature) {
    return res.status(401).json({ error: 'Неверная подпись webhook' });
  }
}
```

## 🖥️ Команды для запуска

```bash
# Запуск в режиме разработки (фронтенд + бэкенд)
npm run dev:all

# Запуск только бэкенда
npm run dev:backend

# Запуск только фронтенда
npm run dev

# Продакшн сборка и запуск
npm run start

# Только сервер
npm run server
```

## 🛠️ Административная панель

Доступ к логам развертывания: `https://ваш-домен.com/deploy-logs`

**Пароль по умолчанию**: `admin123`

⚠️ **Обязательно измените пароль** в файле `src/components/DeployLogsPage.jsx`:

```javascript
const adminPassword = 'ваш-новый-пароль';
```

## 📊 Возможности админ-панели

- 📋 Просмотр логов развертывания в реальном времени
- 🚀 Ручной запуск развертывания
- 🔄 Автообновление логов каждые 3 секунды
- 📁 Просмотр истории развертываний

## 🗂️ Структура проекта

```
uploadsite/
├── server.js                 # Основной сервер
├── package.json              # Единые зависимости
├── src/                      # React фронтенд
│   ├── components/
│   │   ├── HomePage.jsx
│   │   ├── UploadPage.jsx
│   │   └── DeployLogsPage.jsx # Админ-панель
│   └── App.jsx
├── uploads/                  # Загруженные файлы
├── deploy-logs/             # Логи развертывания
├── dist/                    # Собранный фронтенд
└── public/                  # Статические файлы
```

## 🔧 Настройка PM2

Для корректной работы убедитесь что PM2 процесс настроен:

```bash
# Создание процесса (если не существует)
pm2 start server.js --name spacehub

# Или добавление в автозапуск
pm2 startup
pm2 save
```

## 🐛 Отладка

### Проверка webhook'ов:
```bash
# Просмотр логов сервера
pm2 logs spacehub

# Или если запущен напрямую
tail -f deploy-logs/deploy-*.log
```

### Тестирование webhook'а вручную:
```bash
curl -X POST https://ваш-домен.com/webhook/github \
  -H "Content-Type: application/json" \
  -d '{"ref":"refs/heads/main","head_commit":{"message":"test deploy"}}'
```

## 🔒 Рекомендации по безопасности

1. **Измените пароль администратора**
2. **Настройте HTTPS** для webhook'ов
3. **Добавьте секретный ключ** для GitHub webhook'а
4. **Ограничьте доступ** к админ-панели по IP (в nginx/apache)
5. **Регулярно обновляйте** зависимости

## 📞 Поддержка

При проблемах проверьте:
- Логи PM2: `pm2 logs spacehub`
- Логи развертывания: `tail -f deploy-logs/deploy-*.log`
- Доступность webhook endpoint'а: `curl https://ваш-домен.com/health`

---

**Система готова к работе!** 🎉

После настройки webhook'а каждый коммит будет автоматически развертывать проект. 