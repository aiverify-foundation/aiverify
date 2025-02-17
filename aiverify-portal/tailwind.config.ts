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
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      textShadow: {
        default: '0 2px 4px black',
        sm: '0 1px 2px black',
        lg: '0 8px 16px black',
      },
      colors: {
        ...colors,
        white,
        black,
        currentColor,
        transparent,
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    function ({ addUtilities }) {
      addUtilities({
        '.scrollbar-hidden': {
          'scrollbar-width': 'none' /* For Firefox */,
          '-ms-overflow-style': 'none' /* For Internet Explorer and Edge */,
        },
        '.scrollbar-hidden::-webkit-scrollbar': {
          display: 'none' /* For Chrome, Safari, and Opera */,
        },
      });
    },
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
