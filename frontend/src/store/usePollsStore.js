// usePollsStore.js
import { create } from 'zustand';
import {
  getPolls,
  connectVoteSocket,
  connectCommentSocket,
  // You'll create or import this from your poll service:
  getFollowingPolls, 
} from '../services/pollService';

import {
  getUserPolls,
  getUserVotes,
} from '../services/userService';
import { useUserStatsStore } from './useUserStatsStore';

export const usePollsStore = create((set, get) => ({
  // Existing state
  polls: [],
  userPolls: [],
  votedPolls: [],
  followingPolls: [],

  loading: false,
  error: null,

  // ─────────────────────────────────────────────────────────────────────────────
  // Fetch all polls (main feed)
  // ─────────────────────────────────────────────────────────────────────────────
  fetchAllPolls: async (token) => {
    set({ loading: true, error: null });
    try {
      const data = await getPolls(token);
      // Example of sorting comments if you like
      data.forEach((poll) => {
        if (Array.isArray(poll.comments)) {
          poll.comments.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        }
      });
      set({ polls: data });
    } catch (err) {
      set({ error: err.message || 'Something went wrong' });
    } finally {
      set({ loading: false });
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Fetch polls from users the current user is following
  // ─────────────────────────────────────────────────────────────────────────────
  fetchFollowingPolls: async (token) => {
    set({ loading: true, error: null });
    try {
      // This function should call an API that returns polls from followed users
      const data = await getFollowingPolls(token);

      // Sort comments or options if you want
      data.forEach((poll) => {
        if (Array.isArray(poll.comments)) {
          poll.comments.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        }
        if (Array.isArray(poll.options)) {
          poll.options.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
        }
      });

      // Store them in a separate array
      set({ followingPolls: data });
    } catch (err) {
      set({ error: err.message || 'Something went wrong' });
    } finally {
      set({ loading: false });
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Fetch the user’s own polls (Profile → Polls tab)
  // ─────────────────────────────────────────────────────────────────────────────
  fetchUserPolls: async (token, userId) => {
    set({ loading: true, error: null });
    try {
      const data = await getUserPolls(userId, token);
      data.forEach((poll) => {
        if (Array.isArray(poll.options)) {
          poll.options.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
        }
      });
      set({ userPolls: data });
    } catch (err) {
      set({ error: err.message || 'Something went wrong' });
    } finally {
      set({ loading: false });
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Fetch the user’s voted polls (Profile → Votes tab)
  // ─────────────────────────────────────────────────────────────────────────────
  fetchUserVotedPolls: async (token, userId) => {
    set({ loading: true, error: null });
    try {
      const data = await getUserVotes(userId, token);
      data.forEach((poll) => {
        if (Array.isArray(poll.options)) {
          poll.options.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
        }
      });
      set({ votedPolls: data });
    } catch (err) {
      set({ error: err.message || 'Something went wrong' });
    } finally {
      set({ loading: false });
    }
  },

  // ... rest of your store code (updatePollInBoth, updatePollState, etc.) ...
  
  // ─────────────────────────────────────────────────────────────────────────────
  // Initialize store with websockets
  // ─────────────────────────────────────────────────────────────────────────────
  initPolls: (token, userId) => {
    get().fetchAllPolls(token); // or fetchUserPolls, up to you

    // Connect Vote WebSocket
    connectVoteSocket((pollId, userVote, options) => {
      get().updatePollState(pollId, userVote, options, userId, token);
    });

    // Connect Comment WebSocket
    connectCommentSocket((pollId, comment) => {
      get().updateCommentState(pollId, comment);
    });
  },
}));

// Helper for merging options
function mergeOptions(oldOptions, updatedOptions) {
  return oldOptions.map((oldOpt) => {
    const newOpt = updatedOptions.find((o) => o.id === oldOpt.id);
    if (!newOpt) return oldOpt;
    return {
      ...oldOpt,
      text: newOpt.text ?? oldOpt.text,
      votes: newOpt.votes,
    };
  });
}
