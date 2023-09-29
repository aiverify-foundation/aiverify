import { useEffect, useState, createRef } from 'react';
import { UiSchema, RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import Form from '@rjsf/mui';
import { TestInformation } from 'src/types/test.interface';
import { IChangeEvent } from '@rjsf/core';
import { parseRJSFSchema } from 'ai-verify-shared-library/lib';
import { ModelAndDatasets } from 'src/types/project.interface';
import { getDatasets } from 'src/lib/assetService';
import _ from 'lodash';

const defaultUISchema: UiSchema = {
  'ui:options': {
    submitButtonOptions: {
      norender: true,
    },
  },
};

type Props = {
  testInfo: TestInformation;
  onChangeData?: (data: any, valid: boolean) => void;
  modelAndDatasets: ModelAndDatasets;
};

export default function AlgorithmWidgetComponent({
  testInfo,
  onChangeData,
  modelAndDatasets,
}: Props) {
  const [rjsfSchema, setRjsfSchema] = useState<RJSFSchema | null>(null);
  const [uiSchema, setUISchema] = useState<UiSchema | null>(null);
  const formRef = createRef<{ validateForm: (formData: any) => boolean }>();

  useEffect(() => {
    const func = async () => {
      const schema = testInfo.algorithm
        ? _.cloneDeep(testInfo.algorithm.inputSchema)
        : {};
      const uiw = await parseRJSFSchema(
        schema,
        getDatasets as () => Promise<unknown[]>,
        modelAndDatasets.testDataset
      );
      setRjsfSchema({
        ...schema,
        title: '',
        description: '',
      });
      setUISchema({
        ...defaultUISchema,
        ...uiw,
      });
    };
    func();
  }, [testInfo]);

  function handleDataChange(e: IChangeEvent): void {
    let valid = false;
    if (formRef.current) {
      valid = formRef.current.validateForm(e.formData);
    }
    if (onChangeData) onChangeData(e.formData, valid);
  }

  if (!rjsfSchema || !uiSchema) {
    return <div></div>;
  }

  return (
    <div>
      <Form
        ref={formRef as any} //Todo - fix lint
        schema={rjsfSchema}
        formData={testInfo.testArguments}
        onChange={handleDataChange}
        uiSchema={uiSchema}
        validator={validator}
      />
    </div>
  );
}
