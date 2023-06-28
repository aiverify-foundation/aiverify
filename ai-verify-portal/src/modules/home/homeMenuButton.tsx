import React from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material';
import styles from './homeMenuButton.module.css';

type Props = {
  title: string;
  description: string;
  onClick?: React.MouseEventHandler;
  testid?: string;
  MyIcon?: React.ElementType;
};

/**
 * Component for homepage menu.
 */
export default function HomeMenuButtonComponent({
  title,
  description,
  onClick,
  testid,
  MyIcon,
}: Props) {
  const theme = useTheme();

  return (
    <Box
      data-testid={testid}
      sx={{
        p: 2,
        borderRadius: '12px',
        backgroundColor: theme.palette.secondary.light,
      }}
      className={styles.homeMenuButton}
      onClick={onClick}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'left',
          height: '100%',
        }}>
        {MyIcon && (
          <Box sx={{ flexGrow: 1 }}>
            <MyIcon className={styles.homeMenuIcon} />
          </Box>
        )}
        <Typography variant="body2">{description}</Typography>
        <Typography variant="heading4">{title}</Typography>
      </Box>
    </Box>
  );
}
