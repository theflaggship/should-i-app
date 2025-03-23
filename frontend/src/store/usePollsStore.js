// src/store/usePollsStore.js

import { create } from 'zustand';
import {
  // Non-paginated discover/following
  getPolls,
  getFollowingPolls,
  // Paginated discover/following
  getPollsPaginated,
  getFollowingPollsPaginated,
  // Websockets
  connectVoteSocket,
  connectCommentSocket,
} from '../services/pollService';

import {
  // Non-paginated user endpoints
  getUserPolls,
  getUserVotes,
  getUserComments,
  // Paginated user endpoints (implement these in userService)
  getUserPollsPaginated,
  getUserVotesPaginated,
  getUserCommentsPaginated,
} from '../services/userService';

import { useUserStatsStore } from './useUserStatsStore';

/**
 * Helper function: merges updated poll options from a new array
 * into an old array of options, used by updatePollState.
 */
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

export const usePollsStore = create((set, get) => ({
  // ─────────────────────────────────────────────────────────────────────────────
  // Main state
  // ─────────────────────────────────────────────────────────────────────────────
  polls: [],           // "Discover" feed
  followingPolls: [],  // "Following" feed
  userPolls: [],       // Logged-in user's own polls
  votedPolls: [],      // Logged-in user's voted polls
  userComments: [],    // If you want to store paginated user comments

  // Loading & error states
  loading: false,       // For initial fetch
  isLoadingMore: false, // For infinite scroll "load more"
  error: null,

  // Pagination for "Discover"
  discoverTotalCount: 0,
  discoverOffset: 0,
  discoverPageSize: 10,

  // Pagination for "Following"
  followingTotalCount: 0,
  followingOffset: 0,
  followingPageSize: 10,

  // Pagination for Profile → Polls
  userPollsTotalCount: 0,
  userPollsOffset: 0,
  userPollsPageSize: 10,

  // Pagination for Profile → Votes
  userVotesTotalCount: 0,
  userVotesOffset: 0,
  userVotesPageSize: 10,

  // Pagination for Profile → Comments
  userCommentsTotalCount: 0,
  userCommentsOffset: 0,
  userCommentsPageSize: 10,

  // ─────────────────────────────────────────────────────────────────────────────
  // 1) NON-PAGINATED: Discover (kept for backward compatibility)
  // ─────────────────────────────────────────────────────────────────────────────
  fetchAllPolls: async (token) => {
    set({ loading: true, error: null });
    try {
      // Suppose getPolls returns { polls, totalCount }
      const { polls, totalCount } = await getPolls(token);

      // Filter out private polls
      const publicPolls = polls.filter((p) => !p.isPrivate);

      // Sort comments in each poll if needed
      publicPolls.forEach((poll) => {
        if (Array.isArray(poll.comments)) {
          poll.comments.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        }
      });

      set({
        polls: publicPolls,
        error: null,
      });
    } catch (err) {
      set({ error: err.message || 'Error fetching all polls' });
    } finally {
      set({ loading: false });
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 2) PAGINATED: Discover
  // ─────────────────────────────────────────────────────────────────────────────
  fetchAllPollsPage: async (token, limit = 10, offset = 0) => {
    set({ loading: true, error: null });
    try {
      const { totalCount, polls } = await getPollsPaginated(token, limit, offset);

      // Filter out private
      const publicPolls = polls.filter((p) => !p.isPrivate);
      publicPolls.forEach((poll) => {
        if (Array.isArray(poll.comments)) {
          poll.comments.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        }
      });

      set({
        polls: publicPolls,
        discoverTotalCount: totalCount,
        discoverOffset: offset + publicPolls.length,
        error: null,
      });
    } catch (err) {
      set({ error: err.message || 'Error fetching paginated discover polls' });
    } finally {
      set({ loading: false });
    }
  },

  loadMorePollsPage: async (token) => {
    const {
      discoverOffset,
      discoverPageSize,
      discoverTotalCount,
      polls,
      isLoadingMore,
    } = get();

    if (isLoadingMore) return;
    if (polls.length >= discoverTotalCount) return;

    set({ isLoadingMore: true, error: null });
    try {
      const { totalCount, polls: newPolls } = await getPollsPaginated(
        token,
        discoverPageSize,
        discoverOffset
      );

      const publicPolls = newPolls.filter((p) => !p.isPrivate);
      publicPolls.forEach((poll) => {
        if (Array.isArray(poll.comments)) {
          poll.comments.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        }
      });

      set({
        polls: [...polls, ...publicPolls],
        discoverTotalCount: totalCount,
        discoverOffset: discoverOffset + publicPolls.length,
        error: null,
      });
    } catch (err) {
      set({ error: err.message || 'Error loading more discover polls' });
    } finally {
      set({ isLoadingMore: false });
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 3) NON-PAGINATED: Following
  // ─────────────────────────────────────────────────────────────────────────────
  fetchFollowingPolls: async (token) => {
    set({ loading: true, error: null });
    try {
      const data = await getFollowingPolls(token);

      data.forEach((poll) => {
        if (Array.isArray(poll.comments)) {
          poll.comments.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        }
        if (Array.isArray(poll.options)) {
          poll.options.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
        }
      });

      set({
        followingPolls: data,
        error: null,
      });
    } catch (err) {
      set({ error: err.message || 'Error fetching following polls' });
    } finally {
      set({ loading: false });
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 4) PAGINATED: Following
  // ─────────────────────────────────────────────────────────────────────────────
  fetchFollowingPollsPage: async (token, limit = 10, offset = 0) => {
    set({ loading: true, error: null });
    try {
      const { totalCount, polls } = await getFollowingPollsPaginated(token, limit, offset);

      polls.forEach((poll) => {
        if (Array.isArray(poll.comments)) {
          poll.comments.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        }
        if (Array.isArray(poll.options)) {
          poll.options.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
        }
      });

      set({
        followingPolls: polls,
        followingTotalCount: totalCount,
        followingOffset: offset + polls.length,
        error: null,
      });
    } catch (err) {
      set({ error: err.message || 'Error fetching paginated following polls' });
    } finally {
      set({ loading: false });
    }
  },

  loadMoreFollowingPolls: async (token) => {
    const {
      followingOffset,
      followingPageSize,
      followingTotalCount,
      followingPolls,
      isLoadingMore,
    } = get();

    if (isLoadingMore) return;
    if (followingPolls.length >= followingTotalCount) return;

    set({ isLoadingMore: true, error: null });
    try {
      const { totalCount, polls: newPolls } = await getFollowingPollsPaginated(
        token,
        followingPageSize,
        followingOffset
      );

      newPolls.forEach((poll) => {
        if (Array.isArray(poll.comments)) {
          poll.comments.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        }
        if (Array.isArray(poll.options)) {
          poll.options.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
        }
      });

      set({
        followingPolls: [...followingPolls, ...newPolls],
        followingTotalCount: totalCount,
        followingOffset: followingOffset + newPolls.length,
        error: null,
      });
    } catch (err) {
      set({ error: err.message || 'Error loading more following polls' });
    } finally {
      set({ isLoadingMore: false });
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 5) NON-PAGINATED: Profile (user polls, user votes, user comments)
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
      set({ error: err.message || 'Error fetching user polls' });
    } finally {
      set({ loading: false });
    }
  },

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
      set({ error: err.message || 'Error fetching voted polls' });
    } finally {
      set({ loading: false });
    }
  },

  fetchUserComments: async (token, userId) => {
    set({ loading: true, error: null });
    try {
      // Suppose this returns an array of comments + poll data
      const data = await getUserComments(userId, token);
      // You can store them however you want; or parse them into userComments
      // For now, let's just store them in userComments:
      set({ userComments: data });
    } catch (err) {
      set({ error: err.message || 'Error fetching user comments' });
    } finally {
      set({ loading: false });
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 6) PAGINATED: Profile (user polls, user votes, user comments)
  // ─────────────────────────────────────────────────────────────────────────────
  fetchUserPollsPage: async (token, userId, limit = 10, offset = 0) => {
    set({ loading: true, error: null });
    try {
      const { totalCount, polls } = await getUserPollsPaginated(userId, token, limit, offset);

      polls.forEach((poll) => {
        if (Array.isArray(poll.options)) {
          poll.options.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
        }
      });

      set({
        userPolls: polls,
        userPollsTotalCount: totalCount,
        userPollsOffset: offset + polls.length,
        error: null,
      });
    } catch (err) {
      set({ error: err.message || 'Error fetching paginated user polls' });
    } finally {
      set({ loading: false });
    }
  },

  loadMoreUserPollsPage: async (token, userId) => {
    const {
      userPolls,
      userPollsOffset,
      userPollsPageSize,
      userPollsTotalCount,
      isLoadingMore,
    } = get();

    if (isLoadingMore) return;
    if (userPolls.length >= userPollsTotalCount) return;

    set({ isLoadingMore: true, error: null });
    try {
      const { totalCount, polls: newPolls } = await getUserPollsPaginated(
        userId,
        token,
        userPollsPageSize,
        userPollsOffset
      );

      newPolls.forEach((poll) => {
        if (Array.isArray(poll.options)) {
          poll.options.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
        }
      });

      set({
        userPolls: [...userPolls, ...newPolls],
        userPollsTotalCount: totalCount,
        userPollsOffset: userPollsOffset + newPolls.length,
        error: null,
      });
    } catch (err) {
      set({ error: err.message || 'Error loading more user polls' });
    } finally {
      set({ isLoadingMore: false });
    }
  },

  fetchUserVotesPage: async (token, userId, limit = 10, offset = 0) => {
    set({ loading: true, error: null });
    try {
      const { totalCount, votes } = await getUserVotesPaginated(userId, token, limit, offset);

      votes.forEach((poll) => {
        if (Array.isArray(poll.options)) {
          poll.options.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
        }
      });

      set({
        votedPolls: votes,
        userVotesTotalCount: totalCount,
        userVotesOffset: offset + votes.length,
        error: null,
      });
    } catch (err) {
      set({ error: err.message || 'Error fetching paginated user votes' });
    } finally {
      set({ loading: false });
    }
  },

  loadMoreUserVotesPage: async (token, userId) => {
    const {
      votedPolls,
      userVotesOffset,
      userVotesPageSize,
      userVotesTotalCount,
      isLoadingMore,
    } = get();

    if (isLoadingMore) return;
    if (votedPolls.length >= userVotesTotalCount) return;

    set({ isLoadingMore: true, error: null });
    try {
      const { totalCount, polls: newVotes } = await getUserVotesPaginated(
        userId,
        token,
        userVotesPageSize,
        userVotesOffset
      );

      newVotes.forEach((poll) => {
        if (Array.isArray(poll.options)) {
          poll.options.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
        }
      });

      set({
        votedPolls: [...votedPolls, ...newVotes],
        userVotesTotalCount: totalCount,
        userVotesOffset: userVotesOffset + newVotes.length,
        error: null,
      });
    } catch (err) {
      set({ error: err.message || 'Error loading more user votes' });
    } finally {
      set({ isLoadingMore: false });
    }
  },

  fetchUserCommentsPage: async (token, userId, limit = 10, offset = 0) => {
    set({ loading: true, error: null });
    try {
      // The server should return something like: { totalCount, comments: [...] }
      const { totalCount, comments } = await getUserCommentsPaginated(
        userId,
        token,
        limit,
        offset
      );

      // 1) Group the raw comments by pollId
      const groupedMap = {};
      comments.forEach((comment) => {
        const p = comment.poll;
        if (!p) return; // skip if there's no poll on the comment
        const pollId = p.id;

        // If we haven't seen this poll yet, create an entry
        if (!groupedMap[pollId]) {
          groupedMap[pollId] = {
            pollId,
            poll: {
              // keep whatever poll fields you need
              id: p.id,
              question: p.question,
              createdAt: p.createdAt,
              allowComments: p.allowComments,
              isPrivate: p.isPrivate,
              user: p.user,
            },
            userComments: [],
          };
        }

        // Add this comment to that poll's userComments array
        groupedMap[pollId].userComments.push({
          id: comment.id,
          text: comment.text,
          createdAt: comment.createdAt,
          user: comment.user,
        });
      });

      // 2) Convert the map to an array
      const groupedArray = Object.values(groupedMap);

      // 3) (Optional) sort by poll creation date or some other criteria
      // groupedArray.sort((a, b) => new Date(b.poll.createdAt) - new Date(a.poll.createdAt));

      // 4) Store them in userComments
      set({
        userComments: groupedArray,
        userCommentsTotalCount: totalCount,
        userCommentsOffset: offset + comments.length,
        error: null,
      });
    } catch (err) {
      set({ error: err.message || 'Error fetching paginated user comments' });
    } finally {
      set({ loading: false });
    }
  },



  loadMoreUserCommentsPage: async (token, userId) => {
    const {
      userComments,
      userCommentsOffset,
      userCommentsPageSize,
      userCommentsTotalCount,
      isLoadingMore,
    } = get();

    if (isLoadingMore) return;
    if (userComments.length >= userCommentsTotalCount) return;

    set({ isLoadingMore: true, error: null });
    try {
      const { totalCount, polls: newComments } = await getUserCommentsPaginated(
        userId,
        token,
        userCommentsPageSize,
        userCommentsOffset
      );

      set({
        userComments: [...userComments, ...newComments],
        userCommentsTotalCount: totalCount,
        userCommentsOffset: userCommentsOffset + newComments.length,
        error: null,
      });
    } catch (err) {
      set({ error: err.message || 'Error loading more user comments' });
    } finally {
      set({ isLoadingMore: false });
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 7) UPDATE & REMOVE LOGIC (unchanged from your code)
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Update a poll in both the main feed (`polls`) and the user's feed (`userPolls`)
   */
  updatePollInBoth: (pollId, partialData) => {
    set((state) => {
      // Update `polls`
      const updatedPolls = state.polls.map((p) => {
        if (p.id !== pollId) return p;
        return {
          ...p,
          ...partialData,
          options: partialData.options || p.options,
        };
      });

      // Update `userPolls`
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

  /**
   * updatePollState: merges updated options after a vote, in all relevant arrays
   */
  updatePollState: (pollId, userVote, updatedOptions, userId, token) => {
    set((state) => {
      if (!pollId || !updatedOptions) {
        return {
          polls: state.polls,
          userPolls: state.userPolls,
          votedPolls: state.votedPolls,
          followingPolls: state.followingPolls,
        };
      }

      // 1) polls
      const newPolls = state.polls.map((p) => {
        if (p.id !== pollId) return p;
        const mergedOptions = mergeOptions(p.options, updatedOptions);
        return { ...p, options: mergedOptions, userVote: userVote ?? null };
      });

      // 2) userPolls
      const newUserPolls = state.userPolls.map((p) => {
        if (p.id !== pollId) return p;
        const mergedOptions = mergeOptions(p.options, updatedOptions);
        return { ...p, options: mergedOptions, userVote: userVote ?? null };
      });

      // 3) votedPolls
      const newVotedPolls = state.votedPolls.map((p) => {
        if (p.id !== pollId) return p;
        const mergedOptions = mergeOptions(p.options, updatedOptions);
        return { ...p, options: mergedOptions, userVote: userVote ?? null };
      });

      // 4) followingPolls
      const newFollowing = state.followingPolls.map((p) => {
        if (p.id !== pollId) return p;
        const mergedOptions = mergeOptions(p.options, updatedOptions);
        return { ...p, options: mergedOptions, userVote: userVote ?? null };
      });

      return {
        polls: newPolls,
        userPolls: newUserPolls,
        votedPolls: newVotedPolls,
        followingPolls: newFollowing,
      };
    });

    // Optionally refresh stats
    if (userId && token) {
      useUserStatsStore.getState().fetchStats(userId, token);
    }
  },

  /**
   * updateUserPollInStore: only update userPolls array
   */
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

  /**
   * updateCommentState: merges a new or updated comment into `polls`, `userPolls`, etc.
   */
  updateCommentState: (pollId, newComment) => {
    set((state) => {
      if (!pollId || !newComment) return state;
  
      const updatedPolls = state.polls.map((p) => {
        if (p.id !== pollId) return p;
  
        const comments = Array.isArray(p.comments) ? [...p.comments] : [];
  
        // Check if we already have this comment — by ID or as a temp match
        const idx = comments.findIndex((c) =>
          String(c.id) === String(newComment.id) ||
          (c.text === newComment.text && c.user?.id === newComment.user?.id && String(c.id).startsWith('temp'))
        );
  
        if (idx > -1) {
          // Existing comment: merge updates
          comments[idx] = {
            ...comments[idx],
            ...newComment,
            edited: newComment.edited ?? comments[idx].edited ?? false, // preserve true if set
          };
        } else {
          // New comment: push it in
          comments.push({
            ...newComment,
            edited: newComment.edited ?? false,
          });
        }
  
        // Sort by timestamp
        comments.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  
        return { ...p, comments, commentCount: comments.length };
      });
  
      return {
        polls: updatedPolls,
        userPolls: state.userPolls,
        votedPolls: state.votedPolls,
        followingPolls: state.followingPolls,
      };
    });
  },
  
  
  removeComment: (pollId, commentId) => {
    set(state => ({
      polls: state.polls.map(p => {
        if (p.id !== pollId) return p;
        const comments = p.comments.filter(c => String(c.id) !== String(commentId));
        return { ...p, comments, commentCount: comments.length };
      }),
      userPolls: state.userPolls,
      votedPolls: state.votedPolls,
      followingPolls: state.followingPolls,
    }));
  },

  /**
   * addPollToStore: add a newly created poll to the main feed & user feed
   */
  addPollToStore: (newPoll, userId, token) => {
    if (newPoll.User && !newPoll.user) {
      newPoll.user = newPoll.User;
      delete newPoll.User;
    }
    set((state) => {
      // If private, do not add to `polls`
      const updatedPolls = newPoll.isPrivate
        ? state.polls
        : [newPoll, ...state.polls];

      return {
        polls: updatedPolls,
        userPolls: [newPoll, ...state.userPolls],
      };
    });

    if (userId && token) {
      useUserStatsStore.getState().fetchStats(userId, token);
    }
  },

  /**
   * removePoll: remove poll from all arrays
   */
  removePoll: (pollId, userId, token) => {
    set((state) => ({
      polls: state.polls.filter((p) => p.id !== pollId),
      userPolls: state.userPolls.filter((p) => p.id !== pollId),
      followingPolls: state.followingPolls.filter((p) => p.id !== pollId),
      votedPolls: state.votedPolls.filter((p) => p.id !== pollId),
    }));

    if (userId && token) {
      useUserStatsStore.getState().fetchStats(userId, token);
    }
  },

  /**
   * updatePollInStore: simpler update just for main feed
   */
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
  // initPolls: called once on app startup or screen mount
  // ─────────────────────────────────────────────────────────────────────────────
  initPolls: (token, userId) => {
    // If you want to fetch the original non-paginated "all polls" on init:
    get().fetchAllPolls(token);

    // Connect websockets
    connectVoteSocket((pollId, userVote, options) => {
      get().updatePollState(pollId, userVote, options, userId, token);
    });
    connectCommentSocket((pollId, comment) => {
      get().updateCommentState(pollId, comment);
    });
  },
}));
