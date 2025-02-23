// src/services/pollService.js
import api from './api';

let socket; // Vote WebSocket
let commentSocket; // Comment WebSocket

// --------------------
// Poll REST API Calls
// --------------------
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

// ---------------------
// Vote WebSocket Logic
// ---------------------
export const connectWebSocket = (updatePollState) => {
  socket = new WebSocket('ws://localhost:3000'); // Adjust for production

  socket.onopen = () => {
    console.log('Vote WebSocket connected');
  };

  socket.onmessage = (event) => {
    const { pollId, options } = JSON.parse(event.data);
    // Update poll data in frontend state
    updatePollState(pollId, options);
  };

  socket.onclose = () => {
    console.log('Vote WebSocket disconnected, attempting to reconnect...');
    setTimeout(() => connectWebSocket(updatePollState), 3000); // Auto-reconnect
  };
};

export const sendVote = (userId, pollId, pollOptionId) => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ userId, pollId, pollOptionId }));
  } else {
    console.error('Vote WebSocket is not connected.');
  }
};

// -------------------------
// Comment WebSocket Logic
// -------------------------
export const connectCommentSocket = (updateCommentState) => {
  commentSocket = new WebSocket('ws://localhost:3000/comments'); // Adjust URL as needed

  commentSocket.onopen = () => {
    console.log('Comment WebSocket connected');
  };

  commentSocket.onmessage = (event) => {
    // Expected message: { pollId: <id>, comment: { ... } }
    const { pollId, comment } = JSON.parse(event.data);
    // Call the provided callback to update comments state
    updateCommentState(pollId, comment);
  };

  commentSocket.onclose = () => {
    console.log('Comment WebSocket disconnected, attempting to reconnect...');
    setTimeout(() => connectCommentSocket(updateCommentState), 3000); // Auto-reconnect
  };
};

export const sendCommentWS = (userId, pollId, text) => {
  if (commentSocket && commentSocket.readyState === WebSocket.OPEN) {
    commentSocket.send(JSON.stringify({ userId, pollId, text }));
  } else {
    console.error('Comment WebSocket is not connected.');
  }
};
