import { useFormikContext } from 'formik';
import styles from './styles/newModelApiConfig.module.css';
import { ModelAPIGraphQLModel } from './types';
import EditIcon from '@mui/icons-material/Edit';
import { IconButton } from 'src/components/iconButton';
import { useState } from 'react';
import { ApiConfigNameDescForm } from './apiConfigNameDescForm';
import { optionsModelTypes } from './selectOptions';
import { SelectInput } from 'src/components/selectInput';

const defaultConfigNameDisplay = 'Configuration Name';
const defaultConfigDescDisplay = 'Description';

function ModelApiLeftSection() {
  const [isEdit, setIsEdit] = useState(false);
  const { values, setFieldValue } = useFormikContext<ModelAPIGraphQLModel>();
  return (
    <div>
      {!isEdit ? (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            <div className={styles.configName}>
              {values.name || defaultConfigNameDisplay}
            </div>
            <IconButton
              iconComponent={EditIcon}
              noOutline
              style={{ fontSize: 12 }}
              onClick={() => setIsEdit(true)}
            />
          </div>
          <div>
            <div className={styles.description}>
              {values.description || defaultConfigDescDisplay}
            </div>
          </div>
        </div>
      ) : (
        <ApiConfigNameDescForm
          onCancelClick={() => setIsEdit(false)}
          onOKClick={() => setIsEdit(false)}
        />
      )}
      <div style={{ marginTop: 25 }}>
        <SelectInput
          label="Model Type"
          name="modelType"
          options={optionsModelTypes}
          value={values.modelType}
          onChange={(val) => setFieldValue('modelType', val)}
        />
      </div>
    </div>
  );
}

export { ModelApiLeftSection };