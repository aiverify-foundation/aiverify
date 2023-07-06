import * as React from 'react';

import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';

import CodeBlock from 'src/components/codeBlock';

type Props = {
  id?: string;
  open: boolean;
  onClose?: () => void;
  title?: string;
  text?: string;
};

export default function CodeBlockDialog({
  id,
  open,
  onClose,
  title,
  text,
}: Props) {
  return (
    <Dialog id={id} open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <CodeBlock text={text} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
