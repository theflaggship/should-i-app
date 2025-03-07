// PollCard.js
import React, { useContext } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { sendVoteWS } from '../services/pollService';
import { AuthContext } from '../context/AuthContext';
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
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  };
  let formatted = dateObj.toLocaleString('en-US', options);
  formatted = formatted.replace(',', ''); // remove first comma
  formatted = formatted.replace(',', ' at'); // replace second comma with " at"
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

  // Unify poll.user vs. poll.User
  const finalUser = poll.user || poll.User;

  const userVote = poll?.userVote;
  const pollOptions = poll?.options || [];
  const totalVotes = pollOptions.reduce((sum, opt) => sum + (opt.votes || 0), 0);

  // We only show the fill bars + percentages if the user has voted on this poll
  const userHasVoted = userVote != null;

  const handleOptionPress = (optionId) => {
    if (!user || !user.id) return;
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

  const handleNavigateToProfile = () => {
    if (!finalUser?.id) return;
    // Future user profile screen
    navigation.navigate('UserProfile', { userId: finalUser.id });
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
      <TouchableOpacity
        style={styles.userRow}
        activeOpacity={0.8}
        onPress={handleNavigateToDetails}
      >
        {/* Overlaid child pressable for profile pic + username => user profile */}
        <TouchableOpacity
          style={styles.userRowLeft}
          // onPress={handleNavigateToProfile}
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

            // If user hasn't voted, fill bars + percentages are hidden
            let rawPercent = 0;
            let percentage = '0%';
            if (userHasVoted && totalVotes > 0) {
              rawPercent = Math.round((votes / totalVotes) * 100);
              percentage = `${rawPercent}%`;
            }

            // Adjust corners if user has voted
            const fillBarDynamicRadius = rawPercent === 100
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
                {/* Only render the fill bar if userHasVoted */}
                {userHasVoted && (
                  <View
                    style={[
                      styles.fillBar,
                      fillBarDynamicRadius,
                      {
                        width: percentage,
                        backgroundColor: isVoted ? '#b1f3e7' : '#e4edf5',
                      },
                    ]}
                  />
                )}
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
                  {/* Only show the percentage text if userHasVoted */}
                  <Text
                    style={[
                      styles.percentageText,
                      isVoted && styles.selectedOptionText,
                    ]}
                  >
                    {userHasVoted ? percentage : ''}
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

          {/* Show ellipsis if poll belongs to logged-in user and onOpenMenu is provided */}
          {finalUser?.id === user?.id && onOpenMenu && (
            <TouchableOpacity style={styles.ellipsisButton} onPress={() => onOpenMenu(poll)}>
              <MoreHorizontal width={20} color="gray" />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default PollCard;

// -------------- STYLES --------------
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
    flexWrap: 'wrap',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    flexWrap: 'wrap',
  },
  checkMarkContainer: {
    marginRight: 4,
    marginLeft: -4,
    justifyContent: 'center', 
    alignItems: 'center',
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
    flexShrink: 1,
    flexWrap: 'wrap',
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
