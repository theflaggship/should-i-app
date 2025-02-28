// src/components/CustomBottomSheet.js
import React, { forwardRef, useImperativeHandle } from 'react';
import { StyleSheet, Dimensions, View } from 'react-native';
import {
  PanGestureHandler,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  withSpring,
} from 'react-native-reanimated';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * A custom bottom sheet with two snap points:
 *  - MIN_SNAP (20% of screen)
 *  - MAX_SNAP (70% of screen)
 *
 * Drags between these points. The parent can call .openSheet() or .closeSheet().
 */
const CustomBottomSheet = forwardRef((props, ref) => {
  // Snap points
  const MIN_SNAP = SCREEN_HEIGHT * 0.2; // 20%
  const MAX_SNAP = SCREEN_HEIGHT * 0.7; // 70%

  // Shared value tracking the sheet's "expanded height" in px
  const translateY = useSharedValue(MIN_SNAP);

  // Expose open/close methods to the parent
  useImperativeHandle(ref, () => ({
    openSheet: () => {
      // Animate to MAX_SNAP
      translateY.value = withSpring(MAX_SNAP, { damping: 15 });
    },
    closeSheet: () => {
      // Animate to MIN_SNAP
      translateY.value = withSpring(MIN_SNAP, { damping: 15 });
    },
  }));

  /**
   * Gesture handler for dragging the sheet up/down.
   * We store the starting position in ctx.startY,
   * then clamp to [MIN_SNAP, MAX_SNAP].
   */
  const panGesture = useAnimatedGestureHandler({
    onStart: (_, ctx) => {
      'worklet';
      ctx.startY = translateY.value;
    },
    onActive: (event, ctx) => {
      'worklet';
      const newHeight = ctx.startY - event.translationY;
      if (newHeight < MIN_SNAP) {
        translateY.value = MIN_SNAP;
      } else if (newHeight > MAX_SNAP) {
        translateY.value = MAX_SNAP;
      } else {
        translateY.value = newHeight;
      }
    },
    onEnd: () => {
      'worklet';
      // Snap to whichever is closer
      const midpoint = (MIN_SNAP + MAX_SNAP) / 2;
      if (translateY.value > midpoint) {
        translateY.value = withSpring(MAX_SNAP, { damping: 15 });
      } else {
        translateY.value = withSpring(MIN_SNAP, { damping: 15 });
      }
    },
  });

  /**
   * Animated style to position the sheet from the bottom:
   * top = SCREEN_HEIGHT - translateY.value
   */
  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      top: SCREEN_HEIGHT - translateY.value,
    };
  });

  return (
    // Must be inside a GestureHandlerRootView for PanGestureHandler to work properly
    <GestureHandlerRootView style={StyleSheet.absoluteFill}>
      <Animated.View style={[styles.sheetContainer, animatedStyle]}>
        {/* The "handle" area at the top for dragging */}
        <PanGestureHandler onGestureEvent={panGesture}>
          <Animated.View style={styles.handleBarArea}>
            <View style={styles.handleBar} />
          </Animated.View>
        </PanGestureHandler>

        {/* The content inside the sheet (your form, etc.) */}
        <View style={styles.contentContainer}>{props.children}</View>
      </Animated.View>
    </GestureHandlerRootView>
  );
});

const styles = StyleSheet.create({
  sheetContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    // We'll animate the "top" property in `animatedStyle`
    backgroundColor: '#222', // Or your dark color
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handleBarArea: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  handleBar: {
    width: 50,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#666',
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
});

export default CustomBottomSheet;
