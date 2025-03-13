// src/services/followService.js

import api from './api';

export const followUser = async (followingId, token) => {
  const response = await api.post(
    '/follow',
    { followingId },  // body
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return response.data; // { message: 'User followed', follow: { followerId, followingId } }
};

export const unfollowUser = async (followingId, token) => {
  // Note: For DELETE requests with a request body, we pass it in "data" inside config:
  const response = await api.delete('/follow', {
    data: { followingId },
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data; // { message: 'User unfollowed' }
};

export const getFollowers = async (userId, token) => {
  const response = await api.get(`/follow/${userId}/followers`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data; // e.g. [ { followerId, followingId, createdAt, ... }, ... ]
};

export const getFollowing = async (userId, token) => {
  const response = await api.get(`/follow/${userId}/following`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data; // e.g. [ { followerId, followingId, createdAt, ... }, ... ]
};
