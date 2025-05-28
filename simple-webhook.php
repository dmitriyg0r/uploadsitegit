<?php
// Простой webhook для деплоя
// Поместите этот файл в /var/www/html/webhook.php

// Секретный ключ для безопасности
$secret = '747302deb38597662304256819c7c02dc04730bc424bff54afb38b2924c00d43';

// Проверяем секретный ключ
$provided_secret = $_GET['secret'] ?? $_POST['secret'] ?? '';

if ($provided_secret !== $secret) {
    http_response_code(401);
    die('Unauthorized');
}

// Логирование
function logMessage($message) {
    $timestamp = date('Y-m-d H:i:s');
    $log = "[$timestamp] $message\n";
    file_put_contents('/opt/uploadsite/deploy.log', $log, FILE_APPEND);
    echo $log;
}

logMessage('🚀 Начинаем деплой...');

// Команды для деплоя
$commands = [
    'cd /opt/uploadsite',
    'git pull origin main',
    'docker-compose down',
    'docker-compose up --build -d',
    'docker system prune -f'
];

$fullCommand = implode(' && ', $commands);

// Выполняем деплой
exec($fullCommand . ' 2>&1', $output, $returnCode);

if ($returnCode === 0) {
    logMessage('✅ Деплой успешно завершен!');
    echo "✅ Deployment successful!\n";
    echo implode("\n", $output);
} else {
    logMessage('❌ Ошибка деплоя: ' . implode("\n", $output));
    http_response_code(500);
    echo "❌ Deployment failed!\n";
    echo implode("\n", $output);
}

logMessage('🎉 Деплой завершен!');
?> 