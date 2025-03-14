// src/screens/ProfileScreen.js

import React, { useContext, useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../../context/AuthContext';
import { usePollsStore } from '../../store/usePollsStore';
import { useUserStatsStore } from '../../store/useUserStatsStore';
import PollCard from '../../components/PollCard';
import VoteCard from '../../components/VoteCard';
import CommentCard from '../../components/CommentCard';
import CloudBubble from '../../components/CloudBubble';
import PollModalsManager from '../../components/PollModalsManager';
import EditProfileModal from '../../components/EditProfileModal';
import { getUserComments } from '../../services/userService';
import { deletePoll, updatePoll, sendVoteWS } from '../../services/pollService';
import colors from '../../styles/colors';

const TABS = {
  POLLS: 'POLLS',
  VOTES: 'VOTES',
  COMMENTS: 'COMMENTS',
};

export default function ProfileScreen() {
  const { user: loggedInUser, token, login } = useContext(AuthContext);

  // ----- Zustand store (polls) -----
  const userPolls = usePollsStore((state) => state.userPolls);
  const votedPolls = usePollsStore((state) => state.votedPolls);
  const fetchUserPolls = usePollsStore((state) => state.fetchUserPolls);
  const fetchUserVotedPolls = usePollsStore((state) => state.fetchUserVotedPolls);
  const removePoll = usePollsStore((state) => state.removePoll);
  const updatePollInBoth = usePollsStore((state) => state.updatePollInBoth);
  const loading = usePollsStore((state) => state.loading);
  const error = usePollsStore((state) => state.error);

  // ----- Zustand store (stats) -----
  const {
    followers,
    following,
    totalPolls,
    totalVotes,
    fetchStats,
    loading: statsLoading,
    error: statsError,
  } = useUserStatsStore();

  // For the Comments tab
  const [commentsGroupedByPoll, setCommentsGroupedByPoll] = useState([]);

  // Which tab is selected?
  const [selectedTab, setSelectedTab] = useState(TABS.POLLS);

  // Refs for modals
  const pollModalsRef = useRef(null);
  const editProfileRef = useRef(null);

  // ─────────────────────────────────────────────────────────────────────────────
  // Initial fetch on mount
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!loggedInUser?.id) return;

    // Fetch user’s own polls & stats at least once
    fetchUserPolls(token, loggedInUser.id);
    fetchStats(loggedInUser.id, token);
  }, [loggedInUser?.id, token]);

  // ─────────────────────────────────────────────────────────────────────────────
  // useFocusEffect: Re‑fetch data for the currently selected tab
  // whenever this screen regains focus (user returns to it).
  // This ensures the VOTES tab is refreshed if the user voted while away.
  // ─────────────────────────────────────────────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      if (!loggedInUser?.id) return;

      if (selectedTab === TABS.POLLS) {
        fetchUserPolls(token, loggedInUser.id);
      } else if (selectedTab === TABS.VOTES) {
        fetchUserVotedPolls(token, loggedInUser.id);
      } else if (selectedTab === TABS.COMMENTS) {
        handleFetchComments();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedTab, loggedInUser?.id, token])
  );

  // Helper to fetch comments
  const handleFetchComments = async () => {
    try {
      const data = await getUserComments(loggedInUser.id, token);
      const groupedMap = {};
      data.forEach((comment) => {
        const p = comment.poll;
        if (!p) return;
        if (!groupedMap[p.id]) {
          groupedMap[p.id] = {
            pollId: p.id,
            poll: {
              id: p.id,
              question: p.question,
              createdAt: p.createdAt,
              user: p.user,
            },
            userComments: [],
          };
        }
        groupedMap[p.id].userComments.push({
          id: comment.id,
          text: comment.commentText,
          createdAt: comment.createdAt,
        });
      });
      setCommentsGroupedByPoll(Object.values(groupedMap));
    } catch (err) {
      console.error('Fetching user comments error:', err);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Voting
  // ─────────────────────────────────────────────────────────────────────────────
  const handleVote = (pollId, optionId) => {
    if (!loggedInUser?.id) return;
    sendVoteWS(loggedInUser.id, pollId, optionId);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Tab press handler (if you also want to fetch on tab tap)
  // ─────────────────────────────────────────────────────────────────────────────
  const handleTabPress = async (tab) => {
    setSelectedTab(tab);
    if (tab === TABS.POLLS) {
      fetchUserPolls(token, loggedInUser.id);
    } else if (tab === TABS.VOTES) {
      fetchUserVotedPolls(token, loggedInUser.id);
    } else if (tab === TABS.COMMENTS) {
      handleFetchComments();
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Poll Modals
  // ─────────────────────────────────────────────────────────────────────────────
  const handleOpenMenu = (poll) => {
    pollModalsRef.current?.openMenu(poll);
  };

  const handleDeletePoll = async (pollToDelete) => {
    try {
      await deletePoll(token, pollToDelete.id);
      removePoll(pollToDelete.id, loggedInUser.id, token); // pass userId & token if needed
    } catch (err) {
      console.error('Failed to delete poll:', err);
    }
  };

  const handleSavePoll = async (pollToEdit, payload) => {
    try {
      const result = await updatePoll(token, pollToEdit.id, payload);
      if (result.poll && Array.isArray(result.poll.options)) {
        updatePollInBoth(pollToEdit.id, {
          question: result.poll.question,
          allowComments: result.poll.allowComments,
          isPrivate: result.poll.isPrivate,
          options: result.poll.options.map((o) => ({
            ...o,
            text: o.optionText,
          })),
        });
      }
    } catch (err) {
      console.error('Failed to update poll:', err);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Edit Profile
  // ─────────────────────────────────────────────────────────────────────────────
  const handleSaveProfile = (updatedUser) => {
    // Update the AuthContext user so changes persist
    login(updatedUser, token);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // If user not loaded yet
  // ─────────────────────────────────────────────────────────────────────────────
  if (!loggedInUser) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Show "empty" messages if there's no data
  // ─────────────────────────────────────────────────────────────────────────────
  const renderEmptyListMessage = (forTab) => {
    switch (forTab) {
      case TABS.POLLS:
        return 'Create your first poll with the plus button below';
      case TABS.VOTES:
        return 'Start voting!';
      case TABS.COMMENTS:
        return 'Share your thoughts - leave a comment on a poll.';
      default:
        return '';
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Render the tab content
  // ─────────────────────────────────────────────────────────────────────────────
  const renderTabContent = () => {
    if (loading) {
      return (
        <ActivityIndicator
          style={{ marginTop: 20 }}
          color={colors.primary}
          size="large"
        />
      );
    }
    if (error) {
      return <Text style={{ color: 'red', marginTop: 20 }}>{error}</Text>;
    }

    switch (selectedTab) {
      case TABS.POLLS: {
        if (userPolls.length === 0) {
          return (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {renderEmptyListMessage(TABS.POLLS)}
              </Text>
            </View>
          );
        }
        return (
          <FlatList
            data={userPolls}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <PollCard
                poll={item}
                onVote={handleVote}
                onOpenMenu={handleOpenMenu}
              />
            )}
            contentContainerStyle={{ paddingBottom: 16 }}
          />
        );
      }

      case TABS.VOTES: {
        if (votedPolls.length === 0) {
          return (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {renderEmptyListMessage(TABS.VOTES)}
              </Text>
            </View>
          );
        }
        return (
          <FlatList
            data={votedPolls}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <VoteCard
                poll={item}
                user={loggedInUser}
              />
            )}
            contentContainerStyle={{ paddingBottom: 16 }}
          />
        );
      }

      case TABS.COMMENTS: {
        if (commentsGroupedByPoll.length === 0) {
          return (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {renderEmptyListMessage(TABS.COMMENTS)}
              </Text>
            </View>
          );
        }
        return (
          <FlatList
            data={commentsGroupedByPoll}
            keyExtractor={(item) => item.pollId.toString()}
            renderItem={({ item }) => (
              <CommentCard
                poll={item.poll}
                userComments={item.userComments}
                user={loggedInUser}
              />
            )}
            contentContainerStyle={{ paddingBottom: 16 }}
          />
        );
      }

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.picContainer}>
          <Image
            source={{
              uri: loggedInUser.profilePicture || 'https://picsum.photos/200/200',
            }}
            style={styles.profileImage}
          />
          {/* <CloudBubble text="This is my cloud bubble thought. It can wrap multiple lines." /> */}
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => editProfileRef.current?.openEditProfile(loggedInUser)}
          >
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Display Name vs Username */}
        {loggedInUser.displayName ? (
          <>
            <Text style={styles.displayName}>{loggedInUser.displayName}</Text>
            <Text style={styles.usernameSubtitle}>
              @{loggedInUser.username || 'Unknown'}
            </Text>
          </>
        ) : (
          <Text style={styles.usernameTitle}>
            @{loggedInUser.username || 'Unknown'}
          </Text>
        )}

        {/* Personal summary */}
        <Text style={styles.summaryText}>
          {loggedInUser.personalSummary || 'No personal summary yet.'}
        </Text>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{followers}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{following}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{totalPolls}</Text>
            <Text style={styles.statLabel}>Polls</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{totalVotes}</Text>
            <Text style={styles.statLabel}>Total Votes</Text>
          </View>
        </View>
      </View>

      {/* Tabs Row */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabButton, selectedTab === TABS.POLLS && styles.activeTabButton]}
          onPress={() => handleTabPress(TABS.POLLS)}
        >
          <Text
            style={[
              styles.tabButtonText,
              selectedTab === TABS.POLLS && styles.activeTabButtonText,
            ]}
          >
            Polls
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, selectedTab === TABS.VOTES && styles.activeTabButton]}
          onPress={() => handleTabPress(TABS.VOTES)}
        >
          <Text
            style={[
              styles.tabButtonText,
              selectedTab === TABS.VOTES && styles.activeTabButtonText,
            ]}
          >
            Votes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, selectedTab === TABS.COMMENTS && styles.activeTabButton]}
          onPress={() => handleTabPress(TABS.COMMENTS)}
        >
          <Text
            style={[
              styles.tabButtonText,
              selectedTab === TABS.COMMENTS && styles.activeTabButtonText,
            ]}
          >
            Comments
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <View style={styles.tabContent}>{renderTabContent()}</View>

      {/* Poll Modals Manager */}
      <PollModalsManager
        ref={pollModalsRef}
        onDeletePoll={handleDeletePoll}
        onSavePoll={handleSavePoll}
      />

      {/* Edit Profile Modal */}
      <EditProfileModal
        ref={editProfileRef}
        onSaveProfile={handleSaveProfile}
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.appBackground || '#fff',
  },
  profileHeader: {
    backgroundColor: colors.dark,
    paddingTop: 60,
    paddingBottom: 10,
    paddingHorizontal: 16,
  },
  picContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  editButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#21D0B2',
    backgroundColor: '#21D0B2',
  },
  editButtonText: {
    color: colors.dark,
    fontSize: 14,
    fontWeight: '600',
  },
  usernameTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.light,
    marginBottom: 4,
  },
  displayName: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.light,
    marginBottom: 2,
  },
  usernameSubtitle: {
    fontSize: 16,
    color: colors.light,
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 14,
    color: colors.light,
    marginBottom: 12,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.light,
  },
  statLabel: {
    fontSize: 12,
    color: '#ccc',
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabButtonText: {
    color: colors.dark,
    fontSize: 16,
    fontWeight: '500',
  },
  activeTabButton: {
    borderBottomWidth: 3,
    borderBottomColor: colors.primary,
  },
  activeTabButtonText: {
    color: colors.primary,
    fontWeight: '700',
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: '#777',
    fontSize: 16,
    textAlign: 'center',
  },
});
