import * as React from 'react';

import OutlinedInput from '@mui/material/OutlinedInput';

type Props = {
  text?: string;
};

export default function CodeBlock({ text }: Props) {
  return (
    <OutlinedInput
      fullWidth
      margin="dense"
      readOnly
      multiline
      maxRows={25}
      // sx={{ bgcolor:'black', color:'white' }}
      value={text}
    />
  );
}
