import React, { useState, useContext, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  FlatList
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import { usePollsStore } from '../store/usePollsStore';
import { deletePoll, updatePoll, sendCommentWS } from '../services/pollService';
import PollCard from '../components/PollCard';
import PollModalsManager from '../components/PollModalsManager';
import { getTimeElapsed } from '../../utils/timeConversions';
import colors from '../styles/colors';

const DEFAULT_PROFILE_IMG = 'https://picsum.photos/200/200';

const PollDetailsScreen = ({ route }) => {
  const navigation = useNavigation();
  const { user, token } = useContext(AuthContext);

  // Destructure pollId and optional highlightCommentId from route params
  const { pollId, highlightCommentId } = route.params || {};

  // Zustand store
  const polls = usePollsStore((state) => state.polls);
  const removePoll = usePollsStore((state) => state.removePoll);

  const loading = usePollsStore((state) => state.loading);
  const error = usePollsStore((state) => state.error);

  // Local comment input
  const [commentText, setCommentText] = useState('');

  // For scrolling to a specific comment
  const flatListRef = useRef(null);

  // For the PollModalsManager
  const pollModalsRef = useRef(null);

  // Find the poll in the store
  const poll = polls.find((p) => p.id === pollId);

  // Called by PollCard’s ellipsis if the user is the owner
  const handleOpenMenu = (pollToEdit) => {
    pollModalsRef.current?.openMenu(pollToEdit);
  };

  // ============== PollModalsManager callbacks ==============
  const handleDeletePoll = async (pollToDelete) => {
    try {
      await deletePoll(token, pollToDelete.id);
      removePoll(pollToDelete.id);
      // After deleting, go back to the previous screen
      navigation.goBack();
    } catch (err) {
      console.error('Failed to delete poll:', err);
    }
  };

  const handleSavePoll = async (pollToEdit, payload) => {
    try {
      const result = await updatePoll(token, pollToEdit.id, payload);
      if (result.poll && Array.isArray(result.poll.options)) {
        usePollsStore.getState().updatePollInStore(pollToEdit.id, {
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

  // Submit a new comment
  const submitComment = () => {
    if (!commentText.trim() || !poll) return;
    const trimmedText = commentText.trim();

    // 1) Create a local "temp" comment
    const tempComment = {
      id: 'temp-' + Date.now(),
      text: trimmedText,
      createdAt: new Date().toISOString(),
      user: {
        id: user.id,
        username: user.username,
        profilePicture: user.profilePicture,
      },
    };

    // 2) Update the store (optimistic)
    usePollsStore.getState().updateCommentState(poll.id, tempComment);

    // 3) Send the actual comment via WebSocket
    sendCommentWS(user.id, poll.id, trimmedText);

    // 4) Clear the input
    setCommentText('');

    // 5) Scroll to the bottom so the new comment is visible
    setTimeout(() => {
      if (flatListRef.current && poll.comments?.length > 0) {
        flatListRef.current.scrollToEnd({ animated: true });
      }
    }, 100);
  };

  // Scroll & highlight a specific comment if highlightCommentId is provided
  useEffect(() => {
    if (!poll || !poll.comments) return;
    if (!highlightCommentId) return;

    const idx = poll.comments.findIndex((c) => c.id === highlightCommentId);
    if (idx > -1 && flatListRef.current) {
      setTimeout(() => {
        try {
          flatListRef.current.scrollToIndex({ index: idx, animated: true });
        } catch (err) {
          console.warn('scrollToIndex error:', err);
        }
      }, 300);
    }
  }, [poll, highlightCommentId]);

  // ================= Render UI =================
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

  return (
    <SafeAreaView style={styles.safeContainer} edges={['left', 'right', 'bottom']}>
      {/* Header with a Back button */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Poll Details</Text>
      </View>

      {/* Poll Card with bottom row ellipsis if owner */}
      <View style={styles.pollCardContainer}>
        <PollCard poll={poll} showDetailedTimestamp onOpenMenu={handleOpenMenu} />
      </View>

      {/* Comments List */}
      <FlatList
        ref={flatListRef}
        style={styles.commentsList}
        data={poll.comments || []}
        keyExtractor={(item, index) =>
          item?.id ? item.id.toString() : index.toString()
        }
        renderItem={({ item: comment }) => {
          if (!comment) return null;
          // Check if this comment is highlighted
          const isHighlighted = highlightCommentId && comment.id === highlightCommentId;

          const userPic = comment.user?.profilePicture || DEFAULT_PROFILE_IMG;
          const username = comment.user?.username || 'Unknown';

          return (
            <View style={styles.commentItem}>
              <Image source={{ uri: userPic }} style={styles.commentProfileImage} />
              <View
                style={[
                  styles.commentContent,
                  isHighlighted && styles.highlightedComment,
                ]}
              >
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
      />

      {/* Comment Input if allowComments */}
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

      {/* Poll Modals Manager */}
      <PollModalsManager
        ref={pollModalsRef}
        onDeletePoll={handleDeletePoll}
        onSavePoll={handleSavePoll}
      />
    </SafeAreaView>
  );
};

export default PollDetailsScreen;

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    height: 100,
    backgroundColor: colors.dark || '#333',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 16,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    bottom: 16,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },

  pollCardContainer: {
    marginTop: 16,
    marginHorizontal: 16,
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
    marginTop: 8,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  commentProfileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  commentContent: {
    flex: 1,
    backgroundColor: '#e4edf5',
    borderRadius: 6,
    padding: 8,
  },
  highlightedComment: {
    backgroundColor: '#c5eefa',
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
    paddingHorizontal: 16,
    marginBottom: 10,
    marginTop: 6,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingRight: 8,
    paddingLeft: 20,
    paddingVertical: 10,
    marginRight: 8,
  },
  commentButton: {
    backgroundColor: '#21D0B2',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  commentButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
