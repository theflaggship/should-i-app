// FollowersFollowingScreen.js

import React, { useState, useEffect, useContext } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Image,
    StyleSheet,
    ActivityIndicator,
    TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Check, ArrowLeftCircle } from 'react-native-feather';
import colors from '../styles/colors';
import { AuthContext } from '../context/AuthContext';
import {
    getFollowers,
    getFollowing,
    followUser,
    unfollowUser,
} from '../services/followService';
import { useUserStatsStore } from '../store/useUserStatsStore';

const DEFAULT_PROFILE_IMG = 'https://picsum.photos/200/200';

export default function FollowersFollowingScreen({ route }) {
    const navigation = useNavigation();
    const { mode, userId } = route.params;
    const { token, user: loggedInUser } = useContext(AuthContext);
    const { incrementFollowing, decrementFollowing } = useUserStatsStore();

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState({});

    // For real-time search
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchData();
    }, [mode, userId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1️⃣ Get the “viewed” user’s followers OR followings
            const data =
                mode === 'followers'
                    ? await getFollowers(userId, token)
                    : await getFollowing(userId, token);

            // 2️⃣ Always fetch who *I* (loggedInUser) am following
            let iFollowIDs = [];
            if (loggedInUser?.id) {
                const myFollowing = await getFollowing(loggedInUser.id, token);
                iFollowIDs = myFollowing.map((u) => u.id);
            }

            // 3️⃣ Annotate each returned user with whether *I* follow them
            const annotated = data.map((u) => ({
                ...u,
                amIFollowing: iFollowIDs.includes(u.id),
            }));

            setUsers(annotated);
        } catch (err) {
            console.error('Fetch error:', err.response?.data?.error || err.message);
        } finally {
            setLoading(false);
        }
    };

    // Follow/Unfollow
    const handleToggle = async (item, idx) => {
        if (toggling[item.id]) return; // prevent spamming
        setToggling((prev) => ({ ...prev, [item.id]: true }));

        const wasFollowing = item.amIFollowing;

        // Update local state immediately for instant UI feedback
        const updated = [...users];
        updated[idx].amIFollowing = !wasFollowing;
        setUsers(updated);

        // Update user stats
        wasFollowing ? decrementFollowing() : incrementFollowing();

        try {
            if (wasFollowing) {
                await unfollowUser(item.id, token);
            } else {
                await followUser(item.id, token);
            }
        } catch (err) {
            const msg = err.response?.data?.error || err.message;
            if (!msg.toLowerCase().includes('already following')) {
                console.error('Follow toggle failed:', msg);
                // revert local change
                updated[idx].amIFollowing = wasFollowing;
                setUsers(updated);
                wasFollowing ? incrementFollowing() : decrementFollowing();
            }
        } finally {
            setToggling((prev) => ({ ...prev, [item.id]: false }));
        }
    };

    // Tapping user row => navigate to profile
    const handleUserPress = (someUserId) => {
        navigation.navigate('OtherUserProfile', { userId: someUserId });
    };

    // Filter by searchTerm
    const filteredUsers = users.filter((u) => {
        const lowerSearch = searchTerm.toLowerCase();
        return (
            u.displayName?.toLowerCase().includes(lowerSearch) ||
            u.username?.toLowerCase().includes(lowerSearch)
        );
    });

    const renderItem = ({ item, index }) => {
        const name = item.displayName || item.username;
        const isFollowing = item.amIFollowing;
        // If we’re in the followers list, user might be isFollowingMe => “Follow Back”
        const followBack = !isFollowing && item.isFollowingMe;

        return (
            <TouchableOpacity
                style={styles.userRow}
                activeOpacity={0.8}
                onPress={() => handleUserPress(item.id)}
            >
                {/* Avatar */}
                <Image
                    source={{ uri: item.profilePicture || DEFAULT_PROFILE_IMG }}
                    style={styles.avatar}
                />

                {/* User Info */}
                <View style={styles.userInfo}>
                    <Text style={styles.displayName}>{name}</Text>
                    {item.displayName && item.username ? (
                        <Text style={styles.username}>@{item.username}</Text>
                    ) : null}

                    {item.personalSummary ? (
                        <Text style={styles.personalSummary}>{item.personalSummary}</Text>
                    ) : null}

                    {item.isFollowingMe && (
                        <Text style={styles.followsYou}>Follows You</Text>
                    )}
                </View>

                {/* Follow/Unfollow button */}
                {item.id !== loggedInUser.id && (
                    <TouchableOpacity
                        disabled={toggling[item.id]}
                        style={[
                            styles.button,
                            isFollowing ? styles.buttonFollowing : styles.buttonFollow,
                        ]}
                        onPress={() => handleToggle(item, index)}
                    >
                        <Text
                            style={[
                                styles.buttonText,
                                isFollowing ? styles.textFollowing : styles.textFollow,
                            ]}
                        >
                            {isFollowing ? 'Following' : followBack ? 'Follow Back' : 'Follow'}
                        </Text>
                        {isFollowing && (
                            <Check
                                width={14}
                                height={14}
                                color={colors.dark}
                                style={{ marginLeft: 4 }}
                            />
                        )}
                    </TouchableOpacity>
                )}
            </TouchableOpacity>
        );
    };

    const screenTitle = mode === 'followers' ? 'Followers' : 'Following';

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
            >
                <ArrowLeftCircle width={30} color={colors.dark} />
            </TouchableOpacity>

            <Text style={styles.header}>{screenTitle}</Text>

            {/* Search bar */}
            <TextInput
                style={styles.searchInput}
                placeholder="Search users..."
                placeholderTextColor="#999"
                value={searchTerm}
                onChangeText={setSearchTerm}
            />

            {loading ? (
                <ActivityIndicator
                    color={colors.primary}
                    size="large"
                    style={{ marginTop: 40 }}
                />
            ) : (
                <FlatList
                    data={filteredUsers}
                    keyExtractor={(item, i) =>
                        item.id ? item.id.toString() : i.toString()
                    }
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                />
            )}
        </View>
    );
}

// ------------------ STYLES ------------------
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.appBackground,
        paddingTop: 100,
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 16,
        zIndex: 10,
    },
    backButtonText: {
        color: colors.dark,
        fontSize: 16,
    },
    header: {
        fontSize: 20,
        color: colors.dark,
        marginBottom: 12,
        fontWeight: 'bold',
        paddingHorizontal: 16,
    },
    searchInput: {
        backgroundColor: colors.light,
        borderRadius: 8,
        marginHorizontal: 16,
        paddingHorizontal: 12,
        paddingVertical: 8,
        color: colors.dark,
        marginBottom: 12,
    },
    list: {
        paddingHorizontal: 16,
    },
    userRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 12,
        marginBottom: 10,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginRight: 12,
        borderWidth: 1,
        borderColor: colors.onDarkPlaceHolder,
    },
    userInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    displayName: {
        fontSize: 16,
        color: colors.dark,
        fontWeight: '600',
    },
    username: {
        fontSize: 14,
        color: colors.primary,
    },
    personalSummary: {
        fontSize: 12,
        color: '#777',
        marginTop: 4,
    },
    followsYou: {
        fontSize: 12,
        color: '#4caf50',
        marginTop: 4,
    },
    button: {
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 6,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
    },
    buttonFollow: {
        backgroundColor: colors.secondary
        ,
        borderColor: colors.secondaryLight,
    },
    buttonFollowing: {
        backgroundColor: colors.appBackground,
        borderColor: colors.dark,
    },
    buttonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    textFollow: {
        color: colors.dark,
    },
    textFollowing: {
        color: colors.dark,
    },
});
