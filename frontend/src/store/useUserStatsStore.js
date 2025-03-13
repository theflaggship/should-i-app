// src/store/useUserStatsStore.js
import { create } from 'zustand';
import { getUserStats } from '../services/userService';

export const useUserStatsStore = create((set, get) => ({
  followers: 0,
  following: 0,
  totalPolls: 0,
  totalVotes: 0,
  loading: false,
  error: null,

  /**
   * Fetch stats from the server for a specific userId.
   */
  fetchStats: async (userId, token) => {
    set({ loading: true, error: null });
    try {
      const data = await getUserStats(userId, token);
      set({
        followers: data.followers || 0,
        following: data.following || 0,
        totalPolls: data.totalPolls || 0,
        totalVotes: data.totalVotes || 0,
      });
    } catch (err) {
      set({ error: err.message || 'Stats error' });
    } finally {
      set({ loading: false });
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // LOCAL increment/decrement for Followers
  // ─────────────────────────────────────────────────────────────────────────────
  incrementFollowers: () => {
    set((state) => ({ followers: state.followers + 1 }));
  },
  decrementFollowers: () => {
    set((state) => ({
      followers: state.followers > 0 ? state.followers - 1 : 0,
    }));
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // LOCAL increment/decrement for Following
  // ─────────────────────────────────────────────────────────────────────────────
  incrementFollowing: () => {
    set((state) => ({ following: state.following + 1 }));
  },
  decrementFollowing: () => {
    set((state) => ({
      following: state.following > 0 ? state.following - 1 : 0,
    }));
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // LOCAL increment/decrement for totalPolls
  // ─────────────────────────────────────────────────────────────────────────────
  incrementTotalPolls: () => {
    set((state) => ({ totalPolls: state.totalPolls + 1 }));
  },
  decrementTotalPolls: () => {
    set((state) => ({
      totalPolls: state.totalPolls > 0 ? state.totalPolls - 1 : 0,
    }));
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // LOCAL increment/decrement for totalVotes
  // ─────────────────────────────────────────────────────────────────────────────
  incrementTotalVotes: () => {
    set((state) => ({ totalVotes: state.totalVotes + 1 }));
  },
  decrementTotalVotes: () => {
    set((state) => ({
      totalVotes: state.totalVotes > 0 ? state.totalVotes - 1 : 0,
    }));
  },
}));
