// usePollsStore.js
import { create } from 'zustand';
import { getPolls, connectVoteSocket, connectCommentSocket } from '../services/pollService';

export const usePollsStore = create((set, get) => ({
  polls: [],
  loading: false,
  error: null,

  // 1) Fetch all polls
  fetchAllPolls: async (token) => {
    set({ loading: true, error: null });
    try {
      const data = await getPolls(token);
      // We'll trust the backend to return valid polls
      set({ polls: data });
    } catch (err) {
      set({ error: err.message || 'Something went wrong' });
    } finally {
      set({ loading: false });
    }
  },

  // 2) Update poll state (vote updates) - handle userVote + options
  updatePollState: (pollId, userVote, updatedOptions) => {
    set((state) => {
      // If pollId or updatedOptions is missing, do nothing
      if (!pollId || !updatedOptions) {
        return { polls: state.polls };
      }

      const newPolls = state.polls.map((p) => {
        if (p.id !== pollId) {
          return p; // no update for this poll
        }

        // Merge each updated option, ignoring commentCount
        const mergedOptions = p.options.map((oldOpt) => {
          const newOpt = updatedOptions.find((o) => o.id === oldOpt.id);
          if (!newOpt) {
            return oldOpt;
          }
          return {
            ...oldOpt,
            text: newOpt.text ?? oldOpt.text,
            votes: newOpt.votes,
          };
        });

        return {
          ...p,
          options: mergedOptions,
          // Keep existing commentCount
          commentCount: p.commentCount,
          // NEW: store the userVote from the broadcast
          userVote: userVote ?? null,
        };
      });

      return { polls: newPolls };
    });
  },

  // 3) Update comment state (only place that changes commentCount)
  updateCommentState: (pollId, newComment) => {
    set((state) => {
      if (!pollId || !newComment) {
        return { polls: state.polls };
      }

      const newPolls = state.polls.map((p) => {
        if (p.id !== pollId) {
          return p;
        }
        const oldComments = Array.isArray(p.comments) ? p.comments : [];
        const updatedComments = [newComment, ...oldComments];

        return {
          ...p,
          comments: updatedComments,
          commentCount: updatedComments.length,
        };
      });

      return { polls: newPolls };
    });
  },

  // 4) Initialize store: fetch + connect websockets
  initPolls: (token) => {
    get().fetchAllPolls(token);

    // Vote socket
    connectVoteSocket((pollId, userVote, options) => {
      get().updatePollState(pollId, userVote, options);
    });

    // Comment socket
    connectCommentSocket((pollId, comment) => {
      get().updateCommentState(pollId, comment);
    });
  },
}));
