// PollCard.js
import React, { useContext } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { sendVoteWS } from '../services/pollService';
import { MessageCircle, Check, MoreHorizontal } from 'react-native-feather';
import colors from '../styles/colors';

const DEFAULT_PROFILE_IMG = 'https://picsum.photos/200/200';

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
    month: 'long',   // "February"
    day: 'numeric',  // "27"
    year: 'numeric', // "2025"
    hour: 'numeric', // "12"
    minute: '2-digit', // "00"
    hour12: true,    // "PM"
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

  // Safely unify poll.user vs. poll.User
  const finalUser = poll?.user || poll?.User;
  if (!poll) {
    return (
      <View style={styles.card}>
        <Text>No poll data found.</Text>
      </View>
    );
  }

  const userVote = poll?.userVote;   // ID of the option the user voted for, or null
  const pollOptions = poll?.options || [];
  const totalVotes = pollOptions.reduce((sum, opt) => sum + (opt.votes || 0), 0);

  // Decide if we ALWAYS show the fill bar & percentages
  // 1) If poll belongs to the logged-in user => ALWAYS show
  // 2) Otherwise => ONLY show if userVote != null
  const isOwner = finalUser?.id === user?.id;
  // If poll is not owned => must have voted to see fill bar
  const showFillBarAndPercent = isOwner || userVote !== null;

  const handleOptionPress = (optionId) => {
    if (!user?.id) return;
    if (onVote) {
      // A callback passed in, e.g. to update store
      onVote(poll.id, optionId);
    } else {
      // Otherwise use WebSocket
      sendVoteWS(user.id, poll.id, optionId);
    }
  };

  const handleNavigateToDetails = () => {
    if (!disableMainPress && poll?.id) {
      navigation.navigate('PollDetails', { pollId: poll.id });
    }
  };

  return (
    <View style={styles.card}>
      {/* Header row: user info */}
      <TouchableOpacity
        style={styles.userRow}
        activeOpacity={0.8}
        onPress={handleNavigateToDetails}
      >
        <TouchableOpacity
          style={styles.userRowLeft}
          // onPress={handleNavigateToProfile} // If you want a separate press
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
            <Text style={styles.timestamp}>{getTimeElapsed(poll?.createdAt)}</Text>
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
        <Text style={styles.question}>{poll?.question ?? 'No question'}</Text>

        <View style={styles.optionsContainer}>
          {pollOptions.map((option) => {
            const isVoted = userVote === option.id;
            const votes = option.votes || 0;

            // Always compute rawPercent, but we only use it if showFillBarAndPercent
            const rawPercent =
              totalVotes === 0 ? 0 : Math.round((votes / totalVotes) * 100);

            // If we’re not showing fill bar => width=0, text=''
            const fillWidth = showFillBarAndPercent ? `${rawPercent}%` : '0%';
            const percentText = showFillBarAndPercent ? `${rawPercent}%` : '';

            // If rawPercent is 100 => round corners both sides
            // Otherwise => corners only on left side
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
                <View
                  style={[
                    styles.fillBar,
                    fillBarDynamicRadius,
                    {
                      width: fillWidth, // either "XX%" or "0%"
                      backgroundColor: isVoted ? '#b1f3e7' : '#e4edf5',
                    },
                  ]}
                />

                {/* Option text + percentage */}
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
                    {percentText}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {showDetailedTimestamp && (
          <Text style={styles.detailedTimestamp}>
            {formatDetailedDate(poll?.createdAt)}
          </Text>
        )}

        {/* Footer row: commentCount, totalVoteCount, ellipsis */}
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

          {/* Show ellipsis if poll belongs to user and we have onOpenMenu */}
          {finalUser?.id === user?.id && onOpenMenu && (
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

// ---------------- STYLES ----------------
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
    borderRadius: 20,
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
