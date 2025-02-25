// PollDetailsScreen.js
import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Animated,
  Image,
  TextInput,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import { usePollsStore } from '../store/usePollsStore';
import { sendVoteWS, sendCommentWS } from '../services/pollService';
import PollCard from '../components/PollCard';
import colors from '../styles/colors';

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);
const DEFAULT_PROFILE_IMG = 'https://picsum.photos/200/200';

const getTimeElapsed = (createdAt) => {
  if (!createdAt) return '';
  const date = new Date(createdAt);
  const now = new Date();
  const diffInMinutes = Math.floor((now - date) / (1000 * 60));
  if (diffInMinutes < 60) return `${diffInMinutes}m`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d`;
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) return `${diffInWeeks}w`;
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths}mo`;
  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears}y`;
};

const PollDetailsScreen = ({ route }) => {
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);
  const { pollId } = route.params;

  const polls = usePollsStore((state) => state.polls);
  const loading = usePollsStore((state) => state.loading);
  const error = usePollsStore((state) => state.error);

  const [commentText, setCommentText] = useState('');

  const scrollY = React.useRef(new Animated.Value(0)).current;
  const navbarTranslate = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, -35],
    extrapolate: 'clamp',
  });

  const poll = polls.find((p) => p.id === pollId);

  const handleVote = (pollId, optionId) => {
    if (!user || !user.id) return;
    sendVoteWS(user.id, pollId, optionId);
  };

  const submitComment = () => {
    if (!commentText.trim() || !poll) return;
    sendCommentWS(user.id, poll.id, commentText);
    setCommentText('');
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }
  if (!poll) {
    return (
      <View style={styles.center}>
        <Text>No poll found!</Text>
      </View>
    );
  }

  const comments = poll.comments || [];

  return (
    <SafeAreaView style={styles.safeContainer} edges={['left', 'right', 'bottom']}>
      {/* Taller navbar with extra padding */}
      <Animated.View style={[styles.navbar, { transform: [{ translateY: navbarTranslate }] }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>Poll Details</Text>
      </Animated.View>

      {/* We offset the content below the taller navbar */}
      <View style={styles.pollCardContainer}>
        <PollCard poll={poll} onVote={handleVote} />
      </View>

      <AnimatedFlatList
        style={styles.commentsList}
        data={comments}
        keyExtractor={(item, index) => (item?.id ? item.id.toString() : index.toString())}
        renderItem={({ item: comment }) => {
          if (!comment) return null;
          const userPic = comment.User?.profilePicture || DEFAULT_PROFILE_IMG;
          const username = comment.User?.username || 'Unknown';
          return (
            <View style={styles.commentItem}>
              <Image source={{ uri: userPic }} style={styles.commentProfileImage} />
              <View style={styles.commentContent}>
                <View style={styles.commentHeader}>
                  <Text style={styles.commentUsername}>{username}</Text>
                  <Text style={styles.commentTimestamp}>
                    {getTimeElapsed(comment.createdAt)}
                  </Text>
                </View>
                <Text style={styles.commentText}>{comment.text}</Text>
              </View>
            </View>
          );
        }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      />

      {poll.allowComments && (
        <View style={styles.commentInputContainer}>
          <TextInput
            style={styles.commentInput}
            placeholder="Add a comment..."
            value={commentText}
            onChangeText={setCommentText}
          />
          <TouchableOpacity
            style={styles.commentButton}
            onPress={submitComment}
            disabled={!commentText.trim()}
          >
            <Text style={styles.commentButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

export default PollDetailsScreen;

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  navbar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    // Increase the height for a bigger bar
    height: 80,
    backgroundColor: colors.dark || '#333',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    // Add extra padding at the top
    paddingTop: 20,
    // optional shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
  },
  backButton: {
    position: 'absolute',
    left: 12,
    bottom: 12, // keep it near the bottom of the navbar
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  navTitle: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
  },
  pollCardContainer: {
    marginTop: 80, // offset content below the navbar height
    marginHorizontal: 16,
    marginBottom: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
  commentsList: {
    flex: 1,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  commentProfileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  commentContent: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    padding: 8,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  commentUsername: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  commentTimestamp: {
    fontSize: 12,
    color: 'gray',
    marginLeft: 10,
  },
  commentText: {
    fontSize: 14,
    color: '#333',
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginRight: 8,
  },
  commentButton: {
    backgroundColor: '#21D0B2',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  commentButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
