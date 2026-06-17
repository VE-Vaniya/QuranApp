import { useColorScheme } from 'react-native';

const LIGHT_COLORS = {
  // Parchment / Cream
  background: '#FAF7F0',
  backgroundCard: '#FAF7F0',
  
  // Forest Green
  primary: '#1A332E',
  primaryDark: '#0F201C',
  primaryLight: '#2C4E47',
  
  // Iris / Plum Purple
  accent: '#4B2A4A',
  accentLight: '#6B4069',
  
  // Gold / Amber
  gold: '#C5A059',
  goldDark: '#A37F3D',
  goldLight: '#E5C483',
  goldBorder: '#E6D5B8',
  
  // Text colors
  textDark: '#2D2D2D',
  textLight: '#FAF7F0',
  textSecondary: '#6B7280',
  textGold: '#C5A059',
  
  // Input & UI Elements
  inputBg: '#FAF7F0',
  border: '#E6D5B8',
  success: '#10B981',
  error: '#EF4444',
};

const DARK_COLORS = {
  // Deep Forest Slate Green
  background: '#121A18',
  backgroundCard: '#1C2926',
  
  // Brighter Green
  primary: '#244B43',
  primaryDark: '#0F201C',
  primaryLight: '#32695E',
  
  // Lighter Purple
  accent: '#7B4D7A',
  accentLight: '#9E6E9C',
  
  // Gold / Amber
  gold: '#D4AF37',
  goldDark: '#B18E27',
  goldLight: '#F5D77F',
  goldBorder: '#364B46',
  
  // Text colors
  textDark: '#ECEAE4',
  textLight: '#121A18',
  textSecondary: '#9CA3AF',
  textGold: '#D4AF37',
  
  // Input & UI Elements
  inputBg: '#1C2926',
  border: '#364B46',
  success: '#34D399',
  error: '#F87171',
};

export const THEME = {
  colors: LIGHT_COLORS,
  
  fonts: {
    // Serif font for headers
    serif: 'PlayfairDisplay_600SemiBold',
    serifItalic: 'PlayfairDisplay_600SemiBold_Italic',
    serifBold: 'PlayfairDisplay_700Bold',
    
    // Sans-serif font for body text
    sans: 'Inter_400Regular',
    sansMedium: 'Inter_500Medium',
    sansBold: 'Inter_700Bold',
    
    // Arabic fallback
    arabic: 'System', // Standard android Arabic font works very well
  },
  
  shadows: {
    small: {
      shadowColor: '#1A332E',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    medium: {
      shadowColor: '#1A332E',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 4,
    },
    elegant: {
      shadowColor: '#1A332E',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 6,
    }
  },
  
  borders: {
    goldDouble: {
      borderWidth: 1.5,
      borderColor: '#C5A059',
      borderRadius: 12,
      padding: 16,
    },
    elegantCard: {
      borderWidth: 1,
      borderColor: '#E6D5B8',
      borderRadius: 16,
      backgroundColor: '#FAF7F0',
    }
  }
};

/**
 * Custom React Native hook to get the active color scheme.
 * Returns either the Art Nouveau Parchment theme (Light) or Slate Green theme (Dark).
 */
export function useTheme() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const activeColors = isDark ? DARK_COLORS : LIGHT_COLORS;
  
  return {
    colors: activeColors,
    isDark,
    fonts: THEME.fonts,
    shadows: {
      ...THEME.shadows,
      small: {
        ...THEME.shadows.small,
        shadowColor: isDark ? '#000000' : '#1A332E',
      },
      medium: {
        ...THEME.shadows.medium,
        shadowColor: isDark ? '#000000' : '#1A332E',
      },
      elegant: {
        ...THEME.shadows.elegant,
        shadowColor: isDark ? '#000000' : '#1A332E',
      }
    },
    borders: THEME.borders,
  };
}
