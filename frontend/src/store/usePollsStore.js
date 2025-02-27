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

  // 2) Update poll state (vote updates) - handle userVote + options
  updatePollState: (pollId, userVote, updatedOptions) => {
    set((state) => {
      // If pollId or updatedOptions is missing, do nothing
      if (!pollId || !updatedOptions) {
        return { polls: state.polls };
      }

      const newPolls = state.polls.map((p) => {
        if (p.id !== pollId) {
          return p; // no update
        }

        // Merge each updated option
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
          commentCount: p.commentCount, // keep existing
          userVote: userVote ?? null,   // store the userVote
        };
      });

      return { polls: newPolls };
    });
  },

  // 3) Update comment state
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
  
        // Find if there's a "temp" comment with the same text & user
        // so we can replace it with the real one from the server
        let updatedComments = [...oldComments];
        const existingIndex = updatedComments.findIndex((c) => {
          // If c.id is numeric, "typeof c.id" is "number", so skip
          const isTemp = (typeof c.id === 'string') && c.id.startsWith('temp-');
          const sameText = c.text === newComment.text;
          const sameUser = c.User?.id === newComment.User?.id;
          return isTemp && sameText && sameUser;
        });
  
        if (existingIndex > -1) {
          // Overwrite the temp comment with the real comment
          updatedComments[existingIndex] = newComment;
        } else {
          // Normal case: no matching temp, so prepend the new comment
          updatedComments = [newComment, ...updatedComments];
        }
  
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

    // Vote socket: pass a callback
    connectVoteSocket((pollId, userVote, options) => {
      get().updatePollState(pollId, userVote, options);
    });

    // Comment socket: pass a callback
    connectCommentSocket((pollId, comment) => {
      get().updateCommentState(pollId, comment);
    });
  },
}));
