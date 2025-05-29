import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

function UploadPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    secondAuthor: '',
    group: '18ПрД4310',
    subject: ''
  });
  const [files, setFiles] = useState({
    exeFile: null,
    docxFile: null
  });
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [redirectTimer, setRedirectTimer] = useState(0);
  
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || '';

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;
    setFiles(prev => ({
      ...prev,
      [name]: selectedFiles[0]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.fullName.trim()) {
      setMessage({ text: 'ФИО основного автора обязательно для заполнения', type: 'error' });
      return;
    }
    
    if (!files.exeFile || !files.docxFile) {
      setMessage({ text: 'Необходимо загрузить и exe файл и документацию', type: 'error' });
      return;
    }

    setUploading(true);
    setMessage({ text: '', type: '' });

    const uploadData = new FormData();
    uploadData.append('fullName', formData.fullName.trim());
    if (formData.secondAuthor.trim()) {
      uploadData.append('secondAuthor', formData.secondAuthor.trim());
    }
    uploadData.append('group', formData.group);
    uploadData.append('subject', formData.subject);
    uploadData.append('exeFile', files.exeFile);
    uploadData.append('docxFile', files.docxFile);

    try {
      const response = await axios.post(`${API_URL}/api/upload`, uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setMessage({ text: '✅ Файлы успешно загружены!', type: 'success' });
      
      // Очищаем форму
      setFormData({
        fullName: '',
        secondAuthor: '',
        group: '18ПрД4310',
        subject: ''
      });
      setFiles({
        exeFile: null,
        docxFile: null
      });
      
      // Очищаем input файлов
      document.getElementById('exeFile').value = '';
      document.getElementById('docxFile').value = '';
      
      // Через 2 секунды переходим на главную страницу
      setTimeout(() => {
        navigate('/');
      }, 2000);
      
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Ошибка при загрузке файлов';
      setMessage({ text: `❌ ${errorMessage}`, type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-page">
      <header className="page-header">
        <h1>↗ Загрузка работы</h1>
        <p>Загрузите свою программу и документацию</p>
        <Link to="/" className="back-link">
          ← Назад к просмотру работ
        </Link>
      </header>

      <main className="main-content">
        <div className="upload-section">
          <div className="upload-form-container">
            <h2>Загрузить файлы</h2>
            
            <form onSubmit={handleSubmit} className="upload-form">
              <div className="form-group">
                <label htmlFor="fullName">ФИО основного автора *</label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Иванов Иван Иванович"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="secondAuthor">ФИО второго автора (опционально)</label>
                <input
                  type="text"
                  id="secondAuthor"
                  name="secondAuthor"
                  value={formData.secondAuthor}
                  onChange={handleInputChange}
                  placeholder="Петров Петр Петрович"
                />
              </div>

              <div className="form-group">
                <label htmlFor="group">Группа</label>
                <input
                  type="text"
                  id="group"
                  name="group"
                  value={formData.group}
                  onChange={handleInputChange}
                  placeholder="18ПрД4310"
                />
              </div>

              <div className="form-group">
                <label htmlFor="subject">Предмет/Дисциплина</label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  placeholder="Название предмета"
                />
              </div>

              <div className="file-uploads">
                <div className="form-group">
                  <label htmlFor="exeFile">Исполняемый файл (.exe) *</label>
                  <div className="file-input-container">
                    <input
                      type="file"
                      id="exeFile"
                      name="exeFile"
                      onChange={handleFileChange}
                      accept=".exe"
                      required
                    />
                    <div className="file-hint">
                      <p>📁 Загрузите исполняемый файл вашей программы</p>
                      <p>Максимальный размер: 100MB</p>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="docxFile">Документация (.docx) *</label>
                  <div className="file-input-container">
                    <input
                      type="file"
                      id="docxFile"
                      name="docxFile"
                      onChange={handleFileChange}
                      accept=".docx"
                      required
                    />
                    <div className="file-hint">
                      <p>📄 Загрузите документацию к программе</p>
                      <p>Формат: Microsoft Word (.docx)</p>
                    </div>
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                className="submit-button"
                disabled={uploading}
              >
                {uploading ? '⏳ Загружаем...' : '↗ Загрузить файлы'}
              </button>
            </form>

            {message.text && (
              <div className={`message ${message.type === 'success' ? 'success' : 'error'}`}>
                {message.text}
                {message.type === 'success' && (
                  <p className="redirect-info">Переходим к просмотру работ...</p>
                )}
              </div>
            )}
          </div>

          <div className="upload-info">
            <h3>ℹ Информация</h3>
            <div className="info-content">
              <div className="info-item">
                <h4>Требования к файлам:</h4>
                <ul>
                  <li>Программа: файл с расширением .exe</li>
                  <li>Документация: файл с расширением .docx</li>
                  <li>Максимальный размер каждого файла: 100MB</li>
                </ul>
              </div>
              
              <div className="info-item">
                <h4>Что происходит после загрузки:</h4>
                <ul>
                  <li>Файлы сохраняются на сервере</li>
                  <li>Ваша работа появляется в общем списке</li>
                  <li>Все одногруппники и преподаватели смогут увидеть вашу работу</li>
                </ul>
              </div>

              <div className="info-item">
                <h4>💡 Совместная работа</h4>
                <ul>
                  <li>Если работа выполнена двумя разработчиками, укажите второго автора</li>
                  <li>Основной автор указывается в первом поле (обязательно)</li>
                  <li>Папка будет создана по имени основного автора</li>
                  <li>В карточке работы будут отображены оба автора</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default UploadPage; 