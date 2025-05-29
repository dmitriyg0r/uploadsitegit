import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { exec, spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Создаём папку для загрузок если её нет
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Создаём папку для логов развертывания
const deployLogsDir = path.join(__dirname, 'deploy-logs');
if (!fs.existsSync(deployLogsDir)) {
  fs.mkdirSync(deployLogsDir, { recursive: true });
}

// Функция для записи логов
function writeDeployLog(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${type.toUpperCase()}] ${message}\n`;
  const logFile = path.join(deployLogsDir, `deploy-${new Date().toDateString().replace(/\s/g, '-')}.log`);
  
  fs.appendFileSync(logFile, logEntry);
  console.log(logEntry.trim());
}

// Функция для выполнения команд развертывания
async function deployApplication() {
  return new Promise((resolve, reject) => {
    writeDeployLog('Начинаю процесс развертывания...');
    
    // Сначала выполняем git pull
    exec('git pull origin main', { cwd: __dirname }, (error, stdout, stderr) => {
      if (error) {
        writeDeployLog(`Ошибка git pull: ${error.message}`, 'error');
        reject(error);
        return;
      }
      
      writeDeployLog(`Git pull выполнен: ${stdout}`);
      
      // Выполняем сборку фронтенда
      exec('npm run build', { cwd: __dirname }, (error, stdout, stderr) => {
        if (error) {
          writeDeployLog(`Ошибка npm run build: ${error.message}`, 'error');
        } else {
          writeDeployLog(`NPM build выполнен: ${stdout}`);
        }
        
        // Выполняем pm2 restart spacehub
        exec('pm2 restart spacehub', (error, stdout, stderr) => {
          if (error) {
            writeDeployLog(`Ошибка pm2 restart: ${error.message}`, 'error');
          } else {
            writeDeployLog(`PM2 restart выполнен: ${stdout}`);
          }
          
          writeDeployLog('Процесс развертывания завершен');
          resolve({ success: true, message: 'Развертывание завершено' });
        });
      });
    });
  });
}

// Middleware
app.use(cors());
app.use(express.json({ charset: 'utf-8' }));
app.use(express.urlencoded({ extended: true, charset: 'utf-8' }));

// Настройка Multer для загрузки файлов
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Создаём папку для каждого студента
    const studentDir = path.join(uploadsDir, req.body.fullName || 'unknown');
    if (!fs.existsSync(studentDir)) {
      fs.mkdirSync(studentDir, { recursive: true });
    }
    cb(null, studentDir);
  },
  filename: (req, file, cb) => {
    // Правильно обрабатываем UTF-8 кодировку для имен файлов
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const extension = path.extname(originalName);
    const basename = path.basename(originalName, extension);
    cb(null, `${basename}_${timestamp}${extension}`);
  }
});

// Фильтр файлов - разрешаем только .exe и .docx
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.exe', '.docx'];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error(`Разрешены только файлы: ${allowedTypes.join(', ')}`), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB максимум
  }
});

// Маршруты
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.post('/api/upload', upload.fields([
  { name: 'exeFile', maxCount: 1 },
  { name: 'docxFile', maxCount: 1 }
]), (req, res) => {
  try {
    const { fullName, secondAuthor, group, subject, authorsCount } = req.body;
    
    // Новая логика: сначала пытаемся получить авторов из новых полей
    let authors = [];
    
    if (authorsCount && parseInt(authorsCount) > 0) {
      // Новый формат - собираем авторов из полей author_0, author_1, etc.
      const count = parseInt(authorsCount);
      for (let i = 0; i < count; i++) {
        const authorField = req.body[`author_${i}`];
        if (authorField && authorField.trim()) {
          authors.push(authorField.trim());
        }
      }
    } else {
      // Старый формат - для обратной совместимости
      if (fullName && fullName.trim()) {
        authors.push(fullName.trim());
      }
      if (secondAuthor && secondAuthor.trim()) {
        authors.push(secondAuthor.trim());
      }
    }
    
    // Проверяем, что есть хотя бы один автор
    if (authors.length === 0) {
      return res.status(400).json({ error: 'Необходимо указать хотя бы одного автора работы' });
    }
    
    if (!req.files || !req.files.exeFile || !req.files.docxFile) {
      return res.status(400).json({ error: 'Необходимо загрузить и exe файл и документацию' });
    }
    
    // Основной автор - первый в списке
    const mainAuthor = authors[0];
    
    // Сохраняем информацию о загрузке
    const uploadInfo = {
      timestamp: new Date().toISOString(),
      fullName: mainAuthor, // Основной автор для совместимости
      secondAuthor: authors.length > 1 ? authors.slice(1).join(', ') : null, // Для совместимости
      authors: authors, // Новый формат - массив всех авторов
      group: group || '',
      subject: subject || '',
      files: {
        exe: req.files.exeFile[0].filename,
        docx: req.files.docxFile[0].filename
      }
    };
    
    // Сохраняем мета-информацию в JSON файл с правильной UTF-8 кодировкой
    const metaPath = path.join(uploadsDir, mainAuthor, 'upload_info.json');
    fs.writeFileSync(metaPath, JSON.stringify(uploadInfo, null, 2), 'utf8');
    
    res.json({ 
      message: 'Файлы успешно загружены!', 
      uploadInfo 
    });
    
  } catch (error) {
    console.error('Ошибка загрузки:', error);
    res.status(500).json({ error: 'Ошибка сервера при загрузке файлов' });
  }
});

// Получение списка всех загрузок
app.get('/api/uploads', (req, res) => {
  try {
    const uploads = [];
    const studentDirs = fs.readdirSync(uploadsDir);
    
    studentDirs.forEach(studentDir => {
      const metaPath = path.join(uploadsDir, studentDir, 'upload_info.json');
      if (fs.existsSync(metaPath)) {
        const uploadInfo = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
        uploads.push(uploadInfo);
      }
    });
    
    // Устанавливаем правильные заголовки для JSON с кириллицей
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.json(uploads);
  } catch (error) {
    console.error('Ошибка получения списка загрузок:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Новый эндпоинт для скачивания файлов
app.get('/api/download/:fullName/:fileName', (req, res) => {
  try {
    const { fullName, fileName } = req.params;
    const decodedFullName = decodeURIComponent(fullName);
    const decodedFileName = decodeURIComponent(fileName);
    
    const filePath = path.join(uploadsDir, decodedFullName, decodedFileName);
    
    // Проверяем существование файла
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Файл не найден' });
    }
    
    // Проверяем, что файл находится в правильной директории (защита от path traversal)
    const normalizedPath = path.normalize(filePath);
    const normalizedUploadsDir = path.normalize(uploadsDir);
    if (!normalizedPath.startsWith(normalizedUploadsDir)) {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }
    
    // Правильно обрабатываем кириллические символы в заголовках
    const encodedFileName = encodeURIComponent(decodedFileName);
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFileName}`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Cache-Control', 'no-cache');
    
    // Отправляем файл
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
    fileStream.on('error', (error) => {
      console.error('Ошибка чтения файла:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Ошибка чтения файла' });
      }
    });
    
  } catch (error) {
    console.error('Ошибка скачивания файла:', error);
    res.status(500).json({ error: 'Ошибка сервера при скачивании файла' });
  }
});

