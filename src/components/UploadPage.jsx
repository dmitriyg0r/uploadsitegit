import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

function UploadPage() {
  const [formData, setFormData] = useState({
    title: '',
    authors: [''],
    group: '18ПрД4310',
    subject: ''
  });
  const [files, setFiles] = useState({
    exeFile: null,
    docxFile: null
  });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
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

  const handleAuthorChange = (index, value) => {
    setFormData(prev => ({
      ...prev,
      authors: prev.authors.map((author, i) => i === index ? value : author)
    }));
  };

  const addAuthor = () => {
    if (formData.authors.length < 4) {
      setFormData(prev => ({
        ...prev,
        authors: [...prev.authors, '']
      }));
    }
  };

  const removeAuthor = (index) => {
    if (formData.authors.length > 1) {
      setFormData(prev => ({
        ...prev,
        authors: prev.authors.filter((_, i) => i !== index)
      }));
    }
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
    
    if (!formData.title.trim()) {
      setMessage({ text: 'Необходимо указать название работы', type: 'error' });
      return;
    }
    
    const filledAuthors = formData.authors.filter(author => author.trim());
    if (filledAuthors.length === 0) {
      setMessage({ text: 'Необходимо указать хотя бы одного автора работы', type: 'error' });
      return;
    }
    
    if (!files.exeFile || !files.docxFile) {
      setMessage({ text: 'Необходимо загрузить и exe файл и документацию', type: 'error' });
      return;
    }

    setUploading(true);
    setMessage({ text: '', type: '' });
    setUploadProgress('Подготовка к загрузке...');

    const uploadData = new FormData();
    
    uploadData.append('title', formData.title.trim());
    
    const cleanAuthors = filledAuthors.map(author => author.trim());
    uploadData.append('fullName', cleanAuthors[0]);
    
    if (cleanAuthors.length > 1) {
      uploadData.append('secondAuthor', cleanAuthors.slice(1).join(', '));
    }
    
    cleanAuthors.forEach((author, index) => {
      uploadData.append(`author_${index}`, author);
    });
    uploadData.append('authorsCount', cleanAuthors.length.toString());
    
    uploadData.append('group', formData.group);
    uploadData.append('subject', formData.subject);

    try {
      setUploadProgress('Загрузка файлов...');
      
      uploadData.append('exeFile', files.exeFile);
      uploadData.append('docxFile', files.docxFile);

      setUploadProgress('Отправка данных на сервер...');

      const response = await axios.post(`${API_URL}/api/upload`, uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.lengthComputable) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(`Загрузка: ${percentCompleted}%`);
          }
        }
      });

      setUploadProgress('Обработка завершена!');
      setMessage({ text: '✅ Файлы успешно загружены!', type: 'success' });
      
      setFormData({
        title: '',
        authors: [''],
        group: '18ПрД4310',
        subject: ''
      });
      setFiles({
        exeFile: null,
        docxFile: null
      });
      
      document.getElementById('exeFile').value = '';
      document.getElementById('docxFile').value = '';
      
      setTimeout(() => {
        navigate('/');
      }, 2000);
      
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Ошибка при загрузке файлов';
      setMessage({ text: `❌ ${errorMessage}`, type: 'error' });
      setUploadProgress('');
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
                <label htmlFor="title">Название работы *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Например: Система управления базой данных"
                  className="title-input"
                  required
                />
                <div className="input-hint">
                  Укажите краткое и понятное название вашей работы
                </div>
              </div>

              <div className="form-group">
                <label>Авторы работы *</label>
                <div className="authors-container">
                  {formData.authors.map((author, index) => (
                    <div key={index} className="author-input-row">
                      <input
                        type="text"
                        value={author}
                        onChange={(e) => handleAuthorChange(index, e.target.value)}
                        placeholder={`ФИО ${index === 0 ? 'основного' : index + 1 + '-го'} автора`}
                        className="author-input"
                      />
                      {formData.authors.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeAuthor(index)}
                          className="remove-author-btn"
                          title="Удалить автора"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  {formData.authors.length < 4 && (
                    <button
                      type="button"
                      onClick={addAuthor}
                      className="add-author-btn"
                    >
                      + Добавить автора
                    </button>
                  )}
                  <div className="authors-hint">
                    Можно добавить до 4 авторов. Первый автор считается основным.
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="group">Группа</label>
                <input
                  type="text"
                  id="group"
                  name="group"
                  value={formData.group}
                  readOnly
                  className="group-input-readonly"
                  title="Поле группы зафиксировано"
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
                {uploading ? (
                  <div className="loading-content">
                    <div className="loading-spinner"></div>
                    <span>{uploadProgress}</span>
                  </div>
                ) : (
                  '↗ Загрузить файлы'
                )}
              </button>
              
              {uploading && (
                <div className="upload-progress">
                  <div className="progress-bar">
                    <div className="progress-fill"></div>
                  </div>
                </div>
              )}
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
                <h4>Требования к заполнению:</h4>
                <ul>
                  <li>Название работы: краткое и понятное описание проекта</li>
                  <li>Минимум один автор (максимум 4 автора)</li>
                  <li>Группа автоматически устанавливается как 18ПрД4310</li>
                  <li>Предмет/дисциплина (опционально)</li>
                </ul>
              </div>

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
                  <li>Ваша работа появляется в общем списке с указанным названием</li>
                  <li>Все одногруппники и преподаватели смогут увидеть вашу работу</li>
                  <li>В карточке работы будут отображены все авторы</li>
                </ul>
              </div>

              <div className="info-item">
                <h4>💡 Совместная работа</h4>
                <ul>
                  <li>Если работа выполнена несколькими разработчиками, добавьте всех авторов</li>
                  <li>Основной автор указывается первым (обязательно)</li>
                  <li>Папка будет создана по имени основного автора</li>
                  <li>В карточке работы будут отображены все авторы</li>
                  <li>Максимальное количество авторов: 4</li>
                </ul>
              </div>

              <div className="info-item">
                <h4>🚀 Процесс загрузки</h4>
                <ul>
                  <li>Подготовка файлов и проверка данных</li>
                  <li>Загрузка файлов с отображением прогресса</li>
                  <li>Обработка и сохранение на сервере</li>
                  <li>Автоматический переход к списку работ</li>
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