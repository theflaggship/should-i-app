// src/components/CommentCard.js

import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MoreHorizontal } from 'react-native-feather';
import { getTimeElapsed } from '../../utils/timeConversions';
import colors from '../styles/colors';

const DEFAULT_PROFILE_IMG = 'https://picsum.photos/200/200';

const CommentCard = ({ poll, userComments, onOpenMenu, user }) => {
  const navigation = useNavigation();
  const route = useRoute();

  if (!poll) {
    return (
      <View style={styles.card}>
        <Text>No poll data found.</Text>
      </View>
    );
  }

  const finalUser = poll.user || {};
  const isOwner = finalUser.id === user?.id;

  const handleNavigateToPoll = () =>
    navigation.navigate('PollDetails', { pollId: poll.id });

  const handleNavigateToUserProfile = () => {
    if (!finalUser.id) return;
    const currentRoute = route.name;
    const currentUserId = route.params?.userId;
    if (
      (currentRoute === 'OtherUserProfile' && currentUserId === finalUser.id) ||
      ((currentRoute === 'ProfileMain' || currentRoute === 'Profile') &&
        user?.id === finalUser.id)
    ) {
      return;
    }
    navigation.navigate('OtherUserProfile', { userId: finalUser.id });
  };

  const handleCommentPress = (commentId) =>
    navigation.navigate('PollDetails', {
      pollId: poll.id,
      highlightCommentId: commentId,
      poll, // pass entire poll object
    });

  const handleEllipsisPress = () => onOpenMenu && onOpenMenu(poll);

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.userRow} onPress={handleNavigateToPoll}>
        <TouchableOpacity
          style={styles.userRowLeft}
          activeOpacity={0.8}
          onPress={handleNavigateToUserProfile}
        >
          <Image
            source={{ uri: finalUser.profilePicture || DEFAULT_PROFILE_IMG }}
            style={styles.profileImage}
          />
          {finalUser.displayName ? (
            <View>
              <Text style={styles.displayName}>{finalUser.displayName}</Text>
              <Text style={styles.usernameSubtitle}>@{finalUser.username ?? 'Unknown'}</Text>
            </View>
          ) : (
            <Text style={styles.username}>{finalUser.username ?? 'Unknown'}</Text>
          )}
        </TouchableOpacity>
        <Text style={styles.timestamp}>{getTimeElapsed(poll.createdAt)}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleNavigateToPoll} style={styles.pollQuestionContainer}>
        <Text style={styles.question}>{poll.question}</Text>
      </TouchableOpacity>

      <View style={styles.userCommentsContainer}>
        {userComments.map((comment) => (
          <TouchableOpacity
            key={comment.id}
            style={styles.commentItem}
            onPress={() => handleCommentPress(comment.id)}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.commentText}>{comment.text}</Text>
              {comment.edited && <Text style={styles.editedLabel}>Edited</Text>}
            </View>
            <Text style={styles.commentTimestamp}>{getTimeElapsed(comment.createdAt)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {isOwner && onOpenMenu && (
        <View style={styles.bottomRow}>
          <TouchableOpacity style={styles.ellipsisButton} onPress={handleEllipsisPress}>
            <MoreHorizontal width={20} color="gray" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default CommentCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  userRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 0.5,
    borderColor: 'gray',
  },
  displayName: {
    fontFamily: 'Quicksand-SemiBold',
    fontSize: 16,
    color: colors.dark,
    lineHeight: 20,
  },
  usernameSubtitle: {
    fontFamily: 'Quicksand-Regular',
    fontSize: 14,
    color: colors.primary,
    lineHeight: 18,
  },
  username: {
    fontFamily: 'Quicksand-SemiBold',
    fontSize: 16,
    color: colors.dark,
  },
  editedLabel: {
    fontSize: 10,
    fontStyle: 'italic',
    color: 'gray',
    marginTop: 4,
  },
  timestamp: {
    marginLeft: 'auto',
    fontFamily: 'Quicksand-Medium',
    fontSize: 12,
    color: 'gray',
  },
  pollQuestionContainer: { marginVertical: 4 },
  question: {
    fontFamily: 'Quicksand-Medium',
    fontSize: 18,
    color: colors.dark,
  },
  userCommentsContainer: { marginTop: 8 },
  commentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e4edf5',
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  commentText: {
    fontFamily: 'Quicksand-Regular',
    fontSize: 15,
    color: colors.dark,
    flexShrink: 1,
  },
  commentTimestamp: {
    fontFamily: 'Quicksand-Medium',
    fontSize: 12,
    color: 'gray',
    marginLeft: 'auto',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  ellipsisButton: { padding: 6 },
});
