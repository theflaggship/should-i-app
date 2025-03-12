// src/components/CommentCard.js
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MoreHorizontal } from 'react-native-feather';
import { getTimeElapsed } from '../../utils/timeConversions';
import colors from '../styles/colors';

const DEFAULT_PROFILE_IMG = 'https://picsum.photos/200/200';

const CommentCard = ({ poll, userComments, onOpenMenu, user }) => {
  const navigation = useNavigation();

  if (!poll) {
    return (
      <View style={styles.card}>
        <Text>No poll data found.</Text>
      </View>
    );
  }

  // Poll owner
  const finalUser = poll.user || {};
  // Determine if current user owns this poll
  const isOwner = finalUser.id === user?.id;

  const handleNavigateToPoll = () => {
    // If user taps the poll row or question, go to PollDetails
    navigation.navigate('PollDetails', { pollId: poll.id });
  };

  const handleCommentPress = (commentId) => {
    // If user taps a specific comment, navigate to PollDetails
    // and highlight or scroll to that comment
    navigation.navigate('PollDetails', {
      pollId: poll.id,
      highlightCommentId: commentId,
    });
  };

  const handleEllipsisPress = () => {
    if (onOpenMenu) {
      onOpenMenu(poll);
    }
  };

  return (
    <View style={styles.card}>
      {/* Header row: poll owner + poll time on the right */}
      <TouchableOpacity
        style={styles.userRow}
        onPress={handleNavigateToPoll}
        activeOpacity={0.8}
      >
        {/* Left side: poll owner's profile + username */}
        <TouchableOpacity
          style={styles.userRowLeft}
          activeOpacity={0.8}
          pointerEvents="box-only"
        >
          <Image
            source={{ uri: finalUser.profilePicture || DEFAULT_PROFILE_IMG }}
            style={styles.profileImage}
          />
          <Text style={styles.username}>
            {finalUser.username || 'Unknown'}
          </Text>
        </TouchableOpacity>

        {/* Right side: poll's creation time */}
        <TouchableOpacity
          style={styles.userRowRight}
          onPress={handleNavigateToPoll}
          activeOpacity={0.8}
        >
          <Text style={styles.timestamp}>
            {getTimeElapsed(poll.createdAt)}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Poll question (tappable) */}
      <TouchableOpacity
        onPress={handleNavigateToPoll}
        style={styles.pollQuestionContainer}
        activeOpacity={0.8}
      >
        <Text style={styles.question}>{poll.question}</Text>
      </TouchableOpacity>

      {/* The user’s own comments on this poll */}
      <View style={styles.userCommentsContainer}>
        {userComments.map((comment) => (
          <TouchableOpacity
            key={comment.id}
            style={styles.commentItem}
            onPress={() => handleCommentPress(comment.id)}
            activeOpacity={0.8}
          >
            <Text style={styles.commentText}>{comment.text}</Text>
            <Text style={styles.commentTimestamp}>
              {getTimeElapsed(comment.createdAt)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Bottom row with ellipsis if user is owner */}
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
  userRowRight: {
    marginLeft: 'auto',
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: 'gray',
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.dark,
    marginLeft: 8,
  },
  timestamp: {
    fontSize: 12,
    color: 'gray',
  },
  pollQuestionContainer: {
    marginVertical: 4,
  },
  question: {
    fontSize: 18,
    color: colors.dark,
    fontWeight: '400',
  },
  userCommentsContainer: {
    marginTop: 8,
  },
  commentItem: {
    flexDirection: 'row', // text on the left, time on the right
    alignItems: 'center',
    backgroundColor: '#e4edf5',
    borderRadius: 6,
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  commentText: {
    fontSize: 14,
    color: colors.dark,
    marginRight: 8,
    flexShrink: 1,
  },
  commentTimestamp: {
    fontSize: 12,
    color: 'gray',
    marginLeft: 'auto',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  ellipsisButton: {
    padding: 6,
  },
});
