// src/navigation/MainTabNavigator.js

import React, { useRef, useState, useContext } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { Home, PlusCircle, User, MinusCircle } from 'react-native-feather';
import colors from '../styles/colors';

// 1) Imports for the modal, images, and UI
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import { Modalize } from 'react-native-modalize';

// 2) Auth & Store
import { AuthContext } from '../context/AuthContext';
import { usePollsStore } from '../store/usePollsStore';
import { createPoll } from '../services/pollService';

// Dummy screen so "Create" tab won't navigate away
function DummyScreen() {
  return null;
}

const Tab = createBottomTabNavigator();
const { height } = Dimensions.get('window');

const MainTabNavigator = () => {
  // References for modal
  const modalRef = useRef(null);

  // Auth & store
  const { user, token } = useContext(AuthContext);
  const addPollToStore = usePollsStore((state) => state.addPollToStore);

  // FORM STATES
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']); // Start with 2
  const [isPrivate, setIsPrivate] = useState(false);
  const [allowComments, setAllowComments] = useState(true);

  // 3) Open/close modal
  const openModal = () => {
    modalRef.current?.open();
  };
  const closeModal = () => {
    modalRef.current?.close();
    resetForm();
  };

  // Reset form fields
  const resetForm = () => {
    setQuestion('');
    setOptions(['', '']);
    setIsPrivate(false);
    setAllowComments(true);
  };

  // Add a 3rd or 4th option
  const addOptionField = () => {
    if (options.length < 4) {
      setOptions([...options, '']);
    }
  };

  // Remove the 3rd or 4th option
  const removeOptionField = (index) => {
    // Filter out the option at that index
    const updated = options.filter((_, i) => i !== index);
    setOptions(updated);
  };

  // Update text for a given option
  const updateOption = (text, index) => {
    const updated = [...options];
    updated[index] = text;
    setOptions(updated);
  };

  // Submit the new poll
  const handleCreatePoll = async () => {
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

    try {
      const payload = {
        question: trimmedQuestion,
        options: validOptions,
        isPrivate,
        allowComments,
      };
      // Call your backend
      const newPoll = await createPoll(token, payload);
      // Put new poll in store
      addPollToStore(newPoll);
      // Close modal
      closeModal();
    } catch (err) {
      alert('Failed to create poll: ' + (err.message || 'Unknown error'));
    }
  };

  return (
    <>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.dark,
          tabBarStyle: { backgroundColor: colors.background },
          tabBarIcon: ({ color, size }) => {
            if (route.name === 'Home') {
              return <Home color={color} size={size} />;
            } else if (route.name === 'Create') {
              return <PlusCircle color={color} size={size} />;
            } else if (route.name === 'Profile') {
              return <User color={color} size={size} />;
            }
          },
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />

        {/* The "Create" tab that opens a modal instead of navigating */}
        <Tab.Screen
          name="Create"
          component={DummyScreen}
          listeners={{
            tabPress: (e) => {
              e.preventDefault(); // Prevent actual navigation
              openModal();       // Instead, open the create poll modal
            },
          }}
        />

        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>

      {/* 4) The Modalize for creating a poll */}
      <Modalize
        ref={modalRef}
        // Let’s set multiple snap points: minimized at ~20% and expanded at ~80%
        snapPoint={height * 0.8}
        modalHeight={height}
        closeOnOverlayTap={false} // Only close on Cancel or Ask
        handleStyle={{ backgroundColor: '#666' }}
        modalStyle={{ backgroundColor: colors.dark }}
        snapPoints={[height * 0.2, height * 0.8]}
        onClose={resetForm}
      >
        {/* HEADER ROW: Cancel (left), Title (center), Ask (right) */}
        <View style={styles.modalHeader}>
          <Text style={styles.cancelText} onPress={closeModal}>
            Cancel
          </Text>
          <Text style={styles.modalTitle}>Ask a Question</Text>
          <Text style={styles.askText} onPress={handleCreatePoll}>
            Ask
          </Text>
        </View>

        {/* Container for the rest of the form */}
        <View style={styles.formContainer}>
          {/* Row with user pic + multiline text input */}
          <View style={styles.questionRow}>
            <Image
              source={{ uri: user?.profilePicture }}
              style={styles.profilePic}
            />
            <TextInput
              style={styles.questionInput}
              placeholder="What should I ask?"
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
              value={question}
              onChangeText={setQuestion}
            />
          </View>

          {/* Option inputs (with minus icon if index >= 2) */}
          {options.map((opt, idx) => (
            <View style={styles.optionRow} key={`option-${idx}`}>
              <TextInput
                style={styles.optionInput}
                placeholder={`Option ${idx + 1}`}
                placeholderTextColor="#999"
                value={opt}
                onChangeText={(text) => updateOption(text, idx)}
              />
              {idx >= 2 && (
                <TouchableOpacity
                  style={styles.minusButton}
                  onPress={() => removeOptionField(idx)}
                >
                  <MinusCircle color="#fff" width={24} height={24} />
                </TouchableOpacity>
              )}
            </View>
          ))}

          {/* +Add another option (only if < 4) */}
          {options.length < 4 && (
            <TouchableOpacity style={styles.addOptionButton} onPress={addOptionField}>
              <Text style={styles.addOptionText}>+ Add another option</Text>
            </TouchableOpacity>
          )}

          {/* Toggles */}
          <View style={styles.switchRow}>
            <Text style={styles.whiteText}>Private Poll?</Text>
            <Switch
              value={isPrivate}
              onValueChange={setIsPrivate}
              trackColor={{ false: '#666', true: '#999' }}
              thumbColor="#fff"
            />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.whiteText}>Allow Comments?</Text>
            <Switch
              value={allowComments}
              onValueChange={setAllowComments}
              trackColor={{ false: '#666', true: '#999' }}
              thumbColor="#fff"
            />
          </View>
        </View>
      </Modalize>
    </>
  );
};

export default MainTabNavigator;

// STYLES
const styles = StyleSheet.create({
  modalHeader: {
    // This row has Cancel (left), Title (center), Ask (right)
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 16,
    paddingBottom: 8,
    paddingHorizontal: 16,
    // So the text doesn't collide
    position: 'relative',
  },
  cancelText: {
    color: '#fff',
    fontSize: 16,
    position: 'absolute',
    left: 16,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  askText: {
    color: '#21D0B2',
    fontSize: 16,
    fontWeight: '600',
    position: 'absolute',
    right: 16,
  },
  formContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    marginTop: 8,
  },
  profilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  questionInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 6,
    padding: 8,
    color: '#fff',
    textAlignVertical: 'top',
    minHeight: 60,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  optionInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 6,
    padding: 8,
    color: '#fff',
    marginRight: 8,
  },
  minusButton: {
    padding: 4,
  },
  addOptionButton: {
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  addOptionText: {
    color: '#21D0B2',
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 6,
  },
  whiteText: {
    color: '#fff',
    fontSize: 16,
  },
});
