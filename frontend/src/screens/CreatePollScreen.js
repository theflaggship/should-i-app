// CreatePollScreen.js
import React, { useRef, useState, useContext, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Switch, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Modalize } from 'react-native-modalize';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { usePollsStore } from '../store/usePollsStore';
import { createPoll } from '../services/pollService'; // YOU must implement createPoll
import colors from '../styles/colors';

const CreatePollScreen = () => {
  const navigation = useNavigation();
  const { user, token } = useContext(AuthContext);
  const modalRef = useRef(null);

  // Global store function to add a new poll
  const addPollToStore = usePollsStore((state) => state.addPollToStore);

  // Form states
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']); // start with 2 empty options
  const [isPrivate, setIsPrivate] = useState(false);
  const [allowComments, setAllowComments] = useState(true);

  // 1) As soon as this screen mounts, open the modal
  useEffect(() => {
    // Slight delay helps avoid layout glitches on some devices
    setTimeout(() => {
      modalRef.current?.open();
    }, 200);
  }, []);

  // 2) If user swipes down or taps outside to close the modal,
  //    navigate back so they're not stuck on a blank screen
  const handleModalClose = () => {
    navigation.goBack();
  };

  // Add a new option input (up to 4)
  const addOptionField = () => {
    if (options.length < 4) {
      setOptions([...options, '']);
    }
  };

  // Update an option’s text
  const updateOption = (text, index) => {
    const newArr = [...options];
    newArr[index] = text;
    setOptions(newArr);
  };

  // Reset the form after creating or canceling
  const resetForm = () => {
    setQuestion('');
    setOptions(['', '']);
    setIsPrivate(false);
    setAllowComments(true);
  };

  // Submit the poll
  const handleCreatePoll = async () => {
    // Validation: question required, at least 2 non-empty options
    const trimmedQuestion = question.trim();
    const validOptions = options.filter((opt) => opt.trim() !== '');

    if (!trimmedQuestion) {
      alert('Please enter a question.');
      return;
    }
    if (validOptions.length < 2) {
      alert('Please provide at least 2 options.');
      return;
    }

    // Construct payload
    const payload = {
      question: trimmedQuestion,
      options: validOptions,
      isPrivate,
      allowComments,
    };

    try {
      // Call your API to create the poll in the database
      const newPoll = await createPoll(token, payload);

      // Insert new poll into the global store so Home can see it
      addPollToStore(newPoll);

      // Close the modal and reset form
      modalRef.current?.close();
      resetForm();
    } catch (err) {
      console.error('Create poll error:', err);
      alert('Failed to create poll: ' + (err.message || 'Unknown error'));
    }
  };

  // 3) We don’t show anything in the background SafeAreaView (or you can show a logo, etc.)
  return (
    <SafeAreaView style={styles.container}>
      <Modalize
        ref={modalRef}
        adjustToContentHeight
        onClose={handleModalClose}  // <--- important
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Create a Poll</Text>

          {/* Question Input */}
          <TextInput
            style={styles.input}
            placeholder="Poll question..."
            value={question}
            onChangeText={setQuestion}
          />

          {/* Dynamic Option Inputs */}
          {options.map((opt, idx) => (
            <TextInput
              key={`option-${idx}`}
              style={styles.input}
              placeholder={`Option ${idx + 1}`}
              value={opt}
              onChangeText={(text) => updateOption(text, idx)}
            />
          ))}

          {/* Add Option Button (only if under 4) */}
          {options.length < 4 && (
            <TouchableOpacity style={styles.addOptionButton} onPress={addOptionField}>
              <Text style={styles.addOptionText}>+ Add another option</Text>
            </TouchableOpacity>
          )}

          {/* Toggles */}
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Private Poll?</Text>
            <Switch
              value={isPrivate}
              onValueChange={setIsPrivate}
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Allow Comments?</Text>
            <Switch
              value={allowComments}
              onValueChange={setAllowComments}
            />
          </View>

          {/* Submit / Cancel */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                modalRef.current?.close();
                resetForm();
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.createButton} onPress={handleCreatePoll}>
              <Text style={styles.createButtonText}>Create</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modalize>
    </SafeAreaView>
  );
};

export default CreatePollScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // optional background color or branding
    backgroundColor: '#fff',
  },
  modalContent: {
    padding: 16,
    backgroundColor: '#fff',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 8,
    marginBottom: 10,
  },
  addOptionButton: {
    marginVertical: 8,
    alignItems: 'center',
  },
  addOptionText: {
    color: colors.primary || '#21D0B2',
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  switchLabel: {
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  cancelButton: {
    backgroundColor: '#ccc',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: '600',
  },
  createButton: {
    backgroundColor: colors.primary || '#21D0B2',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
