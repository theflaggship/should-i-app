// usePollsStore.js

import { create } from 'zustand';
import {
  getPolls,
  getFollowingPolls,   // <-- import the new function if you have it in pollService
  connectVoteSocket,
  connectCommentSocket,
} from '../services/pollService';

import {
  getUserPolls,
  getUserVotes,
} from '../services/userService';

import { useUserStatsStore } from './useUserStatsStore';

export const usePollsStore = create((set, get) => ({
  // State
  polls: [],
  userPolls: [],
  votedPolls: [],
  followingPolls: [],

  loading: false,
  error: null,

  // ─────────────────────────────────────────────────────────────────────────────
  // Fetch all polls (main feed) - "Discover" tab
  // ─────────────────────────────────────────────────────────────────────────────
  fetchAllPolls: async (token) => {
    set({ loading: true, error: null });
    try {
      const data = await getPolls(token);
      const publicPolls = data.filter((poll) => !poll.isPrivate);
      // Optional: sort comments in each poll by createdAt
      publicPolls.forEach((poll) => {
        if (Array.isArray(poll.comments)) {
          poll.comments.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        }
      });
      set({ polls: publicPolls });
    } catch (err) {
      set({ error: err.message || 'Something went wrong fetching all polls.' });
    } finally {
      set({ loading: false });
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Fetch polls from users the current user is following - "Following" tab
  // ─────────────────────────────────────────────────────────────────────────────
  fetchFollowingPolls: async (token) => {
    set({ loading: true, error: null });
    try {
      // If you created an API endpoint for "following" polls, call it here
      const data = await getFollowingPolls(token);
      // Sort if desired
      data.forEach((poll) => {
        if (Array.isArray(poll.comments)) {
          poll.comments.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        }
        if (Array.isArray(poll.options)) {
          poll.options.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
        }
      });
      set({ followingPolls: data });
    } catch (err) {
      set({ error: err.message || 'Something went wrong fetching following polls.' });
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
      set({ error: err.message || 'Something went wrong fetching user polls.' });
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
      set({ error: err.message || 'Something went wrong fetching voted polls.' });
    } finally {
      set({ loading: false });
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // A helper if you want to update poll in both arrays at once
  // ─────────────────────────────────────────────────────────────────────────────
  updatePollInBoth: (pollId, partialData) => {
    set((state) => {
      // 1) Update the main feed array
      const updatedPolls = state.polls.map((p) => {
        if (p.id !== pollId) return p;
        return {
          ...p,
          ...partialData,
          options: partialData.options || p.options,
        };
      });

      // 2) Update the userPolls array
      const updatedUserPolls = state.userPolls.map((p) => {
        if (p.id !== pollId) return p;
        return {
          ...p,
          ...partialData,
          options: partialData.options || p.options,
        };
      });

      return {
        polls: updatedPolls,
        userPolls: updatedUserPolls,
      };
    });
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // updatePollState: called by the Vote WebSocket or manually
  //    This updates both `polls` and `userPolls` (and `votedPolls` if needed)
  // ─────────────────────────────────────────────────────────────────────────────
  updatePollState: (pollId, userVote, updatedOptions, userId, token) => {
    set((state) => {
      if (!pollId || !updatedOptions) {
        return {
          polls: state.polls,
          userPolls: state.userPolls,
          votedPolls: state.votedPolls,
        };
      }

      // 1) Update the main feed
      const newPolls = state.polls.map((p) => {
        if (p.id !== pollId) return p;
        const mergedOptions = mergeOptions(p.options, updatedOptions);
        return { ...p, options: mergedOptions, userVote: userVote ?? null };
      });

      // 2) Update the userPolls
      const newUserPolls = state.userPolls.map((p) => {
        if (p.id !== pollId) return p;
        const mergedOptions = mergeOptions(p.options, updatedOptions);
        return { ...p, options: mergedOptions, userVote: userVote ?? null };
      });

      // 3) Update the votedPolls
      const newVotedPolls = state.votedPolls.map((p) => {
        if (p.id !== pollId) return p;
        const mergedOptions = mergeOptions(p.options, updatedOptions);
        return { ...p, options: mergedOptions, userVote: userVote ?? null };
      });

      return {
        polls: newPolls,
        userPolls: newUserPolls,
        votedPolls: newVotedPolls,
      };
    });

    // Optionally refresh user stats after a vote
    if (userId && token) {
      useUserStatsStore.getState().fetchStats(userId, token);
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // updateUserPollInStore: if you only want to update userPolls
  // ─────────────────────────────────────────────────────────────────────────────
  updateUserPollInStore: (pollId, partialData) => {
    set((state) => ({
      userPolls: state.userPolls.map((p) => {
        if (p.id !== pollId) return p;
        return {
          ...p,
          ...partialData,
          options: partialData.options || p.options,
        };
      }),
    }));
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Update comment state in main feed
  // ─────────────────────────────────────────────────────────────────────────────
  updateCommentState: (pollId, newComment) => {
    set((state) => {
      if (!pollId || !newComment) {
        return {
          polls: state.polls,
          userPolls: state.userPolls,
          votedPolls: state.votedPolls,
        };
      }

      const newPolls = state.polls.map((p) => {
        if (p.id !== pollId) return p;

        const oldComments = Array.isArray(p.comments) ? p.comments : [];
        const updatedComments = [...oldComments];

        // Attempt to replace a "temp" comment if it matches text & user
        const newTextTrimmed = (newComment.text || '').trim();
        const existingIndex = updatedComments.findIndex((c) => {
          const cTextTrimmed = (c.text || '').trim();
          const isTemp = typeof c.id === 'string' && c.id.startsWith('temp-');
          const sameUser = c.User?.id === newComment.User?.id;
          const sameText = cTextTrimmed === newTextTrimmed;
          return isTemp && sameUser && sameText;
        });

        if (existingIndex > -1) {
          updatedComments[existingIndex] = newComment;
        } else {
          updatedComments.push(newComment);
        }

        // Sort them by createdAt
        updatedComments.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        return {
          ...p,
          comments: updatedComments,
          commentCount: updatedComments.length,
        };
      });

      return {
        polls: newPolls,
        userPolls: state.userPolls,
        votedPolls: state.votedPolls,
      };
    });
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Add a newly created poll to the main feed
  // ─────────────────────────────────────────────────────────────────────────────
  addPollToStore: (newPoll, userId, token) => {
    if (newPoll.User && !newPoll.user) {
      newPoll.user = newPoll.User;
      delete newPoll.User;
    }
    set((state) => {
      // If it’s private, do NOT add it to `polls`:
      const updatedPolls = newPoll.isPrivate
        ? state.polls // unchanged
        : [newPoll, ...state.polls];
  
      return {
        polls: updatedPolls,
        // We still might want to push it to userPolls unconditionally:
        userPolls: [newPoll, ...state.userPolls],
      };
    });

    // Optionally refresh stats after creating a poll
    if (userId && token) {
      useUserStatsStore.getState().fetchStats(userId, token);
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Remove poll from main feed
  // ─────────────────────────────────────────────────────────────────────────────
  removePoll: (pollId, userId, token) => {
    set((state) => ({
      polls: state.polls.filter((p) => p.id !== pollId),
      userPolls: state.userPolls.filter((p) => p.id !== pollId),
    }));
    // optionally also remove from followingPolls or votedPolls if needed
  
    // Optionally refresh stats after deleting a poll
    if (userId && token) {
      useUserStatsStore.getState().fetchStats(userId, token);
    }
  },

  // If you want a simpler update just for main feed
  updatePollInStore: (pollId, partialData) => {
    set((state) => ({
      polls: state.polls.map((p) => {
        if (p.id !== pollId) return p;
        return {
          ...p,
          ...partialData,
          options: partialData.options || [],
        };
      }),
    }));
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Initialize store with websockets
  // ─────────────────────────────────────────────────────────────────────────────
  initPolls: (token, userId) => {
    // For example, fetch the "all polls" on init
    get().fetchAllPolls(token);

    // Connect the Vote WebSocket
    connectVoteSocket((pollId, userVote, options) => {
      get().updatePollState(pollId, userVote, options, userId, token);
    });

    // Connect the Comment WebSocket
    connectCommentSocket((pollId, comment) => {
      get().updateCommentState(pollId, comment);
    });
  },
}));

// Helper function to merge updated options
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
