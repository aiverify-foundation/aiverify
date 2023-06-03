import * as React from 'react';
import OutlinedInput from '@mui/material/OutlinedInput';
import FormControl from '@mui/material/FormControl';
import Typography from '@mui/material/Typography';
import FormHelperText from '@mui/material/FormHelperText';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';

type Props = {
  title?: string,
  description?: string,
  id?: string,
  inputProps?: any,
  errorText?: string|null,
  FormControlProps?: any,
  items: any,
  isDisabled?: boolean,
}

function MySelect ({ title, description, id, inputProps={}, FormControlProps={}, errorText, items={}, isDisabled}: Props) {
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