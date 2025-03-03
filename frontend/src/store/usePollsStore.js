// usePollsStore.js
import { create } from 'zustand';
import { getPolls, connectVoteSocket, connectCommentSocket } from '../services/pollService';

export const usePollsStore = create((set, get) => ({
  polls: [],
  loading: false,
  error: null,

  // Fetch all polls
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

  // Update poll state (for vote updates)
  updatePollState: (pollId, userVote, updatedOptions) => {
    set((state) => {
      if (!pollId || !updatedOptions) {
        return { polls: state.polls };
      }

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

      return { polls: newPolls };
    });
  },

  // Update comment state (for both optimistic + real comments)
  updateCommentState: (pollId, newComment) => {
    set((state) => {
      if (!pollId || !newComment) {
        return { polls: state.polls };
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
          // Replace the temp comment with the new one
          updatedComments[existingIndex] = newComment;
        } else {
          // Append the new comment to the end
          updatedComments.push(newComment);
        }

        // Sort ascending: oldest first, newest last
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

  // Add a new poll to the store
  addPollToStore: (newPoll) => {
    // If newPoll has a capital "User" property, rename it to "user"
    if (newPoll.User && !newPoll.user) {
      newPoll.user = newPoll.User;
      delete newPoll.User;
    }
    set((state) => ({
      polls: [newPoll, ...state.polls], // or push to the front or back
    }));
  },

  // Initialize store
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
