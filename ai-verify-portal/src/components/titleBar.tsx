import { styled } from '@mui/material/styles';
import Paper from '@mui/material/Paper';

/**
 * Styled title bar for showing single line of title
 */
const TitleBarComponent = styled(Paper)(({ theme }) => ({
  color: 'white',
  backgroundColor: '#636363',
  padding: theme.spacing(1),
  fontSize: '18px',
  fontWeight: 700,
})) as typeof Paper;

export default TitleBarComponent;
