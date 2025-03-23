// src/components/CommentOptionsModal.js

import React, { forwardRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Alert } from 'react-native';
import { Modalize } from 'react-native-modalize';
import { Edit, Trash2 } from 'react-native-feather';
import colors from '../styles/colors';

const { height } = Dimensions.get('window');

const CommentOptionsModal = forwardRef(({ onEdit, onDelete, onClosed }, ref) => (
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
                <Text style={styles.menuRowText}>Edit Comment</Text>
                <Edit width={20} color={colors.light} />
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.menuRow}
                onPress={onDelete}
            >
                <Text style={styles.menuRowText}>Delete Comment</Text>
                <Trash2 width={20} color={colors.light} />
            </TouchableOpacity>
        </View>
    </Modalize>
));

export default CommentOptionsModal;

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
