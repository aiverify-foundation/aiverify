import IconButton from '@mui/material/IconButton';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

/**
 * Generic Need Help? component
 */

type Props = {
  onClick?: React.MouseEventHandler;
  testid?: string;
};

export default function NeedHelp({ onClick, testid }: Props) {
  return (
    <Box sx={{ display: 'block' }}>
      <Typography variant="caption">Need Help?</Typography>
      <IconButton data-testid={testid} aria-label="Help" onClick={onClick}>
        <InfoOutlinedIcon />
      </IconButton>
    </Box>
  );
}
