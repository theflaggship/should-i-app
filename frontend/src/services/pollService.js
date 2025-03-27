// src/services/pollService.js

import api from './api';

let voteSocket;    // Vote WebSocket
let commentSocket; // Comment WebSocket

// --------------------
// Poll REST API Calls
// --------------------
export const getPolls = async (token) => {
  try {
    const response = await api.get('/polls', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getPollsPaginated = async (token, limit, offset) => {
  try {
    const response = await api.get('/polls', {
      headers: { Authorization: `Bearer ${token}` },
      params: { limit, offset }, // <--- pass them as query params
    });
    // The server returns: { totalCount, polls: [...] }
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getFollowingPolls = async (token) => {
  try {
    const response = await api.get('/polls/following', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getFollowingPollsPaginated = async (token, limit, offset) => {
  try {
    const response = await api.get('/polls/following', {
      headers: { Authorization: `Bearer ${token}` },
      params: { limit, offset }, // <--- pass them as query params
    });
    // The server returns: { totalCount, polls: [...] }
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getPollById = async (pollId, token) => {
  const response = await api.get(`/polls/${pollId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const createPoll = async (token, pollData) => {
  try {
    const response = await api.post('/polls', pollData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deletePoll = async (token, pollId) => {
  try {
    const response = await api.delete(`/polls/${pollId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updatePoll = async (token, pollId, data) => {
  try {
    // If your backend uses PUT /polls/:id
    const response = await api.put(`/polls/${pollId}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    // e.g. { message: 'Poll updated successfully', poll: {...} }
    return response.data;
  } catch (error) {
    throw error;
  }
};

// -----------------------
// Comment REST API Calls
// -----------------------
export const addComment = async (pollId, text) => {
  const response = await api.post(`/comments/${pollId}`, { text });
  return response.data;
};

export const getCommentsForPoll = async (pollId) => {
  const response = await api.get(`/comments/${pollId}`);
  return response.data;
};

// Update a comment
export const updateComment = async (commentId, text, token) => {
  const { data } = await api.put(
    `/comments/${commentId}`,
    { commentText: text },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return data.comment;
};

// Delete a comment
export const deleteComment = async (commentId, token) => {
  await api.delete(`/comments/${commentId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

// ---------------------
// Vote WebSocket Logic
// ---------------------
export const connectVoteSocket = (onVoteUpdate) => {
  // onVoteUpdate is a callback, e.g. (pollId, userVote, options) => ...
  voteSocket = new WebSocket('ws://localhost:3000'); // default path

  voteSocket.onopen = () => {
    console.log('Vote WebSocket connected');
  };

  voteSocket.onmessage = (event) => {
    // The server sends: { pollId, userVote, options: [...] }
    const { pollId, userVote, options } = JSON.parse(event.data);
    onVoteUpdate(pollId, userVote, options);
  };

  voteSocket.onclose = () => {
    console.log('Vote WebSocket disconnected, attempting to reconnect...');
    setTimeout(() => connectVoteSocket(onVoteUpdate), 3000); // Auto-reconnect
  };
};

export const sendVoteWS = (userId, pollId, pollOptionId) => {
  if (voteSocket && voteSocket.readyState === WebSocket.OPEN) {
    voteSocket.send(JSON.stringify({ userId, pollId, pollOptionId }));
  } else {
    console.error('Vote WebSocket is not connected.');
  }
};

// -------------------------
// Comment WebSocket Logic
// -------------------------
export const connectCommentSocket = (onNewComment) => {
  // onNewComment is a callback, e.g. (pollId, comment) => ...
  commentSocket = new WebSocket('ws://localhost:3000/comments');

  commentSocket.onopen = () => {
    console.log('Comment WebSocket connected');
  };

  commentSocket.onmessage = (event) => {
    // The server broadcasts: { pollId, comment: { id, text, createdAt, User } }
    const { pollId, comment } = JSON.parse(event.data);
    onNewComment(pollId, comment);
  };

  commentSocket.onclose = () => {
    console.log('Comment WebSocket disconnected, attempting to reconnect...');
    setTimeout(() => connectCommentSocket(onNewComment), 3000);
  };
};

export const sendCommentWS = (userId, pollId, commentText) => {
  if (commentSocket && commentSocket.readyState === WebSocket.OPEN) {
    commentSocket.send(JSON.stringify({ userId, pollId, commentText }));
  } else {
    console.error('Comment WebSocket is not connected.');
  }
};
