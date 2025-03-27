// userService.js
import api from './api';

// ─────────────────────────────────────────────────────────────────────────────
// NON-PAGINATED METHODS
// ─────────────────────────────────────────────────────────────────────────────
export const getUserPolls = async (userId, token) => {
  // Returns an array or some structure (non-paginated)
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

// ─────────────────────────────────────────────────────────────────────────────
// PAGINATED METHODS
// ─────────────────────────────────────────────────────────────────────────────
export const getUserPollsPaginated = async (userId, token, limit = 10, offset = 0) => {
  const response = await api.get(`/users/${userId}/polls`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { limit, offset },  // pass pagination as query params
  });
  // The server should return something like:
  // { totalCount: number, polls: [...pollObjects...] }
  return response.data;
};

export const getUserCommentsPaginated = async (userId, token, limit = 10, offset = 0) => {
  const response = await api.get(`/users/${userId}/comments`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { limit, offset },
  });
  // The server should return something like:
  // { totalCount: number, comments: [...commentObjects...] }
  return response.data;
};

export const getUserVotesPaginated = async (userId, token, limit = 10, offset = 0) => {
  const response = await api.get(`/users/${userId}/votes`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { limit, offset },
  });
  // The server should return something like:
  // { totalCount: number, polls: [...], or some structure of voted items }
  return response.data;
};

// ─────────────────────────────────────────────────────────────────────────────
// SUGGESTED USERS FOR SEARCH
// ─────────────────────────────────────────────────────────────────────────────

export const getSuggestedUsers = async (userId, token) => {
  try {
    const res = await api.get(`/users/${userId}/suggested`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (err) {
    console.error('getSuggestedUsers error:', err.response?.data || err.message);
    throw err;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// USER STATS, PROFILE, ETC.
// ─────────────────────────────────────────────────────────────────────────────
export const getUserStats = async (userId, token) => {
  const response = await api.get(`/users/${userId}/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data; // e.g. { followers, following, totalPolls, totalVotes }
};

export const getUserById = async (userId, token) => {
  const response = await api.get(`/users/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data; // user object
};

export const updateUserProfile = async (userId, token, payload) => {
  // e.g. { displayName, status, personalSummary, profilePicture }
  const response = await api.put(`/users/${userId}`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data; // { message, user }
};
