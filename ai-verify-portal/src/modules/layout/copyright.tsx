import Typography from '@mui/material/Typography';
import MuiLink from '@mui/material/Link';

/**
 * Copyright for layout bottom bar.
 */
export default function Copyright() {
  return (
    <Typography variant="subtitle1" align="center">
      {'Copyright © 2022. AI Verify Foundation. For technical assistance, visit '}
      <MuiLink color="inherit" href="https://go.gov.sg/aiverifysupport">
        https://go.gov.sg/aiverifysupport
      </MuiLink>{'.'}
    </Typography>
  );
}
