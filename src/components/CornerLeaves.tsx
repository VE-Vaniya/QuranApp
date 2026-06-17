import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { THEME } from '../theme';

interface CornerLeavesProps {
  color?: string;
  size?: number;
}

export const CornerLeaves: React.FC<CornerLeavesProps> = ({ 
  color = THEME.colors.gold, 
  size = 20
}) => {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* ======================================================== */}
      {/* TOP LEFT CORNER */}
      {/* Horizontal: tip → RIGHT (0° = right) */}
      <Ionicons 
        name="leaf" 
        size={size} 
        color={color} 
        style={[styles.leaf, styles.topLeftHorizontal, { transform: [{ rotate: '0deg' }] }]} 
      />
      {/* Vertical: tip ↓ DOWN (90° = down) */}
      <Ionicons 
        name="leaf" 
        size={size} 
        color={color} 
        style={[styles.leaf, styles.topLeftVertical, { transform: [{ rotate: '90deg' }] }]} 
      />

      {/* ======================================================== */}
      {/* TOP RIGHT CORNER */}
      {/* Horizontal: tip ← LEFT (180° = left) */}
      <Ionicons 
        name="leaf" 
        size={size} 
        color={color} 
        style={[styles.leaf, styles.topRightHorizontal, { transform: [{ rotate: '180deg' }] }]} 
      />
      {/* Vertical: tip ↓ DOWN (90° = down) */}
      <Ionicons 
        name="leaf" 
        size={size} 
        color={color} 
        style={[styles.leaf, styles.topRightVertical, { transform: [{ rotate: '90deg' }] }]} 
      />

      {/* ======================================================== */}
      {/* BOTTOM LEFT CORNER */}
      {/* Horizontal: tip → RIGHT (0° = right) */}
      <Ionicons 
        name="leaf" 
        size={size} 
        color={color} 
        style={[styles.leaf, styles.bottomLeftHorizontal, { transform: [{ rotate: '0deg' }] }]} 
      />
      {/* Vertical: tip ↑ UP (270° = up) */}
      <Ionicons 
        name="leaf" 
        size={size} 
        color={color} 
        style={[styles.leaf, styles.bottomLeftVertical, { transform: [{ rotate: '270deg' }] }]} 
      />

      {/* ======================================================== */}
      {/* BOTTOM RIGHT CORNER */}
      {/* Horizontal: tip ← LEFT (180° = left) */}
      <Ionicons 
        name="leaf" 
        size={size} 
        color={color} 
        style={[styles.leaf, styles.bottomRightHorizontal, { transform: [{ rotate: '180deg' }] }]} 
      />
      {/* Vertical: tip ↑ UP (270° = up) */}
      <Ionicons 
        name="leaf" 
        size={size} 
        color={color} 
        style={[styles.leaf, styles.bottomRightVertical, { transform: [{ rotate: '270deg' }] }]} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  leaf: {
    position: 'absolute',
    opacity: 0.8,
  },
  
  // TOP LEFT — stems in corner (0,0), tips pointing inward
  topLeftHorizontal: {
    top: 0,
    left: 0,
  },
  topLeftVertical: {
    top: 0,
    left: 0,
  },

  // TOP RIGHT — stems in corner
  topRightHorizontal: {
    top: 0,
    right: 0,
  },
  topRightVertical: {
    top: 0,
    right: 0,
  },

  // BOTTOM LEFT — stems in corner
  bottomLeftHorizontal: {
    bottom: 0,
    left: 0,
  },
  bottomLeftVertical: {
    bottom: 0,
    left: 0,
  },

  // BOTTOM RIGHT — stems in corner
  bottomRightHorizontal: {
    bottom: 0,
    right: 0,
  },
  bottomRightVertical: {
    bottom: 0,
    right: 0,
  },
});