// src/theme.ts

import { extendTheme, type ThemeConfig, type StyleFunctionProps } from '@chakra-ui/react';

// 1. Define the config type explicitly
const config: ThemeConfig = {
  initialColorMode: 'dark', // Force Dark Mode
  useSystemColorMode: false,
};

const theme = extendTheme({
  config,
  colors: {
    // 1. Primary Neon Color (Cyan/Aqua)
    neon: {
      50: '#e6fffa',
      100: '#b3fffa',
      200: '#80fff6',
      300: '#4dfff2',
      400: '#1affee',
      500: '#00e6e6', // The main color for accents and glow
      600: '#00cccc',
      700: '#00b3b3',
      800: '#009999',
      900: '#008080',
    },
    // 2. Override default colors for a deeper dark theme
    gray: {
      // FIX: You cannot use the spread operator (...) directly here 
      // without importing the default theme, which is complex.
      // For this theme extension, you can omit the spread and Chakra
      // will intelligently merge it with its defaults.
      // But if you MUST override and see the defaults, you'd do it 
      // like this (if you imported 'colors' from defaultTheme).
      // Since we only need 800 and 900 for dark mode, let's keep it simple:
      
      800: '#1A202C', 
      900: '#0D0E13', 
    },
    // 3. Set semantic tokens for easy use in dark mode
    bg: {
        primary: { default: 'gray.50', _dark: 'gray.900' }, // Main background
        card: { default: 'white', _dark: 'gray.800' }, // Card background
    }
  },
  styles: {
    // FIX: Add the correct type annotation for props (StyleFunctionProps)
    global: (props: StyleFunctionProps) => ({
      // Set the global background color
      'html, body': {
        // Use props.colorMode to access the current mode value
        bg: props.colorMode === 'dark' ? 'bg.primary' : 'gray.50',
        color: 'whiteAlpha.900', // Ensure text is white in dark mode
      },
    }),
  },
});

export default theme;