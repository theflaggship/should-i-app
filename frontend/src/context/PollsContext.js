// PollsContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import { getPolls, connectVoteSocket, connectCommentSocket } from '../services/pollService';
import { AuthContext } from './AuthContext';

export const PollsContext = createContext();

export const PollsProvider = ({ children }) => {
  const { token } = useContext(AuthContext);

  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all polls from the server
  const fetchAllPolls = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('PollsContext: fetching polls...'); // Debug log
      const data = await getPolls(token);
      console.log('PollsContext: fetch success, polls count =', data.length); // Debug log
      setPolls(data);
    } catch (err) {
      console.error('PollsContext: fetchAllPolls error:', err);
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // Update poll with new data (e.g., updated votes)
  const updatePoll = (pollId, updatedData) => {
    setPolls((prevPolls) =>
      prevPolls.map((p) => (p.id === pollId ? { ...p, ...updatedData } : p))
    );
  };

  // Update poll's comments array and commentCount
  const updatePollComments = (pollId, newComment) => {
    setPolls((prevPolls) =>
      prevPolls.map((poll) => {
        if (poll.id === pollId) {
          const updatedComments = poll.comments
            ? [newComment, ...poll.comments]
            : [newComment];
          return {
            ...poll,
            comments: updatedComments,
            commentCount: updatedComments.length,
          };
        }
        return poll;
      })
    );
  };

  // On mount, fetch polls and connect sockets
  useEffect(() => {
    // Fetch initial polls
    fetchAllPolls();

    // Connect the Vote WebSocket
    connectVoteSocket((pollId, options) => {
      // Merge new options into the matching poll
      updatePoll(pollId, { options });
    });

    // Connect the Comment WebSocket
    connectCommentSocket((pollId, comment) => {
      updatePollComments(pollId, comment);
    });
  }, [token]);

  return (
    <PollsContext.Provider
      value={{
        polls,
        loading,
        error,
        fetchAllPolls,
        updatePoll,
      }}
    >
      {children}
    </PollsContext.Provider>
  );
};
