// useUserStatsStore.js
import { create } from 'zustand';
import { getUserStats } from '../services/userService'; // or wherever your getUserStats lives

export const useUserStatsStore = create((set) => ({
  followers: 0,
  following: 0,
  totalPolls: 0,
  totalVotes: 0,
  loading: false,
  error: null,

  // fetchStats: call your getUserStats, then set the store
  fetchStats: async (userId, token) => {
    set({ loading: true, error: null });
    try {
      const data = await getUserStats(userId, token);
      // data should be: { followers, following, totalPolls, totalVotes }
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
}));
