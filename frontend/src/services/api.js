// src/services/api.js
import axios from 'axios';

const API_URL = 'http://localhost:3000/api'; // Change to your backend URL

const api = axios.create({
  baseURL: API_URL,
});

export default api;
