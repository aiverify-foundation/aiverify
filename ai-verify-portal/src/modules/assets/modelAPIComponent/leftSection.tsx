import { useFormikContext } from 'formik';
import styles from './styles/newModelApiConfig.module.css';
import { ModelApiFormModel } from './types';
import EditIcon from '@mui/icons-material/Edit';
import { IconButton } from 'src/components/iconButton';
import { useEffect, useState } from 'react';
import { ApiConfigNameDescForm } from './nameDescInput';
import { optionsModelTypes } from './selectOptions';
import { SelectInput } from 'src/components/selectInput';

const defaultConfigNameDisplay = 'Configuration Name';
const defaultConfigDescDisplay = 'Description';

type SectionProps = {
  disabled: boolean;
  hasDuplicateNameError: boolean;
};

function ModelApiLeftSection({
  disabled = false,
  hasDuplicateNameError = false,
}: SectionProps) {
  const [isEdit, setIsEdit] = useState(false);
  const [nameDescHasErrors, setNameDescHasErrors] = useState(false);
  const { values, errors, touched, handleChange } =
    useFormikContext<ModelApiFormModel>();

  useEffect(() => {
    if (
      Boolean(errors.name && touched.name) ||
      Boolean(errors.description && touched.description)
    ) {
      setIsEdit(true);
      setNameDescHasErrors(true);
    } else {
      setNameDescHasErrors(false);
    }
  }, [errors.name, errors.description]);

  useEffect(() => {
    if (hasDuplicateNameError) setIsEdit(true);
  }, [hasDuplicateNameError]);

  return (
    <div>
      {!isEdit ? (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            <div className={styles.configName}>
              {values.name || defaultConfigNameDisplay}
            </div>
            {!disabled ? (
              <IconButton
                iconComponent={EditIcon}
                noOutline
                style={{ fontSize: 12 }}
                onClick={() => setIsEdit(true)}
                id="editConfigIconBtn"
              />
            ) : null}
          </div>
          <div>
            <div className={styles.description}>
              {values.description || defaultConfigDescDisplay}
            </div>
          </div>
        </div>
      ) : (
        <ApiConfigNameDescForm
          onOKClick={() => setIsEdit(false)}
          disabledOkBtn={nameDescHasErrors}
          hasDuplicateNameError={hasDuplicateNameError}
        />
      )}
      <div style={{ marginTop: 25 }}>
        <SelectInput
          id="modelTypeSelect"
          disabled={disabled}
          label="Model Type"
          name="modelType"
          options={optionsModelTypes}
          value={values.modelType}
          onSyntheticChange={handleChange}
        />
      </div>
    </div>
  );
}

export { ModelApiLeftSection };
