const fs = require('fs');
const path = require('path');

const uploadsDir = './uploads';

function cleanupDuplicates() {
  try {
    if (!fs.existsSync(uploadsDir)) {
      console.log('Директория uploads не найдена');
      return;
    }

    const studentDirs = fs.readdirSync(uploadsDir);
    let fixedCount = 0;

    studentDirs.forEach(studentDir => {
      const metaPath = path.join(uploadsDir, studentDir, 'upload_info.json');
      
      if (fs.existsSync(metaPath)) {
        const uploadInfo = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
        
        // Проверяем, есть ли дублированное поле exe
        if (uploadInfo.files && uploadInfo.files.exe && uploadInfo.files.program) {
          console.log(`Найдено дублирование в работе: ${studentDir}`);
          
          // Удаляем поле exe, оставляя только program
          delete uploadInfo.files.exe;
          
          // Сохраняем исправленный файл
          fs.writeFileSync(metaPath, JSON.stringify(uploadInfo, null, 2), 'utf8');
          fixedCount++;
          
          console.log(`Исправлено: удалено дублированное поле exe`);
        }
      }
    });

    console.log(`\nОтчет о очистке:`);
    console.log(`Всего обработано работ: ${studentDirs.length}`);
    console.log(`Исправлено дублирований: ${fixedCount}`);
    
    if (fixedCount === 0) {
      console.log('✅ Дублированных файлов не найдено!');
    } else {
      console.log(`✅ Успешно исправлено ${fixedCount} работ`);
    }

  } catch (error) {
    console.error('Ошибка при очистке дублированных файлов:', error);
  }
}

// Запускаем очистку
console.log('🚀 Запуск очистки дублированных файлов...\n');
cleanupDuplicates(); 