// Новый эндпоинт для получения информации о файле
app.get('/api/file-info/:fullName/:fileName', (req, res) => {
  try {
    const { fullName, fileName } = req.params;
    const decodedFullName = decodeURIComponent(fullName);
    const decodedFileName = decodeURIComponent(fileName);
    
    const filePath = path.join(uploadsDir, decodedFullName, decodedFileName);
    
    // Проверяем существование файла
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Файл не найден' });
    }
    
    // Проверяем, что файл находится в правильной директории
    const normalizedPath = path.normalize(filePath);
    const normalizedUploadsDir = path.normalize(uploadsDir);
    if (!normalizedPath.startsWith(normalizedUploadsDir)) {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }
    
    // Получаем информацию о файле
    const stats = fs.statSync(filePath);
    
    res.json({
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      name: decodedFileName
    });
    
  } catch (error) {
    console.error('Ошибка получения информации о файле:', error);
    res.status(500).json({ error: 'Ошибка сервера при получении информации о файле' });
  }
});

// Новый эндпоинт для удаления загруженных работ (админ функция)
app.delete('/api/admin/uploads/:fullName', (req, res) => {
  try {
    const { fullName } = req.params;
    const decodedFullName = decodeURIComponent(fullName);
    
    const studentDir = path.join(uploadsDir, decodedFullName);
    
    // Проверяем существование папки
    if (!fs.existsSync(studentDir)) {
      return res.status(404).json({ error: 'Работа не найдена' });
    }
    
    // Проверяем, что папка находится в правильной директории
    const normalizedPath = path.normalize(studentDir);
    const normalizedUploadsDir = path.normalize(uploadsDir);
    if (!normalizedPath.startsWith(normalizedUploadsDir)) {
      return res.status(403).json({ error: 'Доступ запрещен' });
    }
    
    // Рекурсивно удаляем папку со всеми файлами
    fs.rmSync(studentDir, { recursive: true, force: true });
    
    res.json({ 
      success: true, 
      message: `Работа студента "${decodedFullName}" успешно удалена` 
    });
    
  } catch (error) {
    console.error('Ошибка удаления работы:', error);
    res.status(500).json({ error: 'Ошибка сервера при удалении работы' });
  }
});

