// usePollsStore.js
import { create } from 'zustand';
import { getPolls, connectVoteSocket, connectCommentSocket } from '../services/pollService';
import { getUserPolls } from '../services/userService';
import { useUserStatsStore } from './useUserStatsStore'; // <-- ADDED

export const usePollsStore = create((set, get) => ({
  polls: [],
  userPolls: [],
  loading: false,
  error: null,

  // ─────────────────────────────────────────────────────────────────────────────
  // 1) Fetch all polls (main feed)
  // ─────────────────────────────────────────────────────────────────────────────
  fetchAllPolls: async (token) => {
    set({ loading: true, error: null });
    try {
      const data = await getPolls(token);
      // Sort comments in each poll by ascending createdAt
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
  // 2) Fetch user’s own polls (for Profile)
  // ─────────────────────────────────────────────────────────────────────────────
  fetchUserPolls: async (token, userId) => {
    set({ loading: true, error: null });
    try {
      const data = await getUserPolls(userId, token);
      // Optionally sort or transform here
      set({ userPolls: data });
    } catch (err) {
      set({ error: err.message || 'Something went wrong' });
    } finally {
      set({ loading: false });
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 3) A helper if you want to update poll in both arrays at once
  // ─────────────────────────────────────────────────────────────────────────────
  updatePollInBoth: (pollId, partialData) => {
    set((state) => {
      // 1) Update the main feed array
      const updatedPolls = state.polls.map((p) => {
        if (p.id !== pollId) return p;
        return {
          ...p,
          ...partialData,
          // If partialData.options is provided, override existing
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
  // 4) updatePollState: called by the Vote WebSocket or manually
  //    This updates both `polls` and `userPolls`
  // ─────────────────────────────────────────────────────────────────────────────
  updatePollState: (pollId, userVote, updatedOptions, userId, token) => { 
    // <-- CHANGED: optionally accept userId, token to refresh stats
    set((state) => {
      if (!pollId || !updatedOptions) {
        return { polls: state.polls, userPolls: state.userPolls };
      }

      // Update the main feed (polls)
      const newPolls = state.polls.map((p) => {
        if (p.id !== pollId) return p;

        const mergedOptions = p.options.map((oldOpt) => {
          const newOpt = updatedOptions.find((o) => o.id === oldOpt.id);
          if (!newOpt) return oldOpt;
          return {
            ...oldOpt,
            text: newOpt.text ?? oldOpt.text,
            votes: newOpt.votes,
          };
        });

        return {
          ...p,
          options: mergedOptions,
          userVote: userVote ?? null,
        };
      });

      // Update the userPolls (profile feed)
      const newUserPolls = state.userPolls.map((p) => {
        if (p.id !== pollId) return p;

        const mergedOptions = p.options.map((oldOpt) => {
          const newOpt = updatedOptions.find((o) => o.id === oldOpt.id);
          if (!newOpt) return oldOpt;
          return {
            ...oldOpt,
            text: newOpt.text ?? oldOpt.text,
            votes: newOpt.votes,
          };
        });

        return {
          ...p,
          options: mergedOptions,
          userVote: userVote ?? null,
        };
      });

      return {
        polls: newPolls,
        userPolls: newUserPolls,
      };
    });

    // After updating the polls, optionally refresh user stats
    if (userId && token) {
      useUserStatsStore.getState().fetchStats(userId, token);
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 5) updateUserPollInStore: if you only want to update userPolls
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
  // 6) Update comment state in main feed
  // ─────────────────────────────────────────────────────────────────────────────
  updateCommentState: (pollId, newComment) => {
    set((state) => {
      if (!pollId || !newComment) {
        return { polls: state.polls, userPolls: state.userPolls };
      }

      const newPolls = state.polls.map((p) => {
        if (p.id !== pollId) return p;

        const oldComments = Array.isArray(p.comments) ? p.comments : [];
        let updatedComments = [...oldComments];

        // Try to find if there's a "temp" comment to replace
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

        updatedComments.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        return {
          ...p,
          comments: updatedComments,
          commentCount: updatedComments.length,
        };
      });

      return { polls: newPolls };
    });
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 7) Add a newly created poll to the main feed
  // ─────────────────────────────────────────────────────────────────────────────
  addPollToStore: (newPoll, userId, token) => { 
    // <-- CHANGED: accept userId, token to refresh stats if needed
    if (newPoll.User && !newPoll.user) {
      newPoll.user = newPoll.User;
      delete newPoll.User;
    }
    set((state) => ({
      polls: [newPoll, ...state.polls],
    }));

    // Optionally refresh stats after creating a poll
    if (userId && token) {
      useUserStatsStore.getState().fetchStats(userId, token);
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 8) Remove poll from main feed
  // ─────────────────────────────────────────────────────────────────────────────
  removePoll: (pollId, userId, token) => { 
    // <-- CHANGED: accept userId, token to refresh stats if needed
    set((state) => ({
      polls: state.polls.filter((p) => p.id !== pollId),
    }));

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
  // 9) Initialize store with websockets
  // ─────────────────────────────────────────────────────────────────────────────
  initPolls: (token, userId) => { // <-- CHANGED: accept userId to refresh stats
    get().fetchAllPolls(token);

    // Vote socket
    connectVoteSocket((pollId, userVote, options) => {
      // pass userId/token so updatePollState can refresh stats
      get().updatePollState(pollId, userVote, options, userId, token);
    });

    // Comment socket
    connectCommentSocket((pollId, comment) => {
      get().updateCommentState(pollId, comment);
    });
  },
}));
