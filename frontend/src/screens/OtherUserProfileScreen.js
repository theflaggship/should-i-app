// src/screens/OtherUserProfileScreen.js
import React, { useEffect, useState, useRef, useContext } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Image,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { usePollsStore } from '../store/usePollsStore';
import { getUserById, getUserComments, getUserStats } from '../services/userService';
import { AuthContext } from '../context/AuthContext';
import colors from '../styles/colors';
import PollCard from '../components/PollCard';
import VoteCard from '../components/VoteCard';
import CommentCard from '../components/CommentCard';

const TABS = {
  POLLS: 'POLLS',
  VOTES: 'VOTES',
  COMMENTS: 'COMMENTS',
};

export default function OtherUserProfileScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { token } = useContext(AuthContext);

  const viewedUserId = route.params?.userId;

  // Zustand store
  const userPolls = usePollsStore((state) => state.userPolls);
  const votedPolls = usePollsStore((state) => state.votedPolls);
  const fetchUserPolls = usePollsStore((state) => state.fetchUserPolls);
  const fetchUserVotedPolls = usePollsStore((state) => state.fetchUserVotedPolls);

  const loading = usePollsStore((state) => state.loading);
  const error = usePollsStore((state) => state.error);

  const [profileOwner, setProfileOwner] = useState(null);
  const [commentsGroupedByPoll, setCommentsGroupedByPoll] = useState([]);
  const [selectedTab, setSelectedTab] = useState(TABS.POLLS);
  const [stats, setStats] = useState({
    followers: 0,
    following: 0,
    totalPolls: 0,
    totalVotes: 0,
  });
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    if (viewedUserId) {
      fetchDataForUser();
    }
  }, [viewedUserId]);

  const fetchDataForUser = async () => {
    try {
      // 1) Fetch the user data
      const fetchedUser = await getUserById(viewedUserId, token);
      setProfileOwner(fetchedUser);

      // 2) Fetch user polls
      await fetchUserPolls(token, viewedUserId);

      // 3) Fetch stats
      const statsData = await getUserStats(viewedUserId, token);
      setStats(statsData);
    } catch (err) {
      console.error('Error fetching user data:', err);
    }
  };

  const handleTabPress = async (tab) => {
    setSelectedTab(tab);
    if (tab === TABS.POLLS) {
      await fetchUserPolls(token, viewedUserId);
    } else if (tab === TABS.VOTES) {
      await fetchUserVotedPolls(token, viewedUserId);
    } else if (tab === TABS.COMMENTS) {
      try {
        const data = await getUserComments(viewedUserId, token);
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
        console.error('Error fetching user comments:', err);
      }
    }
  };

  const handleFollowToggle = () => {
    setIsFollowing(!isFollowing);
  };

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

    if (selectedTab === TABS.POLLS) {
      return (
        <FlatList
          data={userPolls}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <PollCard poll={item} disableMainPress={false} />}
          contentContainerStyle={{ paddingBottom: 16 }}
        />
      );
    } else if (selectedTab === TABS.VOTES) {
      return (
        <FlatList
          data={votedPolls}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <VoteCard poll={item} />}
          contentContainerStyle={{ paddingBottom: 16 }}
        />
      );
    } else if (selectedTab === TABS.COMMENTS) {
      return (
        <FlatList
          data={commentsGroupedByPoll}
          keyExtractor={(item) => item.pollId.toString()}
          renderItem={({ item }) => (
            <CommentCard poll={item.poll} userComments={item.userComments} />
          )}
          contentContainerStyle={{ paddingBottom: 16 }}
        />
      );
    }
    return null;
  };

  if (!profileOwner) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const showSummary = profileOwner.personalSummary && profileOwner.personalSummary.trim() !== '';

  return (
    <View style={styles.container}>
      {/* Custom back button on top of user pic */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>

      {/* The top header with user pic + follow button */}
      <View style={styles.profileHeader}>
        <View style={styles.picContainer}>
          <Image
            source={{
              uri: profileOwner.profilePicture || 'https://picsum.photos/200/200',
            }}
            style={styles.profileImage}
          />
          {/* Always show Follow button (no edit) */}
          <TouchableOpacity
            style={[
              styles.editButton,
              { backgroundColor: isFollowing ? '#666' : '#21D0B2' },
            ]}
            onPress={handleFollowToggle}
          >
            <Text style={styles.editButtonText}>
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.username}>@{profileOwner.username || 'Unknown'}</Text>

        {showSummary && (
          <Text style={styles.summaryText}>{profileOwner.personalSummary}</Text>
        )}

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.followers}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.following}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.totalPolls}</Text>
            <Text style={styles.statLabel}>Polls</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.totalVotes}</Text>
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

      {/* Tab content */}
      <View style={styles.tabContent}>{renderTabContent()}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: colors.appBackground || '#fff',
  },
  backButton: {
    position: 'absolute',
    top: 50,   // adjust as needed so it sits above user pic
    left: 16,
    zIndex: 9999,
  },
  backButtonText: {
    color: colors.light,
    fontSize: 16,
    fontWeight: '400',
  },
  profileHeader: {
    backgroundColor: colors.dark,
    paddingTop: 80,
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
  },
  editButtonText: {
    color: colors.dark,
    fontSize: 14,
    fontWeight: '600',
  },
  username: {
    fontSize: 20,
    fontWeight: '600',
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
});
