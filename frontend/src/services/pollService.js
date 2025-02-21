// src/services/pollService.js
import api from './api';

export const getPolls = async (token) => {
  const response = await api.get('/polls', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const getPollById = async (pollId) => {
  const response = await api.get(`/polls/${pollId}`);
  return response.data;
};

export const createPoll = async (pollData) => {
  const response = await api.post('/polls', pollData);
  return response.data;
};
