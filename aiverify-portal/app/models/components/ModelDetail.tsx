import React, { useState, useEffect } from 'react';
import Dropdown from '@/app/models/components/DropdownMenu';
import { useModelData } from '@/app/models/hooks/useDownloadModel';
import { useModelAPIData } from '@/app/models/hooks/useDownloadModelAPI';
import { useEditModel } from '@/app/models/hooks/useEditModel';
import { TestModel } from '@/app/models/utils/types';
import { Icon, IconName } from '@/lib/components/IconSVG';
import { Button, ButtonVariant } from '@/lib/components/button';
import { Modal } from '@/lib/components/modal';

type Props = {
  model: TestModel;
};

const ModelDetail: React.FC<Props> = ({ model }) => {
  const [modelAPIData, setModelAPIData] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [modelData, setModelData] = useState<{
    blob: Blob;
    filename: string;
  } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editedModel, setEditedModel] = useState<TestModel>(model);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  // Correct hook for fetching API data
  const fetchModelAPIDataHook = useModelAPIData();

  // Correct hook for fetching model data
  const { data: modelDataHook } = useModelData(String(model.id));

  // Update editedModel when model changes
  useEffect(() => {
    setEditedModel(model);
  }, [model]);

  const fetchModelAPIData = async () => {
    try {
      const result = await fetchModelAPIDataHook(String(model.id));

      if ('data' in result) {
        // Convert ModelAPIData to Record<string, unknown>
        setModelAPIData(result.data.data);
      }
    } catch (error) {
      console.error('Error fetching API data:', error);
    }
  };

  useEffect(() => {
    if (modelDataHook) {
      setModelData(modelDataHook);
    }
  }, [modelDataHook]);

  const handleDownload = async () => {
    if (!modelData) {
      return;
    }

    const { blob, filename } = modelData;
    const fileURL = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = fileURL;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(fileURL);
  };

  const handleDownloadJson = (
    data: Record<string, unknown>,
    filename: string
  ) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  };

  const handleDownloadAPI = async () => {
    await fetchModelAPIData();
    if (modelAPIData) {
      handleDownloadJson(modelAPIData, model.name);
    }
  };

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  const EditModelMutation = useEditModel();

  const handleSaveChanges = async () => {
    try {
      await EditModelMutation.mutateAsync(editedModel);
      setFeedbackMessage('Changes made successfully!');
      setFeedbackSuccess(true);
    } catch (error) {
      setFeedbackMessage(
        error instanceof Error ? error.message : 'Unknown error'
      );
      setFeedbackSuccess(false);
      setEditedModel(model);
      setJsonInput(JSON.stringify(model.modelAPI, null, 2));
    } finally {
      setIsFeedbackModalOpen(true);
      setIsModalOpen(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEditedModel((prevModel) => ({
      ...prevModel,
      [name]: value,
    }));
  };

  const [jsonInput, setJsonInput] = useState(
    JSON.stringify(editedModel.modelAPI, null, 2)
  );
  const [jsonError, setJsonError] = useState('');

  const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setJsonInput(value);

    try {
      const parsed = JSON.parse(value);
      setJsonError('');
      setEditedModel((prevModel) => ({
        ...prevModel,
        modelAPI: parsed,
      }));
    } catch {
      setJsonError('Invalid JSON format');
    }
  };

  return (
    <div className="flex h-fit flex-col overflow-hidden rounded-lg bg-secondary-950 p-6 text-white shadow-lg">
      <div className="flex w-full items-start justify-between">
        <div className="flex w-full flex-col">
          <h3 className="mb-2 mr-2 break-all text-lg font-semibold text-white">
            {editedModel.name}
          </h3>
        </div>
        <div className="flex items-start justify-end">
          <Icon
            name={IconName.Pencil}
            size={20}
            color="#FFFFFF"
            onClick={handleOpenModal}
          />
        </div>
      </div>
      {editedModel.description && (
        <span className="mb-1">{editedModel.description}</span>
      )}
      <span>
        <strong>Status: </strong>
        {model.status}
      </span>
      {(model.fileType || model.mode) && (
        <span>
          <strong>Type: </strong>
          {model.fileType || model.mode}
        </span>
      )}
      <span>
        <strong>Date Updated: </strong>
        {new Date(editedModel.updated_at).toLocaleString('en-GB')}
      </span>
      {model.size && (
        <span>
          <strong>Size: </strong>
          {model.size}
        </span>
      )}
      {model.serializer && (
        <span>
          <strong>Serializer: </strong>
          {model.serializer}
        </span>
      )}
      {model.modelFormat && (
        <span>
          <strong>Model Format: </strong>
          {model.modelFormat}
        </span>
      )}
      {editedModel.modelType && (
        <span>
          <strong>Model Type: </strong>
          {editedModel.modelType}
        </span>
      )}
      <div className="flex">
        {editedModel.modelAPI && (
          <div className="w-full">
            <span>
              <strong>Model API</strong>
            </span>
            <div className="max-h-64 w-full overflow-y-auto whitespace-pre-wrap bg-secondary-800 p-4">
              {JSON.stringify(editedModel.modelAPI, null, 2)}
            </div>
          </div>
        )}
      </div>
      <div className="mt-4 flex justify-end">
        {model.modelAPI && (
          <Button
            pill
            textColor="white"
            variant={ButtonVariant.PRIMARY}
            size="sm"
            text="DOWNLOAD API DATA"
            color="primary-950"
            onClick={handleDownloadAPI}
          />
        )}

        {!model.modelAPI && (
          <Button
            pill
            textColor="white"
            variant={ButtonVariant.PRIMARY}
            size="sm"
            text="DOWNLOAD MODEL FILE"
            color="primary-950"
            onClick={handleDownload}
          />
        )}
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <Modal
            textColor="white"
            onCloseIconClick={() => handleCloseModal()}
            enableScreenOverlay
            heading="Edit Model"
            height={600}
            width={1000}
            primaryBtnLabel="SAVE CHANGES"
            secondaryBtnLabel="CANCEL"
            onPrimaryBtnClick={handleSaveChanges} // Handle saving edits
            onSecondaryBtnClick={() => handleCloseModal()} // Close the modal
          >
            <div className="max-h-[470px] overflow-y-auto">
              <form>
                {/* Edit Model Name */}
                <div className="mb-4">
                  <label className="mb-2 block">Model Name</label>
                  <input
                    type="text"
                    name="name"
                    value={editedModel.name}
                    onChange={handleInputChange}
                    className="w-full rounded border border-secondary-300 bg-transparent p-2"
                  />
                </div>

                {/* Edit Description */}
                <div className="mb-4">
                  <label className="mb-2 block">Description</label>
                  <input
                    type="text"
                    name="description"
                    value={editedModel.description || ''}
                    onChange={handleInputChange}
                    className="w-full rounded border border-gray-300 bg-transparent p-2"
                  />
                </div>

                {/* Edit Model Type */}
                <div className="mb-4">
                  <label className="mb-2 block">Model Type</label>
                  <Dropdown
                    id="model-type-dropdown"
                    title="Select Model Type"
                    data={[
                      { id: 'classification', name: 'Classification' },
                      { id: 'regression', name: 'Regression' },
                    ]}
                    selectedId={editedModel.modelType}
                    onSelect={(id) => {
                      const event = {
                        target: {
                          name: 'modelType',
                          value: id,
                        },
                      } as React.ChangeEvent<HTMLInputElement>; // Type assertion applied here
                      handleInputChange(event);
                    }}
                    style="w-full rounded border border-secondary-300 bg-transparent p-2"
                  />
                </div>

                {/* Edit Model API */}
                {editedModel.mode === 'api' && (
                  <div className="mb-4">
                    <label className="mb-2 block">Model API</label>
                    <textarea
                      name="modelAPI"
                      value={jsonInput}
                      onChange={handleJsonChange}
                      className="w-full rounded border border-gray-300 bg-transparent p-2 font-mono"
                      rows={10}
                    />
                    {jsonError && <p className="text-red-500">{jsonError}</p>}
                  </div>
                )}
              </form>
            </div>
          </Modal>
        </div>
      )}
      {isFeedbackModalOpen && (
        <Modal
          textColor="white"
          onCloseIconClick={() => setIsFeedbackModalOpen(false)}
          enableScreenOverlay
          heading={feedbackSuccess ? 'Edit Model Success' : 'Edit Model Error'}>
          <p>
            {typeof feedbackMessage === 'string'
              ? feedbackMessage
              : JSON.stringify(feedbackMessage)}
          </p>
        </Modal>
      )}
    </div>
  );
};

export default ModelDetail;
