// src/services/pollService.js
import api from './api';

let voteSocket; // Vote WebSocket
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
export const connectVoteSocket = (updatePollState) => {
  voteSocket = new WebSocket('ws://localhost:3000'); // Adjust for production

  voteSocket.onopen = () => {
    console.log('Vote WebSocket connected');
  };

  voteSocket.onmessage = (event) => {
    // The server sends: { pollId, options: [ { id, text, votes }, ... ] }
    const { pollId, options } = JSON.parse(event.data);

    // Pass the array directly to updatePollState
    updatePollState(pollId, options);
  };

  voteSocket.onclose = () => {
    console.log('Vote WebSocket disconnected, attempting to reconnect...');
    setTimeout(() => connectVoteSocket(updatePollState), 3000); // Auto-reconnect
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
export const connectCommentSocket = (updateCommentState) => {
  commentSocket = new WebSocket('ws://localhost:3000/comments'); // Adjust URL as needed

  commentSocket.onopen = () => {
    console.log('Comment WebSocket connected');
  };

  commentSocket.onmessage = (event) => {
    // Expected message: { pollId: <id>, comment: { ... } }
    const { userId, pollId, commentText } = JSON.parse(event.data);
    // Call the provided callback to update comments state
    updateCommentState(userId, pollId, commentText);
  };

  commentSocket.onclose = () => {
    console.log('Comment WebSocket disconnected, attempting to reconnect...');
    setTimeout(() => connectCommentSocket(updateCommentState), 3000); // Auto-reconnect
  };
};

export const sendCommentWS = (userId, pollId, commentText) => {
  if (commentSocket && commentSocket.readyState === WebSocket.OPEN) {
    commentSocket.send(JSON.stringify({ userId, pollId, commentText }));
  } else {
    console.error('Comment WebSocket is not connected.');
  }
};
