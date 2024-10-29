import type { Config } from 'tailwindcss';
import {
  colors,
  white,
  black,
  currentColor,
  transparent,
} from './components/tokens/colors';

const config: Config = {
  important: true,
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
        sans: ['Roboto', 'sans-serif'],
      },
    },
  },
};
export default config;
