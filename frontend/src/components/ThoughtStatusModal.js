// src/components/ThoughtStatusModal.js

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
  } from 'react-native';
  import { Modalize } from 'react-native-modalize';
  import { AuthContext } from '../context/AuthContext';
  import { updateUserProfile } from '../services/userService';
  import colors from '../styles/colors';
  
  const { height } = Dimensions.get('window');
  
  const ThoughtStatusModal = forwardRef(({ onSaveStatus }, ref) => {
    const modalRef = useRef(null);
    const { token } = useContext(AuthContext);
  
    // We'll store the user object so we know their ID
    const [user, setUser] = useState(null);
    // We'll store the local status text the user types
    const [tempStatus, setTempStatus] = useState('');
  
    // Expose a method to the parent
    useImperativeHandle(ref, () => ({
      openStatusModal: (initialUser) => {
        if (!initialUser) return;
        setUser(initialUser);
        setTempStatus(initialUser.status || '');
        modalRef.current?.open();
      },
    }));
  
    const handleSave = async () => {
      if (!user) return;
  
      try {
        // Build payload for status only
        const payload = {
          status: tempStatus.trim(),
        };
  
        const result = await updateUserProfile(user.id, token, payload);
        // If successful, call onSaveStatus
        if (result && result.user) {
          onSaveStatus(result.user);
        }
      } catch (err) {
        console.error('Failed to update status:', err);
      }
  
      modalRef.current?.close();
    };
  
    const handleCancel = () => {
      modalRef.current?.close();
    };
  
    return (
      <Modalize
        ref={modalRef}
        withReactModal
        coverScreen
        snapPoint={height * 0.4}
        modalHeight={height * 0.5}
        closeOnOverlayTap={false}
        modalStyle={{ backgroundColor: colors.dark }}
        handleStyle={{ backgroundColor: '#888' }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={30}
        >
          <View style={styles.headerRow}>
            <Text style={styles.cancelText} onPress={handleCancel}>
              Cancel
            </Text>
            <View style={styles.saveButtonContainer}>
              <Text style={styles.saveButtonText} onPress={handleSave}>
                Save
              </Text>
            </View>
          </View>
  
          <View style={styles.formContent}>
            <Text style={styles.label}>What are you pondering?</Text>
            <TextInput
              style={styles.input}
              placeholder="Type your status..."
              placeholderTextColor="#999"
              value={tempStatus}
              onChangeText={setTempStatus}
              multiline
            />
          </View>
        </KeyboardAvoidingView>
      </Modalize>
    );
  });
  
  export default ThoughtStatusModal;
  
  const styles = StyleSheet.create({
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
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
      marginBottom: 10,
    },
    input: {
      backgroundColor: '#2a3d52',
      borderRadius: 8,
      fontSize: 16,
      padding: 16,
      color: colors.light,
      minHeight: 80,
      textAlignVertical: 'top',
    },
  });
  