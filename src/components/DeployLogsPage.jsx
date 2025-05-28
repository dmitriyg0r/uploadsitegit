import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const DeployLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deploying, setDeploying] = useState(false);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');

  // Простая проверка пароля (в реальном проекте используйте более безопасную аутентификацию)
  const adminPassword = 'admin123'; // В реальном проекте храните в переменных окружения

  const handleAuth = (e) => {
    e.preventDefault();
    if (password === adminPassword) {
      setIsAuthenticated(true);
      sessionStorage.setItem('adminAuth', 'true');
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
      const response = await axios.get('/api/deploy-logs/latest');
      setLogs(response.data.logs || []);
      setLoading(false);
    } catch (err) {
      setError('Ошибка загрузки логов: ' + err.message);
      setLoading(false);
    }
  };

  // Ручной запуск развертывания
  const handleManualDeploy = async () => {
    if (deploying) return;
    
    setDeploying(true);
    try {
      await axios.post('/api/deploy');
      // Логи обновятся автоматически через polling
    } catch (err) {
      setError('Ошибка запуска развертывания: ' + err.message);
    } finally {
      setDeploying(false);
    }
  };

  // Автообновление логов
  useEffect(() => {
    if (isAuthenticated) {
      fetchLogs();
      
      let interval;
      if (autoRefresh) {
        interval = setInterval(fetchLogs, 3000); // Обновляем каждые 3 секунды
      }
      
      return () => {
        if (interval) clearInterval(interval);
      };
    }
  }, [autoRefresh, isAuthenticated]);

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

  // Если не аутентифицирован, показываем форму входа
  if (!isAuthenticated) {
    return (
      <div className="admin-login">
        <div className="login-container">
          <div className="login-header">
            <h1>🔐 Административная панель</h1>
            <p>Введите пароль для доступа к логам развертывания</p>
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

        <style jsx>{`
          .admin-login {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
          }

          .login-container {
            background: white;
            border-radius: 16px;
            padding: 40px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            width: 100%;
            max-width: 400px;
          }

          .login-header {
            text-align: center;
            margin-bottom: 30px;
          }

          .login-header h1 {
            color: #2c3e50;
            margin: 0 0 10px 0;
            font-size: 2rem;
          }

          .login-header p {
            color: #64748b;
            margin: 0;
          }

          .form-group {
            margin-bottom: 20px;
          }

          .form-group label {
            display: block;
            margin-bottom: 8px;
            color: #374151;
            font-weight: 600;
          }

          .form-group input {
            width: 100%;
            padding: 12px 16px;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.2s;
          }

          .form-group input:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
          }

          .login-button {
            width: 100%;
            background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 14px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
          }

          .login-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
          }

          .error-message {
            background: #fee;
            border: 1px solid #fcc;
            color: #c33;
            padding: 12px;
            border-radius: 6px;
            margin: 15px 0;
            text-align: center;
          }

          .back-link {
            text-align: center;
            margin-top: 20px;
          }

          .back-link a {
            color: #667eea;
            text-decoration: none;
            font-weight: 500;
          }

          .back-link a:hover {
            text-decoration: underline;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="deploy-logs-page">
      <div className="header">
        <div className="admin-info">
          <h1>🛠️ Панель администратора</h1>
          <p>Система автоматического развертывания</p>
        </div>
        <div className="controls">
          <button 
            onClick={handleManualDeploy} 
            disabled={deploying}
            className="deploy-button"
          >
            {deploying ? '⏳ Развертывание...' : '🚀 Запустить развертывание'}
          </button>
          <label className="auto-refresh-toggle">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Автообновление
          </label>
          <button onClick={fetchLogs} className="refresh-button">
            🔄 Обновить
          </button>
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

      <div className="admin-nav">
        <Link to="/" className="nav-link">🏠 Главная</Link>
        <Link to="/upload" className="nav-link">📤 Загрузка файлов</Link>
        <span className="current-page">🚀 Логи развертывания</span>
      </div>

      {error && (
        <div className="error-message">
          ❌ {error}
          <button onClick={() => setError(null)}>✖</button>
        </div>
      )}

      <div className="logs-container">
        <div className="logs-header">
          <h3>📋 Последние логи развертывания</h3>
          <div className="status-indicator">
            <span className={`status-dot ${autoRefresh ? 'active' : 'inactive'}`}></span>
            {autoRefresh ? 'Обновляется автоматически' : 'Автообновление отключено'}
          </div>
        </div>
        
        <div className="logs-content">
          {loading ? (
            <div className="loading">⏳ Загрузка логов...</div>
          ) : logs.length > 0 ? (
            <div className="logs-list">
              {logs.map((line, index) => formatLogLine(line))}
            </div>
          ) : (
            <div className="no-logs">📝 Логов пока нет</div>
          )}
        </div>
      </div>

      <div className="instructions">
        <h3>📖 Инструкции по настройке</h3>
        <div className="instruction-card">
          <h4>1. Настройка GitHub Webhook</h4>
          <p>В настройках вашего GitHub репозитория добавьте webhook:</p>
          <code>URL: https://ваш-домен.com/webhook/github</code>
          <p>Content Type: application/json</p>
          <p>Events: Push events</p>
        </div>
        
        <div className="instruction-card">
          <h4>2. Автоматическое развертывание</h4>
          <p>После настройки webhook'а, каждый коммит в ветку main будет:</p>
          <ul>
            <li>Выполнять git pull</li>
            <li>Перезапускать PM2 процесс spacehub</li>
            <li>Запускать npm run start</li>
          </ul>
        </div>

        <div className="instruction-card">
          <h4>3. Безопасность</h4>
          <p>Рекомендации:</p>
          <ul>
            <li>Измените пароль администратора в коде</li>
            <li>Настройте HTTPS для webhook'ов</li>
            <li>Добавьте секретный ключ для GitHub webhook'а</li>
            <li>Ограничьте доступ к административной панели по IP</li>
          </ul>
        </div>
      </div>

      <style jsx>{`
        .deploy-logs-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 20px;
          border-bottom: 2px solid #e1e5e9;
        }

        .admin-info h1 {
          color: #2c3e50;
          margin: 0;
          font-size: 2.5rem;
        }

        .admin-info p {
          color: #64748b;
          margin: 5px 0 0 0;
          font-size: 1.1rem;
        }

        .admin-nav {
          display: flex;
          gap: 20px;
          margin-bottom: 30px;
          padding: 15px;
          background: #f8fafc;
          border-radius: 8px;
          align-items: center;
        }

        .nav-link {
          color: #667eea;
          text-decoration: none;
          padding: 8px 16px;
          border-radius: 6px;
          transition: background-color 0.2s;
        }

        .nav-link:hover {
          background: #e2e8f0;
        }

        .current-page {
          background: #667eea;
          color: white;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 600;
        }

        .controls {
          display: flex;
          gap: 15px;
          align-items: center;
        }

        .deploy-button {
          background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .deploy-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
        }

        .deploy-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .auto-refresh-toggle {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #555;
          cursor: pointer;
        }

        .refresh-button {
          background: #f8f9fa;
          border: 2px solid #dee2e6;
          padding: 10px 16px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .refresh-button:hover {
          background: #e9ecef;
          border-color: #adb5bd;
        }

        .logout-button {
          background: #dc3545;
          color: white;
          border: none;
          padding: 10px 16px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .logout-button:hover {
          background: #c82333;
        }

        .error-message {
          background: #fee;
          border: 1px solid #fcc;
          color: #c33;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .logs-container {
          background: #1e1e1e;
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 30px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }

        .logs-header {
          background: #2d3748;
          color: white;
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .logs-header h3 {
          margin: 0;
          font-size: 1.3rem;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.9rem;
        }

        .status-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }

        .status-dot.active {
          background: #4ade80;
          box-shadow: 0 0 10px #4ade80;
        }

        .status-dot.inactive {
          background: #64748b;
        }

        .logs-content {
          background: #1a1a1a;
          min-height: 400px;
          max-height: 600px;
          overflow-y: auto;
          padding: 20px;
        }

        .logs-list {
          font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace;
          font-size: 14px;
          line-height: 1.6;
        }

        .log-line {
          display: flex;
          align-items: center;
          padding: 6px 0;
          border-bottom: 1px solid #333;
        }

        .log-line:last-child {
          border-bottom: none;
        }

        .log-time {
          color: #64748b;
          margin-right: 12px;
          min-width: 80px;
          font-size: 12px;
        }

        .log-level {
          margin-right: 12px;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          min-width: 60px;
          text-align: center;
        }

        .log-level.info {
          background: #1e40af;
          color: #bfdbfe;
        }

        .log-level.error {
          background: #dc2626;
          color: #fecaca;
        }

        .log-message {
          color: #e2e8f0;
          flex: 1;
        }

        .loading {
          text-align: center;
          color: #64748b;
          padding: 40px;
          font-size: 1.1rem;
        }

        .no-logs {
          text-align: center;
          color: #64748b;
          padding: 40px;
          font-size: 1.1rem;
        }

        .instructions {
          background: #f8fafc;
          border-radius: 12px;
          padding: 30px;
        }

        .instructions h3 {
          color: #1e293b;
          margin-top: 0;
          margin-bottom: 20px;
        }

        .instruction-card {
          background: white;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 15px;
          border-left: 4px solid #667eea;
        }

        .instruction-card h4 {
          color: #374151;
          margin-top: 0;
          margin-bottom: 10px;
        }

        .instruction-card code {
          background: #f1f5f9;
          padding: 4px 8px;
          border-radius: 4px;
          font-family: 'SF Mono', monospace;
          color: #475569;
          display: inline-block;
          margin: 8px 0;
        }

        .instruction-card ul {
          margin: 10px 0;
          padding-left: 20px;
        }

        .instruction-card li {
          margin: 5px 0;
          color: #4b5563;
        }
      `}</style>
    </div>
  );
};

export default DeployLogsPage; 