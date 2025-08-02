// src/services/authService.js
import axios from 'axios';

/**
 * Save the JWT to localStorage and set up Axios to send it
 * on every request automatically.
 */
export function saveAuthToken(token) {
  localStorage.setItem('token', token);
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

/**
 * Call this once on app startup (e.g. in index.js or App.jsx)
 * so that if a token is already in localStorage, it still
 * gets applied to axios headers.
 */
export function loadAuthToken() {
  const token = localStorage.getItem('token');
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
}
