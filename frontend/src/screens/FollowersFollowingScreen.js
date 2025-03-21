// FollowersFollowingScreen.js

import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  TextInput,
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
  const { token } = useContext(AuthContext);
  const { incrementFollowing, decrementFollowing } = useUserStatsStore();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState({});
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, [mode, userId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let data = [];
      if (mode === 'followers') {
        data = await getFollowers(userId, token);
      } else {
        data = await getFollowing(userId, token);
      }
      setUsers(data);
    } catch (err) {
      console.error('Fetch error:', err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  // Follow/Unfollow toggle
  const handleToggle = async (item, idx) => {
    if (toggling[item.id]) return;
    setToggling((prev) => ({ ...prev, [item.id]: true }));

    const wasFollowing = item.amIFollowing;
    const updated = [...users];
    updated[idx].amIFollowing = !wasFollowing;
    setUsers(updated);
    wasFollowing ? decrementFollowing() : incrementFollowing();

    try {
      if (wasFollowing) {
        await unfollowUser(item.id, token);
      } else {
        await followUser(item.id, token);
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      if (!msg.toLowerCase().includes('already following')) {
        console.error('Follow toggle failed:', msg);
        updated[idx].amIFollowing = wasFollowing; // revert
        setUsers(updated);
        wasFollowing ? incrementFollowing() : decrementFollowing();
      }
    } finally {
      setToggling((prev) => ({ ...prev, [item.id]: false }));
    }
  };

  // Navigate to a user's profile
  const handleUserPress = (someUserId) => {
    // Adjust route name or param as needed
    navigation.navigate('OtherUserProfile', { userId: someUserId });
  };

  // Filter array based on searchTerm
  const filteredUsers = users.filter((u) => {
    const lowerSearch = searchTerm.toLowerCase();
    const nameMatches = u.displayName?.toLowerCase().includes(lowerSearch);
    const userMatches = u.username?.toLowerCase().includes(lowerSearch);
    return nameMatches || userMatches;
  });

  const renderItem = ({ item, index }) => {
    const name = item.displayName || item.username;
    const isFollowing = item.amIFollowing;
    const followBack = !isFollowing && item.isFollowingMe;

    return (
      <TouchableOpacity
        style={styles.userRow}
        activeOpacity={0.8}
        // If user taps the row (but NOT the follow button), we go to their profile
        onPress={() => handleUserPress(item.id)}
      >
        {/* User avatar */}
        <Image
          source={{ uri: item.profilePicture || DEFAULT_PROFILE_IMG }}
          style={styles.avatar}
        />

        {/* User info */}
        <View style={styles.userInfo}>
          <Text style={styles.displayName}>{name}</Text>
          {item.displayName && item.username ? (
            <Text style={styles.username}>@{item.username}</Text>
          ) : null}

          {item.personalSummary ? (
            <Text style={styles.personalSummary}>{item.personalSummary}</Text>
          ) : null}

          {item.isFollowingMe && (
            <Text style={styles.followsYou}>Follows You</Text>
          )}
        </View>

        {/* Follow/Unfollow button */}
        <TouchableOpacity
          disabled={toggling[item.id]}
          style={[
            styles.button,
            isFollowing ? styles.buttonFollowing : styles.buttonFollow,
          ]}
          onPress={() => handleToggle(item, index)}
        >
          <Text
            style={[
              styles.buttonText,
              isFollowing ? styles.textFollowing : styles.textFollow,
            ]}
          >
            {isFollowing ? 'Following' : followBack ? 'Follow Back' : 'Follow'}
          </Text>
          {isFollowing && (
            <Check width={14} height={14} color={colors.secondary} style={{ marginLeft: 4 }} />
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const screenTitle = mode === 'followers' ? 'Followers' : 'Following';

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.navigate('ProfileMain')}
      >
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>

      <Text style={styles.header}>{screenTitle}</Text>

      {/* Search bar */}
      <TextInput
        style={styles.searchInput}
        placeholder="Search by username or display name..."
        placeholderTextColor="#999"
        value={searchTerm}
        onChangeText={setSearchTerm}
      />

      {loading ? (
        <ActivityIndicator
          color={colors.primary}
          size="large"
          style={{ marginTop: 40 }}
        />
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item, i) =>
            item.id ? item.id.toString() : i.toString()
          }
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark,
    paddingTop: 100,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    zIndex: 10,
  },
  backButtonText: {
    color: colors.light,
    fontSize: 16,
  },
  header: {
    fontSize: 20,
    color: '#fff',
    marginBottom: 12,
    fontWeight: 'bold',
    paddingHorizontal: 16,
  },
  searchInput: {
    backgroundColor: colors.input,
    borderRadius: 8,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#fff',
    marginBottom: 12,
  },
  list: {
    paddingHorizontal: 16,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.input,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  displayName: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  username: {
    fontSize: 14,
    color: '#aaa',
  },
  personalSummary: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 4,
  },
  followsYou: {
    fontSize: 12,
    color: '#4caf50',
    marginTop: 4,
  },
  button: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  buttonFollow: { backgroundColor: '#21D0B2', borderColor: '#21D0B2' },
  buttonFollowing: { backgroundColor: '#2a3d52', borderColor: '#2a3d52' },
  buttonText: { fontSize: 14, fontWeight: '600' },
  textFollow: { color: colors.dark },
  textFollowing: { color: colors.light },
});
