import React from 'react';
import { createRoot } from 'react-dom/client';
import { loadAuthToken } from './services/authService';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

loadAuthToken();

const root = createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
