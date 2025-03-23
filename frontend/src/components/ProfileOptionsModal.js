// src/components/ProfileOptionsModal.js

import React, { forwardRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Alert } from 'react-native';
import { Modalize } from 'react-native-modalize';
import { LogOut, Settings } from 'react-native-feather';
import colors from '../styles/colors';

const { height } = Dimensions.get('window');

const ProfileOptionsModal = forwardRef(({ onEdit, onSignOut, onClosed }, ref) => (
  <Modalize
    ref={ref}
    withReactModal
    coverScreen
    snapPoint={210}
    modalHeight={height * 0.37}
    closeOnOverlayTap={true}
    modalStyle={styles.modal}
    handleStyle={styles.handle}
    onClosed={onClosed}
  >
    <View style={styles.container}>
      <TouchableOpacity style={styles.menuRow} onPress={onEdit}>
        <Text style={styles.menuRowText}>Edit Profile</Text>
        <Settings width={20} color={colors.light} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuRow}
        onPress={() =>
          Alert.alert(
            'Confirm Sign Out',
            'Are you sure you want to sign out?',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Sign Out', style: 'destructive', onPress: onSignOut },
            ],
            { cancelable: true }
          )
        }
      >
        <Text style={styles.menuRowText}>Sign Out</Text>
        <LogOut width={20} color={colors.light} />
      </TouchableOpacity>
    </View>
  </Modalize>
));

export default ProfileOptionsModal;

const styles = StyleSheet.create({
  modal: {
    backgroundColor: colors.dark,
    padding: 25,
  },
  handle: {
    backgroundColor: '#888',
  },
  container: {
    paddingHorizontal: 5,
    paddingTop: 8,
    marginBottom: 24,
  },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.input,
    paddingHorizontal: 28,
    paddingVertical: 14,
    marginVertical: 6,
    borderRadius: 25,
    borderWidth: 0.3,
    borderColor: colors.light,
  },
  menuRowText: {
    fontFamily: 'Quicksand-Medium',
    color: colors.light,
    fontSize: 18,
  },
});
