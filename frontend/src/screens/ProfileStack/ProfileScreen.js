// src/screens/ProfileScreen.js
import React, { useContext, useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Modalize } from 'react-native-modalize';
import { Settings, Trash2 } from 'react-native-feather';
import colors from '../../styles/colors';
import { AuthContext } from '../../context/AuthContext';
import PollCard from '../../components/PollCard';
import CommentCard from '../../components/CommentCard';
import { sendVoteWS } from '../../services/pollService';
import { getUserComments, getUserVotes } from '../../services/userService';
import { usePollsStore } from '../../store/usePollsStore';
import { deletePoll, updatePoll } from '../../services/pollService';

const { height } = Dimensions.get('window');

const TABS = {
  POLLS: 'POLLS',
  COMMENTS: 'COMMENTS',
  VOTES: 'VOTES',
};

const ProfileScreen = ({ navigation }) => {
  const { user, token } = useContext(AuthContext);

  // Access userPolls from the store
  const userPolls = usePollsStore((state) => state.userPolls);
  const fetchUserPolls = usePollsStore((state) => state.fetchUserPolls);
  const updateUserPollInStore = usePollsStore((state) => state.updateUserPollInStore);

  // Store loading/error
  const loading = usePollsStore((state) => state.loading);
  const error = usePollsStore((state) => state.error);

  // Local states for the other tabs
  const [comments, setComments] = useState([]);
  const [commentsGroupedByPoll, setCommentsGroupedByPoll] = useState([]);
  const [votes, setVotes] = useState([]);
  const [selectedTab, setSelectedTab] = useState(TABS.POLLS);

  // For modals
  const menuModalRef = useRef(null);
  const editModalRef = useRef(null);
  const deleteConfirmModalRef = useRef(null);
  const fullEditModalRef = useRef(null);

  // Track which poll is selected
  const [selectedPoll, setSelectedPoll] = useState(null);

  // Toggles + question + options for editing
  const [tempAllowComments, setTempAllowComments] = useState(false);
  const [tempIsPrivate, setTempIsPrivate] = useState(false);
  const [tempQuestion, setTempQuestion] = useState('');
  const [tempOptions, setTempOptions] = useState([]);

  // On mount, fetch the user's polls
  useEffect(() => {
    fetchUserPolls(token, user.id);
  }, [token, user.id]);

  const handleVote = (pollId, optionId) => {
    if (!user?.id) return;
    sendVoteWS(user.id, pollId, optionId);
  };

  // Switch tabs
  const handleTabPress = async (tab) => {
    setSelectedTab(tab);
    if (tab === TABS.POLLS) {
      fetchUserPolls(token, user.id);
    } else if (tab === TABS.COMMENTS) {
      try {
        const data = await getUserComments(user.id, token);
        setComments(data);

        // Group them by poll
        const groupedMap = {};
        data.forEach((comment) => {
          const p = comment.poll;
          if (!p) return;
          if (!groupedMap[p.id]) {
            groupedMap[p.id] = {
              pollId: p.id,
              poll: {
                id: p.id,
                question: p.question,
                createdAt: p.createdAt,
                user: p.user,
              },
              userComments: [],
            };
          }
          groupedMap[p.id].userComments.push({
            id: comment.id,
            text: comment.commentText,
            createdAt: comment.createdAt,
          });
        });
        const groupedArray = Object.values(groupedMap);
        setCommentsGroupedByPoll(groupedArray);
      } catch (err) {
        console.error('Fetching user comments error:', err);
      }
    } else if (tab === TABS.VOTES) {
      try {
        const data = await getUserVotes(user.id, token);
        setVotes(data);
      } catch (err) {
        console.error('Fetching user votes error:', err);
      }
    }
  };

  // Ellipsis + modals
  const handleOpenMenu = (poll) => {
    setSelectedPoll(poll);
    setTempAllowComments(poll.allowComments);
    setTempIsPrivate(poll.isPrivate);
    setTempQuestion(poll.question);
    setTempOptions(poll.options?.map((o) => o.text || '') || []);
    menuModalRef.current?.open();
  };

  const handleMenuOption = (option) => {
    menuModalRef.current?.close();
    setTimeout(() => {
      if (option === 'delete') {
        deleteConfirmModalRef.current?.open();
        return;
      }
      if (option === 'edit') {
        fullEditModalRef.current?.open();
      } else if (option === 'interaction') {
        editModalRef.current?.open();
      }
    }, 300);
  };

  const confirmDeletePoll = async () => {
    try {
      await deletePoll(token, selectedPoll.id);
      usePollsStore.setState((state) => ({
        userPolls: state.userPolls.filter((p) => p.id !== selectedPoll.id),
      }));
      deleteConfirmModalRef.current?.close();
      menuModalRef.current?.close();
    } catch (err) {
      console.error('Delete poll error:', err);
    }
  };

  const handleSaveToggles = async () => {
    try {
      const payload = { allowComments: tempAllowComments, isPrivate: tempIsPrivate };
      const result = await updatePoll(token, selectedPoll.id, payload);
      if (result.poll) {
        updateUserPollInStore(selectedPoll.id, {
          allowComments: result.poll.allowComments,
          isPrivate: result.poll.isPrivate,
        });
      }
      editModalRef.current?.close();
      menuModalRef.current?.close();
    } catch (err) {
      console.error('Failed to update toggles:', err);
    }
  };

  const handleSaveFullEdit = async () => {
    try {
      const trimmedQuestion = tempQuestion.trim();
      const validOptions = tempOptions
        .map((txt, idx) => ({
          optionText: txt.trim(),
          sortOrder: idx,
        }))
        .filter((o) => o.optionText !== '');

      const payload = {
        question: trimmedQuestion,
        options: validOptions,
        allowComments: tempAllowComments,
        isPrivate: tempIsPrivate,
      };
      const result = await updatePoll(token, selectedPoll.id, payload);
      if (result.poll && Array.isArray(result.poll.options)) {
        updateUserPollInStore(selectedPoll.id, {
          question: result.poll.question,
          allowComments: result.poll.allowComments,
          isPrivate: result.poll.isPrivate,
          options: result.poll.options.map((o) => ({
            ...o,
            text: o.optionText,
          })),
        });
      }
      fullEditModalRef.current?.close();
      menuModalRef.current?.close();
    } catch (err) {
      console.error('Failed to fully edit poll:', err);
    }
  };

  // Render tab content
  const renderTabContent = () => {
    if (loading) {
      return (
        <ActivityIndicator
          style={{ marginTop: 20 }}
          color={colors.primary}
          size="large"
        />
      );
    }
    if (error) {
      return <Text style={{ color: 'red', marginTop: 20 }}>{error}</Text>;
    }

    if (selectedTab === TABS.POLLS) {
      return (
        <FlatList
          data={userPolls}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <PollCard poll={item} onVote={handleVote} onOpenMenu={handleOpenMenu} />
          )}
          contentContainerStyle={{ paddingBottom: 16 }}
        />
      );
    } else if (selectedTab === TABS.COMMENTS) {
      return (
        <FlatList
          data={commentsGroupedByPoll}
          keyExtractor={(item) => item.pollId.toString()}
          renderItem={({ item }) => (
            <CommentCard poll={item.poll} userComments={item.userComments} />
          )}
          contentContainerStyle={{ paddingBottom: 16 }}
        />
      );
    } else if (selectedTab === TABS.VOTES) {
      return (
        <FlatList
          data={votes}
          keyExtractor={(item, idx) => String(idx)}
          renderItem={({ item }) => (
            <View style={styles.commentContainer}>
              <Text style={styles.commentText}>
                Voted pollId: {item.pollId}
              </Text>
              <Text style={styles.commentText}>
                optionId: {item.pollOptionId}
              </Text>
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 16 }}
        />
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      {/* 
        Updated arrangement:
        - Profile pic 100x100 at top-left
        - Edit Profile button on the right side, center-aligned with the bottom of the pic
        - Username below pic, summary below that
        - Stats row at bottom of this header, above tabs
      */}
      <View style={styles.profileHeader}>
        <View style={styles.picContainer}>
          <Image
            source={{ uri: user.profilePicture || 'https://picsum.photos/200/200' }}
            style={styles.profileImage}
          />
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.username}>@{user.username}</Text>
        <Text style={styles.summaryText}>
          {user.personalSummary || 'No personal summary yet.'}
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Polls</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Total Votes</Text>
          </View>
        </View>
      </View>

      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            selectedTab === TABS.POLLS && styles.activeTabButton,
          ]}
          onPress={() => handleTabPress(TABS.POLLS)}
        >
          <Text
            style={[
              styles.tabButtonText,
              selectedTab === TABS.POLLS && styles.activeTabButtonText,
            ]}
          >
            Polls
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            selectedTab === TABS.COMMENTS && styles.activeTabButton,
          ]}
          onPress={() => handleTabPress(TABS.COMMENTS)}
        >
          <Text
            style={[
              styles.tabButtonText,
              selectedTab === TABS.COMMENTS && styles.activeTabButtonText,
            ]}
          >
            Comments
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            selectedTab === TABS.VOTES && styles.activeTabButton,
          ]}
          onPress={() => handleTabPress(TABS.VOTES)}
        >
          <Text
            style={[
              styles.tabButtonText,
              selectedTab === TABS.VOTES && styles.activeTabButtonText,
            ]}
          >
            Votes
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabContent}>{renderTabContent()}</View>

      {/* ======== The same modals from your existing code ======== */}
      <Modalize
        ref={menuModalRef}
        withReactModal
        coverScreen
        adjustToContentHeight
        modalStyle={{ backgroundColor: colors.dark }}
        handleStyle={{ backgroundColor: '#888' }}
      >
        <View style={styles.menuModalContent}>
          <TouchableOpacity style={styles.menuRow} onPress={() => handleMenuOption('edit')}>
            <Text style={styles.menuRowText}>Edit Poll</Text>
            <Settings width={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuRow} onPress={() => handleMenuOption('interaction')}>
            <Text style={styles.menuRowText}>Edit Interaction Settings</Text>
            <Settings width={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuRow} onPress={() => handleMenuOption('delete')}>
            <Text style={styles.menuRowText}>Delete Poll</Text>
            <Trash2 width={20} color="#ccc" />
          </TouchableOpacity>
        </View>
      </Modalize>

      <Modalize
        ref={editModalRef}
        withReactModal
        coverScreen
        adjustToContentHeight
        modalStyle={{ backgroundColor: colors.dark }}
        handleStyle={{ backgroundColor: '#888' }}
      >
        <View style={styles.editModalContent}>
          <Text style={styles.editTitle}>Edit Interaction Settings</Text>
          <Text style={{ color: '#fff', marginBottom: 10 }}>
            Allow Comments? {tempAllowComments ? 'Yes' : 'No'}
          </Text>
          <Text style={{ color: '#fff', marginBottom: 10 }}>
            Private Poll? {tempIsPrivate ? 'Yes' : 'No'}
          </Text>

          <TouchableOpacity style={styles.saveButton} onPress={handleSaveToggles}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </Modalize>

      <Modalize
        ref={fullEditModalRef}
        withReactModal
        coverScreen
        adjustToContentHeight
        modalStyle={{ backgroundColor: colors.dark }}
        handleStyle={{ backgroundColor: '#888' }}
      >
        <View style={styles.editModalContent}>
          <Text style={styles.editTitle}>Edit Poll (Full)</Text>
          <TouchableOpacity style={styles.saveButton} onPress={handleSaveFullEdit}>
            <Text style={styles.saveButtonText}>Save Poll</Text>
          </TouchableOpacity>
        </View>
      </Modalize>

      <Modalize
        ref={deleteConfirmModalRef}
        withReactModal
        coverScreen
        adjustToContentHeight
        modalStyle={{ backgroundColor: colors.dark }}
        handleStyle={{ backgroundColor: '#888' }}
      >
        <View style={styles.deleteConfirmContent}>
          <Text style={styles.deleteTitle}>Delete this poll?</Text>
          <Text style={styles.deleteSubtitle}>
            If you delete this poll, you won't be able to recover it.
          </Text>

          <TouchableOpacity style={styles.deleteConfirmButton} onPress={confirmDeletePoll}>
            <Text style={styles.deleteConfirmButtonText}>Delete Poll</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => deleteConfirmModalRef.current?.close()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modalize>
    </View>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.appBackground || '#fff',
  },
  profileHeader: {
    backgroundColor: colors.dark,
    paddingTop: 60,
    paddingBottom: 10,
    paddingHorizontal: 16,
  },
  picContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  // Now the button is on the right side, bottom of the pic
  editButton: {
    position: 'absolute',
    right: 0,
    bottom: 0, // Adjust as needed for perfect alignment
    backgroundColor: '#21D0B2',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#21D0B2',
  },
  editButtonText: {
    color: colors.dark,
    fontSize: 14,
    fontWeight: '600',
  },

  username: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.light,
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 14,
    color: colors.light,
    marginBottom: 12,
    marginTop: 2,
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.light,
  },
  statLabel: {
    fontSize: 12,
    color: '#ccc',
  },

  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabButtonText: {
    color: colors.dark,
    fontSize: 16,
    fontWeight: '500',
  },
  activeTabButton: {
    borderBottomWidth: 3,
    borderBottomColor: colors.primary,
  },
  activeTabButtonText: {
    color: colors.primary,
    fontWeight: '700',
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },

  commentContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
  },
  commentText: {
    color: colors.dark,
    fontSize: 14,
    marginBottom: 2,
  },

  menuModalContent: {
    padding: 25,
  },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a3d52',
    backgroundColor: '#2a3d52',
    paddingHorizontal: 28,
    paddingVertical: 14,
    marginVertical: 6,
    borderRadius: 25,
  },
  menuRowText: {
    color: colors.light,
    fontSize: 16,
  },

  editModalContent: {
    padding: 25,
  },
  editTitle: {
    fontSize: 18,
    color: colors.light,
    marginBottom: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#21D0B2',
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: colors.dark,
    fontSize: 16,
    fontWeight: '600',
  },

  deleteConfirmContent: {
    padding: 25,
  },
  deleteTitle: {
    fontSize: 18,
    color: colors.light,
    fontWeight: '700',
    marginBottom: 14,
  },
  deleteSubtitle: {
    fontSize: 14,
    color: colors.light,
    marginBottom: 20,
    lineHeight: 20,
  },
  deleteConfirmButton: {
    backgroundColor: 'red',
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  deleteConfirmButtonText: {
    color: colors.light,
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    borderWidth: 1,
    backgroundColor: '#2a3d52',
    borderColor: '#2a3d52',
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  cancelButtonText: {
    color: colors.light,
    fontSize: 16,
    fontWeight: '500',
  },
});
