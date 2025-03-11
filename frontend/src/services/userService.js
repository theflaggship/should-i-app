import api from './api';

export const getUserPolls = async (userId, token) => {
  const response = await api.get(`/users/${userId}/polls`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const getUserComments = async (userId, token) => {
    const response = await api.get(`/users/${userId}/comments`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};
  

export const getUserVotes = async (userId, token) => {
  const response = await api.get(`/users/${userId}/votes`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const getUserStats = async (userId, token) => {
  const response = await api.get(`/users/${userId}/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data; // { followers, following, totalPolls, totalVotes }
};