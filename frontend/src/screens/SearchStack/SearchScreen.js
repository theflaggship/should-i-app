// src/screens/SearchScreen.js
import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { ArrowLeftCircle } from 'react-native-feather';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../../context/AuthContext';
import { searchUsersAndPolls } from '../../services/searchService';
import { getSuggestedUsers } from '../../services/userService';
import { followUser, unfollowUser } from '../../services/followService';
import { sendVoteWS } from '../../services/pollService';
import { usePollsStore } from '../../store/usePollsStore';
import { useUserStatsStore } from '../../store/useUserStatsStore';
import { getPollById } from '../../services/pollService';
import PollCard from '../../components/PollCard';
import UserCard from '../../components/UserCard';
import colors from '../../styles/colors';

export default function SearchScreen() {
  const { token, user: loggedInUser } = useContext(AuthContext);
  const { user } = useContext(AuthContext);
  const navigation = useNavigation();

  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('Users');
  const [loading, setLoading] = useState(false);

  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [searchResults, setSearchResults] = useState({ users: [], polls: [] });
  const [toggling, setToggling] = useState({});

  const { incrementFollowing, decrementFollowing } = useUserStatsStore();

  const timeoutRef = useRef(null);
  const searchCache = useRef({});

  const debounce = (fn, delay = 400) => {
    return (...args) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => fn(...args), delay);
    };
  };

  const search = async (q) => {
    try {
      setLoading(true);

      // ✅ Use cached results if available
      if (searchCache.current[q]) {
        const cached = searchCache.current[q];
        setSearchResults(cached);

        const polls = cached.polls || [];
        usePollsStore.getState().upsertPolls(polls);
        return;
      }

      // ✅ Fresh search request
      const res = await searchUsersAndPolls(q, token);
      searchCache.current[q] = res; // save to cache
      setSearchResults(res);
      const polls = res.polls || [];
      if (polls.length) usePollsStore.getState().upsertPolls(polls);
    } catch (err) {
      console.error('Search error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = debounce(search);

  useEffect(() => {
    if (!query.trim()) {
      fetchSuggested();
    } else {
      debouncedSearch(query);
    }
  }, [query]);


  useEffect(() => {
    if (loggedInUser?.id && token) {
      usePollsStore.getState().initPolls(token, loggedInUser.id);
    }
  }, [loggedInUser?.id, token]);

  useEffect(() => {
    if (!searchResults.polls || searchResults.polls.length === 0) return;
    const ids = searchResults.polls.map((p) => p.id);
  }, [searchResults.polls]);

  const fetchSuggested = async () => {
    try {
      setLoading(true);
      const data = await getSuggestedUsers(loggedInUser.id, token);
      setSuggestedUsers(data);
    } catch (err) {
      console.error('Suggested users error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFollow = async (item, idx) => {
    if (toggling[item.id]) return;
    setToggling((prev) => ({ ...prev, [item.id]: true }));

    const wasFollowing = item.amIFollowing;
    const updatedUsers = [...(query.trim() ? searchResults.users : suggestedUsers)];
    updatedUsers[idx].amIFollowing = !wasFollowing;

    if (!query.trim()) {
      setSuggestedUsers(updatedUsers);
    } else {
      setSearchResults((prev) => ({
        ...prev,
        users: updatedUsers,
      }));
    }

    wasFollowing ? decrementFollowing() : incrementFollowing();

    try {
      if (wasFollowing) {
        await unfollowUser(item.id, token);
      } else {
        await followUser(item.id, token);
      }
    } catch (err) {
      console.error('Follow toggle failed:', err.message);
      updatedUsers[idx].amIFollowing = wasFollowing;
      if (!query.trim()) {
        setSuggestedUsers(updatedUsers);
      } else {
        setSearchResults((prev) => ({
          ...prev,
          users: updatedUsers,
        }));
      }
      wasFollowing ? incrementFollowing() : decrementFollowing();
    } finally {
      setToggling((prev) => ({ ...prev, [item.id]: false }));
    }
  };

  const usersToRender = query.trim() ? searchResults.users : suggestedUsers;
  const pollsToRender = searchResults.polls;

  const handlePollPress = (item) => navigation.navigate('PollDetails', { pollId: item.id });


  const renderUserItem = ({ item, index }) => (
    <UserCard
      user={item}
      loggedInUserId={loggedInUser?.id}
      toggling={toggling}
      onToggleFollow={() => handleToggleFollow(item, index)}
    />
  );

  const renderPollItem = ({ item }) => (
    <TouchableOpacity onPress={() => handlePollPress(item)} activeOpacity={0.8}>
      <PollCard poll={item} onVote={(pollId, optionId) => sendVoteWS(user.id, pollId, optionId)} />
    </TouchableOpacity>
  );




  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <ArrowLeftCircle width={30} color={colors.dark} />
      </TouchableOpacity>

      {/* Header */}
      <Text style={styles.header}>Search</Text>

      {/* Search Input */}
      <TextInput
        style={styles.searchInput}
        placeholder="Search users or polls..."
        placeholderTextColor="#999"
        value={query}
        onChangeText={setQuery}
      />

      {/* Tabs - Only appear if query is typed */}
      {query.trim().length > 0 && (
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'Users' && styles.activeTabButton]}
            onPress={() => setActiveTab('Users')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'Users' && styles.activeTabButtonText]}>Users</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'Polls' && styles.activeTabButton]}
            onPress={() => setActiveTab('Polls')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'Polls' && styles.activeTabButtonText]}>Polls</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Follow Suggestions Header */}
      {!query.trim() && suggestedUsers.length > 0 && (
        <Text style={styles.suggestionHeader}>Follow Suggestions</Text>
      )}

      {/* Content */}
      {loading ? (
        <ActivityIndicator
          color={colors.primary}
          size="large"
          style={{ marginTop: 30 }}
        />
      ) : (
        <FlatList
          data={activeTab === 'Users' || !query.trim() ? usersToRender : pollsToRender}
          keyExtractor={(item, i) => item.id?.toString() || i.toString()}
          renderItem={activeTab === 'Users' || !query.trim() ? renderUserItem : renderPollItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.emptyText}>No results found.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.appBackground,
    paddingTop: 100,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    zIndex: 10,
  },
  header: {
    fontFamily: 'Quicksand-SemiBold',
    fontSize: 20,
    color: colors.dark,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  searchInput: {
    fontFamily: 'Quicksand-Medium',
    backgroundColor: colors.light,
    borderRadius: 8,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.dark,
    marginBottom: 12,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  tabButtonText: {
    fontFamily: 'Quicksand-Bold',
    fontSize: 16,
    fontWeight: '500',
    color: colors.dark,
  },
  activeTabButton: {
    borderBottomWidth: 3,
    borderBottomColor: colors.primary,
  },
  activeTabButtonText: {
    color: colors.primary,
    fontWeight: '700',
  },
  suggestionHeader: {
    fontFamily: 'Quicksand-SemiBold',
    fontSize: 16,
    color: colors.dark,
    marginBottom: 6,
    marginHorizontal: 16,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 60,
  },
  emptyText: {
    fontFamily: 'Quicksand-Medium',
    textAlign: 'center',
    color: 'gray',
    marginTop: 30,
  },
});
