// src/services/scheduleService.js
import axios from 'axios';
const API_URL = `${import.meta.env.VITE_API_URL}/api/schedule`;


function normalizeDate(date) {
  return typeof date === 'string' ? date : date.toISOString().slice(0, 10);
}

export const getSchedule = date =>
  axios
    .get(API_URL, { params: { date: normalizeDate(date) } })
    .then(r => r.data);

export const saveSchedule = (date, slots) =>
  axios
    .post(API_URL, { date: normalizeDate(date), slots })
    .then(r => r.data);