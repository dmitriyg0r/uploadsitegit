import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Создаём папку для загрузок если её нет
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
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

// Обработка ошибок Multer
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Файл слишком большой (максимум 100MB)' });
    }
  }
  
  res.status(400).json({ error: error.message });
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
}); 