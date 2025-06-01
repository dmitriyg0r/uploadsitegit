import React, { useState, useEffect } from 'react';

function SearchAndFilter({ uploads, onFilter, onSort }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');
  const [filterBy, setFilterBy] = useState('all');

  // Получаем уникальные группы и предметы для фильтров
  const uniqueGroups = [...new Set(uploads.map(u => u.group).filter(Boolean))];
  const uniqueSubjects = [...new Set(uploads.map(u => u.subject).filter(Boolean))];

  useEffect(() => {
    let filtered = uploads;

    // Поиск по названию, автору или предмету
    if (searchTerm) {
      filtered = filtered.filter(upload => {
        const title = upload.title || '';
        const authors = upload.authors || [upload.fullName];
        const subject = upload.subject || '';
        
        const searchText = searchTerm.toLowerCase();
        
        return (
          title.toLowerCase().includes(searchText) ||
          authors.some(author => author.toLowerCase().includes(searchText)) ||
          subject.toLowerCase().includes(searchText)
        );
      });
    }

    // Фильтрация по группе/предмету
    if (filterBy !== 'all') {
      if (filterBy.startsWith('group-')) {
        const group = filterBy.replace('group-', '');
        filtered = filtered.filter(upload => upload.group === group);
      } else if (filterBy.startsWith('subject-')) {
        const subject = filterBy.replace('subject-', '');
        filtered = filtered.filter(upload => upload.subject === subject);
      }
    }

    // Сортировка
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.timestamp) - new Date(a.timestamp);
        case 'date-asc':
          return new Date(a.timestamp) - new Date(b.timestamp);
        case 'title-asc':
          const titleA = (a.title || '').toLowerCase();
          const titleB = (b.title || '').toLowerCase();
          return titleA.localeCompare(titleB);
        case 'title-desc':
          const titleA2 = (a.title || '').toLowerCase();
          const titleB2 = (b.title || '').toLowerCase();
          return titleB2.localeCompare(titleA2);
        case 'author-asc':
          return a.fullName.toLowerCase().localeCompare(b.fullName.toLowerCase());
        case 'author-desc':
          return b.fullName.toLowerCase().localeCompare(a.fullName.toLowerCase());
        default:
          return 0;
      }
    });

    onFilter(filtered);
  }, [searchTerm, sortBy, filterBy, uploads, onFilter]);

  const clearFilters = () => {
    setSearchTerm('');
    setSortBy('date-desc');
    setFilterBy('all');
  };

  const hasActiveFilters = searchTerm || sortBy !== 'date-desc' || filterBy !== 'all';

  return (
    <div className="search-filter-container">
      <div className="search-row">
        <div className="search-input-container">
          <input
            type="text"
            placeholder="🔍 Поиск по названию, автору или предмету..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button
              className="clear-search-btn"
              onClick={() => setSearchTerm('')}
              title="Очистить поиск"
            >
              ✕
            </button>
          )}
        </div>
        
        {hasActiveFilters && (
          <button
            className="clear-filters-btn"
            onClick={clearFilters}
            title="Сбросить все фильтры"
          >
            🗑️ Сбросить
          </button>
        )}
      </div>

      <div className="filters-row">
        <div className="filter-group">
          <label htmlFor="sort-select">Сортировка:</label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="filter-select"
          >
            <option value="date-desc">📅 Сначала новые</option>
            <option value="date-asc">📅 Сначала старые</option>
            <option value="title-asc">📝 По названию (А-Я)</option>
            <option value="title-desc">📝 По названию (Я-А)</option>
            <option value="author-asc">👤 По автору (А-Я)</option>
            <option value="author-desc">👤 По автору (Я-А)</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="filter-select">Фильтр:</label>
          <select
            id="filter-select"
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
            className="filter-select"
          >
            <option value="all">Все работы</option>
            
            {uniqueGroups.length > 0 && (
              <optgroup label="По группе">
                {uniqueGroups.map(group => (
                  <option key={group} value={`group-${group}`}>
                    👥 {group}
                  </option>
                ))}
              </optgroup>
            )}
            
            {uniqueSubjects.length > 0 && (
              <optgroup label="По предмету">
                {uniqueSubjects.map(subject => (
                  <option key={subject} value={`subject-${subject}`}>
                    📚 {subject}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>
      </div>
    </div>
  );
}

export default SearchAndFilter; 