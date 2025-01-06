'use client';

import React, { useState } from 'react';
import LayoutHeader from '@/app/models/components/LayoutHeader';
import { Button, ButtonVariant } from '@/lib/components/button';
import ModelUploader from '@/app/models/upload/components/ModelUploader';
import PipelineUploader from './components/PipelineUploader';

type UploadPageProps = {
  onBack?: () => void;
};

const UploadPage: React.FC<UploadPageProps> = () => {
  const [selectedMethod, setSelectedMethod] = useState('');
  const [activeCard, setActiveCard] = useState<string>(''); // Track the active card

  const handleMethodSelect = (method: string) => {
    setActiveCard(method);
  };

  const handleNext = () => {
    if (activeCard) {
      setSelectedMethod(activeCard);
    }
  };

  const handleBack = () => {
    setSelectedMethod(''); // Reset to show the selection interface
  };

  const renderSelectionOptions = () => (
    <div className="h-full">
      <h1 className="text-3xl font-bold mb-6">Add New AI Model</h1>
      <p className="mb-8 text-gray-300">
        How would you like AI Verify to access the AI Model to be tested?
      </p>
      <div className="min-h-full flex justify-between gap-6 p-8">
        {renderOptionCard('file', 'Upload AI Model', [
          'Supported frameworks: LightGBM, Scikit-learn, TensorFlow, XGBoost',
          '*Compatible with tabular datasets only',
          'How it works: AI Verify will run the testing dataset against the AI model uploaded to generate predictions.',
        ])}
        {renderOptionCard('pipeline', 'Upload Pipeline', [
          'Supported frameworks: Scikit-learn Pipeline',
          'Supported datasets: Tabular, Image',
          'How it works: AI Verify will run technical tests using the uploaded test dataset and pipeline.',
        ])}
        {renderOptionCard('api', 'Connect to AI Model API', [
          'Supports any AI Framework. See: Supported API Configurations',
          'How it works: AI Verify will call the model API to generate predictions for the testing dataset.',
        ])}
      </div>
      <div className="flex items-center justify-end ml-auto">
        <Button
          variant={ButtonVariant.PRIMARY}
          className="mb-8"
          size="sm"
          onClick={handleNext}
          disabled={!activeCard}
          text="NEXT"
        />
      </div>
    </div>
  );

  const renderOptionCard = (
    method: string,
    title: string,
    descriptions: string[]
  ) => (
    <div
      className={`p-6 border rounded-lg cursor-pointer h-80 ${
        activeCard === method ? 'bg-primary-600 border-primary-200' : 'border-gray-300'
      }`}
      onClick={() => handleMethodSelect(method)}
    >
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      {descriptions.map((desc, index) => (
        <p key={index} className="text-sm mt-2 text-gray-300">
          {desc}
        </p>
      ))}
    </div>
  );

  return (
    <div className="h-[calc(100vh-120px)] bg-secondary-950 text-white mt-6">
      <LayoutHeader />
      <div className="w-full mx-auto p-6">
        {!selectedMethod ? renderSelectionOptions() : null}
        {selectedMethod === 'file' && <ModelUploader onBack={handleBack} />}
        {selectedMethod === 'pipeline' && <PipelineUploader onBack={handleBack} />}
      </div>
    </div>
  );
};

export default UploadPage;
