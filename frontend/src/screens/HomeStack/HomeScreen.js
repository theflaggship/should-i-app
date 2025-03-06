import React, { useRef, useContext, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Switch,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  RefreshControl, // <-- ADDED
} from 'react-native';
import { Modalize } from 'react-native-modalize';
import { Settings, Trash2, MinusCircle } from 'react-native-feather';
import { AuthContext } from '../../context/AuthContext';
import { usePollsStore } from '../../store/usePollsStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PollCard from '../../components/PollCard';
import colors from '../../styles/colors';
import { deletePoll, updatePoll } from '../../services/pollService';

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);
const { height } = Dimensions.get('window');

const HomeScreen = () => {
  const { user, token } = useContext(AuthContext);
  const polls = usePollsStore((state) => state.polls);
  const loading = usePollsStore((state) => state.loading);
  const error = usePollsStore((state) => state.error);

  const fetchAllPolls = usePollsStore((state) => state.fetchAllPolls); // <-- to refresh
  const removePoll = usePollsStore((state) => state.removePoll);

  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;

  // For the bottom drawer menu (the ellipsis menu)
  const menuModalRef = useRef(null);
  // For the Edit Interaction Settings drawer (toggles only)
  const editModalRef = useRef(null);
  // For the Delete Poll confirmation drawer
  const deleteConfirmModalRef = useRef(null);
  // For a full "Edit Poll" drawer (question, options, toggles)
  const fullEditModalRef = useRef(null);

  // The poll we tapped on
  const [selectedPoll, setSelectedPoll] = useState(null);

  // Toggles for "Edit Interaction Settings"
  const [tempAllowComments, setTempAllowComments] = useState(false);
  const [tempIsPrivate, setTempIsPrivate] = useState(false);

  // For "Edit Poll" scenario
  const [tempQuestion, setTempQuestion] = useState('');
  const [tempOptions, setTempOptions] = useState([]);

  // For pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);

  // Animate the navbar
  const navbarTranslate = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, -50],
    extrapolate: 'clamp',
  });

  // Pull-to-refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchAllPolls(token); // re-fetch polls
    } catch (err) {
      console.error('Refresh error:', err);
    } finally {
      setRefreshing(false);
    }
  };

  // Show the main menu with the chosen poll
  const handleOpenMenu = (poll) => {
    setSelectedPoll(poll);
    setTempAllowComments(poll.allowComments);
    setTempIsPrivate(poll.isPrivate);
    setTempQuestion(poll.question || '');
    const optionTexts = (poll.options || []).map((opt) => opt.text || '');
    setTempOptions(optionTexts);
    menuModalRef.current?.open();
  };

  // Compute total votes
  const getTotalVotes = (poll) => {
    if (!poll || !poll.options) return 0;
    return poll.options.reduce((sum, opt) => sum + (opt.votes || 0), 0);
  };

  // Confirm delete poll
  const confirmDeletePoll = async () => {
    try {
      await deletePoll(token, selectedPoll.id);
      removePoll(selectedPoll.id);
      deleteConfirmModalRef.current?.close();
      menuModalRef.current?.close();
    } catch (err) {
      console.error('Failed to delete poll:', err);
    }
  };

  // Save toggles only
  const handleSaveToggles = async () => {
    try {
      const payload = { allowComments: tempAllowComments, isPrivate: tempIsPrivate };
      const result = await updatePoll(token, selectedPoll.id, payload);
      if (result.poll) {
        usePollsStore.getState().updatePollInStore(selectedPoll.id, {
          question: result.poll.question,
          allowComments: result.poll.allowComments,
          isPrivate: result.poll.isPrivate,
          options: result.poll.options.map((o) => ({
            ...o,
            text: o.optionText,
          })),
        });
      }
      editModalRef.current?.close();
      menuModalRef.current?.close();
    } catch (err) {
      console.error('Failed to update poll toggles:', err);
      alert('Could not update poll settings. Please try again.');
    }
  };

  // FULL EDIT LOGIC
  const addOptionField = () => {
    if (tempOptions.length < 4) {
      setTempOptions([...tempOptions, '']);
    }
  };
  const removeOptionField = (index) => {
    const updated = tempOptions.filter((_, i) => i !== index);
    setTempOptions(updated);
  };
  const updateOptionField = (text, index) => {
    const updated = [...tempOptions];
    updated[index] = text;
    setTempOptions(updated);
  };

  const handleSaveFullEdit = async () => {
    try {
      const trimmedQuestion = tempQuestion.trim();
      const validOptions = tempOptions
        .map((txt, idx) => ({
          optionText: txt.trim(),
          sortOrder: idx,
        }))
        .filter((opt) => opt.optionText !== '');

      const payload = {
        question: trimmedQuestion,
        options: validOptions,
        allowComments: tempAllowComments,
        isPrivate: tempIsPrivate,
      };

      const result = await updatePoll(token, selectedPoll.id, payload);

      if (result.poll && Array.isArray(result.poll.options)) {
        usePollsStore.getState().updatePollInStore(selectedPoll.id, {
          question: result.poll.question,
          allowComments: result.poll.allowComments,
          isPrivate: result.poll.isPrivate,
          options: result.poll.options.map((o) => ({
            ...o,
            text: o.optionText,
          })),
        });
      } else {
        console.warn('No poll or poll.options returned, or not an array');
      }

      fullEditModalRef.current?.close();
      menuModalRef.current?.close();
    } catch (err) {
      console.error('Failed to fully edit poll:', err);
      alert('Could not update the poll. Please try again.');
    }
  };

  const handleMenuOption = (option) => {
    menuModalRef.current?.close();
    setTimeout(() => {
      if (option === 'delete') {
        deleteConfirmModalRef.current?.open();
        return;
      }
      if (option === 'edit') {
        const total = getTotalVotes(selectedPoll);
        if (total === 0) {
          fullEditModalRef.current?.open();
        } else {
          editModalRef.current?.open();
        }
      }
    }, 300);
  };

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Animated Navbar */}
      <Animated.View
        style={[styles.navbar, { transform: [{ translateY: navbarTranslate }] }]}
      >
        <Text style={styles.navTitle}>Whicha</Text>
      </Animated.View>

      {loading && polls.length === 0 && (
        <ActivityIndicator style={{ marginVertical: 20 }} color={colors.primary} />
      )}

      <AnimatedFlatList
        data={polls}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item, index }) => (
          <View
            style={
              index === 0
                ? styles.firstPollCardContainer
                : styles.pollCardContainer
            }
          >
            <PollCard poll={item} onOpenMenu={handleOpenMenu} />
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 16 }}
        // ADDED RefreshControl for pull-to-refresh
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary} // iOS spinner color
            colors={[colors.primary]} 
            progressViewOffset={110}  // Android spinner color
          />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      />

      {/* The main menu bottom drawer */}
      <Modalize
        ref={menuModalRef}
        withReactModal
        coverScreen
        snapPoint={height * 0.25}
        modalStyle={{ backgroundColor: colors.dark }}
        handleStyle={{ backgroundColor: '#888' }}
      >
        <View style={styles.menuModalContent}>
          {getTotalVotes(selectedPoll) === 0 && (
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => handleMenuOption('edit')}
            >
              <Text style={styles.menuRowText}>Edit Poll</Text>
              <Settings width={20} color="#ccc" />
            </TouchableOpacity>
          )}

          {getTotalVotes(selectedPoll) > 0 && (
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => handleMenuOption('edit')}
            >
              <Text style={styles.menuRowText}>Edit Interaction Settings</Text>
              <Settings width={20} color="#ccc" />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => handleMenuOption('delete')}
          >
            <Text style={styles.menuRowText}>Delete Poll</Text>
            <Trash2 width={20} color="#ccc" />
          </TouchableOpacity>
        </View>
      </Modalize>

      {/* Edit Interaction Settings drawer (toggles only) */}
      <Modalize
        ref={editModalRef}
        withReactModal
        coverScreen
        snapPoint={height * 0.42}
        modalStyle={{ backgroundColor: colors.dark }}
        handleStyle={{ backgroundColor: '#888' }}
      >
        <View style={styles.editModalContent}>
          <Text style={styles.editTitle}>Edit Interaction Settings</Text>

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Allow Comments?</Text>
            <Switch
              value={tempAllowComments}
              onValueChange={setTempAllowComments}
              trackColor={{ false: '#666', true: '#21D0B2' }}
              thumbColor="#dbe4ed"
            />
          </View>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Private Poll?</Text>
            <Switch
              value={tempIsPrivate}
              onValueChange={setTempIsPrivate}
              trackColor={{ false: '#666', true: '#21D0B2' }}
              thumbColor="#dbe4ed"
            />
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSaveToggles}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => editModalRef.current?.close()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modalize>

      {/* Full Edit Poll drawer (question, dynamic options, toggles) */}
      <Modalize
        snapPoint={height * 0.85}
        modalHeight={height * 0.93}
        closeOnOverlayTap={false}
        ref={fullEditModalRef}
        withReactModal
        coverScreen
        modalStyle={{ backgroundColor: colors.dark }}
        handleStyle={{ backgroundColor: '#888' }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={30}
        >
          <View style={styles.editButtonRow}>
            <Text
              style={styles.editCancelText}
              onPress={() => fullEditModalRef.current?.close()}
            >
              Cancel
            </Text>
            <View style={styles.editSaveButton}>
              <Text style={styles.editSaveText} onPress={handleSaveFullEdit}>
                Save Poll
              </Text>
            </View>
          </View>

          <View style={styles.fullEditContent}>
            <TextInput
              style={styles.editInput}
              value={tempQuestion}
              onChangeText={setTempQuestion}
              placeholder="What should I ask?"
              placeholderTextColor="#999"
              multiline
            />

            {tempOptions.map((opt, idx) => (
              <View style={styles.optionContainer} key={`editOption-${idx}`}>
                <TextInput
                  style={styles.optionInput}
                  placeholder={`Option ${idx + 1}`}
                  placeholderTextColor="#999"
                  value={opt}
                  onChangeText={(txt) => updateOptionField(txt, idx)}
                />
                {idx >= 2 && (
                  <TouchableOpacity
                    style={styles.minusButton}
                    onPress={() => removeOptionField(idx)}
                  >
                    <MinusCircle color="#8fa0b5" width={18} height={18} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
            {tempOptions.length < 4 && (
              <TouchableOpacity style={styles.addOptionButton} onPress={addOptionField}>
                <Text style={styles.addOptionText}>+ Add another option</Text>
              </TouchableOpacity>
            )}

            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Allow Comments?</Text>
              <Switch
                value={tempAllowComments}
                onValueChange={setTempAllowComments}
                trackColor={{ false: '#666', true: '#21D0B2' }}
                thumbColor="#dbe4ed"
              />
            </View>
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Private Poll?</Text>
              <Switch
                value={tempIsPrivate}
                onValueChange={setTempIsPrivate}
                trackColor={{ false: '#666', true: '#21D0B2' }}
                thumbColor="#dbe4ed"
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modalize>

      <Modalize
        ref={deleteConfirmModalRef}
        withReactModal
        coverScreen
        snapPoint={height * 0.35}
        modalStyle={{ backgroundColor: colors.dark }}
        handleStyle={{ backgroundColor: '#888' }}
      >
        <View style={styles.deleteConfirmContent}>
          <Text style={styles.deleteTitle}>Delete this poll?</Text>
          <Text style={styles.deleteSubtitle}>
            If you delete this poll, you won't be able to recover it and will lose your votes.
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

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.appBackground || '#fff',
  },
  navbar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: colors.dark || '#333',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    elevation: 4,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
  },
  navTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.light,
    marginTop: 30,
  },
  pollCardContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  firstPollCardContainer: {
    marginTop: 118,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
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
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  toggleLabel: {
    fontSize: 16,
    color: colors.light,
  },
  saveButton: {
    backgroundColor: '#21D0B2',
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: colors.dark,
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
    marginBottom: 8,
  },
  cancelButtonText: {
    color: colors.light,
    fontSize: 16,
    fontWeight: '500',
  },
  editButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    marginVertical: 20,
    paddingBottom: 8,
    paddingHorizontal: 16,
  },
  editCancelText: {
    color: colors.light,
    fontSize: 16,
    position: 'absolute',
    left: 16,
  },
  editSaveButton: {
    backgroundColor: '#21D0B2',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 20,
    position: 'absolute',
    right: 16,
  },
  editSaveText: {
    color: colors.dark,
    fontSize: 16,
    fontWeight: '500',
  },
  fullEditContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  editInput: {
    backgroundColor: '#2a3d52',
    borderRadius: 8,
    fontSize: 16,
    padding: 25,
    color: colors.light,
    marginTop: 15,
    marginBottom: 20,
    textAlignVertical: 'top',
  },
  optionContainer: {
    position: 'relative',
    marginBottom: 10,
    width: '100%',
  },
  optionInput: {
    borderWidth: 1,
    borderColor: '#2a3d52',
    backgroundColor: '#2a3d52',
    borderRadius: 20,
    paddingVertical: 12,
    paddingLeft: 24,
    paddingRight: 40,
    color: colors.light,
    marginVertical: 1,
  },
  minusButton: {
    position: 'absolute',
    top: 14,
    right: 14,
  },
  addOptionButton: {
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  addOptionText: {
    color: '#21D0B2',
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
    textAlign: 'left',
    lineHeight: 20,
  },
  deleteConfirmButton: {
    backgroundColor: colors.red || 'red',
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
});

