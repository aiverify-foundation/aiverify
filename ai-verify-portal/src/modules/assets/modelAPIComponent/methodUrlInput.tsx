import { useFormikContext } from 'formik';
import { SelectInput } from 'src/components/selectInput';
import { ModelApiFormModel, RequestMethod } from './types';
import { optionsRequestMethods } from './selectOptions';
import { TextInput } from 'src/components/textInput';
import { usePresetHelper } from './providers/presetHelperProvider';
import { ColorPalette } from 'src/components/colorPalette';
import { Tooltip, TooltipPosition } from 'src/components/tooltip';

type MethodUrlInputProps = {
  disabled?: boolean;
  onRequestMethodChange: (val: RequestMethod) => void;
};

function MethodUrlInput(props: MethodUrlInputProps) {
  const { onRequestMethodChange, disabled = false } = props;
  const { values, errors, touched, setFieldValue, handleChange } =
    useFormikContext<ModelApiFormModel>();
  const { inputFieldsDisabledStatus, highlightedFields } = usePresetHelper();

  function handleRequestMethodChange(val: RequestMethod) {
    setFieldValue('modelAPI.method', val);
    if (onRequestMethodChange) {
      onRequestMethodChange(val);
    }
  }

  return (
    <div style={{ display: 'flex' }}>
      <div style={{ marginRight: 10 }}>
        <SelectInput
          disabled={disabled || inputFieldsDisabledStatus['modelAPI.method']}
          width={140}
          label="Request Method"
          name="modelAPI.method"
          options={optionsRequestMethods}
          onChange={handleRequestMethodChange}
          value={values.modelAPI.method}
        />
      </div>
      <div style={{ flexGrow: 1 }}>
        <Tooltip
          defaultShow={highlightedFields['modelAPI.url']}
          disabled
          backgroundColor={ColorPalette.gray}
          fontColor={ColorPalette.white}
          content={
            <div style={{ marginBottom: 5, textAlign: 'left' }}>
              Enter the URL of the model prediction API
            </div>
          }
          position={TooltipPosition.bottom}
          offsetTop={-10}
          offsetLeft={-200}>
          <div style={{ width: '100%' }}>
            <TextInput
              disabled={disabled}
              label="Model URL"
              name="modelAPI.url"
              onChange={handleChange}
              value={values.modelAPI.url}
              inputStyle={
                highlightedFields['modelAPI.url']
                  ? {
                      border: `1px solid ${ColorPalette.gray}`,
                      backgroundColor: ColorPalette.softPurpleTint,
                    }
                  : undefined
              }
              error={
                Boolean(errors.modelAPI?.url && touched.modelAPI?.url)
                  ? errors.modelAPI?.url
                  : undefined
              }
            />
          </div>
        </Tooltip>
      </div>
    </div>
  );
}

export { MethodUrlInput };
