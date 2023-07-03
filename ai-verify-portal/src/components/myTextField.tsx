import OutlinedInput from '@mui/material/OutlinedInput';
import FormControl from '@mui/material/FormControl';
import Typography from '@mui/material/Typography';
import FormHelperText from '@mui/material/FormHelperText';

type Props = {
  title?: string;
  description?: string;
  id?: string;
  inputProps?: any;
  errorText?: string | null;
  FormControlProps?: any;
};

function MyTextField({
  title,
  description,
  id,
  inputProps = {},
  FormControlProps = {},
  errorText,
}: Props) {
  return (
    <FormControl fullWidth {...FormControlProps}>
      {title && <Typography variant="formLabel">{title}</Typography>}
      {description && (
        <Typography variant="formHelperText" sx={{ mb: 0.5 }}>
          {description}
        </Typography>
      )}
      <OutlinedInput
        color="secondary"
        data-testid={id}
        id={id}
        fullWidth
        size="small"
        {...inputProps}
      />
      {errorText && <FormHelperText error>{errorText}</FormHelperText>}
    </FormControl>
  );
}

export default MyTextField;
