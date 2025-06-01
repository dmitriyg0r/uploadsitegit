import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button 
      className="theme-toggle"
      onClick={toggleTheme}
      title={`Переключить на ${theme === 'dark' ? 'светлую' : 'темную'} тему`}
      aria-label={`Переключить на ${theme === 'dark' ? 'светлую' : 'темную'} тему`}
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}

export default ThemeToggle; 