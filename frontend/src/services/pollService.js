// src/services/pollService.js
import api from './api';

export const getPolls = async () => {
  const response = await api.get('/polls');
  return response.data;
};

export const getPollById = async (pollId) => {
  const response = await api.get(`/polls/${pollId}`);
  return response.data;
};

// Additional functions for creating/updating polls can be added here.
