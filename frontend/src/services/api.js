import axios from 'axios';

// const API = axios.create({
//   baseURL: import.meta.env.VITE_API_URL,  // ✅ use import.meta.env
// });

const API = import.meta.env.VITE_API_URL;

export const getTest = () => API.get('/api/test');
export const login = (form) => API.post('/api/login', form);