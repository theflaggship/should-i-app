import React, { useState, useContext, useRef, useEffect } from 'react';
import {
  Alert,
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import { usePollsStore } from '../store/usePollsStore';
import { sendVoteWS } from '../services/pollService';
import { useUserStatsStore } from '../store/useUserStatsStore';
import { deletePoll, updatePoll, sendCommentWS, updateComment, deleteComment } from '../services/pollService';
import PollCard from '../components/PollCard';
import PollModalsManager from '../components/PollModalsManager';
import CommentOptionsModal from '../components/CommentOptionsModal';
import CommentModal from '../components/CommentModal';
import { getPollById } from '../services/pollService';
import { getTimeElapsed } from '../../utils/timeConversions';
import colors from '../styles/colors';
import { ArrowLeftCircle, MoreHorizontal } from 'react-native-feather';

const PollDetailsScreen = ({ route }) => {
  const { user, token } = useContext(AuthContext);
  const navigation = useNavigation();
  const { pollId, highlightCommentId } = route.params;

  const storePoll = usePollsStore(state => state.polls.find(p => p.id === pollId));
  const addOrUpdatePoll = usePollsStore(state => state.addOrUpdatePoll);
  const removePoll = usePollsStore(state => state.removePoll);
  const loading = usePollsStore(state => state.loading);
  const error = usePollsStore(state => state.error);
  
  const flatListRef = useRef(null);
  const commentOptionsRef = useRef(null);
  const addCommentRef = useRef(null);
  const editCommentRef = useRef(null);
  const pollModalsRef = useRef(null);

  const [selectedComment, setSelectedComment] = useState(null);
  const [editingCommentId, setEditingCommentId] = useState(null);

  // Local copy (used by your comment logic)
  const [pollData, setPollData] = useState(storePoll ?? null);

  useEffect(() => {
    if (storePoll) {
      setPollData(storePoll);
    }
  }, [storePoll]);

  useEffect(() => {
    // Always fetch full details on mount—even if storePoll is available
    getPollById(pollId, token)
      .then(full => {
        // Merge existing vote info if available
        const merged = {
          ...full,
          // If our current pollData has a vote (even if full.userVote is null), keep it.
          userVote: pollData?.userVote ?? full.userVote,
        };
        addOrUpdatePoll(merged);
        setPollData(merged);
      })
      .catch(err => console.error('Error loading poll details:', err.message));
  }, [pollId, token]);



  // Called by PollCard’s ellipsis if the user is the owner
  const handleOpenMenu = (pollToEdit) => {
    pollModalsRef.current?.openMenu(pollToEdit);
  };

  // const handleVote = ({ userId, poll, pollId, optionId }) => {
  //   if (!userId || !pollId || !poll) return;

  //   // Optimistically update poll state in store
  //   usePollsStore.setState((state) => {
  //     const update = (p) => {
  //       if (p.id !== pollId) return p;

  //       const newOptions = p.options.map((opt) => {
  //         if (opt.id === optionId) {
  //           const delta = p.userVote === optionId ? -1 : (p.userVote == null ? 1 : 0);
  //           return { ...opt, votes: (opt.votes || 0) + delta };
  //         }
  //         if (opt.id === p.userVote) {
  //           return { ...opt, votes: (opt.votes || 0) - 1 };
  //         }
  //         return opt;
  //       });

  //       return {
  //         ...p,
  //         options: newOptions,
  //         userVote: p.userVote === optionId ? null : optionId,
  //       };
  //     };

  //     return {
  //       polls: state.polls.map(update),
  //       votedPolls: state.votedPolls.map(update),
  //       followingPolls: state.followingPolls.map(update),
  //       userPolls: state.userPolls.map(update),
  //     };
  //   });

  //   // Update vote stats
  //   const stats = useUserStatsStore.getState();
  //   if (poll.userVote === optionId) {
  //     stats.decrementTotalVotes();
  //   } else if (poll.userVote == null) {
  //     stats.incrementTotalVotes();
  //   }

  //   // Send vote over WebSocket
  //   sendVoteWS(userId, pollId, optionId);
  // };

  // ============== PollModalsManager callbacks ==============
  const handleDeletePoll = async (pollToDelete) => {
    try {
      await deletePoll(token, pollToDelete.id);
      removePoll(pollToDelete.id);
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
    if (!text?.trim() || !pollData) return;
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
    usePollsStore.getState().updateCommentState(pollData.id, newComment);

    // Send over WS
    sendCommentWS(user.id, pollData.id, text.trim());

    // Scroll into view
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  // Edit a comment
  const handleEditComment = async (newText) => {
    if (
      !newText.trim() ||
      !editingCommentId ||
      String(editingCommentId).startsWith('temp-')
    ) {
      return;
    }

    commentOptionsRef.current.close();

    try {
      const updated = await updateComment(editingCommentId, newText.trim(), token);
      usePollsStore.getState().updateCommentState(pollData.id, updated); // update store

      // ⬇️ Update localPoll/pollData if it's being used
      setPollData((prev) => {
        if (!prev?.comments) return prev;
        const updatedComments = prev.comments.map((c) =>
          String(c.id) === String(updated.id) ? { ...c, ...updated } : c
        );
        return { ...prev, comments: updatedComments };
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
    if (!pollData?.comments || !highlightCommentId) return;
  
    const idx = pollData.comments.findIndex(c => c.id === highlightCommentId);
    if (idx > -1) {
      setTimeout(() => {
        try {
          flatListRef.current?.scrollToIndex({ index: idx, animated: true });
        } catch {}
      }, 300);
    }
  }, [pollData, highlightCommentId]);

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
  if (!pollData || !pollData.options) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  if (!pollData || !pollData.options || pollData.userVote === undefined) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
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
        <PollCard poll={pollData} showDetailedTimestamp onOpenMenu={handleOpenMenu} />
      </View>

      {/* Comments List */}
      <FlatList
        ref={flatListRef}
        style={styles.commentsList}
        data={pollData.comments || []}
        keyExtractor={(comment) => comment.id.toString()}
        renderItem={({ item: comment }) => {
          if (!comment) return null;
          const commenter = comment.user ?? {};
          const name = commenter.displayName?.trim() || commenter.username || 'Unknown';
          const userPic = commenter.profilePicture
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
      {pollData.allowComments && (
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
                  usePollsStore.getState().removeComment(pollData.id, selectedComment.id);
                }
              }
            ]
          );
        }}
      />

      {/* Poll Modals Manager */}
      <PollModalsManager
        ref={pollModalsRef}
        onDeletePoll={() => handleDeletePoll(pollData)}
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
