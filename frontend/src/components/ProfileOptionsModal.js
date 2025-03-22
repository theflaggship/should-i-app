// src/components/ProfileOptionsModal.js
import React, { forwardRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
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
      <TouchableOpacity style={styles.menuRow} onPress={onSignOut}>
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
        borderWidth: 1,
        borderColor: colors.input,
        backgroundColor: colors.input,
        paddingHorizontal: 28,
        paddingVertical: 14,
        marginVertical: 6,
        borderRadius: 25,
        borderWidth: .3,
        borderColor: colors.light,
      },
      menuRowText: {
        color: colors.light,
        fontSize: 18,
      },
    editButtonContainer: {
        backgroundColor: colors.secondary,
        borderRadius: 20,
        paddingVertical: 12,
        alignItems: 'center',
        marginVertical: 5,
    },
    editButtonText: {
        color: colors.dark,
        fontSize: 16,
        fontWeight: '600',
    },
    signOutButtonContainer: {
        backgroundColor: colors.red || 'red',
        borderRadius: 20,
        paddingVertical: 12,
        alignItems: 'center',
        marginTop: 5,
    },
    signOutButtonText: {
        color: colors.light,
        fontSize: 16,
        fontWeight: '600',
    },
});
