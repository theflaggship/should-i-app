import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Animated,  // <-- import Animated
  Easing,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { sendVoteWS } from '../services/pollService';
import { MessageCircle, Check, MoreHorizontal } from 'react-native-feather';
import colors from '../styles/colors';

const DEFAULT_PROFILE_IMG = 'https://picsum.photos/200/200';

// Helpers
const getTimeElapsed = (createdAt) => {
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
};

const formatDetailedDate = (createdAt) => {
  if (!createdAt) return '';
  const dateObj = new Date(createdAt);
  const options = {
    month: 'long', 
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  };
  let formatted = dateObj.toLocaleString('en-US', options);
  formatted = formatted.replace(',', '');
  formatted = formatted.replace(',', ' at');
  return formatted;
};

const PollCard = ({
  poll,
  onVote,
  disableMainPress = false,
  showDetailedTimestamp = false,
  onOpenMenu,
}) => {
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);

  if (!poll) {
    return (
      <View style={styles.card}>
        <Text>No poll data found.</Text>
      </View>
    );
  }

  // Unify poll.user vs. poll.User
  const finalUser = poll.user || poll.User;
  const isOwner = finalUser?.id === user?.id;

  const userVote = poll.userVote;   
  const pollOptions = poll.options || [];
  const totalVotes = pollOptions.reduce((sum, opt) => sum + (opt.votes || 0), 0);

  // If poll is owned by the user => always show fill bar. Otherwise => show fill bar only if userVote != null.
  const showFillBarAndPercent = isOwner || userVote !== null;

  // ----------------------------------------------------------------
  // ANIMATION LOGIC (for non-owners only)
  // ----------------------------------------------------------------
  // We store an Animated.Value for each option. 
  // This will let us animate from oldWidth% to newWidth% in 1 second.
  const [fillAnims, setFillAnims] = useState(() =>
    pollOptions.map(() => new Animated.Value(0))
  );

  // If the poll options array length changes (rare, but can happen if poll is edited),
  // re-initialize the array. 
  useEffect(() => {
    if (fillAnims.length !== pollOptions.length) {
      setFillAnims(pollOptions.map(() => new Animated.Value(0)));
    }
    // We only re-init if lengths differ. Otherwise we keep them so we can animate from old to new.
  }, [pollOptions, fillAnims]);

  // Animate whenever pollOptions, totalVotes, or userVote changes, but only if not the owner.
  useEffect(() => {
    if (isOwner) {
      // If owner => skip animations, just snap to final
      pollOptions.forEach((opt, i) => {
        const rawPercent = totalVotes === 0 ? 0 : Math.round((opt.votes / totalVotes) * 100);
        fillAnims[i].setValue(rawPercent); // instantly set
      });
      return;
    }

    // If not owner => animate from old to new
    pollOptions.forEach((opt, i) => {
      const rawPercent = totalVotes === 0 ? 0 : Math.round((opt.votes / totalVotes) * 100);
      const finalValue = showFillBarAndPercent ? rawPercent : 0;

      Animated.timing(fillAnims[i], {
        toValue: finalValue,
        duration: 700,           // 700 ms
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,   // width animation requires layout, so no driver
      }).start();
    });
  }, [pollOptions, totalVotes, userVote, showFillBarAndPercent, isOwner, fillAnims]);

  // ----------------------------------------------------------------
  // HANDLERS
  // ----------------------------------------------------------------
  const handleOptionPress = (optionId) => {
    if (!user?.id) return;
    if (onVote) {
      onVote(poll.id, optionId);
    } else {
      sendVoteWS(user.id, poll.id, optionId);
    }
  };

  const handleNavigateToDetails = () => {
    if (!disableMainPress && poll?.id) {
      navigation.navigate('PollDetails', { pollId: poll.id });
    }
  };

  // ----------------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------------
  return (
    <View style={styles.card}>
      {/* Header row */}
      <TouchableOpacity
        style={styles.userRow}
        activeOpacity={0.8}
        onPress={handleNavigateToDetails}
      >
        <TouchableOpacity
          style={styles.userRowLeft}
          activeOpacity={0.8}
          pointerEvents="box-only"
        >
          <Image
            source={{ uri: finalUser?.profilePicture || DEFAULT_PROFILE_IMG }}
            style={styles.profileImage}
          />
          <Text style={styles.username}>{finalUser?.username ?? 'Unknown'}</Text>
        </TouchableOpacity>

        {!showDetailedTimestamp && (
          <TouchableOpacity
            style={styles.userRowRight}
            onPress={handleNavigateToDetails}
            activeOpacity={0.8}
          >
            <Text style={styles.timestamp}>{getTimeElapsed(poll.createdAt)}</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {/* Body: question + poll options */}
      <TouchableOpacity
        activeOpacity={0.8}
        disabled={disableMainPress}
        onPress={handleNavigateToDetails}
        style={styles.mainBody}
      >
        <Text style={styles.question}>{poll.question ?? 'No question'}</Text>

        <View style={styles.optionsContainer}>
          {pollOptions.map((option, index) => {
            const isVoted = userVote === option.id;
            const votes = option.votes || 0;
            const rawPercent =
              totalVotes === 0 ? 0 : Math.round((votes / totalVotes) * 100);

            // If the user is the owner => no animation => just use rawPercent
            // If not owner => use fillAnims
            let fillWidthStyle;
            if (isOwner) {
              const fillWidth = showFillBarAndPercent ? `${rawPercent}%` : '0%';
              fillWidthStyle = { width: fillWidth };
            } else {
              // Use interpolation from fillAnims
              const fillAnim = fillAnims[index];
              fillWidthStyle = {
                width: fillAnim.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                }),
              };
            }

            // If 100% => round corners both sides
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
                {/* Fill Bar */}
                <Animated.View
                  style={[
                    styles.fillBar,
                    fillBarDynamicRadius,
                    {
                      backgroundColor: isVoted ? '#b1f3e7' : '#e4edf5',
                    },
                    fillWidthStyle, // animated or static
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

        {/* Footer row: comments, total votes, etc. */}
        <View style={styles.bottomRow}>
          {poll.allowComments && (
            <View style={styles.commentContainer}>
              <MessageCircle width={18} color="gray" style={styles.commentIcon} />
              <Text style={styles.commentCount}>{poll.commentCount || 0}</Text>
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

          {/* Ellipsis if poll belongs to user */}
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
