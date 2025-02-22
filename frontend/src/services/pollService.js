// src/services/pollService.js
import api from './api';

let socket;

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

// WebSocket: Connect and listen for poll updates
export const connectWebSocket = (updatePollState) => {
  socket = new WebSocket('ws://localhost:3000'); // Change this for production

  socket.onopen = () => {
    console.log('WebSocket connected');
  };

  socket.onmessage = (event) => {
    const { pollId, options } = JSON.parse(event.data);

    // Update poll data in frontend state
    updatePollState(pollId, options);
  };

  socket.onclose = () => {
    console.log('WebSocket disconnected, attempting to reconnect...');
    setTimeout(() => connectWebSocket(updatePollState), 3000); // Auto-reconnect
  };
};

// WebSocket: Send vote to backend
export const sendVote = (userId, pollId, pollOptionId) => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ userId, pollId, pollOptionId }));
  } else {
    console.error('WebSocket is not connected.');
  }
};
