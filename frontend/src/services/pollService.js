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
