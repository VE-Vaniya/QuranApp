import React from 'react';
import { View, StyleSheet, Dimensions, ViewStyle } from 'react-native';
import { THEME } from '../theme';

const TILE = 56;
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const COLS = Math.ceil(SCREEN_W / TILE) + 1;
const ROWS = Math.ceil(SCREEN_H / TILE) + 1;

function StarTile({ x, y }: { x: number; y: number }) {
  return (
    <View
      style={[
        styles.tile,
        {
          left: x * TILE,
          top: y * TILE,
        },
      ]}
      pointerEvents="none"
    >
      <View style={styles.diamond} />
      <View style={[styles.diamond, styles.diamondInner]} />
    </View>
  );
}

interface PatternBackgroundProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function PatternBackground({ children, style }: PatternBackgroundProps) {
  const tiles: React.ReactNode[] = [];
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      tiles.push(<StarTile key={`${row}-${col}`} x={col} y={row} />);
    }
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.patternLayer} pointerEvents="none">
        {tiles}
      </View>
      <View style={styles.cornerOrnamentTL} pointerEvents="none" />
      <View style={styles.cornerOrnamentTR} pointerEvents="none" />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  patternLayer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.35,
  },
  tile: {
    position: 'absolute',
    width: TILE,
    height: TILE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diamond: {
    width: 18,
    height: 18,
    borderWidth: 0.5,
    borderColor: THEME.colors.gold,
    transform: [{ rotate: '45deg' }],
    opacity: 0.45,
  },
  diamondInner: {
    position: 'absolute',
    width: 8,
    height: 8,
    opacity: 0.6,
  },
  cornerOrnamentTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 120,
    height: 120,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.15)',
    borderBottomRightRadius: 80,
  },
  cornerOrnamentTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 120,
    height: 120,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.15)',
    borderBottomLeftRadius: 80,
  },
  content: {
    flex: 1,
  },
});
