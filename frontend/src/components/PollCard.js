// PollCard.js
import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { sendVoteWS } from '../services/pollService';
import { AuthContext } from '../context/AuthContext';
import { MessageCircle, Check } from 'react-native-feather';
import colors from '../styles/colors';

const DEFAULT_PROFILE_IMG = 'https://picsum.photos/200/200';

const PollCard = ({ poll }) => {
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);

  // 1) Locally track the user's current vote for instant UI updates
  const [localUserVote, setLocalUserVote] = useState(poll?.userVote || null);

  // 2) Whenever the poll object changes (e.g. new fetch or WebSocket update),
  //    sync localUserVote with poll.userVote (if your backend sets it)
  useEffect(() => {
    setLocalUserVote(poll?.userVote || null);
  }, [poll?.userVote, poll?.id]);

  // Safely handle poll.options
  const pollOptions = poll?.options || [];
  const totalVotes = pollOptions.reduce((sum, opt) => sum + (opt.votes || 0), 0);

  // Show a "0 Votes" or percentage string
  const getVotePercentage = (optionVotes) => {
    if (!optionVotes || totalVotes === 0) return '0 Votes';
    return `${Math.round((optionVotes / totalVotes) * 100)}%`;
  };

  // Simple time-ago helper
  const getTimeElapsed = (createdAt) => {
    if (!createdAt) return '';
    const pollDate = new Date(createdAt);
    const now = new Date();
    const diffInMinutes = Math.floor((now - pollDate) / (1000 * 60));
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

  // 3) Handle user tapping an option
  const handleOptionPress = (optionId) => {
    if (!user || !user.id) return;

    // Optimistic update: change localUserVote right away
    if (localUserVote === optionId) {
      setLocalUserVote(null); // unvote
    } else {
      setLocalUserVote(optionId); // switch to new option
    }

    // Send the vote to the server via WebSocket
    sendVoteWS(user.id, poll.id, optionId);
  };

  // 4) Navigate to PollDetails if the poll allows comments
  const handleCommentsPress = () => {
    if (poll?.id) {
      navigation.navigate('PollDetails', { pollId: poll.id });
    }
  };

  if (!poll) {
    return (
      <View style={styles.card}>
        <Text>No poll data found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      {/* Header Row: User info + timestamp */}
      <View style={styles.userRow}>
        <Image
          source={{ uri: poll?.user?.profilePicture || DEFAULT_PROFILE_IMG }}
          style={styles.profileImage}
        />
        <Text style={styles.username}>{poll?.user?.username ?? 'Unknown'}</Text>
        <Text style={styles.timestamp}>{getTimeElapsed(poll?.createdAt)}</Text>
      </View>

      <Text style={styles.question}>{poll?.question ?? 'No question'}</Text>

      {/* Render poll options */}
      <View style={styles.optionsContainer}>
        {pollOptions.map((option) => {
          const isVoted = localUserVote === option.id;
          const percentage = getVotePercentage(option.votes);

          return (
            <TouchableOpacity
              key={option.id}
              style={[styles.optionContainer, isVoted && styles.selectedOptionBorder]}
              onPress={() => handleOptionPress(option.id)}
            >
              <View
                style={[
                  styles.fillBar,
                  { width: percentage, backgroundColor: isVoted ? '#b1f3e7' : '#dbe4ed' },
                ]}
              />
              <View style={styles.optionContent}>
                <View style={styles.optionLeft}>
                  {isVoted && (
                    <View style={styles.checkMarkContainer}>
                      <View style={styles.singleVoteCircle}>
                        <Check stroke-width="1.5" width={12} color="#21D0B2" />
                      </View>
                    </View>
                  )}
                  <Text style={[styles.optionText, isVoted && styles.selectedOptionText]}>
                    {option.text}
                  </Text>
                </View>
                <Text style={[styles.percentageText, isVoted && styles.selectedOptionText]}>
                  {percentage}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Bottom row: comment count + total votes */}
      <View style={styles.bottomRow}>
        {poll.allowComments && (
          <TouchableOpacity style={styles.commentContainer} onPress={handleCommentsPress}>
            <MessageCircle width={18} color="gray" style={styles.commentIcon} />
            <Text style={styles.commentCount}>{poll.commentCount || 0}</Text>
          </TouchableOpacity>
        )}
        <View style={styles.voteContainer}>
          <View style={styles.checkMarkContainer}>
            <View style={styles.totalVoteCircle}>
              <Check width={12} color="gray" style={styles.totalVoteCheck} />
            </View>
          </View>
          <Text style={styles.voteCount}>{totalVotes}</Text>
        </View>
      </View>
    </View>
  );
};

export default PollCard;

/* ------------- STYLES ------------- */

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.pollBackground || '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
  },
  username: {
    fontSize: 16,
    color: colors.dark,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
    color: 'gray',
    marginLeft: 'auto',
  },
  question: {
    fontSize: 18,
    color: colors.dark,
    marginBottom: 12,
  },
  optionsContainer: {
    flexDirection: 'column',
  },
  optionContainer: {
    position: 'relative',
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.dark,
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  fillBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    borderRadius: 4,
  },
  optionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 1,
    marginLeft: 12,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
    color: colors.dark,
  },
  selectedOptionBorder: {
    borderColor: '#21D0B2',
  },
  selectedOptionText: {
    color: colors.dark,
  },
  percentageText: {
    fontSize: 12,
    color: 'gray',
    fontWeight: '400',
    marginRight: 12,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  commentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  commentIcon: {
    marginRight: 2,
  },
  commentCount: {
    fontSize: 14,
    color: colors.dark,
  },
  voteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkMarkContainer: {
    marginRight: 4,
  },
  totalVoteCircle: {
    width: 17,
    height: 17,
    borderRadius: 8.5,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.2,
    borderColor: 'gray',
  },
  singleVoteCircle: {
    width: 17,
    height: 17,
    borderRadius: 8.5,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
    borderColor: '#21D0B2',
    borderWidth: 1.2,
  },
  voteCount: {
    fontSize: 14,
    color: colors.dark,
  },
});
