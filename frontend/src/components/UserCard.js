import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Check } from 'react-native-feather';
import colors from '../styles/colors';

const DEFAULT_PROFILE_IMG = 'https://picsum.photos/200/200';

const UserCard = ({
  user,
  loggedInUserId = null,
  toggling = {},
  onToggleFollow = () => {},
}) => {
  const navigation = useNavigation();
  const route = useRoute();

  const isFollowing = user.amIFollowing;
  const followBack = !isFollowing && user.isFollowingMe;

  const handleUserPress = () => {
    if (!user?.id) return;

    const currentRoute = route.name;
    const currentUserId = route.params?.userId;

    const isSelfProfile =
      (currentRoute === 'ProfileMain' || currentRoute === 'Profile') &&
      loggedInUserId === user.id;

    const isAlreadyOnProfile =
      currentRoute === 'OtherUserProfile' && currentUserId === user.id;

    if (!isSelfProfile && !isAlreadyOnProfile) {
      navigation.navigate('OtherUserProfile', { userId: user.id });
    }
  };

  return (
    <TouchableOpacity
      style={styles.userRow}
      activeOpacity={0.8}
      onPress={handleUserPress}
    >
      {/* Avatar */}
      <Image
        source={{ uri: user.profilePicture || DEFAULT_PROFILE_IMG }}
        style={styles.avatar}
      />

      {/* Info */}
      <View style={styles.userInfo}>
        <Text style={styles.displayName}>{user.displayName || user.username}</Text>
        {user.displayName && user.username && (
          <Text style={styles.username}>@{user.username}</Text>
        )}
        {user.personalSummary && (
          <Text style={styles.personalSummary}>{user.personalSummary}</Text>
        )}
        {user.isFollowingMe && (
          <Text style={styles.followsYou}>Follows You</Text>
        )}
      </View>

      {/* Follow/Unfollow Button */}
      {user.id !== loggedInUserId && (
        <TouchableOpacity
          disabled={toggling[user.id]}
          style={[
            styles.button,
            isFollowing ? styles.buttonFollowing : styles.buttonFollow,
          ]}
          onPress={() => onToggleFollow(user)}
        >
          {toggling[user.id] ? (
            <ActivityIndicator size="small" color="#333" />
          ) : (
            <>
              <Text
                style={[
                  styles.buttonText,
                  isFollowing ? styles.textFollowing : styles.textFollow,
                ]}
              >
                {isFollowing
                  ? 'Following'
                  : followBack
                  ? 'Follow Back'
                  : 'Follow'}
              </Text>
              {isFollowing && (
                <Check
                  width={14}
                  height={14}
                  color={colors.dark}
                  style={{ marginLeft: 4 }}
                />
              )}
            </>
          )}
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

export default UserCard;

const styles = StyleSheet.create({
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
    fontFamily: 'Quicksand-SemiBold',
    fontSize: 16,
    color: colors.dark,
    fontWeight: '600',
  },
  username: {
    fontFamily: 'Quicksand-Medium',
    fontSize: 14,
    color: colors.primary,
  },
  personalSummary: {
    fontFamily: 'Quicksand-Medium',
    fontSize: 12,
    color: '#777',
    marginTop: 4,
  },
  followsYou: {
    fontFamily: 'Quicksand-Medium',
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
    backgroundColor: colors.secondary,
    borderColor: colors.secondaryLight,
  },
  buttonFollowing: {
    backgroundColor: colors.appBackground,
    borderColor: colors.dark,
  },
  buttonText: {
    fontFamily: 'Quicksand-Medium',
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
