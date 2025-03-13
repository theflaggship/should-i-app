// src/components/EditProfileModal.js
import React, {
    forwardRef,
    useImperativeHandle,
    useState,
    useRef,
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
  } from 'react-native';
  import { Modalize } from 'react-native-modalize';
  import colors from '../styles/colors';
  
  const { height } = Dimensions.get('window');
  
  const EditProfileModal = forwardRef(({ onSaveProfile }, ref) => {
    // Refs to Modalize
    const editModalRef = useRef(null);
  
    // Local state for the user’s summary (or any other fields)
    const [tempSummary, setTempSummary] = useState('');
  
    // We store the original user so we can reset if needed
    const [user, setUser] = useState(null);
  
    // Expose a method to parent
    useImperativeHandle(ref, () => ({
      openEditProfile: (initialUser) => {
        if (!initialUser) return;
        setUser(initialUser);
        setTempSummary(initialUser.personalSummary || '');
        editModalRef.current?.open();
      },
    }));
  
    // Handle saving
    const handleSaveProfile = () => {
      if (onSaveProfile && user) {
        // Build a payload with updated fields
        const payload = {
          ...user,
          personalSummary: tempSummary.trim(),
        };
        onSaveProfile(payload);
      }
      editModalRef.current?.close();
    };
  
    // Cancel changes
    const handleCancel = () => {
      editModalRef.current?.close();
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
  
          <View style={styles.formContent}>
            <Text style={styles.label}>Personal Summary</Text>
            <TextInput
              style={styles.input}
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
    },
    input: {
      backgroundColor: '#2a3d52',
      borderRadius: 8,
      fontSize: 16,
      padding: 20,
      color: colors.light,
      minHeight: 120,
      textAlignVertical: 'top',
    },
  });
  