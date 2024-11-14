import {
  colors,
  white,
  black,
  currentColor,
  transparent,
} from './lib/theme/colors';
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    colors: {
      ...colors,
      white,
      black,
      currentColor,
      transparent,
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      textShadow: {
        default: '0 2px 4px black',
        sm: '0 1px 2px black',
        lg: '0 8px 16px black',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    function ({ matchUtilities, theme }) {
      matchUtilities(
        {
          'text-shadow': (value) => ({
            textShadow: value,
          }),
        },
        { values: theme('textShadow') }
      );
    },
  ],
};
export default config;
