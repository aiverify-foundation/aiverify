import React, { useState, useEffect } from 'react';
import { TestModel } from '@/app/models/utils/types';
import { Button, ButtonVariant } from '@/lib/components/button';
import { useModelAPIData } from '@/app/models/hooks/useDownloadModelAPI';
import { useModelData } from '@/app/models/hooks/useDownloadModel';

type Props = {
  model: TestModel;
};

export default function ModelDetail({ model }: Props) {
  const { data: modelAPIData, isLoading: isModelAPIDataLoading, isError: isModelAPIDataError } = 
    model.modelAPI ? useModelAPIData(String(model.id)) : { data: null, isLoading: false, isError: false };

  const { data: modelData, isLoading: isModelDataLoading, isError: isModelDataError } = 
    !model.modelAPI ? useModelData(String(model.id)) : { data: null, isLoading: false, isError: false };

  const handleDownloadJson = (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  };

  const handleDownload = async () => {
    if (modelData && modelData.blob) {
      const { blob, filename } = modelData; // Get the blob and filename from modelData
  
      // Create a URL for the blob (binary data)
      const fileURL = URL.createObjectURL(blob);
      
      // Create an anchor element to trigger the download
      const a = document.createElement('a');
      a.href = fileURL;
      a.download = filename; // Set the filename from the response headers
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Revoke the object URL to clean up
      URL.revokeObjectURL(fileURL);
    }
  };
  
  const handleDownloadAPI = () => {
    if (modelAPIData) {
      handleDownloadJson(modelAPIData, model.name);
    }
  };

  return (
    <div className="bg-secondary-950 h-fit text-white rounded-lg shadow-lg p-6 flex flex-col overflow-hidden">
        <h3 className="text-xl font-semibold text-white mb-2 break-words mb-2">{model.name}</h3>
        {model.description && (
          <span className='mb-1'>{model.description}</span>
        )}
        <span><strong>Status: </strong>{model.status}</span>
        {(model.fileType || model.mode) && ( 
          <span><strong>Type: </strong>{model.fileType || model.mode}</span>
        )}
        <span><strong>Date Updated: </strong>{new Date(model.updated_at).toLocaleString('en-GB')}</span>
        {model.size && ( 
          <span><strong>Size: </strong>{model.size}</span>
        )}
        {model.serializer && ( 
          <span><strong>Serializer: </strong>{model.serializer}</span>
        )}
        {model.modelFormat && ( 
          <span><strong>Model Format: </strong>{model.modelFormat}</span>
        )}
        {model.modelType && ( 
          <span><strong>Model Type: </strong>{model.modelType}</span>
        )}
        <div className='flex'>
        {model.modelAPI && (
          <div className='w-full'>
            <span><strong>Model API</strong></span>
            <div className="bg-secondary-800 w-full max-h-64 overflow-y-auto p-4 whitespace-pre-wrap">
            {JSON.stringify(model.modelAPI, null, 2)}
          </div>
          </div>
          )}
        </div>
        <div className="flex justify-end mt-4">
          {/* Download button for API mode */}
          {model.modelAPI && modelAPIData &&(
            <Button
              pill
              textColor="white"
              variant={ButtonVariant.PRIMARY}
              size="sm"
              text="DOWNLOAD API DATA"
              color='primary-950'
              onClick={handleDownloadAPI}
            />
          )}

          {/* Download button for non-API mode */}
          {!model.modelAPI && modelData && (
            <Button
              pill
              textColor="white"
              variant={ButtonVariant.PRIMARY}
              size="sm"
              text="DOWNLOAD MODEL FILE"
              color='primary-950'
              onClick={handleDownload}
            />
          )}
        </div>
    </div>
  );
}