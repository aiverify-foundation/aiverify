import { styled } from '@mui/material/styles';
import Tooltip, { TooltipProps } from '@mui/material/Tooltip';

type StyledTooltipProps = TooltipProps;

const StyledTooltip = styled((props: StyledTooltipProps) => {
  const { className, ...restOfProps } = props;
  return <Tooltip {...restOfProps} classes={{ popper: className }} />;
})(() => ({
  '& .MuiTooltip-tooltip': {
    background: '#702F8A',
    '&.MuiTooltip-tooltipPlacementTop': {
      marginTop: '-10px',
    },
  },
}));

export { StyledTooltip };
