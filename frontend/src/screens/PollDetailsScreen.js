import React, { useState, useContext, useRef, useEffect } from 'react';
import {
  Alert,
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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import { usePollsStore } from '../store/usePollsStore';
import { deletePoll, updatePoll, sendCommentWS, updateComment, deleteComment } from '../services/pollService';
import PollCard from '../components/PollCard';
import PollModalsManager from '../components/PollModalsManager';
import CommentOptionsModal from '../components/CommentOptionsModal';
import CommentModal from '../components/CommentModal';
import { getTimeElapsed } from '../../utils/timeConversions';
import colors from '../styles/colors';
import { ArrowLeftCircle, MoreHorizontal } from 'react-native-feather';

const DEFAULT_PROFILE_IMG = 'https://picsum.photos/200/200';

const PollDetailsScreen = ({ route }) => {
  const { user, token } = useContext(AuthContext);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  // Destructure pollId and optional highlightCommentId from route params
  const { pollId, highlightCommentId } = route.params || {};

  // Zustand store
  const polls = usePollsStore((state) => state.polls);
  const removePoll = usePollsStore((state) => state.removePoll);

  const loading = usePollsStore((state) => state.loading);
  const error = usePollsStore((state) => state.error);

  const [selectedComment, setSelectedComment] = useState(null);
  const commentOptionsRef = useRef();
  const [editingCommentId, setEditingCommentId] = useState(null);

  // For scrolling to a specific comment
  const flatListRef = useRef(null);

  // For CommentModal
  const addCommentRef = useRef();
  const editCommentRef = useRef();

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

  // Add a new comment
  const handleAddComment = (text) => {
    if (!text?.trim() || !poll) return;
    const newComment = {
      id: 'temp-' + Date.now(),
      text: text.trim(),
      createdAt: new Date().toISOString(),
      user: {
        id: user.id,
        username: user.username,
        profilePicture: user.profilePicture,
        displayName: user.displayName,
      },
    };

    // Optimistically update store
    usePollsStore.getState().updateCommentState(poll.id, newComment);

    // Send over WS
    sendCommentWS(user.id, poll.id, text.trim());

    // Scroll into view
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  // Edit a comment
  const handleEditComment = async (newText) => {
    if (!newText.trim() || !editingCommentId) return;
    commentOptionsRef.current.close();
  
    try {
      const updated = await updateComment(editingCommentId, newText.trim(), token);
      usePollsStore.getState().updateCommentState(poll.id, {
        id: updated.id,
        text: updated.commentText,
        createdAt: updated.createdAt,
        user: updated.user,
        edited: true,
      });
    } catch (err) {
      console.error('Edit failed:', err.response?.data || err.message);
      Alert.alert('Error', 'Could not save changes.');
    } finally {
      setEditingCommentId(null);
    }
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
          <ArrowLeftCircle width={30} color={colors.light} />
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
        keyExtractor={(comment) => comment.id.toString()}
        renderItem={({ item: comment }) => {
          if (!comment) return null;
          const commenter = comment.user ?? {};
          const name = commenter.displayName ?? commenter.username ?? 'Unknown';
          const userPic = commenter.profilePicture || DEFAULT_PROFILE_IMG;
          const isOwner = commenter.id === user.id;
          const isHighlighted = highlightCommentId === comment.id;
        
          return (
            <View style={styles.commentItem}>
              <TouchableOpacity onPress={() => commenter.id && navigation.navigate('OtherUserProfile', { userId: commenter.id })}>
                <Image source={{ uri: userPic }} style={styles.commentProfileImage} />
              </TouchableOpacity>
        
              <View style={[styles.commentContent, isHighlighted && styles.highlightedComment]}>
                <View style={styles.commentHeader}>
                  <TouchableOpacity onPress={() => commenter.id && navigation.navigate('OtherUserProfile', { userId: commenter.id })}>
                    <Text style={styles.commentUsername}>{name}</Text>
                  </TouchableOpacity>
                  <Text style={styles.commentTimestamp}>{getTimeElapsed(comment.createdAt)}</Text>
                </View>
        
                <Text style={styles.commentText}>{comment.text}</Text>
                {comment.edited && <Text style={styles.editedLabel}>Edited</Text>}
        
                {isOwner && (
                  <TouchableOpacity style={styles.commentOptionsIcon} onPress={() => {
                    setSelectedComment(comment);
                    commentOptionsRef.current.open();
                  }}>
                    <MoreHorizontal width={20} color={colors.dark} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }}
      />

      {/* Comment Input if allowComments */}
      {poll.allowComments && (
        <TouchableOpacity style={styles.commentInputContainer} onPress={() => addCommentRef.current.open()}>
          <View style={styles.commentInputContainer}>
            <View style={styles.commentInput}>
              <Text style={styles.commentInputText}>Add a comment...</Text>
            </View>
          </View>
        </TouchableOpacity>
      )}

      <CommentOptionsModal
        ref={commentOptionsRef}
        onEdit={() => {
          commentOptionsRef.current.close();
          setEditingCommentId(selectedComment.id);
          setTimeout(() => {
            editCommentRef.current.open(selectedComment.text);
          }, 300); // 300ms gives Modalize time to close
        }}
        onDelete={() => {
          Alert.alert(
            'Delete Comment?',
            'Are you sure?',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete', style: 'destructive', onPress: async () => {
                  commentOptionsRef.current.close();
                  await deleteComment(selectedComment.id, token);
                  usePollsStore.getState().removeComment(poll.id, selectedComment.id);
                }
              }
            ]
          );
        }}
      />

      {/* Poll Modals Manager */}
      <PollModalsManager
        ref={pollModalsRef}
        onDeletePoll={handleDeletePoll}
        onSavePoll={handleSavePoll}
      />

      {/* Comment Modal */}
      <CommentModal ref={addCommentRef} onSubmit={handleAddComment} />
      <CommentModal ref={editCommentRef} onSubmit={handleEditComment} actionLabel="Save" />
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
    fontFamily: 'Quicksand-SemiBold',
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
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
    marginTop: -8,
    marginBottom: 32,
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
    backgroundColor: '#CDFDFE',
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentUsername: {
    fontFamily: 'Quicksand-SemiBold',
    fontSize: 14,
    color: colors.dark,
  },
  commentTimestamp: {
    fontFamily: 'Quicksand-Medium',
    fontSize: 12,
    color: 'gray',
  },
  commentText: {
    fontFamily: 'Quicksand-Regular',
    fontSize: 14,
    color: colors.dark,
  },
  commentOptionsIcon: {
    position: 'absolute',
    bottom: 2,
    right: 8,
  },
  editedLabel: {
    fontSize: 10,
    fontStyle: 'italic',
    color: 'gray',
    marginTop: 4,
  },
  commentInputContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,                 // flush to bottom
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    backgroundColor: colors.appBackground,
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
    backgroundColor: '#fff',
  },
  commentInputText: {
    fontFamily: 'Quicksand-Regular',
  },
  commentButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
