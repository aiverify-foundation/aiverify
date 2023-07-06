import * as React from 'react';
import { styled } from '@mui/material/styles';
import Tooltip, { TooltipProps, tooltipClasses } from '@mui/material/Tooltip';

const HtmlTooltip = styled(({ className, ...props }: TooltipProps) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    // backgroundColor: '#f5f5f9',
    backgroundColor: theme.palette.secondary.main,
    // color: 'rgba(0, 0, 0, 0.87)',
    color: theme.palette.secondary.contrastText,
    // maxWidth: 800,
    // width: 500,
    fontSize: theme.typography.pxToRem(12),
    border: '1px solid #dadde9',
  },
}));

export default HtmlTooltip;
