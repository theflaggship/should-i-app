// src/components/CommentCard.js
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import colors from '../styles/colors';

const DEFAULT_PROFILE_IMG = 'https://picsum.photos/200/200';

function getTimeElapsed(createdAt) {
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
}

const CommentCard = ({ poll, userComments }) => {
  /**
   * poll = {
   *   id, question, createdAt,
   *   user: { id, username, profilePicture }
   *   // ... etc
   * }
   *
   * userComments = [
   *   { id, text, createdAt, ... },
   *   ...
   * ]
   */
  const navigation = useNavigation();
  if (!poll) {
    return (
      <View style={styles.card}>
        <Text>No poll data found.</Text>
      </View>
    );
  }

  const finalUser = poll.user; // the poll owner's user object

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

  return (
    <View style={styles.card}>
      {/* --- Header row: poll owner + poll time on the right --- */}
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
            source={{ uri: finalUser?.profilePicture || DEFAULT_PROFILE_IMG }}
            style={styles.profileImage}
          />
          <Text style={styles.username}>
            {finalUser?.username || 'Unknown'}
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

      {/* --- The user’s own comments on this poll --- */}
      <View style={styles.userCommentsContainer}>
        {userComments.map((comment) => (
          <TouchableOpacity
            key={comment.id}
            style={styles.commentItem}
            onPress={() => handleCommentPress(comment.id)}
            activeOpacity={0.8}
          >
            {/* Comment text on the left */}
            <Text style={styles.commentText}>{comment.text}</Text>
            {/* Time on the right */}
            <Text style={styles.commentTimestamp}>
              {getTimeElapsed(comment.createdAt)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
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
  // --- Poll header row (similar to PollCard) ---
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
    marginLeft: 'auto',
  },

  // --- Poll question styling ---
  pollQuestionContainer: {
    marginVertical: 4,
  },
  question: {
    fontSize: 16,
    color: colors.dark,
    fontWeight: '500',
  },

  // --- Comments list styling ---
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
});
