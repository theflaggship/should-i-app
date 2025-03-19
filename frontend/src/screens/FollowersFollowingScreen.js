// src/screens/FollowersFollowingScreen.js

import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Check } from 'react-native-feather';
import colors from '../styles/colors';
import { AuthContext } from '../context/AuthContext';
import {
  getFollowers,
  getFollowing,
  followUser,
  unfollowUser,
} from '../services/followService';
import { useUserStatsStore } from '../store/useUserStatsStore';

const DEFAULT_PROFILE_IMG = 'https://picsum.photos/200/200';

export default function FollowersFollowingScreen({ route }) {
  const navigation = useNavigation();
  const { mode, userId } = route.params;

  // Logged-in user from AuthContext
  const { user: loggedInUser, token } = useContext(AuthContext);

  // Local stats store
  const { incrementFollowing, decrementFollowing } = useUserStatsStore();

  // Screen state
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState({});

  useEffect(() => {
    fetchData();
  }, [mode, userId]);

  /**
   * Fetch data depending on the tab (Followers or Following).
   */
  const fetchData = async () => {
    setLoading(true);
    try {
      if (mode === 'followers') {
        // People who follow userId
        const [followerData, iFollowData] = await Promise.all([
          getFollowers(userId, token),         // e.g. [ { id, displayName, ... } ... ]
          getFollowing(loggedInUser.id, token) // who I follow, so I can mark amIFollowing
        ]);

        // Mark "amIFollowing" if I follow them
        const merged = followerData.map((f) => ({
          ...f,
          amIFollowing: iFollowData.some((u) => u.id === f.id),
        }));
        setUsers(merged);

      } else {
        // mode === 'following': People userId is following
        const followingData = await getFollowing(userId, token);

        // Mark them as amIFollowing = true if it's userId's "following" list
        const merged = followingData.map((f) => ({
          ...f,
          amIFollowing: true
        }));
        setUsers(merged);
      }
    } catch (err) {
      console.error('Fetch error:', err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Toggle Follow/Unfollow for the given user
   * (Optimistic UI + local stats update).
   */
  const handleToggle = async (item, idx) => {
    if (toggling[item.id]) return; // Prevent double-taps
    setToggling((prev) => ({ ...prev, [item.id]: true }));

    const wasFollowing = item.amIFollowing;
    const updated = [...users];

    // Flip amIFollowing in local array
    updated[idx].amIFollowing = !wasFollowing;
    setUsers(updated);

    // Real-time local stat changes (my "following" count)
    if (wasFollowing) {
      decrementFollowing();
    } else {
      incrementFollowing();
    }

    try {
      if (wasFollowing) {
        await unfollowUser(item.id, token);
      } else {
        await followUser(item.id, token);
      }
      // No immediate removal from the list in "following" mode:
      // We'll let a future fetch remove them if I'm no longer following them.
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      if (!msg.toLowerCase().includes('already following')) {
        console.error('Follow toggle failed:', msg);

        // Roll back local UI
        updated[idx].amIFollowing = wasFollowing;
        setUsers(updated);

        // Roll back stats
        if (wasFollowing) {
          incrementFollowing();
        } else {
          decrementFollowing();
        }
      }
    } finally {
      setToggling((prev) => ({ ...prev, [item.id]: false }));
    }
  };

  const renderItem = ({ item, index }) => {
    const isFollowing = item.amIFollowing;
    const followBack = !isFollowing && item.isFollowingMe;
    const displayName = item.displayName || item.username;

    return (
      <View style={styles.userRow}>
        <Image
          source={{ uri: item.profilePicture || DEFAULT_PROFILE_IMG }}
          style={styles.avatar}
        />

        <View style={styles.userInfo}>
          <Text style={styles.displayName}>{displayName}</Text>
          {!!item.displayName && <Text style={styles.username}>@{item.username}</Text>}
          {!!item.personalSummary && <Text style={styles.summary}>{item.personalSummary}</Text>}
          {item.isFollowingMe && <Text style={styles.followsYou}>Follows You</Text>}
        </View>

        {/* Follow/Unfollow Button */}
        <TouchableOpacity
          disabled={toggling[item.id]}
          style={[styles.button, isFollowing ? styles.buttonFollowing : styles.buttonFollow]}
          onPress={() => handleToggle(item, index)}
        >
          <Text style={[styles.buttonText, isFollowing ? styles.textFollowing : styles.textFollow]}>
            {isFollowing ? 'Following' : followBack ? 'Follow Back' : 'Follow'}
          </Text>
          {isFollowing && (
            <Check width={14} height={14} color={colors.secondary} style={{ marginLeft: 4 }} />
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>

      <Text style={styles.header}>
        {mode === 'followers' ? 'Followers' : 'Following'}
      </Text>

      {loading ? (
        <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item, i) => item.id?.toString() || i.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

// ============= STYLES =============
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.dark, paddingTop: 100 },
  backButton: { position: 'absolute', top: 50, left: 16, zIndex: 10 },
  backButtonText: { color: colors.light, fontSize: 16 },
  header: { fontSize: 20, fontWeight: '600', color: colors.light, paddingHorizontal: 16, marginBottom: 12 },
  list: { paddingHorizontal: 16 },

  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2e2e2e',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  avatar: { width: 48, height: 48, borderRadius: 24, marginRight: 12 },
  userInfo: { flex: 1 },
  displayName: { fontSize: 16, color: colors.light, fontWeight: '600' },
  username: { fontSize: 14, color: '#aaa' },
  summary: { fontSize: 12, color: '#aaa', marginTop: 4 },
  followsYou: { fontSize: 12, color: '#4caf50', marginTop: 4 },

  button: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  buttonFollow: {
    backgroundColor: '#21D0B2',
    borderColor: '#21D0B2',
  },
  buttonFollowing: {
    backgroundColor: '#2a3d52',
    borderColor: '#2a3d52',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  textFollow: {
    color: colors.dark,
  },
  textFollowing: {
    color: colors.light,
  },
});
