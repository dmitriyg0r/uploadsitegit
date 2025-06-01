import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from './ThemeToggle';
import SearchAndFilter from './SearchAndFilter';
import { ToastContainer } from './ToastNotification';

function HomePage() {
  const [uploads, setUploads] = useState([]);
  const [filteredUploads, setFilteredUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingFiles, setDownloadingFiles] = useState(new Set());
  const { theme } = useTheme();

  const API_URL = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    fetchUploads();
  }, []);

  const fetchUploads = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/uploads`);
      const uploadData = Array.isArray(response.data) ? response.data : [];
      setUploads(uploadData);
      setFilteredUploads(uploadData);
      setError('');
      
      if (window.showToast) {
        window.showToast('Данные успешно загружены', 'success', 2000);
      }
    } catch (error) {
      console.error('Ошибка получения списка загрузок:', error);
      setError('Ошибка загрузки данных');
      setUploads([]);
      setFilteredUploads([]);
      
      if (window.showToast) {
        window.showToast('Ошибка загрузки данных', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async (fullName, fileName, fileType) => {
    const fileKey = `${fullName}-${fileName}`;
    setDownloadingFiles(prev => new Set(prev).add(fileKey));
    
    try {
      const response = await axios.get(
        `${API_URL}/api/download/${encodeURIComponent(fullName)}/${encodeURIComponent(fileName)}`,
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
      
      if (window.showToast) {
        window.showToast(`Файл "${fileName}" скачан`, 'success', 3000);
      }
    } catch (error) {
      console.error('Ошибка скачивания файла:', error);
      if (window.showToast) {
        window.showToast('Ошибка при скачивании файла', 'error');
      }
    } finally {
      setDownloadingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(fileKey);
        return newSet;
      });
    }
  };

  const getFileSize = async (fullName, fileName) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/file-info/${encodeURIComponent(fullName)}/${encodeURIComponent(fileName)}`
      );
      return response.data.size;
    } catch (error) {
      return 'Неизвестно';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 'Неизвестно') return bytes;
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
        return '⚙';
      case 'docx':
        return '📝';
      case 'pdf':
        return '📄';
      case 'zip':
        return '📦';
      case 'txt':
        return '📄';
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
        return '⟨/⟩';
      case 'py':
        return '🐍';
      case 'java':
        return '☕';
      case 'cpp':
      case 'c':
        return '⚡';
      default:
        return '📎';
    }
  };

  const handleShare = (upload) => {
    const authors = getAuthorsDisplay(upload);
    const authorsText = authors.join(', ');
    const shareText = `Работа: "${getWorkTitle(upload)}" от ${authorsText}`;
    
    if (navigator.share) {
      navigator.share({
        title: shareText,
        text: shareText,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(`${shareText}\n${window.location.href}`);
      if (window.showToast) {
        window.showToast('Информация скопирована в буфер обмена', 'success', 3000);
      }
    }
  };

  // Формируем строку с авторами
  const getAuthorsDisplay = (upload) => {
    if (upload.authors && upload.authors.length > 0) {
      return upload.authors;
    } else if (upload.secondAuthor) {
      // Поддержка старого формата данных
      return [upload.fullName, upload.secondAuthor];
    }
    return [upload.fullName];
  };

  // Получаем название работы или fallback
  const getWorkTitle = (upload) => {
    return upload.title || `Работа от ${upload.fullName}`;
  };

  const handleFilter = (filtered) => {
    setFilteredUploads(filtered);
  };

  const FileRow = ({ fileName, fileType, fullName, upload }) => {
    const [fileSize, setFileSize] = useState('...');
    const fileKey = `${fullName}-${fileName}`;
    const isDownloading = downloadingFiles.has(fileKey);

    useEffect(() => {
      getFileSize(fullName, fileName).then(size => {
        setFileSize(formatFileSize(size));
      });
    }, [fullName, fileName]);

    return (
      <div className="file-row">
        <div className="file-info">
          <span className="file-icon">{getFileIcon(fileName)}</span>
          <div className="file-details">
            <span 
              className="file-name" 
              title={fileName}
              onClick={() => downloadFile(fullName, fileName, fileType)}
              style={{ cursor: 'pointer' }}
            >
              {fileName}
            </span>
          </div>
        </div>
        <div className="file-size-col">
          <span className="file-size">{fileSize}</span>
        </div>
        <div className="file-actions-col">
          <button 
            className="file-download-btn"
            onClick={() => downloadFile(fullName, fileName, fileType)}
            disabled={isDownloading}
            title="Скачать файл"
          >
            {isDownloading ? (
              <span className="spinner-small"></span>
            ) : (
              '↓'
            )}
          </button>
        </div>
      </div>
    );
  };

  const WorkCard = ({ upload, index }) => {
    const authors = getAuthorsDisplay(upload);
    const workTitle = getWorkTitle(upload);
    const filesCount = Object.keys(upload.files).filter(key => key !== 'programType').length;

    return (
      <article className="upload-card fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
        <header className="upload-header">
          <div className="student-info">
            <Link 
              to={`/work/${encodeURIComponent(upload.fullName)}`} 
              className="work-title-link"
            >
              <h3 className="work-title">{workTitle}</h3>
            </Link>
            <div className="upload-meta">
              <time className="upload-date" dateTime={upload.timestamp}>
                📅 {new Date(upload.timestamp).toLocaleDateString('ru-RU', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </time>
              {upload.group && (
                <span className="group-badge">
                  👥 {upload.group}
                </span>
              )}
              {upload.subject && (
                <span className="subject-badge">
                  📚 {upload.subject}
                </span>
              )}
            </div>
          </div>
          <div className="upload-actions">
            <Link
              to={`/work/${encodeURIComponent(upload.fullName)}`}
              className="action-btn details-btn"
              title="Подробнее"
            >
              👁️
            </Link>
            <button
              className="action-btn share-btn"
              onClick={() => handleShare(upload)}
              title="Поделиться"
            >
              📤
            </button>
          </div>
        </header>

        <div className="upload-content">
          <div className="authors-section">
            <span className="section-label">👤 Авторы:</span>
            <div className="authors-list">
              {authors.map((author, index) => (
                <span key={index} className="author-tag">{author}</span>
              ))}
            </div>
          </div>

          <div className="files-section">
            <div className="files-header">
              <span className="section-label">📁 Файлы ({filesCount})</span>
            </div>
            <div className="files-container">
              {upload.files.program && (
                <FileRow 
                  fileName={upload.files.program}
                  fileType={upload.files.programType === '.py' ? 'py' : 'exe'}
                  fullName={upload.fullName}
                  upload={upload}
                />
              )}
              {upload.files.docx && (
                <FileRow 
                  fileName={upload.files.docx}
                  fileType="docx"
                  fullName={upload.fullName}
                  upload={upload}
                />
              )}
            </div>
          </div>
        </div>
      </article>
    );
  };

  return (
    <div className="home-page">
      <ToastContainer />
      
      <header className="page-header">
        <div className="header-content">
          <div className="header-main">
            <h1>🎓 Проекты студентов</h1>
            <p>Группа 18ПрД4310 • Просмотр загруженных работ</p>
          </div>
          <div className="header-actions">
            <ThemeToggle />
            <Link to="/upload" className="btn-primary upload-btn">
              📤 Загрузить работу
            </Link>
          </div>
        </div>
      </header>

      <main className="main-content">
        <div className="content-container">
          <div className="section-header">
            <div className="section-info">
              <h2>📚 Загруженные работы</h2>
              <span className="works-count">{filteredUploads.length} из {uploads.length}</span>
            </div>
            <button onClick={fetchUploads} className="btn-secondary refresh-btn" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-small"></span>
                  Загрузка...
                </>
              ) : (
                <>
                  🔄 Обновить
                </>
              )}
            </button>
          </div>

          {uploads.length > 0 && (
            <SearchAndFilter 
              uploads={uploads} 
              onFilter={handleFilter}
            />
          )}
          
          {loading ? (
            <div className="loading-state">
              <div className="loading-content">
                <div className="spinner"></div>
                <h3>Загружаем работы...</h3>
                <p>Пожалуйста, подождите</p>
              </div>
            </div>
          ) : error ? (
            <div className="error-state">
              <div className="error-content">
                <div className="error-icon">❌</div>
                <h3>Упс! Что-то пошло не так</h3>
                <p>{error}</p>
                <button onClick={fetchUploads} className="btn-primary retry-btn">
                  🔄 Попробовать снова
                </button>
              </div>
            </div>
          ) : uploads.length === 0 ? (
            <div className="empty-state">
              <div className="empty-content">
                <div className="empty-icon">📭</div>
                <h3>Пока что работ нет</h3>
                <p>Будьте первым! Загрузите свою работу и поделитесь с группой</p>
                <Link to="/upload" className="btn-primary">
                  📤 Загрузить первую работу
                </Link>
              </div>
            </div>
          ) : filteredUploads.length === 0 ? (
            <div className="empty-state">
              <div className="empty-content">
                <div className="empty-icon">🔍</div>
                <h3>Ничего не найдено</h3>
                <p>Попробуйте изменить критерии поиска или сбросить фильтры</p>
              </div>
            </div>
          ) : (
            <div className="uploads-grid">
              {filteredUploads.map((upload, index) => (
                <WorkCard 
                  key={`${upload.fullName}-${upload.timestamp}`} 
                  upload={upload} 
                  index={index}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default HomePage; 