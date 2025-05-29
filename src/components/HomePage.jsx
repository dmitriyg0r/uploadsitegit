import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function HomePage() {
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingFiles, setDownloadingFiles] = useState(new Set());

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
      setError('');
    } catch (error) {
      console.error('Ошибка получения списка загрузок:', error);
      setError('Ошибка загрузки данных');
      setUploads([]);
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

  const FileCard = ({ fileName, fileType, fullName, upload }) => {
    const [fileSize, setFileSize] = useState('Загрузка...');
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
            <span className="file-name" title={fileName}>{fileName}</span>
          </div>
        </div>
        <div className="file-size-col">
          <span className="file-size">{fileSize}</span>
        </div>
        <div className="file-actions-col">
          <button 
            className="action-btn download-btn"
            onClick={() => downloadFile(fullName, fileName, fileType)}
            disabled={isDownloading}
            title="Скачать файл"
          >
            {isDownloading ? (
              <>
                <span className="spinner-small"></span>
              </>
            ) : (
              '↓'
            )}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="home-page">
      <header className="page-header">
        <h1>Проекты студентов группы 18ПрД4310</h1>
        <p>Просмотр загруженных работ</p>
        <Link to="/upload" className="upload-link">
          ↗ Загрузить работу
        </Link>
      </header>

      <main className="main-content">
        <div className="uploads-section">
          <div className="section-header">
            <h2>Загруженные работы ({uploads.length})</h2>
            <button onClick={fetchUploads} className="refresh-button">
              ↻ Обновить
            </button>
          </div>
          
          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
              <p>Загружаем данные...</p>
            </div>
          ) : error ? (
            <div className="error-message">
              <p>✗ {error}</p>
              <button onClick={fetchUploads} className="retry-button">
                Попробовать снова
              </button>
            </div>
          ) : uploads.length === 0 ? (
            <div className="no-uploads">
              <h3>Пока что никто не загрузил файлы</h3>
              <p>Будьте первым! <Link to="/upload">Загрузите свою работу</Link></p>
            </div>
          ) : (
            <div className="uploads-grid">
              {uploads.map((upload, index) => (
                <div key={index} className="upload-card">
                  <div className="upload-header">
                    <div className="student-info">
                      <h3>{upload.fullName}</h3>
                      <div className="upload-meta">
                        <span className="upload-date">
                          📅 {new Date(upload.timestamp).toLocaleString('ru-RU')}
                        </span>
                        {upload.group && (
                          <span className="group-badge">
                            👥 {upload.group}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="upload-actions">
                      <button className="action-btn share-btn" title="Поделиться">
                        🔗
                      </button>
                      <button className="action-btn more-btn" title="Больше действий">
                        ⋯
                      </button>
                    </div>
                  </div>

                  <div className="upload-details">
                    {upload.subject && (
                      <div className="detail-item">
                        <span className="label">📚 Предмет:</span>
                        <span className="value">{upload.subject}</span>
                      </div>
                    )}
                    
                    <div className="files-section">
                      <h4>Файлы ({Object.keys(upload.files).length})</h4>
                      <div className="files-table">
                        {upload.files.exe && (
                          <FileCard 
                            fileName={upload.files.exe}
                            fileType="exe"
                            fullName={upload.fullName}
                            upload={upload}
                          />
                        )}
                        {upload.files.docx && (
                          <FileCard 
                            fileName={upload.files.docx}
                            fileType="docx"
                            fullName={upload.fullName}
                            upload={upload}
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="upload-footer">
                    <div className="upload-stats">
                      <span className="stat-item">
                        📊 Всего файлов: {Object.keys(upload.files).length}
                      </span>
                      <span className="stat-item">
                        🕒 Загружено: {new Date(upload.timestamp).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default HomePage; 