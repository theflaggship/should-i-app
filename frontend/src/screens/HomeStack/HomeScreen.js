// HomeScreen.js
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
} from 'react-native';
import { Modalize } from 'react-native-modalize';
import { Settings, Trash2 } from 'react-native-feather'; // Icons for the rows
import { AuthContext } from '../../context/AuthContext';
import { usePollsStore } from '../../store/usePollsStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PollCard from '../../components/PollCard';
import colors from '../../styles/colors';
import { deletePoll } from '../../services/pollService'; // if you have a deletePoll function

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

const HomeScreen = () => {
  const { user, token } = useContext(AuthContext);
  const polls = usePollsStore((state) => state.polls);
  const loading = usePollsStore((state) => state.loading);
  const error = usePollsStore((state) => state.error);

  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;

  // For the bottom drawer menu (the ellipsis menu)
  const menuModalRef = useRef(null);
  // For the Edit Interaction Settings drawer
  const editModalRef = useRef(null);
  // For the Delete Poll confirmation drawer
  const deleteConfirmModalRef = useRef(null);

  // The poll we tapped on
  const [selectedPoll, setSelectedPoll] = useState(null);

  // Toggles for "Edit Interaction Settings"
  const [tempAllowComments, setTempAllowComments] = useState(false);
  const [tempIsPrivate, setTempIsPrivate] = useState(false);

  // --------------------------------------------------------------------------
  // OLD: We tried nextModal + onClose approach. We'll keep it, but comment it out
  // so you can see it. We now use setTimeout approach below.
  // const [nextModal, setNextModal] = useState(null);

  // const onMenuModalClose = () => {
  //   if (nextModal === 'edit') {
  //     editModalRef.current?.open();
  //   } else if (nextModal === 'delete') {
  //     deleteConfirmModalRef.current?.open();
  //   }
  //   setNextModal(null);
  // };
  // --------------------------------------------------------------------------

  // Animate the navbar
  const navbarTranslate = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, -35],
    extrapolate: 'clamp',
  });

  // Show the main menu with the chosen poll
  const handleOpenMenu = (poll) => {
    setSelectedPoll(poll);
    // Preload toggles from poll if needed
    setTempAllowComments(poll.allowComments);
    setTempIsPrivate(poll.isPrivate);
    // setNextModal(null); // old approach
    menuModalRef.current?.open();
  };

  // Confirm delete poll
  const confirmDeletePoll = async () => {
    try {
      await deletePoll(token, selectedPoll.id);
      usePollsStore.getState().removePoll(selectedPoll.id);
      deleteConfirmModalRef.current?.close();
      menuModalRef.current?.close();
    } catch (err) {
      console.error('Failed to delete poll:', err);
    }
  };

  // Save toggles
  const handleSaveToggles = () => {
    // Example: update poll in DB or store with new toggles
    // e.g. updatePoll(token, selectedPoll.id, { allowComments: tempAllowComments, isPrivate: tempIsPrivate });
    editModalRef.current?.close();
    menuModalRef.current?.close();
  };

  // --------------------------------------------------------------------------
  // NEW: Instead of setting nextModal + onClose, we do a setTimeout approach.
  // So the main menu closes fully before opening the second modal.
  const handleMenuOption = (option) => {
    // 1) Close main menu
    menuModalRef.current?.close();

    // 2) Wait a bit, then open the next modal
    setTimeout(() => {
      if (option === 'edit') {
        editModalRef.current?.open();
      } else if (option === 'delete') {
        deleteConfirmModalRef.current?.open();
      }
    }, 300); // 300ms to allow main menu to finish closing
  };
  // --------------------------------------------------------------------------

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

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
      <Animated.View style={[styles.navbar, { transform: [{ translateY: navbarTranslate }] }]}>
        <Text style={styles.navTitle}>Should I?</Text>
      </Animated.View>

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
            <PollCard
              poll={item}
              onOpenMenu={handleOpenMenu}
            />
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 16 }}
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
        adjustToContentHeight
        modalStyle={{ backgroundColor: colors.dark }}
        handleStyle={{ backgroundColor: '#888' }}
        // onClose={onMenuModalClose} // <-- old approach (commented out)
      >
        <View style={styles.menuModalContent}>
          {/* Row 1: Edit Interaction Settings */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => handleMenuOption('edit')} // use setTimeout approach
          >
            <Text style={styles.menuRowText}>Edit Interaction Settings</Text>
            <Settings width={20} color="#ccc" />
          </TouchableOpacity>

          {/* Row 2: Delete Poll */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => handleMenuOption('delete')}
          >
            <Text style={styles.menuRowText}>Delete Poll</Text>
            <Trash2 width={20} color="#ccc" />
          </TouchableOpacity>
        </View>
      </Modalize>

      {/* Edit Interaction Settings drawer */}
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

          {/* Toggles for comments + private */}
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
        </View>
      </Modalize>

      {/* Delete Poll Confirmation drawer */}
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

// ----------------------------------------
// --------------- STYLES ----------------
// ----------------------------------------
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
    color: '#fff',
    marginTop: 30,
  },
  pollCardContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  firstPollCardContainer: {
    marginTop: 118, // enough space below the navbar
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

  // The main menu content
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

  deleteButton: {
    backgroundColor: '#21D0B2',
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 24,
    width: 80,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },

  // The edit settings content
  editModalContent: {
    padding: 25,
  },
  editTitle: {
    fontSize: 18,
    color: '#fff',
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
    color: '#fff',
  },
  saveButton: {
    backgroundColor: '#21D0B2',
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  saveButtonText: {
    color: colors.dark,
    fontSize: 16,
    fontWeight: '600',
  },

  // The delete confirm content
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
    backgroundColor: colors.red,
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  deleteConfirmButtonText: {
    color: '#fff',
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
});
