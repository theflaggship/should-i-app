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
} from 'react-native';

// Import your color palette
import colors from '../styles/colors';

// Import your auth context (for the token) and follow services
import { AuthContext } from '../context/AuthContext';
import {
  getFollowers,
  getFollowing,
  followUser,
  unfollowUser,
} from '../services/followService';

const DEFAULT_PROFILE_IMG = 'https://picsum.photos/200/200';

const FollowersFollowingScreen = ({ route, navigation }) => {
  /**
   * route.params should include:
   *  - mode: 'followers' or 'following'
   *  - userId: the ID of the user whose list we want to see
   */
  const { mode, userId } = route.params;
  const { token } = useContext(AuthContext);

  // Local state
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch the appropriate list on mount or when mode/userId changes
  useEffect(() => {
    fetchData();
  }, [mode, userId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      let data = [];
      if (mode === 'followers') {
        data = await getFollowers(userId, token);
      } else {
        data = await getFollowing(userId, token);
      }
      console.log('Fetched data:', data); // Debug
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Toggle follow/unfollow
  const handleFollowToggle = async (user) => {
    try {
      if (user.amIFollowing) {
        // If we are currently following, unfollow
        await unfollowUser(user.id, token);
      } else {
        // Otherwise, follow
        await followUser(user.id, token);
      }
      // Re-fetch the list to update the UI
      fetchData();
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  // Render each row in the list
  const renderItem = ({ item }) => {
    // Determine what name to show
    const displayNameOrUsername = item.displayName || item.username;

    return (
      <View style={styles.userRow}>
        {/* User's Avatar */}
        <Image
          source={
            item.profilePicture
              ? { uri: item.profilePicture }
              : DEFAULT_PROFILE_IMG
          }
          style={styles.avatar}
        />

        {/* User's Text Info */}
        <View style={styles.userInfo}>
          <Text style={styles.displayName}>{displayNameOrUsername}</Text>

          {/* Show @username if displayName is also present, for clarity */}
          {item.displayName && item.username ? (
            <Text style={styles.username}>@{item.username}</Text>
          ) : null}

          {/* Personal summary if available */}
          {item.personalSummary ? (
            <Text style={styles.personalSummary}>{item.personalSummary}</Text>
          ) : null}

          {/* "Follows You" indicator if the user is following you */}
          {item.isFollowingMe && (
            <Text style={styles.followsYou}>Follows You</Text>
          )}
        </View>

        {/* Follow/Unfollow button */}
        <TouchableOpacity
          style={styles.followButton}
          onPress={() => handleFollowToggle(item)}
        >
          <Text style={styles.followButtonText}>
            {item.amIFollowing
              ? 'Unfollow'
              : item.isFollowingMe
              ? 'Follow Back'
              : 'Follow'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Screen Title (e.g., "Followers" or "Following")
  const screenTitle = mode === 'followers' ? 'Followers' : 'Following';

  return (
    <View style={styles.container}>
      {/* Header */}
      <Text style={styles.headerText}>{screenTitle}</Text>

      {/* Loading Spinner */}
      {loading ? (
        <ActivityIndicator size="large" color="#fff" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

export default FollowersFollowingScreen;

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark, // Your dark color
    paddingTop: 16,
  },
  headerText: {
    fontSize: 20,
    color: '#fff',
    marginBottom: 16,
    fontWeight: 'bold',
    paddingHorizontal: 16,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2e2e2e',
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
  followButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    alignSelf: 'center',
  },
  followButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
