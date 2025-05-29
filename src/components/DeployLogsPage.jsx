import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const DeployLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [uploads, setUploads] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deploying, setDeploying] = useState(false);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('logs');
  const [deletingItems, setDeletingItems] = useState(new Set());

  const API_URL = import.meta.env.VITE_API_URL || '';
  
  // Простая проверка пароля
  const adminPassword = 'admin123';

  const handleAuth = (e) => {
    e.preventDefault();
    if (password === adminPassword) {
      setIsAuthenticated(true);
      sessionStorage.setItem('adminAuth', 'true');
      setError(null);
    } else {
      setError('Неверный пароль администратора');
    }
  };

  // Проверяем аутентификацию при загрузке
  useEffect(() => {
    const savedAuth = sessionStorage.getItem('adminAuth');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // Загрузка логов
  const fetchLogs = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/deploy-logs/latest`);
      setLogs(response.data.logs || []);
    } catch (err) {
      setError('Ошибка загрузки логов: ' + err.message);
    }
  };

  // Загрузка списка работ
  const fetchUploads = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/uploads`);
      setUploads(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError('Ошибка загрузки работ: ' + err.message);
    }
  };

  // Загрузка статистики
  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/admin/stats`);
      setStats(response.data);
    } catch (err) {
      setError('Ошибка загрузки статистики: ' + err.message);
    }
  };

  // Общая функция загрузки данных
  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchLogs(),
        fetchUploads(),
        fetchStats()
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Ручной запуск развертывания
  const handleManualDeploy = async () => {
    if (deploying) return;
    
    setDeploying(true);
    try {
      await axios.post(`${API_URL}/api/deploy`);
      setTimeout(fetchLogs, 1000); // Обновляем логи через секунду
    } catch (err) {
      setError('Ошибка запуска развертывания: ' + err.message);
    } finally {
      setDeploying(false);
    }
  };

  // Удаление работы
  const handleDeleteUpload = async (fullName) => {
    if (!confirm(`Вы уверены, что хотите удалить работу студента "${fullName}"? Это действие нельзя отменить.`)) {
      return;
    }

    setDeletingItems(prev => new Set(prev).add(fullName));
    
    try {
      await axios.delete(`${API_URL}/api/admin/uploads/${encodeURIComponent(fullName)}`);
      await fetchUploads(); // Обновляем список
      await fetchStats(); // Обновляем статистику
    } catch (err) {
      setError(`Ошибка удаления работы: ${err.response?.data?.error || err.message}`);
    } finally {
      setDeletingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(fullName);
        return newSet;
      });
    }
  };

  // Автообновление
  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
      
      let interval;
      if (autoRefresh && activeTab === 'logs') {
        interval = setInterval(fetchLogs, 3000);
      }
      
      return () => {
        if (interval) clearInterval(interval);
      };
    }
  }, [autoRefresh, isAuthenticated, activeTab]);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Байт';
    const k = 1024;
    const sizes = ['Байт', 'КБ', 'МБ', 'ГБ'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatLogLine = (line) => {
    const parts = line.match(/\[(.*?)\] \[(.*?)\] (.*)/);
    if (parts) {
      const [, timestamp, level, message] = parts;
      const time = new Date(timestamp).toLocaleTimeString();
      const levelClass = level === 'ERROR' ? 'error' : level === 'INFO' ? 'info' : 'default';
      
      return (
        <div key={`${timestamp}-${Math.random()}`} className={`log-line ${levelClass}`}>
          <span className="log-time">{time}</span>
          <span className={`log-level ${levelClass}`}>{level}</span>
          <span className="log-message">{message}</span>
        </div>
      );
    }
    
    return (
      <div key={`${line}-${Math.random()}`} className="log-line">
        <span className="log-message">{line}</span>
      </div>
    );
  };

  // Формируем строку с авторами для админ панели
  const getAuthorsDisplayForAdmin = (upload) => {
    if (upload.authors && upload.authors.length > 0) {
      return upload.authors;
    } else if (upload.secondAuthor) {
      // Поддержка старого формата данных
      return [upload.fullName, upload.secondAuthor];
    }
    return [upload.fullName];
  };

  // Получаем название работы или fallback для админ панели
  const getWorkTitleForAdmin = (upload) => {
    return upload.title || `Работа от ${upload.fullName}`;
  };

  // Если не аутентифицирован, показываем форму входа
  if (!isAuthenticated) {
    return (
      <div className="admin-page">
        <div className="login-container">
          <div className="login-header">
            <h1>🔐 Административная панель</h1>
            <p>Введите пароль для доступа к панели управления</p>
          </div>
          
          <form onSubmit={handleAuth} className="login-form">
            <div className="form-group">
              <label htmlFor="password">Пароль администратора:</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Введите пароль"
                required
              />
            </div>
            
            {error && (
              <div className="error-message">
                ❌ {error}
              </div>
            )}
            
            <button type="submit" className="login-button">
              🚀 Войти в админ-панель
            </button>
          </form>
          
          <div className="back-link">
            <Link to="/">← Вернуться на главную</Link>
          </div>
        </div>
      </div>
    );
  }

  // Основной интерфейс админ панели
  return (
    <div className="admin-page">
      <header className="admin-header">
        <div className="admin-header-content">
          <h1>⚙️ Административная панель</h1>
          <div className="admin-actions">
            <Link to="/" className="back-link">← На главную</Link>
            <button 
              onClick={() => {
                setIsAuthenticated(false);
                sessionStorage.removeItem('adminAuth');
              }}
              className="logout-button"
            >
              🚪 Выйти
            </button>
          </div>
        </div>
      </header>

      <div className="admin-tabs">
        <button 
          className={`tab-button ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          📊 Статистика
        </button>
        <button 
          className={`tab-button ${activeTab === 'uploads' ? 'active' : ''}`}
          onClick={() => setActiveTab('uploads')}
        >
          📁 Управление работами
        </button>
        <button 
          className={`tab-button ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          📋 Логи развертывания
        </button>
      </div>

      <div className="admin-content">
        {/* Вкладка статистики */}
        {activeTab === 'stats' && (
          <div className="stats-section">
            <div className="section-header">
              <h2>📊 Статистика</h2>
              <button onClick={fetchStats} className="refresh-button">
                ↻ Обновить
              </button>
            </div>
            
            {stats && (
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-value">{stats.totalUploads}</div>
                  <div className="stat-label">Всего работ</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{formatFileSize(stats.totalSize)}</div>
                  <div className="stat-label">Общий размер</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{Object.keys(stats.uploadsByDate).length}</div>
                  <div className="stat-label">Дней с загрузками</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{stats.recentUploads.length}</div>
                  <div className="stat-label">Недавних загрузок</div>
                </div>
              </div>
            )}
            
            {stats?.recentUploads && stats.recentUploads.length > 0 && (
              <div className="recent-uploads">
                <h3>🕒 Последние загрузки</h3>
                <div className="recent-uploads-list">
                  {stats.recentUploads.map((upload, index) => (
                    <div key={index} className="recent-upload-item">
                      <div className="upload-info">
                        <span className="student-name">{upload.fullName}</span>
                        {upload.group && <span className="group-badge">{upload.group}</span>}
                      </div>
                      <span className="upload-time">
                        {new Date(upload.timestamp).toLocaleString('ru-RU')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Вкладка управления работами */}
        {activeTab === 'uploads' && (
          <div className="uploads-section">
            <div className="section-header">
              <h2>📁 Управление работами ({uploads.length})</h2>
              <button onClick={fetchUploads} className="refresh-button">
                ↻ Обновить
              </button>
            </div>
            
            {loading ? (
              <div className="loading">
                <div className="spinner"></div>
                <p>Загружаем данные...</p>
              </div>
            ) : uploads.length === 0 ? (
              <div className="no-uploads">
                <p>Загруженных работ пока нет</p>
              </div>
            ) : (
              <div className="uploads-table">
                <div className="table-header">
                  <div className="col-student">Название / Студент</div>
                  <div className="col-group">Группа</div>
                  <div className="col-subject">Предмет</div>
                  <div className="col-date">Дата загрузки</div>
                  <div className="col-files">Файлы</div>
                  <div className="col-actions">Действия</div>
                </div>
                
                {uploads.map((upload, index) => (
                  <div key={index} className="table-row">
                    <div className="col-student">
                      <Link 
                        to={`/work/${encodeURIComponent(upload.fullName)}`} 
                        className="work-title-admin-link"
                      >
                        <strong>{getWorkTitleForAdmin(upload)}</strong>
                      </Link>
                      <div className="authors-admin-list" style={{ fontSize: '12px', color: '#8b949e', marginTop: '4px' }}>
                        👤 {getAuthorsDisplayForAdmin(upload).map((author, index) => (
                          <div key={index} style={{ marginLeft: '16px' }}>{author}</div>
                        ))}
                      </div>
                      {(upload.authors && upload.authors.length > 1) || upload.secondAuthor ? (
                        <div style={{ fontSize: '11px', color: '#58a6ff', marginTop: '2px' }}>
                          👥 Совместная работа ({upload.authors ? upload.authors.length : 2} автора)
                        </div>
                      ) : null}
                    </div>
                    <div className="col-group">
                      {upload.group || '—'}
                    </div>
                    <div className="col-subject">
                      {upload.subject || '—'}
                    </div>
                    <div className="col-date">
                      {new Date(upload.timestamp).toLocaleString('ru-RU')}
                    </div>
                    <div className="col-files">
                      {Object.keys(upload.files).length} файлов
                    </div>
                    <div className="col-actions">
                      <button
                        onClick={() => handleDeleteUpload(upload.fullName)}
                        disabled={deletingItems.has(upload.fullName)}
                        className="delete-button"
                        title="Удалить работу"
                      >
                        {deletingItems.has(upload.fullName) ? (
                          <>
                            <span className="spinner-small"></span>
                          </>
                        ) : (
                          '🗑️'
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Вкладка логов */}
        {activeTab === 'logs' && (
          <div className="logs-section">
            <div className="section-header">
              <h2>📋 Логи развертывания</h2>
              <div className="logs-controls">
                <label className="auto-refresh-toggle">
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                  />
                  Автообновление
                </label>
                <button onClick={fetchLogs} className="refresh-button">
                  ↻ Обновить
                </button>
                <button 
                  onClick={handleManualDeploy} 
                  disabled={deploying}
                  className="deploy-button"
                >
                  {deploying ? '⏳ Развертывание...' : '🚀 Запустить развертывание'}
                </button>
              </div>
            </div>
            
            <div className="logs-container">
              {loading ? (
                <div className="loading">Загрузка логов...</div>
              ) : logs.length === 0 ? (
                <div className="no-logs">Логов пока нет</div>
              ) : (
                <div className="logs-content">
                  {logs.map((line, index) => formatLogLine(line))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="error-toast">
          <span>❌ {error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}
    </div>
  );
};

export default DeployLogsPage; 