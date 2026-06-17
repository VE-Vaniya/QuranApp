import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../theme';

interface CornerLeavesProps {
  color?: string;
  size?: number; // Size of the leaf icon. Adjust this to make it bigger/smaller.
}

/**
 * Reusable CornerLeaves component that renders 8 leaf decorations in the corners of a card.
 * To use this, the parent container MUST have `position: 'relative'` and some padding.
 * 
 * Adjust the `size` prop or the positions in the styles below to manually reposition them.
 */
export const CornerLeaves: React.FC<CornerLeavesProps> = ({ 
  color = THEME.colors.gold, 
  size = 20 // Default size (can be customized)
}) => {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* ======================================================== */}
      {/* TOP LEFT CORNER */}
      {/* Horizontal: tip facing right (0 degrees is right) */}
      <Ionicons 
        name="leaf" 
        size={size} 
        color={color} 
        style={[styles.leaf, styles.topLeftHorizontal, { transform: [{ rotate: '45deg' }] }]} 
      />
      {/* Vertical: tip facing down (90 degrees is down) */}
      <Ionicons 
        name="leaf" 
        size={size} 
        color={color} 
        style={[styles.leaf, styles.topLeftVertical, { transform: [{ rotate: '135deg' }] }]} 
      />

      {/* ======================================================== */}
      {/* TOP RIGHT CORNER */}
      {/* Horizontal: tip facing left (180 degrees is left) */}
      <Ionicons 
        name="leaf" 
        size={size} 
        color={color} 
        style={[styles.leaf, styles.topRightHorizontal, { transform: [{ rotate: '225deg' }] }]} 
      />
      {/* Vertical: tip facing down (90 degrees is down) */}
      <Ionicons 
        name="leaf" 
        size={size} 
        color={color} 
        style={[styles.leaf, styles.topRightVertical, { transform: [{ rotate: '135deg' }] }]} 
      />

      {/* ======================================================== */}
      {/* BOTTOM LEFT CORNER */}
      {/* Horizontal: tip facing right (0 degrees is right) */}
      <Ionicons 
        name="leaf" 
        size={size} 
        color={color} 
        style={[styles.leaf, styles.bottomLeftHorizontal, { transform: [{ rotate: '45deg' }] }]} 
      />
      {/* Vertical: tip facing up (270 degrees is up) */}
      <Ionicons 
        name="leaf" 
        size={size} 
        color={color} 
        style={[styles.leaf, styles.bottomLeftVertical, { transform: [{ rotate: '315deg' }] }]} 
      />

      {/* ======================================================== */}
      {/* BOTTOM RIGHT CORNER */}
      {/* Horizontal: tip facing left (180 degrees is left) */}
      <Ionicons 
        name="leaf" 
        size={size} 
        color={color} 
        style={[styles.leaf, styles.bottomRightHorizontal, { transform: [{ rotate: '225deg' }] }]} 
      />
      {/* Vertical: tip facing up (270 degrees is up) */}
      <Ionicons 
        name="leaf" 
        size={size} 
        color={color} 
        style={[styles.leaf, styles.bottomRightVertical, { transform: [{ rotate: '315deg' }] }]} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  leaf: {
    position: 'absolute',
    opacity: 0.8,
  },
  
  // TOP LEFT CORNER POSITIONS
  // Adjust top/left values to position them exactly as you like
  topLeftHorizontal: {
    top: 6,
    left: 20,
  },
  topLeftVertical: {
    top: 20,
    left: 6,
  },

  // TOP RIGHT CORNER POSITIONS
  topRightHorizontal: {
    top: 6,
    right: 20,
  },
  topRightVertical: {
    top: 20,
    right: 6,
  },

  // BOTTOM LEFT CORNER POSITIONS
  bottomLeftHorizontal: {
    bottom: 6,
    left: 20,
  },
  bottomLeftVertical: {
    bottom: 20,
    left: 6,
  },

  // BOTTOM RIGHT CORNER POSITIONS
  bottomRightHorizontal: {
    bottom: 6,
    right: 20,
  },
  bottomRightVertical: {
    bottom: 20,
    right: 6,
  },
});