// Новый эндпоинт для получения статистики (админ функция)
app.get('/api/admin/stats', (req, res) => {
  try {
    const studentDirs = fs.readdirSync(uploadsDir);
    const stats = {
      totalUploads: 0,
      totalSize: 0,
      uploadsByDate: {},
      recentUploads: []
    };
    
    studentDirs.forEach(studentDir => {
      const metaPath = path.join(uploadsDir, studentDir, 'upload_info.json');
      if (fs.existsSync(metaPath)) {
        const uploadInfo = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
        stats.totalUploads++;
        
        // Подсчитываем размер всех файлов в папке
        const studentDirPath = path.join(uploadsDir, studentDir);
        const files = fs.readdirSync(studentDirPath);
        files.forEach(file => {
          const filePath = path.join(studentDirPath, file);
          if (fs.statSync(filePath).isFile() && file !== 'upload_info.json') {
            stats.totalSize += fs.statSync(filePath).size;
          }
        });
        
        // Группируем по датам
        const date = uploadInfo.timestamp.split('T')[0];
        stats.uploadsByDate[date] = (stats.uploadsByDate[date] || 0) + 1;
        
        // Добавляем в недавние загрузки
        stats.recentUploads.push({
          fullName: uploadInfo.fullName,
          timestamp: uploadInfo.timestamp,
          group: uploadInfo.group,
          subject: uploadInfo.subject
        });
      }
    });
    
    // Сортируем недавние загрузки по дате
    stats.recentUploads.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    stats.recentUploads = stats.recentUploads.slice(0, 10); // Последние 10
    
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.json(stats);
  } catch (error) {
    console.error('Ошибка получения статистики:', error);
    res.status(500).json({ error: 'Ошибка сервера при получении статистики' });
  }
});

// GitHub Webhook endpoint
app.post('/webhook/github', async (req, res) => {
  try {
    const signature = req.headers['x-hub-signature-256'];
    const event = req.body; // Используем уже распарсенный JSON
    
    // Проверяем что это push в main ветку
    if (event.ref === 'refs/heads/main' || event.ref === 'refs/heads/master') {
      writeDeployLog(`Получен webhook от GitHub. Коммит: ${event.head_commit?.message || 'unknown'}`);
      
      // Отправляем ответ немедленно
      res.json({ message: 'Webhook получен, развертывание запущено' });
      
      // Запускаем развертывание асинхронно
      setTimeout(async () => {
        try {
          const result = await deployApplication();
          writeDeployLog(`Развертывание успешно завершено: ${result.message}`);
        } catch (error) {
          writeDeployLog(`Ошибка развертывания: ${error.message}`, 'error');
        }
      }, 100);
      
    } else {
      writeDeployLog(`Webhook получен, но ветка ${event.ref} игнорируется`);
      res.json({ message: 'Webhook получен, но развертывание не требуется' });
    }
    
  } catch (error) {
    writeDeployLog(`Ошибка обработки webhook: ${error.message}`, 'error');
    res.status(500).json({ error: 'Ошибка обработки webhook' });
  }
});

// Ручной запуск развертывания
app.post('/api/deploy', async (req, res) => {
  try {
    writeDeployLog('Запущено ручное развертывание');
    
    // Отправляем ответ немедленно
    res.json({ success: true, message: 'Развертывание запущено' });
    
    // Запускаем развертывание асинхронно после отправки ответа
    setTimeout(async () => {
      try {
        const result = await deployApplication();
        writeDeployLog(`Развертывание завершено: ${result.message}`);
      } catch (error) {
        writeDeployLog(`Ошибка развертывания: ${error.message}`, 'error');
      }
    }, 100); // Небольшая задержка чтобы ответ успел отправиться
    
  } catch (error) {
    writeDeployLog(`Ошибка запуска развертывания: ${error.message}`, 'error');
    res.status(500).json({ error: 'Ошибка запуска развертывания', details: error.message });
  }
});

// Получение логов развертывания
app.get('/api/deploy-logs', (req, res) => {
  try {
    const logs = [];
    const logFiles = fs.readdirSync(deployLogsDir)
      .filter(file => file.endsWith('.log'))
      .sort((a, b) => b.localeCompare(a)); // Сортируем по убыванию (новые сначала)
    
    logFiles.forEach(file => {
      const logPath = path.join(deployLogsDir, file);
      const content = fs.readFileSync(logPath, 'utf8');
      logs.push({
        filename: file,
        content: content.split('\n').filter(line => line.trim()).reverse() // Новые записи сначала
      });
    });
    
    res.json(logs);
  } catch (error) {
    console.error('Ошибка получения логов:', error);
    res.status(500).json({ error: 'Ошибка получения логов' });
  }
});

// Получение последних логов (для real-time обновления)
app.get('/api/deploy-logs/latest', (req, res) => {
  try {
    const today = new Date().toDateString().replace(/\s/g, '-');
    const logFile = path.join(deployLogsDir, `deploy-${today}.log`);
    
    if (fs.existsSync(logFile)) {
      const content = fs.readFileSync(logFile, 'utf8');
      const lines = content.split('\n').filter(line => line.trim()).slice(-50); // Последние 50 строк
      res.json({ logs: lines.reverse() }); // Новые записи сначала
    } else {
      res.json({ logs: [] });
    }
  } catch (error) {
    console.error('Ошибка получения последних логов:', error);
    res.status(500).json({ error: 'Ошибка получения логов' });
  }
});

// Обработка ошибок Multer
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Файл слишком большой (максимум 100MB)' });
    }
  }
  
  res.status(400).json({ error: error.message });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Сервер запущен на порту ${PORT}`);
}); 