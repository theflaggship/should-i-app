// src/navigation/MainTabNavigator.js

import React, { useRef, useState, useContext } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
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
  const questionInputRef = useRef(null);

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
    const validOptions = options
      .filter((opt) => opt.trim() !== '')
      .map((opt) => ({
        optionText: opt,
        // optionImage: 'someURL' // only if you have images
      }));

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
        userId: user.id,             // If you want the client to specify user
        question: trimmedQuestion,
        options: validOptions,
        isPrivate,
        allowComments,
        isImagePoll: false, 
      };
      // Call your backend
      const response = await createPoll(token, payload);

      const pollWithTransformedOptions = {
        ...response.poll,
        options: response.poll.options?.map(opt => ({
          ...opt,
          text: opt.optionText,         // unify to "text"
        })),
        // Also unify "User" if needed, etc.
      };

      // Put new poll in store
      addPollToStore(pollWithTransformedOptions);
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
          tabBarShowLabel: false,
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
        snapPoint={height * 0.85}
        modalHeight={height * 0.93}
        closeOnOverlayTap={false} // Only close on Cancel or Ask
        handleStyle={{ backgroundColor: '#666' }}
        modalStyle={{ backgroundColor: colors.dark }}
        snapPoints={[height * 0.1, height * 0.85]}
        onClose={resetForm}
        onOpened={() => questionInputRef.current?.focus()}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={30} // adjust this if necessary
        >

          {/* BUTTON ROW: Cancel (left), Ask (right) */}
          <View style={styles.buttonRow}>
            <Text style={styles.cancelText} onPress={closeModal}>
              Cancel
            </Text>
            <View style={styles.askButton}>
              <Text style={styles.askText} onPress={handleCreatePoll}>
                Ask
              </Text>
            </View>
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
                ref={questionInputRef}
                style={styles.questionInput}
                placeholder="What should I ask?"
                placeholderTextColor="#8fa0b5"
                multiline
                numberOfLines={3}
                value={question}
                onChangeText={setQuestion}
              />
            </View>

            {/* Option inputs (with minus icon if index >= 2) */}
            {options.map((opt, idx) => (
              <View style={styles.optionContainer} key={`option-${idx}`}>
                <TextInput
                  style={styles.optionInput}
                  placeholder={`Option ${idx + 1}`}
                  placeholderTextColor="#8fa0b5"
                  value={opt}
                  onChangeText={(text) => updateOption(text, idx)}
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

            {/* +Add another option (only if < 4) */}
            {options.length < 4 && (
              <TouchableOpacity style={styles.addOptionButton} onPress={addOptionField}>
                <Text style={styles.addOptionText}>+ Add another option</Text>
              </TouchableOpacity>
            )}

            {/* Toggles */}
            <View style={styles.switchRow}>
              <Text style={styles.lightText}>Allow Comments?</Text>
              <Switch
                value={allowComments}
                onValueChange={setAllowComments}
                trackColor={{ false: '#666', true: '#21D0B2' }}
                thumbColor="#dbe4ed"
              />
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.lightText}>Private Poll?</Text>
              <Switch
                value={isPrivate}
                onValueChange={setIsPrivate}
                trackColor={{ false: '#666', true: '#21D0B2' }}
                thumbColor="#dbe4ed"
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modalize>
    </>
  );
};

export default MainTabNavigator;

// STYLES
const styles = StyleSheet.create({
  buttonRow: {
    // This row has Cancel (left), Ask (right)
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 16,
    marginTop: 16,
    paddingBottom: 8,
    paddingHorizontal: 16,
  },
  cancelText: {
    color: colors.light,
    fontSize: 16,
    position: 'absolute',
    left: 16,
  },
  askButton: {
    backgroundColor: '#21D0B2',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 20,
    position: 'absolute',
    right: 16,
  },
  askText: {
    color: colors.dark,
    fontSize: 16,
    fontWeight: '600',
  },
  formContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    marginTop: 16,
  },
  profilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: .5,
    borderColor: 'gray',
  },
  questionInput: {
    flex: 1,
    borderRadius: 6,
    padding: 8,
    color: '#fff',
    textAlignVertical: 'top',
    minHeight: 60,
    fontSize: 18,
  },
  optionContainer: {
    position: 'relative',
    marginBottom: 10,
    width: '100%',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  optionInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#2a3d52',
    backgroundColor: '#2a3d52',
    borderRadius: 6,
    padding: 8,
    paddingRight: 40, // Ensure there's room for the minus button
    color: '#fff',
  },
  minusButton: {
    position: 'absolute',
    top: 8,    // Adjust this value if needed
    right: 4,  // Adjust this value if needed
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
  lightText: {
    color: '#dbe4ed',
    fontSize: 16,
  },
});
