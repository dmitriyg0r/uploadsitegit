const express = require('express');
const { exec } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');

const app = express();
const PORT = 3001;

// Секретный ключ для GitHub webhook
const WEBHOOK_SECRET = '747302deb38597662304256819c7c02dc04730bc424bff54afb38b2924c00d43';

app.use(express.json());

// Функция для проверки подписи GitHub
function verifySignature(payload, signature) {
    const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
    const digest = 'sha256=' + hmac.update(payload).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

// Функция для логирования
function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    console.log(logMessage);
    fs.appendFileSync('/opt/uploadsite/deploy.log', logMessage);
}

// Функция деплоя
function deployApp() {
    log('🚀 Начинаем автоматический деплой...');
    
    const commands = [
        'cd /opt/uploadsite',
        'git pull origin main',
        'docker-compose down',
        'docker-compose up --build -d',
        'docker system prune -f'
    ];
    
    const fullCommand = commands.join(' && ');
    
    exec(fullCommand, (error, stdout, stderr) => {
        if (error) {
            log(`❌ Ошибка деплоя: ${error.message}`);
            return;
        }
        
        if (stderr) {
            log(`⚠️ Предупреждения: ${stderr}`);
        }
        
        log(`✅ Деплой успешно завершен: ${stdout}`);
        log('🎉 Сайт обновлен!');
    });
}

// Webhook endpoint
app.post('/webhook', (req, res) => {
    const signature = req.headers['x-hub-signature-256'];
    const payload = JSON.stringify(req.body);
    
    // Проверяем подпись (если настроен секрет)
    if (WEBHOOK_SECRET && signature) {
        if (!verifySignature(payload, signature)) {
            log('❌ Неверная подпись webhook');
            return res.status(401).send('Unauthorized');
        }
    }
    
    // Проверяем, что это push в main ветку
    if (req.body.ref === 'refs/heads/main') {
        log(`📨 Получен push от ${req.body.pusher.name}`);
        log(`💬 Коммит: ${req.body.head_commit.message}`);
        
        // Запускаем деплой
        deployApp();
        
        res.status(200).send('Deployment started');
    } else {
        log(`ℹ️ Push в ветку ${req.body.ref}, игнорируем`);
        res.status(200).send('Not main branch, ignored');
    }
});

// Endpoint для ручного деплоя
app.post('/deploy', (req, res) => {
    log('🔧 Ручной деплой запущен');
    deployApp();
    res.status(200).send('Manual deployment started');
});

// Статус endpoint
app.get('/status', (req, res) => {
    exec('docker-compose ps', (error, stdout, stderr) => {
        if (error) {
            return res.status(500).json({ error: error.message });
        }
        
        res.json({
            status: 'running',
            containers: stdout,
            timestamp: new Date().toISOString()
        });
    });
});

app.listen(PORT, () => {
    log(`🎯 Webhook сервер запущен на порту ${PORT}`);
    log('📡 Готов к приему webhook от GitHub');
});

module.exports = app; 