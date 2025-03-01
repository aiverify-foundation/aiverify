'use client';

import Link from 'next/link';
import React, { useState } from 'react';
import LayoutHeader from '@/app/models/components/LayoutHeader';
import ModelUploader from '@/app/models/upload/components/ModelUploader';
import { Icon, IconName } from '@/lib/components/IconSVG';
import { Button, ButtonVariant } from '@/lib/components/button';
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

  const renderOptionCard = (
    method: string,
    title: string,
    descriptions: string[]
  ) => (
    <div
      className={`flex h-[350px] w-[50%] cursor-pointer flex-col rounded-lg border p-6 transition-all duration-200`}
      style={{
        borderColor:
          activeCard === method
            ? 'var(--color-primary-600)'
            : 'var(--color-secondary-300)',
        backgroundColor:
          activeCard === method
            ? 'var(--color-primary-600)'
            : 'var(--color-secondary-950)',
      }}
      onClick={() => handleMethodSelect(method)}>
      <div className="mb-4 flex items-center gap-3">
        <div
          className={`flex h-5 w-5 items-center justify-center rounded-full border ${activeCard === method ? 'border-purple-400' : 'border-zinc-700'}`}>
          {activeCard === method && (
            <div className="h-2.5 w-2.5 rounded-full bg-purple-400" />
          )}
        </div>
        <Icon
          name={IconName.Folder}
          size={20}
          color={activeCard === method ? '#C084FC' : '#A1A1AA'}
        />
        <h2 className="text-xl font-semibold text-white">{title}</h2>
      </div>
      {descriptions.map((desc, index) => {
        const isNote = desc.startsWith('*');
        const [sectionTitle, content] = desc.split(': ');

        if (content) {
          return (
            <div
              key={index}
              className="mt-4">
              <h3 className="text-sm font-medium text-zinc-400">
                {sectionTitle}
              </h3>
              <p className="mt-1 text-sm text-white">{content}</p>
            </div>
          );
        }

        return (
          <p
            key={index}
            className={`mt-2 text-sm ${isNote ? 'text-zinc-400' : 'text-white'}`}>
            {desc}
          </p>
        );
      })}
    </div>
  );

  const renderSelectionOptions = () => (
    <div className="relative flex flex-col overflow-y-auto">
      <div className="flex items-center">
        <Link href="/models">
          <Icon
            name={IconName.ArrowLeft}
            size={40}
            color="#FFFFFF"
          />
        </Link>
        <div className="ml-3">
          <h1 className="text-2xl font-bold text-white">Add New AI Model</h1>
          <h3 className="text-white">
            How would you like AI Verify to access the AI Model to be tested?
          </h3>
        </div>
      </div>
      <div className="flex flex-grow items-center gap-10 p-10">
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
      </div>
      <div className="mt-6 mt-auto flex items-center justify-end pr-6">
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

  return (
    <div className="mt-6 flex h-[calc(100vh-150px)] overflow-y-auto rounded-2xl bg-secondary-950 pt-6 text-white">
      <LayoutHeader />
      <div className="mx-auto h-full w-full p-2">
        {!selectedMethod ? renderSelectionOptions() : null}
        {selectedMethod === 'file' && <ModelUploader onBack={handleBack} />}
        {selectedMethod === 'pipeline' && (
          <PipelineUploader onBack={handleBack} />
        )}
      </div>
    </div>
  );
};

export default UploadPage;
