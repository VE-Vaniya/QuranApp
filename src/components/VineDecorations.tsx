import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../theme';

interface CornerVinesProps {
  color?: string;
  size?: number;
}

export function CornerVines({ color = THEME.colors.gold, size = 18 }: CornerVinesProps) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* TOP LEFT CORNER: Horizontal tip -> Right, Vertical tip -> Down */}
      <Ionicons 
        name="leaf" 
        size={size} 
        color={color} 
        style={[styles.leaf, { top: 6, left: 20, transform: [{ rotate: '45deg' }] }]} 
      />
      <Ionicons 
        name="leaf" 
        size={size} 
        color={color} 
        style={[styles.leaf, { top: 20, left: 6, transform: [{ rotate: '135deg' }] }]} 
      />

      {/* TOP RIGHT CORNER: Horizontal tip -> Left, Vertical tip -> Down */}
      <Ionicons 
        name="leaf" 
        size={size} 
        color={color} 
        style={[styles.leaf, { top: 6, right: 20, transform: [{ rotate: '225deg' }] }]} 
      />
      <Ionicons 
        name="leaf" 
        size={size} 
        color={color} 
        style={[styles.leaf, { top: 20, right: 6, transform: [{ rotate: '135deg' }] }]} 
      />

      {/* BOTTOM LEFT CORNER: Horizontal tip -> Right, Vertical tip -> Up */}
      <Ionicons 
        name="leaf" 
        size={size} 
        color={color} 
        style={[styles.leaf, { bottom: 6, left: 20, transform: [{ rotate: '45deg' }] }]} 
      />
      <Ionicons 
        name="leaf" 
        size={size} 
        color={color} 
        style={[styles.leaf, { bottom: 20, left: 6, transform: [{ rotate: '315deg' }] }]} 
      />

      {/* BOTTOM RIGHT CORNER: Horizontal tip -> Left, Vertical tip -> Up */}
      <Ionicons 
        name="leaf" 
        size={size} 
        color={color} 
        style={[styles.leaf, { bottom: 6, right: 20, transform: [{ rotate: '225deg' }] }]} 
      />
      <Ionicons 
        name="leaf" 
        size={size} 
        color={color} 
        style={[styles.leaf, { bottom: 20, right: 6, transform: [{ rotate: '315deg' }] }]} 
      />
    </View>
  );
}

interface HorizontalVinesProps {
  color?: string;
  style?: ViewStyle;
  leafSize?: number;
}

export function HorizontalVines({ color = THEME.colors.gold, style, leafSize = 16 }: HorizontalVinesProps) {
  return (
    <View style={[styles.horizontalWrap, style]} pointerEvents="none">
      <View style={[styles.hLine, { backgroundColor: color }]} />
      <Ionicons name="leaf" size={leafSize} color={color} style={styles.hLeafLeft} />
      <Ionicons name="leaf" size={leafSize - 2} color={color} style={styles.hLeafLeftSmall} />
      <View style={[styles.hCenterDot, { borderColor: color }]} />
      <Ionicons name="leaf" size={leafSize - 2} color={color} style={styles.hLeafRightSmall} />
      <Ionicons name="leaf" size={leafSize} color={color} style={styles.hLeafRight} />
      <View style={[styles.hLine, { backgroundColor: color }]} />
    </View>
  );
}

interface CenteredTitleWithVinesProps {
  title: string;
  textStyle?: TextStyle;
  color?: string;
}

export function CenteredTitleWithVines({ title, textStyle, color = THEME.colors.gold }: CenteredTitleWithVinesProps) {
  return (
    <View style={styles.centeredTitleRow}>
      <View style={styles.titleSide}>
        <Ionicons name="leaf" size={14} color={color} style={{ transform: [{ rotate: '-28deg' }], opacity: 0.75 }} />
        <View style={[styles.titleLine, { backgroundColor: color }]} />
      </View>
      <Text style={[styles.centeredTitleText, textStyle]}>{title}</Text>
      <View style={styles.titleSide}>
        <View style={[styles.titleLine, { backgroundColor: color }]} />
        <Ionicons name="leaf" size={14} color={color} style={{ transform: [{ rotate: '28deg' }, { scaleX: -1 }], opacity: 0.75 }} />
      </View>
    </View>
  );
}

export function VineBorderBox({
  children,
  style,
  cornerColor,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  cornerColor?: string;
}) {
  return (
    <View style={[styles.vineBox, style]}>
      <CornerVines color={cornerColor} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  leaf: {
    position: 'absolute',
    opacity: 0.85,
    zIndex: 10,
  },
  horizontalWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    gap: 6,
  },
  hLine: {
    flex: 1,
    height: 1,
    opacity: 0.45,
  },
  hLeafLeft: { transform: [{ rotate: '-30deg' }], opacity: 0.75 },
  hLeafLeftSmall: { transform: [{ rotate: '-55deg' }], opacity: 0.55, marginRight: -4 },
  hCenterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 1,
    opacity: 0.6,
  },
  hLeafRightSmall: { transform: [{ rotate: '55deg' }, { scaleX: -1 }], opacity: 0.55, marginLeft: -4 },
  hLeafRight: { transform: [{ rotate: '30deg' }, { scaleX: -1 }], opacity: 0.75 },
  centeredTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    gap: 10,
    paddingHorizontal: 4,
  },
  titleSide: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: 90,
  },
  titleLine: {
    flex: 1,
    height: 1,
    opacity: 0.45,
  },
  centeredTitleText: {
    fontSize: 22,
    fontFamily: 'PlayfairDisplay_700Bold',
    color: THEME.colors.primary,
    textAlign: 'center',
  },
  vineBox: {
    position: 'relative',
  },
});
