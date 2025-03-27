import api from './api';

// Perform a unified search of users and polls
export const searchUsersAndPolls = async (query, token) => {
  try {
    const res = await api.get(`/search`, {
      params: { query },
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data; // { users: [...], polls: [...] }
  } catch (err) {
    console.error('Search error:', err.response?.data || err.message);
    throw err;
  }
};