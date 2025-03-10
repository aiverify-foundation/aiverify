'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { UserFlows } from '@/app/userFlowsEnum';
import { Icon } from '@/lib/components/IconSVG';
import { IconName } from '@/lib/components/IconSVG';
import { Button, ButtonVariant } from '@/lib/components/button';
import { Modal } from '@/lib/components/modal';
import { TextArea } from '@/lib/components/textArea';
import { TextInput } from '@/lib/components/textInput';
import { useCreateTemplate } from '@/lib/fetchApis/getTemplates';

type NewTemplateFormProps = {
  onCancel: () => void;
};

export function NewTemplateForm({ onCancel }: NewTemplateFormProps) {
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [error, setError] = useState<string>();
  const router = useRouter();
  const createTemplate = useCreateTemplate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      const newTemplate = await createTemplate.mutateAsync({
        projectInfo: {
          name: formData.get('name') as string,
          description: formData.get('description') as string,
        },
        globalVars: [],
        pages: [],
        fromPlugin: false,
      });

      router.push(
        `/canvas?templateId=${newTemplate.id}&flow=${UserFlows.ViewTemplate}&isTemplate=true&mode=edit`
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to create template'
      );
      setShowErrorModal(true);
    }
  };

  return (
    <>
      {showErrorModal ? (
        <Modal
          heading="Errors"
          className="bg-secondary-800"
          textColor="#FFFFFF"
          primaryBtnLabel="Close"
          enableScreenOverlay
          width={400}
          height={600}
          onCloseIconClick={() => setShowErrorModal(false)}
          onPrimaryBtnClick={() => setShowErrorModal(false)}>
          <div className="flex items-start gap-2">
            <Icon
              name={IconName.Alert}
              size={30}
              color="red"
            />
            {error || 'An unknown error occurred'}
          </div>
        </Modal>
      ) : null}
      <form onSubmit={handleSubmit}>
        <TextInput
          name="name"
          label="Template Name*"
          labelClassName="!text-white"
          required
        />
        <TextArea
          name="description"
          label="Template Description"
          labelClassName="!text-white"
        />
        <div className="flex justify-between">
          <p className="text-[0.8rem] text-secondary-400">* Required</p>
          <div className="mt-16 flex gap-4">
            <Button
              type="button"
              text="Cancel"
              variant={ButtonVariant.SECONDARY}
              size="sm"
              onClick={onCancel}
            />
            <Button
              type="submit"
              text="Next"
              variant={ButtonVariant.PRIMARY}
              size="sm"
              disabled={createTemplate.isPending}
            />
          </div>
        </div>
      </form>
    </>
  );
}
