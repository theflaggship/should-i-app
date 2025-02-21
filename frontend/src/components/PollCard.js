// src/components/PollCard.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import colors from '../styles/colors';

const DEFAULT_PROFILE_IMG = 'https://picsum.photos/200/200';

const PollCard = ({ poll, onVote }) => {
  // Keep track of which option the user has voted for in local state
  // Initialize from poll.userVote if provided
  const [userVote, setUserVote] = useState(poll?.userVote || null);

  // Handle option press
  const handleOptionPress = (optionId) => {
    if (userVote === optionId) {
      // If user taps the same option again, remove vote
      setUserVote(null);
      onVote && onVote(poll.id, null);
    } else {
      // Otherwise, vote for this new option
      setUserVote(optionId);
      onVote && onVote(poll.id, optionId);
    }
  };

  return (
    <View style={styles.card}>
      {/* Top row: profile image + username */}
      <View style={styles.userRow}>
        <Image
          source={{ uri: poll?.user?.profilePicture || DEFAULT_PROFILE_IMG }}
          style={styles.profileImage}
        />
        <Text style={styles.username}>
          {poll?.user?.username ?? 'Unknown'}
        </Text>
      </View>

      {/* Poll question */}
      <Text style={styles.question}>{poll?.question ?? 'No question'}</Text>

      {/* Poll options */}
      <View style={styles.optionsContainer}>
        {(poll?.options || []).map((option) => {
          const isVoted = userVote === option.id;
          return (
            <TouchableOpacity
              key={option.id}
              style={[styles.option, isVoted && styles.selectedOption]}
              onPress={() => handleOptionPress(option.id)}
            >
              <Text style={[styles.optionText, isVoted && styles.selectedOptionText]}>
                {option.text}
              </Text>
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
  question: {
    fontSize: 18,
    color: colors.dark,
    marginBottom: 12,
  },
  optionsContainer: {
    // Optional styling for the container of options
  },
  option: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.dark,
    borderRadius: 4,
    marginBottom: 8,
  },
  selectedOption: {
    backgroundColor: '#c8f7c5', // Light green highlight
    borderColor: colors.primary,
  },
  optionText: {
    fontSize: 16,
    color: colors.dark,
  },
  selectedOptionText: {
    color: colors.dark,
    fontWeight: '600',
  },
});

export default PollCard;
