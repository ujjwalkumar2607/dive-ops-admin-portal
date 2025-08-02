import axios from 'axios';
const API_URL = `${import.meta.env.VITE_API_URL}/api/crew`;

export const getCrew = () => axios.get(API_URL).then(r => r.data);
export const createCrew = crew => axios.post(API_URL, crew).then(r => r.data);
export const updateCrew = crew =>
  axios.put(`${API_URL}/${crew._id}`, crew).then(r => r.data);
export const deleteCrew = id =>
  axios.delete(`${API_URL}/${id}`).then(r => r.data);
