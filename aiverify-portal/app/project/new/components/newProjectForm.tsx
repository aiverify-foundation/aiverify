'use client';
import { useActionState } from 'react';
import { useEffect, useState } from 'react';
import { createProject } from '@/app/project/actions/createProject';
import { ProjectFormValues } from '@/app/project/types';
import { FormState } from '@/app/types';
import { Icon } from '@/lib/components/IconSVG';
import { IconName } from '@/lib/components/IconSVG';
import { Button, ButtonVariant } from '@/lib/components/button';
import { Modal } from '@/lib/components/modal';
import { TextArea } from '@/lib/components/textArea';
import { TextInput } from '@/lib/components/textInput';

const initialFormValues: FormState<ProjectFormValues> = {
  formStatus: 'initial',
  formErrors: undefined,
  name: '',
  description: '',
  reportTitle: '',
  company: '',
};

function NewProjectForm() {
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [formState, action] = useActionState<
    FormState<ProjectFormValues>,
    FormData
  >(createProject, initialFormValues);

  useEffect(() => {
    if (formState.formStatus === 'error') {
      setShowErrorModal(true);
      return;
    }
    if (formState.formStatus === 'success') {
    }
  }, [formState]);
  return (
    <>
      {showErrorModal ? (
        <Modal
          heading="Errors"
          className="bg-secondary-800"
          textColor="#FFFFFF"
          primaryBtnLabel="Close"
          enableScreenOverlay
          overlayOpacity={0.8}
          onCloseIconClick={() => setShowErrorModal(false)}
          onPrimaryBtnClick={() => setShowErrorModal(false)}>
          <div className="flex items-start gap-2">
            <Icon
              name={IconName.Alert}
              size={30}
              color="red"
            />
            {formState.formErrors ? (
              <ul>
                {Object.entries(formState.formErrors).map(([key, value]) => (
                  <li key={key}>
                    {key}: {value.join(', ')}
                  </li>
                ))}
              </ul>
            ) : (
              'An unknown error occurred'
            )}
          </div>
        </Modal>
      ) : null}
      <form
        className="w-[60%] p-8"
        action={action}>
        <TextInput
          name="name"
          label="Project Name*"
          labelClassName="!text-white"
        />
        <TextArea
          name="description"
          label="Project Description"
          labelClassName="!text-white"
        />
        <TextInput
          name="reportTitle"
          label="Report Title"
          labelClassName="!text-white"
        />
        <TextInput
          name="company"
          label="Company Name"
          labelClassName="!text-white"
        />
        <div className="mt-[80px] flex justify-between">
          <p className="text-[0.8rem] text-secondary-400">* Required</p>
          <Button
            type="submit"
            text="Next"
            variant={ButtonVariant.PRIMARY}
            size="sm"
          />
        </div>
      </form>
    </>
  );
}

export { NewProjectForm };
