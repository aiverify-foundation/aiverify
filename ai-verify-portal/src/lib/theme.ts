import { Inter } from '@next/font/google';
const inter = Inter({ subsets: ['latin'] });
import { createTheme } from '@mui/material/styles';

// Create a theme instance.
const theme = createTheme({
  typography: {
    fontFamily: inter.style.fontFamily,
    heading1: {
      fontSize: '40px',
      lineHeight: 1.5,
      fontWeight: 700,
    },
    heading2: {
      fontSize: '37px',
      lineHeight: 1.5,
      fontWeight: 700,
    },
    heading3: {
      fontSize: '28px',
      lineHeight: 1.5,
      fontWeight: 700,
    },
    heading4: {
      fontSize: '24px',
      lineHeight: 1.5,
      fontWeight: 700,
    },
    heading5: {
      fontSize: '20px',
      lineHeight: 1.5,
      fontWeight: 600,
    },
    title1: {
      fontSize: '26px',
      fontWeight: 700,
    },
    title2: {
      fontSize: '24px',
      fontWeight: 700,
    },
    title3: {
      fontSize: '20px',
      fontWeight: 600,
    },
    formLabel: {
      fontSize: '14px',
      fontWeight: 600,
    },
    formHelperText: {
      fontSize: '14px',
      fontWeight: 300,
    },
  },
  palette: {
    background: {
      default: '#F3F0F5',
    },
    text: {
      primary: '#676767',
      strong: '#474747',
    },
    primary: {
      main: '#702F8A',
    },
    secondary: {
      main: '#991E66',
      light: '#90376B',
    },
    positive: {
      main: '#33961A',
    },
    negative: {
      main: '#DF2525',
    },
    select: {
      main: '#CF98E4',
    },
  },
});

declare module '@mui/material/styles' {
  interface Palette {
    positive: Palette['primary'];
    negative: Palette['primary'];
    select: Palette['primary'];
  }

  // allow configuration using `createTheme`
  interface PaletteOptions {
    positive?: PaletteOptions['primary'];
    negative?: PaletteOptions['primary'];
    select?: PaletteOptions['primary'];
  }

  interface TypeText {
    strong?: string;
  }

  interface TypographyVariants {
    heading1: React.CSSProperties;
    heading2: React.CSSProperties;
    heading3: React.CSSProperties;
    heading4: React.CSSProperties;
    heading5: React.CSSProperties;
    title1: React.CSSProperties;
    title2: React.CSSProperties;
    title3: React.CSSProperties;
    formLabel: React.CSSProperties;
    formHelperText: React.CSSProperties;
  }

  // allow configuration using `createTheme`
  interface TypographyVariantsOptions {
    heading1?: React.CSSProperties;
    heading2?: React.CSSProperties;
    heading3?: React.CSSProperties;
    heading4?: React.CSSProperties;
    heading5?: React.CSSProperties;
    title1?: React.CSSProperties;
    title2?: React.CSSProperties;
    title3?: React.CSSProperties;
    formLabel?: React.CSSProperties;
    formHelperText?: React.CSSProperties;
  }
}

// Update the Typography's variant prop options
declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    heading1?: true;
    heading2?: true;
    heading3?: true;
    heading4?: true;
    heading5?: true;
    title1: true;
    title2: true;
    title3: true;
    formLabel: true;
    formHelperText: true;
  }
}

export default theme;
