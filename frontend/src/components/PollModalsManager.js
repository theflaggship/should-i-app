import React, {
    forwardRef,
    useRef,
    useImperativeHandle,
    useState,
  } from 'react';
  import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    Switch,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
    StyleSheet,
  } from 'react-native';
  import { Modalize } from 'react-native-modalize';
  import { Settings, Trash2, MinusCircle } from 'react-native-feather';
  import { useUserStatsStore } from '../store/useUserStatsStore';
  import colors from '../styles/colors';
  
  // For dynamic snapPoints
  const { height } = Dimensions.get('window');
  
  /**
   * PollModalsManager is a single manager component that includes:
   * - Main menu (Edit Poll / Edit Interaction Settings / Delete Poll)
   * - Edit Interaction Settings (toggles only)
   * - Full Edit Poll (question, dynamic options, toggles)
   * - Delete Confirm
   *
   * Usage in any screen:
   *  1) import PollModalsManager from '...'
   *  2) const pollModalsRef = useRef(null);
   *  3) <PollModalsManager ref={pollModalsRef} onDeletePoll={...} onSavePoll={...} />
   *  4) When user taps "ellipsis" or similar: pollModalsRef.current?.openMenu(poll);
   *
   * The parent screen handles the actual API calls in onDeletePoll / onSavePoll.
   */
  
  const PollModalsManager = forwardRef(
    ({ onDeletePoll, onSavePoll }, ref) => {
      // ──────────────────────────────────────────────────────────────────────────
      // Modal references
      // ──────────────────────────────────────────────────────────────────────────
      const menuModalRef = useRef(null);
      const editModalRef = useRef(null);
      const fullEditModalRef = useRef(null);
      const deleteConfirmModalRef = useRef(null);
  
      // ──────────────────────────────────────────────────────────────────────────
      // Local state for the selected poll and temporary edit fields
      // ──────────────────────────────────────────────────────────────────────────
      const [poll, setPoll] = useState(null);
  
      // Toggles for "Edit Interaction Settings"
      const [tempAllowComments, setTempAllowComments] = useState(false);
      const [tempIsPrivate, setTempIsPrivate] = useState(false);
  
      // For "Full Edit" scenario
      const [tempQuestion, setTempQuestion] = useState('');
      const [tempOptions, setTempOptions] = useState([]);
  
      // ──────────────────────────────────────────────────────────────────────────
      // Expose methods to parent via ref
      // ──────────────────────────────────────────────────────────────────────────
      useImperativeHandle(ref, () => ({
        openMenu: (selectedPoll) => {
          if (!selectedPoll) return;
          setPoll(selectedPoll);
          // Initialize local states
          setTempAllowComments(selectedPoll.allowComments);
          setTempIsPrivate(selectedPoll.isPrivate);
          setTempQuestion(selectedPoll.question || '');
          const optionTexts = (selectedPoll.options || []).map((opt) => opt.text || '');
          setTempOptions(optionTexts);
  
          menuModalRef.current?.open();
        },
      }));
  
      // ──────────────────────────────────────────────────────────────────────────
      // Helper: total votes for a poll
      // ──────────────────────────────────────────────────────────────────────────
      const getTotalVotes = (somePoll) => {
        if (!somePoll?.options) return 0;
        return somePoll.options.reduce((sum, opt) => sum + (opt.votes || 0), 0);
      };
  
      // ──────────────────────────────────────────────────────────────────────────
      // MENU logic: user chooses "edit" or "delete"
      // ──────────────────────────────────────────────────────────────────────────
      const handleMenuOption = (option) => {
        menuModalRef.current?.close();
        setTimeout(() => {
          if (option === 'delete') {
            deleteConfirmModalRef.current?.open();
            return;
          }
          if (option === 'edit') {
            const total = getTotalVotes(poll);
            if (total === 0) {
              // Full edit if 0 votes
              fullEditModalRef.current?.open();
            } else {
              // Toggles only if > 0 votes
              editModalRef.current?.open();
            }
          }
        }, 300);
      };
  
      // ──────────────────────────────────────────────────────────────────────────
      // DELETE CONFIRM
      // ──────────────────────────────────────────────────────────────────────────
      const handleConfirmDelete = () => {
        if (onDeletePoll && poll) {
          onDeletePoll(poll);
          useUserStatsStore.getState().decrementTotalPolls();
        }
        deleteConfirmModalRef.current?.close();
      };
  
      // ──────────────────────────────────────────────────────────────────────────
      // EDIT INTERACTION SETTINGS (toggles only)
      // ──────────────────────────────────────────────────────────────────────────
      const handleSaveToggles = () => {
        if (onSavePoll && poll) {
          const partialData = {
            allowComments: tempAllowComments,
            isPrivate: tempIsPrivate,
          };
          onSavePoll(poll, partialData);
        }
        editModalRef.current?.close();
      };
  
      // ──────────────────────────────────────────────────────────────────────────
      // FULL EDIT POLL (question, dynamic options, toggles)
      // ──────────────────────────────────────────────────────────────────────────
      const handleSaveFullEdit = () => {
        if (onSavePoll && poll) {
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
  
          onSavePoll(poll, payload);
        }
        fullEditModalRef.current?.close();
      };
  
      // Ability to add or remove options
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
  
      // ──────────────────────────────────────────────────────────────────────────
      // Render
      // ──────────────────────────────────────────────────────────────────────────
      return (
        <>
          {/* ─────────────────────────────────────────────────────────────────────
              1) MENU MODAL
              ──────────────────────────────────────────────────────────────────── */}
          <Modalize
            ref={menuModalRef}
            withReactModal
            coverScreen
            snapPoint={height * 0.25}
            modalStyle={{ backgroundColor: colors.dark }}
            handleStyle={{ backgroundColor: '#888' }}
          >
            <View style={styles.menuModalContent}>
              {getTotalVotes(poll) === 0 && (
                <TouchableOpacity
                  style={styles.menuRow}
                  onPress={() => handleMenuOption('edit')}
                >
                  <Text style={styles.menuRowText}>Edit Poll</Text>
                  <Settings width={20} color="#ccc" />
                </TouchableOpacity>
              )}
  
              {getTotalVotes(poll) > 0 && (
                <TouchableOpacity
                  style={styles.menuRow}
                  onPress={() => handleMenuOption('edit')}
                >
                  <Text style={styles.menuRowText}>Edit Interaction Settings</Text>
                  <Settings width={20} color={colors.light} />
                </TouchableOpacity>
              )}
  
              <TouchableOpacity
                style={styles.menuRow}
                onPress={() => handleMenuOption('delete')}
              >
                <Text style={styles.menuRowText}>Delete Poll</Text>
                <Trash2 width={20} color={colors.light} />
              </TouchableOpacity>
            </View>
          </Modalize>
  
          {/* ─────────────────────────────────────────────────────────────────────
              2) EDIT INTERACTION SETTINGS (TOGGLES ONLY)
              ──────────────────────────────────────────────────────────────────── */}
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
  
          {/* ─────────────────────────────────────────────────────────────────────
              3) FULL EDIT POLL (QUESTION, OPTIONS, TOGGLES)
              ──────────────────────────────────────────────────────────────────── */}
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
  
          {/* ─────────────────────────────────────────────────────────────────────
              4) DELETE CONFIRM MODAL
              ──────────────────────────────────────────────────────────────────── */}
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
  
              <TouchableOpacity style={styles.deleteConfirmButton} onPress={handleConfirmDelete}>
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
        </>
      );
    }
  );
  
  export default PollModalsManager;
  
  const styles = StyleSheet.create({
    // Menu Modal
    menuModalContent: {
      padding: 25,
    },
    menuRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.input,
      backgroundColor: colors.input,
      paddingHorizontal: 28,
      paddingVertical: 14,
      marginVertical: 6,
      borderRadius: 25,
      borderWidth: .5,
      borderColor: colors.light,
    },
    menuRowText: {
      fontFamily: 'Quicksand-Medium',
      color: colors.light,
      fontSize: 18,
    },
  
    // Edit Interaction Settings (toggles only)
    editModalContent: {
      padding: 25,
    },
    editTitle: {
      fontFamily: 'Quicksand-SemiBold',
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
      fontFamily: 'Quicksand-Medium',
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
      fontFamily: 'Quicksand-SemiBold',
      color: colors.dark,
      fontSize: 16,
      fontWeight: '600',
    },
    cancelButton: {
      borderWidth: .5,
      backgroundColor: colors.input,
      borderColor: colors.light,
      borderRadius: 20,
      paddingVertical: 12,
      alignItems: 'center',
      marginTop: 16,
      marginBottom: 8,
    },
    cancelButtonText: {
      fontFamily: 'Quicksand-SemiBold',
      color: colors.light,
      fontSize: 16,
      fontWeight: '500',
    },
  
    // Full Edit Poll
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
      fontFamily: 'Quicksand-Medium',
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
      fontFamily: 'Quicksand-Bold',
      color: colors.dark,
      fontSize: 16,
    },
    fullEditContent: {
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
    editInput: {
      fontFamily: 'Quicksand-Medium',
      backgroundColor: colors.input,
      borderRadius: 8,
      fontSize: 16,
      padding: 25,
      color: colors.light,
      marginTop: 15,
      marginBottom: 20,
      textAlignVertical: 'top',
      borderWidth: .5,
      borderColor: colors.light,
    },
    optionContainer: {
      position: 'relative',
      marginBottom: 10,
      width: '100%',
    },
    optionInput: {
      fontFamily: 'Quicksand-Medium',
      borderWidth: .3,
      borderColor: colors.light,
      backgroundColor: colors.input,
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
      fontFamily: 'Quicksand-Medium',
      color: '#21D0B2',
      fontWeight: '600',
    },
  
    // Delete Confirm
    deleteConfirmContent: {
      padding: 25,
    },
    deleteTitle: {
      fontFamily: 'Quicksand-SemiBold',
      fontSize: 18,
      color: colors.light,
      fontWeight: '700',
      marginBottom: 14,
    },
    deleteSubtitle: {
      fontFamily: 'Quicksand-Medium',
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
      fontFamily: 'Quicksand-SemiBold',
      color: colors.light,
      fontSize: 16,
      fontWeight: '600',
    },
  });
  