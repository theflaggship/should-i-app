// src/components/EditProfileModal.js

import React, {
  forwardRef,
  useImperativeHandle,
  useState,
  useRef,
  useContext
} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  StyleSheet,
  Image
} from 'react-native';
import { Modalize } from 'react-native-modalize';
import { AuthContext } from '../context/AuthContext';
import { updateUserProfile } from '../services/userService';
import { Camera } from 'react-native-feather';
import colors from '../styles/colors';

const { height } = Dimensions.get('window');

const EditProfileModal = forwardRef(({ onSaveProfile }, ref) => {
  // Refs to Modalize
  const editModalRef = useRef(null);

  // We'll pull the token from AuthContext so we can call updateUserProfile
  const { token } = useContext(AuthContext);

  // Local state for the user object
  const [user, setUser] = useState(null);

  // Local fields for editing
  const [tempDisplayName, setTempDisplayName] = useState('');
  const [tempSummary, setTempSummary] = useState('');
  const [tempProfilePicture, setTempProfilePicture] = useState('');

  // Expose a method to parent
  useImperativeHandle(ref, () => ({
    openEditProfile: (initialUser) => {
      if (!initialUser) return;
      setUser(initialUser);
      setTempDisplayName(initialUser.displayName || '');
      setTempSummary(initialUser.personalSummary || '');
      setTempProfilePicture(initialUser.profilePicture || '');
      editModalRef.current?.open();
    },
  }));

  // Handle saving
  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      // Build a payload with updated fields
      const payload = {
        displayName: tempDisplayName.trim(),
        personalSummary: tempSummary.trim(),
        // We won't change the status here, but you could add it if needed
        profilePicture: tempProfilePicture.trim(),
      };

      // Call your back-end update
      const result = await updateUserProfile(user.id, token, payload);
      // result => { message, user: updatedUser }

      // If successful, pass updated user back to parent
      if (result && result.user) {
        // The parent can update local context or store
        onSaveProfile(result.user);
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
    }

    editModalRef.current?.close();
  };

  // Cancel changes
  const handleCancel = () => {
    editModalRef.current?.close();
  };

  // Placeholder for camera button
  const handleCameraPress = () => {
    // Future implementation for uploading a new profile picture
    console.log('Camera button pressed - future feature');
  };

  return (
    <Modalize
      ref={editModalRef}
      withReactModal
      coverScreen
      snapPoint={height * 0.85}
      modalHeight={height * 0.93}
      closeOnOverlayTap={false}
      modalStyle={{ backgroundColor: colors.dark }}
      handleStyle={{ backgroundColor: '#888' }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={30}
      >
        {/* Header row: Cancel (left), Save (right) */}
        <View style={styles.headerRow}>
          <Text style={styles.cancelText} onPress={handleCancel}>
            Cancel
          </Text>
          <View style={styles.saveButtonContainer}>
            <Text style={styles.saveButtonText} onPress={handleSaveProfile}>
              Save
            </Text>
          </View>
        </View>

        {/* Main content */}
        <View style={styles.formContent}>
          {/* Profile Picture + Camera Button */}
          <View style={styles.profilePicContainer}>
            <Image
              source={{ uri: user?.profilePicture}}
              style={styles.profilePic}
            />
            <TouchableOpacity
              style={styles.cameraButton}
              onPress={handleCameraPress}
              activeOpacity={0.8}
            >
              <Camera width={16} color="#ccc" />
            </TouchableOpacity>
          </View>

          {/* Display Name */}
          <Text style={styles.label}>Display Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter display name..."
            placeholderTextColor="#999"
            value={tempDisplayName}
            onChangeText={setTempDisplayName}
          />

          {/* Personal Summary */}
          <Text style={styles.label}>Personal Summary</Text>
          <TextInput
            style={[styles.input, { minHeight: 80 }]}
            placeholder="Tell us about yourself..."
            placeholderTextColor="#999"
            multiline
            value={tempSummary}
            onChangeText={setTempSummary}
          />
        </View>
      </KeyboardAvoidingView>
    </Modalize>
  );
});

export default EditProfileModal;

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    marginVertical: 20,
    paddingBottom: 8,
    paddingHorizontal: 16,
  },
  cancelText: {
    color: colors.light,
    fontSize: 16,
    position: 'absolute',
    left: 16,
  },
  saveButtonContainer: {
    backgroundColor: '#21D0B2',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 20,
    position: 'absolute',
    right: 16,
  },
  saveButtonText: {
    color: colors.dark,
    fontSize: 16,
    fontWeight: '500',
  },
  formContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  label: {
    color: colors.light,
    fontSize: 16,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#2a3d52',
    borderRadius: 8,
    fontSize: 16,
    padding: 16,
    color: colors.light,
  },

  // Profile Picture + Camera Button
  profilePicContainer: {
    alignSelf: 'center',
    marginVertical: 10,
    position: 'relative',
  },
  profilePic: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 3,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 16,
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
