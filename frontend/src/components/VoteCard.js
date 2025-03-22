// src/components/VoteCard.js
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MessageCircle, Check, MoreHorizontal } from 'react-native-feather';
import { getTimeElapsed } from '../../utils/timeConversions';
import colors from '../styles/colors';

const DEFAULT_PROFILE_IMG = 'https://picsum.photos/200/200';

const VoteCard = ({ poll, onOpenMenu, user }) => {
    const navigation = useNavigation();
    const route = useRoute();

    if (!poll) {
        return (
            <View style={styles.card}>
                <Text>No poll data found.</Text>
            </View>
        );
    }

    // Retrieve the poll owner and options
    const finalUser = poll.user || {};
    const pollOptions = poll.options || [];

    // Determine ownership
    const isOwner = finalUser.id === user?.id;

    // Get the user's vote (assumed to be an option ID)
    const userVoteId = poll.userVote;
    // Look up the voted option object from poll.options using the vote ID
    const votedOption = pollOptions.find((opt) => opt.id === userVoteId);

    // Navigation
    const handleNavigateToPoll = () => {
        navigation.navigate('PollDetails', { pollId: poll.id });
    };

    const handleNavigateToUserProfile = () => {
        if (!poll?.user?.id) return;

        const finalUserId = poll.user.id;
        const currentRouteName = route.name;
        const currentUserId = route.params?.userId;
        const myUserId = user?.id;

        // ... logic to skip if we’re on that same user’s profile ...
        if (currentRouteName === 'OtherUserProfile' && currentUserId === finalUserId) {
            return;
        }
        if ((currentRouteName === 'ProfileMain' || currentRouteName === 'Profile') && myUserId === finalUserId) {
            return;
        }

        // otherwise, navigate
        navigation.navigate('OtherUserProfile', { userId: finalUserId });
    };

    const handleEllipsisPress = () => {
        if (onOpenMenu) {
            onOpenMenu(poll);
        }
    };

    // If there's no voted option, show a fallback container
    if (!votedOption) {
        return (
            <TouchableOpacity
                style={[styles.card, styles.removedVoteContainer]}
                onPress={handleNavigateToPoll}
                activeOpacity={0.8}
            >
                <Text style={styles.removedVoteText}>
                    You no longer have a vote on this poll.{"\n"}Tap to view details.
                </Text>
            </TouchableOpacity>
        );
    }

    // Calculate total votes and percentage for the voted option
    const totalVotes = pollOptions.reduce((sum, opt) => sum + (opt.votes || 0), 0);
    const votes = votedOption.votes || 0;
    const rawPercent = totalVotes === 0 ? 0 : Math.round((votes / totalVotes) * 100);

    return (
        <View style={styles.card}>
            {/* Header row */}
            <TouchableOpacity
                style={styles.userRow}
                activeOpacity={0.8}
                onPress={handleNavigateToPoll}
            >
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
                <TouchableOpacity
                    style={styles.userRowRight}
                    activeOpacity={0.8}
                    onPress={handleNavigateToPoll}
                >
                    <Text style={styles.timestamp}>
                        {getTimeElapsed(poll.createdAt)}
                    </Text>
                </TouchableOpacity>
            </TouchableOpacity>

            {/* Poll question */}
            <TouchableOpacity
                onPress={handleNavigateToPoll}
                style={styles.pollQuestionContainer}
                activeOpacity={0.8}
            >
                <Text style={styles.question}>{poll.question}</Text>
            </TouchableOpacity>

            {/* Voted option container */}
            <TouchableOpacity
                onPress={handleNavigateToPoll}
                style={[styles.optionContainer, styles.selectedOptionBorder]}
                activeOpacity={0.8}
            >
                {/* Fill bar showing vote percentage */}
                <View
                    style={[
                        styles.fillBar,
                        { width: `${rawPercent}%`, backgroundColor: '#b1f3e7' },
                    ]}
                />
                <View style={styles.optionContent}>
                    <View style={styles.optionLeft}>
                        <Text style={[styles.optionText, styles.selectedOptionText]}>
                            {votedOption.text}
                        </Text>
                    </View>
                    <Text style={[styles.percentageText, styles.selectedOptionText]}>
                        {`${rawPercent}%`}
                    </Text>
                </View>
            </TouchableOpacity>

            {/* Bottom row for total comments & total votes */}
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

                {/* Ellipsis if user is owner */}
                {isOwner && onOpenMenu && (
                    <TouchableOpacity
                        style={styles.ellipsisButton}
                        onPress={handleEllipsisPress}
                    >
                        <MoreHorizontal width={20} color="gray" />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

export default VoteCard;

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.pollBackground || '#fff',
        padding: 12,
        borderRadius: 8,
        marginBottom: 10,
    },
    removedVoteContainer: {
        paddingLeft: 20,
    },
    removedVoteText: {
        fontFamily: 'Quicksand-Medium',
        fontSize: 14,
        color: colors.dark,
        textAlign: 'left',
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
    displayName: {
        fontFamily: 'Quicksand-SemiBold',
        fontSize: 16,
        fontWeight: '600',
        color: colors.dark,
        lineHeight: 20,
      },
      usernameSubtitle: {
        fontFamily: 'Quicksand-Regular',
        fontSize: 14,
        color: colors.primary,
        lineHeight: 18,
      },
      // Fallback if no displayName
      username: {
        fontFamily: 'Quicksand-SemiBold',
        fontSize: 16,
        color: colors.dark,
      },
    timestamp: {
        fontFamily: 'Quicksand-Medium',
        fontSize: 12,
        color: 'gray',
    },
    pollQuestionContainer: {
        marginVertical: 4,
        marginBottom: 12,
    },
    question: {
        fontFamily: 'Quicksand-Medium',
        fontSize: 18,
        color: colors.dark,
        marginTop: 5,
        marginLeft: 5,
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
    optionText: {
        fontFamily: 'Quicksand-Medium',
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
        fontFamily: 'Quicksand-Medium',
        fontSize: 12,
        color: 'gray',
        fontWeight: '400',
        marginRight: 12,
    },

    // Bottom row for total comments & total votes
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
        fontFamily: 'Quicksand-Medium',
        fontSize: 14,
        color: colors.dark,
    },
    voteContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkMarkContainer: {
        marginRight: 0,
        marginLeft: -4,
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
    voteCount: {
        fontFamily: 'Quicksand-Medium',
        fontSize: 14,
        color: colors.dark,
    },
    ellipsisButton: {
        marginLeft: 'auto',
        padding: 6,
    },
});
