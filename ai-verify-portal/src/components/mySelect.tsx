import * as React from 'react';
import FormControl from '@mui/material/FormControl';
import Typography from '@mui/material/Typography';
import FormHelperText from '@mui/material/FormHelperText';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectProps } from '@mui/material/Select';
import { SxProps } from '@mui/material';

type Props = {
  title?: string,
  description?: string,
  id?: string,
  inputProps?: SelectProps<string>,
  errorText?: string|null,
  FormControlProps?: {sx?: SxProps},
  items: string[],
  isDisabled?: boolean,
}

function MySelect ({ title, description, id, inputProps={}, FormControlProps={}, errorText, items=[], isDisabled}: Props) {
  return (
    <FormControl
      fullWidth
      {...FormControlProps}
    >
    {title && <Typography variant="formLabel">{title}</Typography>}
    {description && <Typography variant="formHelperText" sx={{ mb:0.5 }}>{description}</Typography>}
    <Select
        color='secondary'
        data-testid={id}
        id={id}
        fullWidth
        size="small"
        {...inputProps}
        disabled={isDisabled}
    >
        {items && items.map((item: string) => {
            return (
                <MenuItem value={item} key={item}>{item}</MenuItem>
            )
        })}
    </Select>
      {errorText && <FormHelperText error>{errorText}</FormHelperText>}
    </FormControl>
  )
}

export default MySelect;