// src/components/PollCard.js
import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { sendVoteWS } from '../services/pollService';
import { useUserStatsStore } from '../store/useUserStatsStore';
import { MessageCircle, Check, MoreHorizontal } from 'react-native-feather';
import { getTimeElapsed, formatDetailedDate } from '../../utils/timeConversions';
import colors from '../styles/colors';

const DEFAULT_PROFILE_IMG = 'https://picsum.photos/200/200';

const PollCard = ({
  poll,
  onVote,
  disableMainPress = false,
  showDetailedTimestamp = false,
  onOpenMenu,
}) => {
  const route = useRoute();
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);

  // Early return if no poll
  if (!poll) {
    return (
      <View style={styles.card}>
        <Text>No poll data found.</Text>
      </View>
    );
  }

  // Safely unify user objects
  const finalUser = poll.user || poll.User || {};
  const isOwner = finalUser.id === user?.id;

  const userVote = poll.userVote;
  const pollOptions = poll.options || [];
  const totalVotes = pollOptions.reduce((sum, opt) => sum + (opt.votes || 0), 0);

  // Show fill bar if user is owner or has voted
  const showFillBarAndPercent = isOwner || userVote !== null;

  // We'll store an Animated.Value for each poll option
  const [fillAnims, setFillAnims] = useState(() =>
    pollOptions.map(() => new Animated.Value(0))
  );

  // Keep track of the previous votes array
  const prevVotesRef = useRef([]);

  // Re-init fillAnims if pollOptions length changes
  useEffect(() => {
    if (fillAnims.length !== pollOptions.length) {
      setFillAnims(pollOptions.map(() => new Animated.Value(0)));
      prevVotesRef.current = pollOptions.map((opt) => opt.votes || 0);
    }
  }, [pollOptions, fillAnims]);

  // Animate fill bars if votes changed
  useEffect(() => {
    if (pollOptions.length === 0 || totalVotes === 0) {
      // Reset to zero fill
      pollOptions.forEach((_, i) => fillAnims[i]?.setValue(0));
      prevVotesRef.current = pollOptions.map((opt) => opt.votes || 0);
      return;
    }

    if (isOwner) {
      // Owner => snap to final
      pollOptions.forEach((opt, i) => {
        const rawPercent = Math.round((opt.votes || 0) / totalVotes * 100);
        fillAnims[i]?.setValue(rawPercent);
      });
      prevVotesRef.current = pollOptions.map((opt) => opt.votes || 0);
      return;
    }

    if (userVote == null) {
      // No vote => fill bars = 0
      pollOptions.forEach((_, i) => fillAnims[i]?.setValue(0));
      prevVotesRef.current = pollOptions.map((opt) => opt.votes || 0);
      return;
    }

    // Compare old vs new
    const oldVotes = prevVotesRef.current;
    const newVotes = pollOptions.map((opt) => opt.votes || 0);

    let changed = false;
    if (oldVotes.length === newVotes.length) {
      for (let i = 0; i < newVotes.length; i++) {
        if (newVotes[i] !== oldVotes[i]) {
          changed = true;
          break;
        }
      }
    } else {
      changed = true;
    }

    if (changed) {
      // Animate from old -> new
      pollOptions.forEach((opt, i) => {
        const rawPercent = Math.round((opt.votes || 0) / totalVotes * 100);
        Animated.timing(fillAnims[i], {
          toValue: showFillBarAndPercent ? rawPercent : 0,
          duration: 700,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }).start();
      });
    } else {
      // Snap
      pollOptions.forEach((opt, i) => {
        const rawPercent = Math.round((opt.votes || 0) / totalVotes * 100);
        fillAnims[i]?.setValue(showFillBarAndPercent ? rawPercent : 0);
      });
    }

    prevVotesRef.current = newVotes;
  }, [
    pollOptions,
    totalVotes,
    userVote,
    isOwner,
    showFillBarAndPercent,
    fillAnims,
  ]);

  // Option press => vote or unvote logic
  const handleOptionPress = (optionId) => {
    if (!user?.id) return;

    if (poll.userVote === optionId) {
      // Removing the vote
      useUserStatsStore.getState().decrementTotalVotes();
      if (onVote) {
        onVote(poll.id, optionId);
      } else {
        sendVoteWS(user.id, poll.id, optionId);
      }
    } else {
      // Adding or changing a vote
      if (poll.userVote == null) {
        useUserStatsStore.getState().incrementTotalVotes();
      }
      if (onVote) {
        onVote(poll.id, optionId);
      } else {
        sendVoteWS(user.id, poll.id, optionId);
      }
    }
  };

  // Navigation
  const handleNavigateToDetails = () => {
    if (!disableMainPress && poll?.id) {
      navigation.navigate('PollDetails', { pollId: poll.id });
    }
  };

  const handleNavigateToUserProfile = () => {
    if (!poll?.user?.id) return;

    const finalUserId = poll.user.id;
    const currentRouteName = route.name;
    const currentUserId = route.params?.userId;
    const myUserId = user?.id;

    // skip if we’re on that same user’s profile ...
    if (currentRouteName === 'OtherUserProfile' && currentUserId === finalUserId) {
      return;
    }
    if ((currentRouteName === 'ProfileMain' || currentRouteName === 'Profile') && myUserId === finalUserId) {
      return;
    }

    navigation.navigate('OtherUserProfile', { userId: finalUserId });
  };

  return (
    <View style={styles.card}>
      {/* Header row */}
      <TouchableOpacity
        style={styles.userRow}
        activeOpacity={0.8}
        onPress={handleNavigateToDetails}
      >
        {/* Tapping the userRowLeft => go to user profile */}
        <TouchableOpacity
          style={styles.userRowLeft}
          activeOpacity={0.8}
          onPress={handleNavigateToUserProfile}
          pointerEvents="box-only"
        >
          <Image
            source={{ uri: finalUser.profilePicture || DEFAULT_PROFILE_IMG }}
            style={styles.profileImage}
          />

          {/* SHOW displayName if available, otherwise fallback to username */}
          {finalUser.displayName ? (
            <View>
              <Text style={styles.displayName}>{finalUser.displayName}</Text>
              <Text style={styles.usernameSubtitle}>
                @{finalUser.username ?? 'Unknown'}
              </Text>
            </View>
          ) : (
            <Text style={styles.username}>
              {finalUser.username ?? 'Unknown'}
            </Text>
          )}
        </TouchableOpacity>

        {!showDetailedTimestamp && (
          <TouchableOpacity
            style={styles.userRowRight}
            onPress={handleNavigateToDetails}
            activeOpacity={0.8}
          >
            <Text style={styles.timestamp}>
              {getTimeElapsed(poll.createdAt)}
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {/* Main body: question + poll options */}
      <TouchableOpacity
        activeOpacity={0.8}
        disabled={disableMainPress}
        onPress={handleNavigateToDetails}
        style={styles.mainBody}
      >
        <Text style={styles.question}>{poll.question || 'No question'}</Text>

        <View style={styles.optionsContainer}>
          {pollOptions.map((option, index) => {
            const isVoted = userVote === option.id;
            const votes = option.votes || 0;
            const rawPercent =
              totalVotes === 0 ? 0 : Math.round((votes / totalVotes) * 100);

            let fillWidthStyle;
            if (isOwner) {
              fillWidthStyle = {
                width: showFillBarAndPercent ? `${rawPercent}%` : '0%',
              };
            } else {
              fillWidthStyle = {
                width: showFillBarAndPercent
                  ? fillAnims[index]?.interpolate({
                      inputRange: [0, 100],
                      outputRange: ['0%', '100%'],
                    }) ?? '0%'
                  : '0%',
              };
            }

            const fillBarDynamicRadius =
              rawPercent === 100
                ? {
                    borderTopLeftRadius: 20,
                    borderBottomLeftRadius: 20,
                    borderTopRightRadius: 20,
                    borderBottomRightRadius: 20,
                  }
                : {
                    borderTopLeftRadius: 20,
                    borderBottomLeftRadius: 20,
                    borderTopRightRadius: 0,
                    borderBottomRightRadius: 0,
                  };

            const displayPercent = showFillBarAndPercent ? `${rawPercent}%` : '';

            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionContainer,
                  isVoted && styles.selectedOptionBorder,
                ]}
                onPress={() => handleOptionPress(option.id)}
                activeOpacity={0.8}
              >
                {/* Animated fill bar */}
                <Animated.View
                  style={[
                    styles.fillBar,
                    fillBarDynamicRadius,
                    {
                      backgroundColor: isVoted ? '#A4FFE4' : '#e4edf5',
                    },
                    fillWidthStyle,
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
                    <Text
                      style={[
                        styles.optionText,
                        isVoted && styles.selectedOptionText,
                      ]}
                    >
                      {option.text}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.percentageText,
                      isVoted && styles.selectedOptionText,
                    ]}
                  >
                    {displayPercent}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {showDetailedTimestamp && (
          <Text style={styles.detailedTimestamp}>
            {formatDetailedDate(poll.createdAt)}
          </Text>
        )}

        {/* Footer row */}
        <View style={styles.bottomRow}>
          {poll.allowComments && (
            <View style={styles.commentContainer}>
              <MessageCircle width={18} color="gray" style={styles.commentIcon} />
              <Text style={styles.commentCount}>
                {poll.commentCount || 0}
              </Text>
            </View>
          )}

          <View style={styles.voteContainer}>
            <View style={styles.checkMarkContainer}>
              <View style={styles.totalVoteCircle}>
                <Check width={12} color="gray" style={styles.totalVoteCheck} />
              </View>
            </View>
            <Text style={styles.voteCount}>{totalVotes}</Text>
          </View>

          {/* Ellipsis if user is the poll owner */}
          {isOwner && onOpenMenu && (
            <TouchableOpacity
              style={styles.ellipsisButton}
              onPress={() => onOpenMenu(poll)}
            >
              <MoreHorizontal width={20} color="gray" />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default PollCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.pollBackground || '#fff',
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
    marginRight: 8,
    borderWidth: 0.5,
    borderColor: 'gray',
  },

  // ============= NEW STYLES FOR DISPLAY NAME & SUBTITLE =============
  displayName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.dark,
    lineHeight: 20,
  },
  usernameSubtitle: {
    fontSize: 14,
    color: colors.primary,
    lineHeight: 18,
  },

  // Fallback if no displayName
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
  mainBody: {},
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
    borderWidth: 1,
    borderColor: '#b8c3cf',
    borderRadius: 20,
    marginBottom: 8,
    overflow: 'hidden',
  },
  fillBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
  },
  optionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 1,
    paddingVertical: 10,
    paddingRight: 12,
    paddingLeft: 22,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkMarkContainer: {
    marginRight: 0,
    marginLeft: -4,
  },
  singleVoteCircle: {
    width: 17,
    height: 17,
    borderRadius: 8.5,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: colors.secondary,
    borderWidth: 1.2,
    marginRight: 5,
  },
  optionText: {
    fontSize: 16,
    color: colors.dark,
  },
  selectedOptionBorder: {
    borderColor: colors.secondary,
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
    marginRight: 25,
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
  totalVoteCircle: {
    width: 17,
    height: 17,
    borderRadius: 8.5,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.2,
    borderColor: 'gray',
    marginRight: 4,
  },
  totalVoteCheck: {},
  voteCount: {
    fontSize: 14,
    color: colors.dark,
  },
  detailedTimestamp: {
    fontSize: 14,
    color: 'gray',
    marginTop: 4,
    marginBottom: 8,
  },
  ellipsisButton: {
    marginLeft: 'auto',
    padding: 6,
  },
});
