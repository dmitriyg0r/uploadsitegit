import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import UploadPage from './components/UploadPage';
import DeployLogsPage from './components/DeployLogsPage';
import WorkDetailsPage from './components/WorkDetailsPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/deploy-logs" element={<DeployLogsPage />} />
          <Route path="/work/:authorName" element={<WorkDetailsPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
