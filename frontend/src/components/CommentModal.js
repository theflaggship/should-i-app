// src/components/CommentModal.js

import React, { forwardRef, useImperativeHandle, useState, useRef } from 'react';
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

const CommentModal = forwardRef(({ onSubmit, actionLabel = 'Add' }, ref) => {
  const modalRef = useRef();
  const inputRef = useRef();
  const [text, setText] = useState('');

  useImperativeHandle(ref, () => ({
    open: (initialText = '') => {
      setText(initialText);
      modalRef.current?.open();
    },
    close: () => {
      setText('');
      modalRef.current?.close();
    },
  }));

  const handleOpen = () => setTimeout(() => inputRef.current?.focus(), 100);
  const handleAction = () => {
    onSubmit(text.trim());
    ref.current.close();
  };

  return (
    <Modalize
      ref={modalRef}
      withReactModal
      coverScreen
      snapPoint={height * 0.6}
      modalHeight={height * 0.6}
      closeOnOverlayTap={true}
      modalStyle={styles.modal}
      handleStyle={styles.handle}
      onOpened={handleOpen}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => ref.current.close()}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleAction}
            disabled={!text.trim()}
            style={styles.actionButton}
          >
            <Text style={styles.actionButtonText}>{actionLabel}</Text>
          </TouchableOpacity>
        </View>
        <TextInput
          ref={inputRef}
          style={styles.textArea}
          placeholder="Write your comment..."
          placeholderTextColor="#aaa"
          multiline
          numberOfLines={4}
          value={text}
          onChangeText={setText}
        />
      </KeyboardAvoidingView>
    </Modalize>
  );
});

export default CommentModal;

const styles = StyleSheet.create({
  modal: {
    backgroundColor: colors.dark,
    padding: 25,
  },
  handle: {
    backgroundColor: '#888',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  cancelText: {
    fontFamily: 'Quicksand-Medium',
    color: colors.light,
    fontSize: 16,
  },
  actionButton: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  actionButtonText: {
    fontFamily: 'Quicksand-Bold',
    color: colors.dark,
    fontSize: 16,
  },
  textArea: {
    flex: 1,
    marginTop: 8,
    backgroundColor: colors.input,
    borderRadius: 8,
    padding: 12,
    fontFamily: 'Quicksand-Regular',
    color: colors.light,
    fontSize: 16,
    textAlignVertical: 'top',
    borderWidth: 0.3,
    borderColor: colors.light,
  },
});
