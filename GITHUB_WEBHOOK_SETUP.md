# 🚀 Настройка автоматического деплоя через GitHub Webhook

## ✅ Система готова!

Автоматический деплой настроен и работает! Теперь нужно подключить GitHub.

## 📋 Что уже настроено на сервере:

1. ✅ **Webhook endpoint**: `https://space-point.ru/webhook.php`
2. ✅ **Автоматический деплой**: `/opt/uploadsite/auto-deploy.sh`
3. ✅ **Логирование**: `/opt/uploadsite/deploy.log`
4. ✅ **Nginx конфигурация**: webhook работает через HTTPS
5. ✅ **PHP обработка**: webhook получает и обрабатывает запросы от GitHub

## 🔧 Настройка GitHub Webhook:

### 1. Откройте ваш репозиторий на GitHub
Перейдите по ссылке: https://github.com/dmitriyg0r/uploadsitegit

### 2. Зайдите в Settings > Webhooks
- Нажмите **Settings** (вкладка в репозитории)
- В боковом меню выберите **Webhooks**
- Нажмите **Add webhook**

### 3. Заполните настройки webhook:

**Payload URL:**
```
https://space-point.ru/webhook.php
```

**Content type:**
```
application/json
```

**Secret:** (опционально, для дополнительной безопасности)
```
747302deb38597662304256819c7c02dc04730bc424bff54afb38b2924c00d43
```

**Events:** 
- Выберите "Just the push event"
- Или выберите "Let me select individual events" и отметьте только "Pushes"

**Active:** ✅ (должно быть включено)

### 4. Нажмите "Add webhook"

## 🎯 Как это работает:

1. **Вы делаете коммит** на вашем компьютере
2. **Делаете push** в GitHub
3. **GitHub автоматически отправляет webhook** на `https://space-point.ru/webhook.php`
4. **Сервер получает уведомление** и запускает автоматический деплой
5. **Сайт обновляется** автоматически в течение 3-5 минут

## 📊 Мониторинг деплоя:

### Просмотр логов:
```bash
# Просмотр последних логов
tail -f /opt/uploadsite/deploy.log

# Просмотр последних 20 записей
tail -20 /opt/uploadsite/deploy.log
```

### Проверка статуса контейнеров:
```bash
cd /opt/uploadsite
docker-compose ps
```

### Ручной деплой (если нужно):
```bash
cd /opt/uploadsite
./auto-deploy.sh
```

## 🔍 Тестирование:

После настройки webhook в GitHub, сделайте тестовый коммит:

```bash
# На вашем компьютере
echo "test" > test.txt
git add test.txt
git commit -m "Тест автоматического деплоя"
git push origin main
```

Через 3-5 минут изменения должны появиться на сайте!

## 📞 Endpoints для управления:

- **Webhook**: `https://space-point.ru/webhook.php` (для GitHub)
- **Логи деплоя**: `/opt/uploadsite/deploy.log`
- **Сайт**: `https://space-point.ru`

## 🎉 Готово!

Теперь любой push в main ветку будет автоматически деплоиться на сервер! 