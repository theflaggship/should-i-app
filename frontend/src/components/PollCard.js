// PollCard.js
import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { sendVoteWS } from '../services/pollService';
import { AuthContext } from '../context/AuthContext';
import { MessageCircle, Check } from 'react-native-feather';
import colors from '../styles/colors';

const DEFAULT_PROFILE_IMG = 'https://picsum.photos/200/200';

const PollCard = ({ poll, onVote }) => {
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);
  const [userVote, setUserVote] = useState(poll?.userVote || null);
  const [options, setOptions] = useState(poll?.options || []);
  const [totalVotes, setTotalVotes] = useState(
    poll?.options ? poll.options.reduce((sum, option) => sum + (option.votes || 0), 0) : 0
  );

  // Update options and total votes when poll prop changes
  useEffect(() => {
    setOptions((prevOptions) =>
      prevOptions.map((prevOption) => {
        const updatedOption = poll.options.find((opt) => opt.id === prevOption.id);
        return updatedOption ? { ...prevOption, votes: updatedOption.votes } : prevOption;
      })
    );
    setTotalVotes(poll.options.reduce((sum, option) => sum + (option.votes || 0), 0));
  }, [poll]);

  // Update userVote when poll.userVote changes
  useEffect(() => {
    setUserVote(poll.userVote);
  }, [poll.userVote]);

  const getVotePercentage = (optionVotes) => {
    if (!optionVotes || totalVotes === 0) return '0 Votes';
    return `${Math.round((optionVotes / totalVotes) * 100)}%`;
  };

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

  const handleOptionPress = (optionId) => {
    if (userVote === optionId) {
      // Unvote
      setUserVote(null);
      setOptions((prevOptions) =>
        prevOptions.map((opt) =>
          opt.id === optionId ? { ...opt, votes: Math.max(opt.votes - 1, 0) } : opt
        )
      );
    } else {
      // Vote for a new option
      setOptions((prevOptions) =>
        prevOptions.map((opt) => {
          if (opt.id === optionId) {
            return { ...opt, votes: opt.votes + 1 };
          } else if (opt.id === userVote) {
            return { ...opt, votes: Math.max(opt.votes - 1, 0) };
          }
          return opt;
        })
      );
      setUserVote(optionId);
    }
    onVote(poll.id, optionId);
  };

  const handleCommentsPress = () => {
    if (poll.id) {
      navigation.navigate('PollDetails', { pollId: poll.id });
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.userRow}>
        <Image
          source={{ uri: poll?.user?.profilePicture || DEFAULT_PROFILE_IMG }}
          style={styles.profileImage}
        />
        <Text style={styles.username}>{poll?.user?.username ?? 'Unknown'}</Text>
        <Text style={styles.timestamp}>{getTimeElapsed(poll?.createdAt)}</Text>
      </View>

      <Text style={styles.question}>{poll?.question ?? 'No question'}</Text>

      <View style={styles.optionsContainer}>
        {options.map((option) => {
          const isVoted = userVote === option.id;
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
                        <Check width={12} color="#21D0B2" />
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
    borderColor: '#c8f7c5',
  },
  selectedOptionText: {
    color: '#21D0B2',
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
  },
  voteCount: {
    fontSize: 14,
    color: colors.dark,
  },
});

export default PollCard;
