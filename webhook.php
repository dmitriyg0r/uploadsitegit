<?php
header('Content-Type: application/json');

// Секретный ключ для безопасности  
$secret = '747302deb38597662304256819c7c02dc04730bc424bff54afb38b2924c00d43';

// Логирование
function logMessage($message) {
    $timestamp = date('Y-m-d H:i:s');
    $log = "[$timestamp] $message\n";
    file_put_contents('/opt/uploadsite/deploy.log', $log, FILE_APPEND);
    echo $log;
}

// Проверяем метод запроса
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Получаем данные
$input = file_get_contents('php://input');
$data = json_decode($input, true);

// Проверяем подпись GitHub (если настроена)
$signature = $_SERVER['HTTP_X_HUB_SIGNATURE_256'] ?? '';
if ($signature) {
    $expected = 'sha256=' . hash_hmac('sha256', $input, $secret);
    if (!hash_equals($expected, $signature)) {
        logMessage('❌ Неверная подпись webhook');
        http_response_code(401);
        echo json_encode(['error' => 'Invalid signature']);
        exit;
    }
}

// Проверяем, что это push в main ветку
if (!isset($data['ref']) || $data['ref'] !== 'refs/heads/main') {
    logMessage('ℹ️ Push не в main ветку, игнорируем');
    echo json_encode(['message' => 'Not main branch, ignored']);
    exit;
}

logMessage('📨 Получен webhook от GitHub');
logMessage('💬 Коммит: ' . ($data['head_commit']['message'] ?? 'неизвестно'));
logMessage('👤 Автор: ' . ($data['pusher']['name'] ?? 'неизвестно'));

// Запускаем автоматический деплой
logMessage('🚀 Запуск автоматического деплоя...');

// Выполняем деплой в фоне
$output = shell_exec('/opt/uploadsite/auto-deploy.sh 2>&1 &');

logMessage('✅ Команда деплоя запущена');

echo json_encode([
    'status' => 'success',
    'message' => 'Deployment started',
    'timestamp' => date('Y-m-d H:i:s')
]);

logMessage('🎉 Webhook обработан успешно');
?> 