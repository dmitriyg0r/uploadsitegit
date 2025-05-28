import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

function UploadPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    group: '',
    subject: ''
  });
  const [files, setFiles] = useState({
    exeFile: null,
    docxFile: null
  });
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  
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
      setMessage('Пожалуйста, заполните ФИО');
      return;
    }
    
    if (!files.exeFile || !files.docxFile) {
      setMessage('Пожалуйста, выберите оба файла (exe и docx)');
      return;
    }

    setUploading(true);
    setMessage('');

    try {
      const uploadData = new FormData();
      uploadData.append('fullName', formData.fullName);
      uploadData.append('group', formData.group);
      uploadData.append('subject', formData.subject);
      uploadData.append('exeFile', files.exeFile);
      uploadData.append('docxFile', files.docxFile);

      const response = await axios.post(`${API_URL}/api/upload`, uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setMessage('✅ Файлы успешно загружены!');
      
      // Очищаем форму
      setFormData({
        fullName: '',
        group: '',
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
      setMessage(`❌ ${errorMessage}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-page">
      <header className="page-header">
        <h1>📤 Загрузка работы</h1>
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
                <label htmlFor="fullName">ФИО *</label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Фамилия Имя Отчество"
                  required
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
                  placeholder="Например: 18ПрД4310"
                />
              </div>

              <div className="form-group">
                <label htmlFor="subject">Предмет/проект</label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  placeholder="Например: Тер.Вер"
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
                {uploading ? '⏳ Загружаем...' : '📤 Загрузить файлы'}
              </button>
            </form>

            {message && (
              <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
                {message}
                {message.includes('✅') && (
                  <p className="redirect-info">Переходим к просмотру работ...</p>
                )}
              </div>
            )}
          </div>

          <div className="upload-info">
            <h3>ℹ️ Информация</h3>
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
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default UploadPage; 