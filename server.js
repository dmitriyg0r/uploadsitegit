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
      
      // Выполняем pm2 restart spacehub
      exec('pm2 restart spacehub', (error, stdout, stderr) => {
        if (error) {
          writeDeployLog(`Ошибка pm2 restart: ${error.message}`, 'error');
        } else {
          writeDeployLog(`PM2 restart выполнен: ${stdout}`);
        }
        
        // Выполняем npm run start
        exec('npm run start', { cwd: __dirname }, (error, stdout, stderr) => {
          if (error) {
            writeDeployLog(`Ошибка npm run start: ${error.message}`, 'error');
          } else {
            writeDeployLog(`NPM start выполнен: ${stdout}`);
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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
    // Сохраняем файл с оригинальным именем и датой
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const extension = path.extname(file.originalname);
    const basename = path.basename(file.originalname, extension);
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
    const { fullName, group, subject } = req.body;
    
    if (!fullName) {
      return res.status(400).json({ error: 'ФИО обязательно для заполнения' });
    }
    
    if (!req.files || !req.files.exeFile || !req.files.docxFile) {
      return res.status(400).json({ error: 'Необходимо загрузить и exe файл и документацию' });
    }
    
    // Сохраняем информацию о загрузке
    const uploadInfo = {
      timestamp: new Date().toISOString(),
      fullName,
      group: group || '',
      subject: subject || '',
      files: {
        exe: req.files.exeFile[0].filename,
        docx: req.files.docxFile[0].filename
      }
    };
    
    // Сохраняем мета-информацию в JSON файл
    const metaPath = path.join(uploadsDir, fullName, 'upload_info.json');
    fs.writeFileSync(metaPath, JSON.stringify(uploadInfo, null, 2));
    
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
    
    res.json(uploads);
  } catch (error) {
    console.error('Ошибка получения списка загрузок:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// GitHub Webhook endpoint
app.post('/webhook/github', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-hub-signature-256'];
    const payload = req.body;
    
    const event = JSON.parse(payload.toString());
    
    // Проверяем что это push в main ветку
    if (event.ref === 'refs/heads/main' || event.ref === 'refs/heads/master') {
      writeDeployLog(`Получен webhook от GitHub. Коммит: ${event.head_commit?.message || 'unknown'}`);
      
      // Запускаем развертывание асинхронно
      deployApplication()
        .then(result => {
          writeDeployLog(`Развертывание успешно завершено: ${result.message}`);
        })
        .catch(error => {
          writeDeployLog(`Ошибка развертывания: ${error.message}`, 'error');
        });
      
      res.json({ message: 'Webhook получен, развертывание запущено' });
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