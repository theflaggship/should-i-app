import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { sendVote } from '../services/pollService';
import { AuthContext } from '../context/AuthContext';
import colors from '../styles/colors';
import Icon from 'react-native-vector-icons/Feather';

const DEFAULT_PROFILE_IMG = 'https://picsum.photos/200/200';

const PollCard = ({ poll, onVote }) => {
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);
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
    if (!optionVotes || totalVotes === 0) return '0 Votes'; // Prevent NaN
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

  const handleOptionPress = (optionId) => {
    // If the user taps the same option again, remove the vote (unvote)
    if (userVote === optionId) {
      setUserVote(null);
      setOptions((prevOptions) =>
        prevOptions.map((opt) =>
          opt.id === optionId ? { ...opt, votes: Math.max(opt.votes - 1, 0) } : opt
        )
      );
    } else {
      // The user is voting for a different option or voting for the first time
      setOptions((prevOptions) =>
        prevOptions.map((opt) => {
          if (opt.id === optionId) {
            // Increment votes on the newly chosen option
            return { ...opt, votes: opt.votes + 1 };
          } else if (opt.id === userVote) {
            // Decrement votes on the previously chosen option
            return { ...opt, votes: Math.max(opt.votes - 1, 0) };
          }
          return opt;
        })
      );
      setUserVote(optionId);
    }
  
    // Send the vote via WebSocket
    // (No await/response because WebSockets don't return an immediate result)
    sendVote(user.id, poll.id, optionId);
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
      {poll.allowComments && (
        <TouchableOpacity style={styles.commentContainer} onPress={handleCommentsPress}>
          <Icon name="message-circle" size={18} color="gray" style={styles.commentIcon} />
          <Text style={styles.commentCount}>{poll.commentCount || 0}</Text>
        </TouchableOpacity>
      )}
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
  commentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10, // Spacing below last option
  },
  commentIcon: {
    marginRight: 3, // ✅ Places the icon before the number
  },
  commentCount: {
    fontSize: 14,
    color: colors.dark,
  },
});

export default PollCard;
