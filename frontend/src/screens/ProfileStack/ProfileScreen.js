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
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { AuthContext } from '../../context/AuthContext';
import { usePollsStore } from '../../store/usePollsStore';
import { useUserStatsStore } from '../../store/useUserStatsStore';
import PollCard from '../../components/PollCard';
import VoteCard from '../../components/VoteCard';
import CommentCard from '../../components/CommentCard';
import PollModalsManager from '../../components/PollModalsManager';
import EditProfileModal from '../../components/EditProfileModal';
import ProfileOptionsModal from '../../components/ProfileOptionsModal';
import { getUserComments, getUserById } from '../../services/userService';
import { deletePoll, updatePoll, sendVoteWS } from '../../services/pollService';
import { MoreHorizontal } from 'react-native-feather';
import colors from '../../styles/colors';

const TABS = {
  POLLS: 'POLLS',
  VOTES: 'VOTES',
  COMMENTS: 'COMMENTS',
};

export default function ProfileScreen() {
  const navigation = useNavigation(); // Access navigation
  const { user: loggedInUser, token, login } = useContext(AuthContext);

  // ----- Polls Store -----
  const {
    userPolls,
    userPollOffset,
    userPollPageSize,
    userPollTotalCount,
    fetchUserPollsPage,
    loadMoreUserPolls,

    votedPolls,
    userVotedOffset,
    userVotedPageSize,
    userVotedTotalCount,
    fetchUserVotesPage,
    loadMoreUserVotedPolls,

    userComments,
    userCommentOffset,
    userCommentPageSize,
    userCommentTotalCount,
    fetchUserCommentsPage,
    loadMoreUserComments,

    loading,
    error,
    removePoll,
    updatePollInBoth,
  } = usePollsStore();

  // ----- Stats Store -----
  const {
    followers,
    following,
    totalPolls,
    totalVotes,
    fetchStats,
    loading: statsLoading,
    error: statsError,
  } = useUserStatsStore();

  // Which tab is selected?
  const [selectedTab, setSelectedTab] = useState(TABS.POLLS);
  const [refreshing, setRefreshing] = useState(false);

  // Refs for modals
  const pollModalsRef = useRef(null);
  const editProfileRef = useRef(null);

  // ─────────────────────────────────────────────────────────────────────────────
  // On mount, fetch stats and the first page of user polls
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!loggedInUser?.id) return;

    // Re-fetch the user from server
    getUserById(loggedInUser.id, token)
      .then((freshUser) => {
        // Overwrite the local AuthContext user with the updated data
        login(freshUser, token);

        // Then fetch stats, polls, etc.
        fetchStats(freshUser.id, token);
        fetchUserPollsPage(token, freshUser.id, userPollPageSize, 0);
      })
      .catch((err) => console.error('Error refreshing user:', err));
  }, [loggedInUser?.id, token]);

  // ─────────────────────────────────────────────────────────────────────────────
  // useFocusEffect: re-fetch data for the current tab whenever screen regains focus
  // ─────────────────────────────────────────────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      if (!loggedInUser?.id) return;

      if (selectedTab === TABS.POLLS) {
        // optionally refresh
      } else if (selectedTab === TABS.VOTES) {
        fetchUserVotesPage(token, loggedInUser.id, userVotedPageSize, 0);
      } else if (selectedTab === TABS.COMMENTS) {
        fetchUserCommentsPage(token, loggedInUser.id, userCommentPageSize, 0);
      }
    }, [selectedTab, loggedInUser?.id, token])
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // User Options Press
  // ─────────────────────────────────────────────────────────────────────────────
  const optionsModalRef = useRef(null);
  const signOutRequested = useRef(false);
  const editRequested = useRef(false);

  const { logout } = useContext(AuthContext);

  const handleOpenOptions = () => optionsModalRef.current?.open();
  const handleEdit = () => {
    editRequested.current = true;
    optionsModalRef.current?.close();
  };
  const handleSignOutRequest = () => {
    signOutRequested.current = true;
    optionsModalRef.current?.close();
  };

  const handleOptionsClosed = () => {
    if (editRequested.current) {
      editRequested.current = false;
      editProfileRef.current?.openEditProfile(loggedInUser);
      return;
    }
    if (signOutRequested.current) {
      signOutRequested.current = false;
      logout();
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    }
  };

  const handleSignOut = () => {
    logout();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Pull-to-refresh
  // ─────────────────────────────────────────────────────────────────────────────
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      if (selectedTab === TABS.POLLS) {
        await fetchUserPollsPage(token, loggedInUser.id, userPollPageSize, 0);
      } else if (selectedTab === TABS.VOTES) {
        await fetchUserVotesPage(token, loggedInUser.id, userVotedPageSize, 0);
      } else if (selectedTab === TABS.COMMENTS) {
        await fetchUserCommentsPage(token, loggedInUser.id, userCommentPageSize, 0);
      }
    } catch (err) {
      console.error('Refresh error:', err);
    } finally {
      setRefreshing(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Tab press
  // ─────────────────────────────────────────────────────────────────────────────
  const handleTabPress = async (tab) => {
    setSelectedTab(tab);
    setRefreshing(true);
    try {
      if (tab === TABS.POLLS) {
        await fetchUserPollsPage(token, loggedInUser.id, userPollPageSize, 0);
      } else if (tab === TABS.VOTES) {
        await fetchUserVotesPage(token, loggedInUser.id, userVotedPageSize, 0);
      } else if (tab === TABS.COMMENTS) {
        await fetchUserCommentsPage(token, loggedInUser.id, userCommentPageSize, 0);
      }
    } catch (err) {
      console.error('Tab fetch error:', err);
    } finally {
      setRefreshing(false);
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
      // e.g. deletePoll(token, pollToDelete.id)
      removePoll(pollToDelete.id, loggedInUser.id, token);
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
  // Voting
  // ─────────────────────────────────────────────────────────────────────────────
  const handleVote = (pollId, optionId) => {
    if (!loggedInUser?.id) return;
    sendVoteWS(loggedInUser.id, pollId, optionId);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Edit Profile
  // ─────────────────────────────────────────────────────────────────────────────
  const handleSaveProfile = (updatedUser) => {
    login(updatedUser, token);
    fetchStats(updatedUser.id, token);
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
  // Load More for Polls
  // ─────────────────────────────────────────────────────────────────────────────
  const canLoadMorePolls = userPolls.length < userPollTotalCount;
  const handleLoadMorePolls = async () => {
    if (!canLoadMorePolls || loading) return;
    await loadMoreUserPolls(token, loggedInUser.id);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Load More for Votes
  // ─────────────────────────────────────────────────────────────────────────────
  const canLoadMoreVotes = votedPolls.length < userVotedTotalCount;
  const handleLoadMoreVotes = async () => {
    if (!canLoadMoreVotes || loading) return;
    await loadMoreUserVotedPolls(token, loggedInUser.id);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Load More for Comments
  // ─────────────────────────────────────────────────────────────────────────────
  const canLoadMoreComments = userComments.length < userCommentTotalCount;
  const handleLoadMoreComments = async () => {
    if (!canLoadMoreComments || loading) return;
    await loadMoreUserComments(token, loggedInUser.id);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Render Tab Content
  // ─────────────────────────────────────────────────────────────────────────────
  const renderTabContent = () => {
    if (loading && selectedTab !== TABS.COMMENTS) {
      if (
        (selectedTab === TABS.POLLS && userPolls.length === 0) ||
        (selectedTab === TABS.VOTES && votedPolls.length === 0)
      ) {
        return (
          <ActivityIndicator
            style={{ marginTop: 20 }}
            color={colors.primary}
            size="large"
          />
        );
      }
    }

    if (error) {
      return <Text style={{ color: 'red', marginTop: 20 }}>{error}</Text>;
    }

    // Polls Tab
    if (selectedTab === TABS.POLLS) {
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
            <PollCard poll={item} onVote={handleVote} onOpenMenu={handleOpenMenu} />
          )}
          contentContainerStyle={{ paddingBottom: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          onEndReachedThreshold={0.7}
          onEndReached={handleLoadMorePolls}
          ListFooterComponent={
            loading && userPolls.length > 0 ? (
              <ActivityIndicator
                color={colors.primary}
                style={{ marginVertical: 10 }}
              />
            ) : null
          }
        />
      );
    }

    // Votes Tab
    if (selectedTab === TABS.VOTES) {
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
          renderItem={({ item }) => <VoteCard poll={item} user={loggedInUser} />}
          contentContainerStyle={{ paddingBottom: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          onEndReachedThreshold={0.7}
          onEndReached={handleLoadMoreVotes}
          ListFooterComponent={
            loading && votedPolls.length > 0 ? (
              <ActivityIndicator
                color={colors.primary}
                style={{ marginVertical: 10 }}
              />
            ) : null
          }
        />
      );
    }

    // Comments Tab
    if (selectedTab === TABS.COMMENTS) {
      if (userComments.length === 0) {
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
          data={userComments}
          keyExtractor={(item) => item.pollId.toString()}
          renderItem={({ item }) =>
            item.poll ? (
              <CommentCard poll={item.poll} userComments={item.userComments} user={loggedInUser} />
            ) : null
          }
          contentContainerStyle={{ paddingBottom: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          onEndReachedThreshold={0.7}
          onEndReached={handleLoadMoreComments}
          ListFooterComponent={
            loading && userComments.length > 0 ? (
              <ActivityIndicator
                color={colors.primary}
                style={{ marginVertical: 10 }}
              />
            ) : null
          }
        />
      );
    }

    return null;
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.userRow}>
          <Image
            source={{ uri: loggedInUser.profilePicture || 'https://picsum.photos/200/200' }}
            style={styles.profileImage}
          />
          <View style={styles.userTextBlock}>
            {loggedInUser.displayName ? (
              <>
                <Text style={styles.displayName}>{loggedInUser.displayName}</Text>
                <Text style={styles.usernameSubtitle}>@{loggedInUser.username || 'Unknown'}</Text>
              </>
            ) : (
              <Text style={styles.usernameTitle}>@{loggedInUser.username || 'Unknown'}</Text>
            )}
          </View>
          <TouchableOpacity style={styles.optionsButton} onPress={handleOpenOptions}>
            <MoreHorizontal width={24} height={24} color={colors.light} />
          </TouchableOpacity>
        </View>

        {/* Personal summary */}
        <Text style={styles.summaryText}>
          {loggedInUser.personalSummary || 'No personal summary yet.'}
        </Text>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          {/* Followers */}
          <TouchableOpacity
            style={styles.statItem}
            onPress={() =>
              navigation.navigate('FollowersFollowingScreen', {
                userId: loggedInUser.id,
                mode: 'followers',
              })
            }
          >
            <Text style={styles.statNumber}>{followers}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </TouchableOpacity>

          {/* Following */}
          <TouchableOpacity
            style={styles.statItem}
            onPress={() =>
              navigation.navigate('FollowersFollowingScreen', {
                userId: loggedInUser.id,
                mode: 'following',
              })
            }
          >
            <Text style={styles.statNumber}>{following}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </TouchableOpacity>

          {/* Polls */}
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{totalPolls}</Text>
            <Text style={styles.statLabel}>Polls</Text>
          </View>

          {/* Total Votes */}
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

      <ProfileOptionsModal
        ref={optionsModalRef}
        onEdit={handleEdit}
        onSignOut={handleSignOutRequest}
        onClosed={handleOptionsClosed}
      />

      {/* Edit Profile Modal */}
      <EditProfileModal ref={editProfileRef} onSaveProfile={handleSaveProfile} />
    </View>
  );
}

// ============= STYLES =============
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.appBackground || '#fff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  profileHeader: {
    backgroundColor: colors.dark,
    paddingTop: 60,
    paddingBottom: 10,
    paddingHorizontal: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  userTextBlock: {
    flexShrink: 1,
    paddingLeft: 14,
  },
  optionsButton: {
    position: 'absolute',
    top: -10,            // lifts button above profile image
    right: -10,          // hugs right edge
    backgroundColor: colors.input,
    borderWidth: .5,
    borderColor: colors.light,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  displayName: {
    fontFamily: 'Quicksand-SemiBold',
    fontSize: 20,
    fontWeight: '600',
    color: colors.light,
    marginBottom: 2,
  },
  usernameSubtitle: {
    fontFamily: 'Quicksand-Medium',
    fontSize: 16,
    color: colors.secondaryLight,
    marginBottom: 4,
  },
  summaryText: {
    fontFamily: 'Quicksand-Medium',
    fontSize: 16,
    color: colors.light,
    marginBottom: 12,
    marginTop: 2,
    paddingLeft: 8,
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
    fontFamily: 'Quicksand-SemiBold',
    fontSize: 16,
    fontWeight: '600',
    color: colors.secondaryLight,
  },
  statLabel: {
    fontFamily: 'Quicksand-SemiBold',
    fontSize: 12,
    color: colors.secondaryLight,
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
    fontFamily: 'Quicksand-Bold',
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
