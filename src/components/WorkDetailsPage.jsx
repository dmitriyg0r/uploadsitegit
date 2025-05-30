import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useParams, useNavigate } from 'react-router-dom';

function WorkDetailsPage() {
  const { authorName } = useParams();
  const navigate = useNavigate();
  const [workData, setWorkData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingFiles, setDownloadingFiles] = useState(new Set());
  const [filesInfo, setFilesInfo] = useState({});

  const API_URL = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    fetchWorkDetails();
  }, [authorName]);

  const fetchWorkDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/uploads`);
      const uploads = Array.isArray(response.data) ? response.data : [];
      
      // Находим работу по имени основного автора
      const work = uploads.find(upload => upload.fullName === decodeURIComponent(authorName));
      
      if (!work) {
        setError('Работа не найдена');
        return;
      }
      
      setWorkData(work);
      
      // Получаем информацию о файлах
      const fileInfoPromises = Object.entries(work.files).map(async ([type, fileName]) => {
        try {
          const response = await axios.get(
            `${API_URL}/api/file-info/${encodeURIComponent(work.fullName)}/${encodeURIComponent(fileName)}`
          );
          return { [type]: response.data };
        } catch (error) {
          return { [type]: { size: 'Неизвестно', error: true } };
        }
      });
      
      const fileInfoResults = await Promise.all(fileInfoPromises);
      const filesInfoObj = fileInfoResults.reduce((acc, curr) => ({ ...acc, ...curr }), {});
      setFilesInfo(filesInfoObj);
      
    } catch (error) {
      console.error('Ошибка получения данных работы:', error);
      setError('Ошибка загрузки данных работы');
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async (fileName, fileType) => {
    const fileKey = `${fileName}`;
    setDownloadingFiles(prev => new Set(prev).add(fileKey));
    
    try {
      const response = await axios.get(
        `${API_URL}/api/download/${encodeURIComponent(workData.fullName)}/${encodeURIComponent(fileName)}`,
        { responseType: 'blob' }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Ошибка скачивания файла:', error);
      alert('Ошибка при скачивании файла');
    } finally {
      setDownloadingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(fileKey);
        return newSet;
      });
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 'Неизвестно' || bytes === undefined) return 'Неизвестно';
    if (bytes === 0) return '0 Байт';
    
    const k = 1024;
    const sizes = ['Байт', 'КБ', 'МБ', 'ГБ'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    switch (extension) {
      case 'exe':
        return '⚙️';
      case 'docx':
        return '📝';
      case 'pdf':
        return '📄';
      case 'zip':
        return '📦';
      default:
        return '📎';
    }
  };

  const getAuthorsDisplay = (work) => {
    if (work.authors && work.authors.length > 0) {
      return work.authors;
    } else if (work.secondAuthor) {
      return [work.fullName, work.secondAuthor];
    }
    return [work.fullName];
  };

  const getWorkTitle = (work) => {
    return work.title || `Работа от ${work.fullName}`;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Скопировано в буфер обмена');
  };

  if (loading) {
    return (
      <div className="work-details-page">
        <div className="loading">
          <div className="spinner"></div>
          <p>Загружаем данные работы...</p>
        </div>
      </div>
    );
  }

  if (error || !workData) {
    return (
      <div className="work-details-page">
        <div className="error-container">
          <h1>❌ {error || 'Работа не найдена'}</h1>
          <p>Возможно, работа была удалена или перемещена</p>
          <Link to="/" className="back-to-home-btn">
            ← Вернуться к списку работ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="work-details-page">
      <header className="work-header">
        <div className="breadcrumb">
          <Link to="/" className="breadcrumb-link">Проекты</Link>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">{getWorkTitle(workData)}</span>
        </div>
        
        <div className="work-title-section">
          <div className="work-icon">🚀</div>
          <div className="work-info">
            <h1 className="work-title">{getWorkTitle(workData)}</h1>
            <div className="work-meta">
              <span className="work-visibility">🌐 Публичная</span>
              <span className="work-group">👥 {workData.group}</span>
              {workData.subject && (
                <span className="work-subject">📚 {workData.subject}</span>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="work-content">
        <div className="work-main">
          <div className="work-nav">
            <div className="nav-tabs">
              <button className="nav-tab active">📁 Файлы</button>
              <button className="nav-tab" disabled>📝 README</button>
            </div>
            <div className="nav-actions">
              <button 
                className="action-button download-all"
                onClick={() => {
                  Object.entries(workData.files).forEach(([type, fileName]) => {
                    downloadFile(fileName, type);
                  });
                }}
              >
                ⬇️ Скачать все
              </button>
            </div>
          </div>

          <div className="files-container">
            <div className="files-header">
              <div className="files-info">
                <span className="commit-info">
                  📅 Загружено {new Date(workData.timestamp).toLocaleDateString('ru-RU', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              <div className="files-count">
                {Object.keys(workData.files).filter(key => key !== 'programType').length} файлов
              </div>
            </div>

            <div className="files-list">
              {Object.entries(workData.files)
                .filter(([type]) => type !== 'programType') // Исключаем служебное поле
                .map(([type, fileName]) => {
                const fileInfo = filesInfo[type] || {};
                const isDownloading = downloadingFiles.has(fileName);
                
                return (
                  <div key={type} className="file-item">
                    <div className="file-icon-name">
                      <span className="file-icon">{getFileIcon(fileName)}</span>
                      <span className="file-name">{fileName}</span>
                    </div>
                    <div className="file-actions">
                      <span className="file-size">{formatFileSize(fileInfo.size)}</span>
                      <button
                        className="file-download-btn"
                        onClick={() => downloadFile(fileName, type)}
                        disabled={isDownloading}
                        title="Скачать файл"
                      >
                        {isDownloading ? (
                          <span className="spinner-small"></span>
                        ) : (
                          '⬇️'
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="readme-section">
            <div className="readme-header">
              <h3>📋 О проекте</h3>
            </div>
            <div className="readme-content">
              <p>Данный проект содержит программное обеспечение и документацию, разработанные в рамках учебного процесса.</p>
              
              <h4>📦 Состав проекта:</h4>
              <ul>
                {(workData.files.program || workData.files.exe) && (
                  <li>
                    <strong>Программный файл:</strong> {workData.files.program || workData.files.exe}
                    {workData.files.programType === '.py' && (
                      <span className="file-type-hint"> (Python скрипт)</span>
                    )}
                    {workData.files.programType === '.exe' && (
                      <span className="file-type-hint"> (Исполняемый файл)</span>
                    )}
                  </li>
                )}
                {workData.files.docx && (
                  <li><strong>Документация:</strong> {workData.files.docx}</li>
                )}
              </ul>

              {workData.subject && (
                <>
                  <h4>🎓 Дисциплина:</h4>
                  <p>{workData.subject}</p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="work-sidebar">
          <div className="sidebar-section">
            <h3>👥 Авторы</h3>
            <div className="authors-list">
              {getAuthorsDisplay(workData).map((author, index) => (
                <div key={index} className="author-item">
                  <div className="author-avatar">👤</div>
                  <div className="author-info">
                    <div className="author-name">{author}</div>
                    <div className="author-role">
                      {index === 0 ? 'Основной автор' : 'Соавтор'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="sidebar-section">
            <h3>📊 Статистика</h3>
            <div className="stats-list">
              <div className="stat-item">
                <span className="stat-label">Файлов:</span>
                <span className="stat-value">{Object.keys(workData.files).length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Группа:</span>
                <span className="stat-value">{workData.group}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Загружено:</span>
                <span className="stat-value">
                  {new Date(workData.timestamp).toLocaleDateString('ru-RU')}
                </span>
              </div>
            </div>
          </div>

          <div className="sidebar-section">
            <h3>🔗 Действия</h3>
            <div className="actions-list">
              <button 
                className="action-btn"
                onClick={() => {
                  const authors = getAuthorsDisplay(workData);
                  const shareText = `Работа: "${getWorkTitle(workData)}" от ${authors.join(', ')}`;
                  copyToClipboard(shareText);
                }}
              >
                📋 Копировать информацию
              </button>
              <button 
                className="action-btn"
                onClick={() => {
                  const url = window.location.href;
                  copyToClipboard(url);
                }}
              >
                🔗 Копировать ссылку
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WorkDetailsPage; 