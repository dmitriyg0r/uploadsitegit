import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function HomePage() {
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    fetchUploads();
  }, []);

  const fetchUploads = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/uploads`);
      setUploads(response.data);
      setError('');
    } catch (error) {
      console.error('Ошибка получения списка загрузок:', error);
      setError('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-page">
      <header className="page-header">
        <h1>📚 Работы студентов</h1>
        <p>Просмотр загруженных программ и документации одногруппников</p>
        <Link to="/upload" className="upload-link">
          📤 Загрузить свою работу
        </Link>
      </header>

      <main className="main-content">
        <div className="uploads-section">
          <div className="section-header">
            <h2>Загруженные работы ({uploads.length})</h2>
            <button onClick={fetchUploads} className="refresh-button">
              🔄 Обновить
            </button>
          </div>
          
          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
              <p>Загружаем данные...</p>
            </div>
          ) : error ? (
            <div className="error-message">
              <p>❌ {error}</p>
              <button onClick={fetchUploads} className="retry-button">
                Попробовать снова
              </button>
            </div>
          ) : uploads.length === 0 ? (
            <div className="no-uploads">
              <h3>📁 Пока что никто не загрузил файлы</h3>
              <p>Будьте первым! <Link to="/upload">Загрузите свою работу</Link></p>
            </div>
          ) : (
            <div className="uploads-grid">
              {uploads.map((upload, index) => (
                <div key={index} className="upload-card">
                  <div className="upload-header">
                    <h3>{upload.fullName}</h3>
                    <span className="upload-date">
                      {new Date(upload.timestamp).toLocaleString('ru-RU')}
                    </span>
                  </div>
                  <div className="upload-details">
                    {upload.group && (
                      <div className="detail-item">
                        <span className="label">Группа:</span>
                        <span className="value">{upload.group}</span>
                      </div>
                    )}
                    {upload.subject && (
                      <div className="detail-item">
                        <span className="label">Предмет:</span>
                        <span className="value">{upload.subject}</span>
                      </div>
                    )}
                    <div className="files-section">
                      <h4>Файлы:</h4>
                      <div className="file-list">
                        <div className="file-item exe-file">
                          <span className="file-icon">🗃️</span>
                          <span className="file-name">{upload.files.exe}</span>
                        </div>
                        <div className="file-item docx-file">
                          <span className="file-icon">📄</span>
                          <span className="file-name">{upload.files.docx}</span>
                        </div>
                      </div>
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