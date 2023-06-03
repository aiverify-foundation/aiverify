import * as React from 'react';
import { styled } from '@mui/material/styles';
import Button, { ButtonProps } from '@mui/material/Button';

const StyledButton = styled(Button)(({ theme }) => ({
  padding: '18px',
  fontSize: '18px',
  fontWeight: 700,
  textTransform: 'none',
  backgroundColor: '#4B0965',
  '&:contained': {
    backgroundColor: 'red',
  }
})) as typeof Button;

export default StyledButton;