import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { sendVote } from '../services/pollService';
import colors from '../styles/colors';

const DEFAULT_PROFILE_IMG = 'https://picsum.photos/200/200';

const PollCard = ({ poll, onVote }) => {
  const [userVote, setUserVote] = useState(poll?.userVote || null);
  const [options, setOptions] = useState(poll.options);
  const [totalVotes, setTotalVotes] = useState(
    poll?.options?.reduce((sum, option) => sum + (option.votes || 0), 0) || 0
  );

  useEffect(() => {
    // Merge WebSocket updates into existing options while preserving text and order
    setOptions((prevOptions) => 
      prevOptions.map((prevOption) => {
        const updatedOption = poll.options.find((opt) => opt.id === prevOption.id);
        return updatedOption
          ? { ...prevOption, votes: updatedOption.votes } // Keep text, update votes
          : prevOption;
      })
    );
    
    setTotalVotes(poll.options.reduce((sum, option) => sum + (option.votes || 0), 0));
  }, [poll]);

  // Function to calculate percentage safely
  const getVotePercentage = (optionVotes) => {
    if (!optionVotes || totalVotes === 0) return '0%'; // Prevent NaN
    return `${Math.round((optionVotes / totalVotes) * 100)}%`;
  };

  // Function to calculate elapsed time
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

  // Handle option press and send vote via WebSocket
  const handleOptionPress = (optionId) => {
    if (userVote === optionId) {
      // Remove vote, decrease total votes and option votes
      setUserVote(null);
      setOptions((prevOptions) =>
        prevOptions.map((opt) =>
          opt.id === optionId ? { ...opt, votes: opt.votes - 1 } : opt
        )
      );
      setTotalVotes((prevTotal) => prevTotal - 1);
      sendVote(poll.id, null);
    } else {
      // Vote for a new option, increase total votes and option votes
      setUserVote(optionId);
      setOptions((prevOptions) =>
        prevOptions.map((opt) =>
          opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
        )
      );
      setTotalVotes((prevTotal) => prevTotal + 1);
      sendVote(poll.id, optionId);
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
              style={[
                styles.optionContainer,
                isVoted && styles.selectedOptionBorder,
              ]}
              onPress={() => handleOptionPress(option.id)}
            >
              <View style={[styles.fillBar, { width: percentage, backgroundColor: isVoted ? '#c8f7c5' : '#d3d3d3' }]} />
              
              <View style={styles.optionContent}>
                <Text style={[styles.optionText, isVoted && styles.selectedOptionText]}>
                  {option.text}
                </Text>
                <Text style={[styles.percentageText, isVoted && styles.selectedOptionText]}>
                  {percentage}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 6,
    padding: 16,
    marginVertical: 8,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    paddingHorizontal: 12,
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
  },
  selectedOptionBorder: {
    borderColor: '#c8f7c5',
  },
  optionText: {
    fontSize: 16,
    color: colors.dark,
  },
  percentageText: {
    fontSize: 12,
    color: 'gray',
    fontWeight: '400',
  },
});

export default PollCard;
