'use client'

import { useState } from 'react';
import LayoutHeader from "@/app/models/components/LayoutHeader";
import { Button, ButtonVariant } from "@/lib/components/button";
import ModelUploader from "@/app/models/upload/components/ModelUploader";
import PipelineUploader from './components/PipelineUploader';

const UploadPage = () => {
    const [selectedMethod, setSelectedMethod] = useState('');
    const [activeCard, setActiveCard] = useState(''); // Track the active card
  
    const handleMethodSelect = (method: string) => {
      setActiveCard(method); // Set the active card on selection
    };

    const handleNext = () => {
        // Proceed to the next step (rendering the selected component)
        // This could involve API calls, validations, etc.
        // For simplicity, we'll directly render here:
        if (activeCard) {
          setSelectedMethod(activeCard); 
        }
      };

    const handleBack = () => {
        setSelectedMethod(''); // Reset to show the selection interface
    };

  return (
    <div className="h-[calc(100vh-120px)] bg-secondary-950 text-white mt-6">
      <LayoutHeader />
      <div className="w-full mx-auto p-6">
        {!selectedMethod ? (
          <div className='h-full'>
          <h1 className="text-3xl font-bold mb-6">Add New AI Model</h1>
          <p className="mb-8 text-gray-300">How would you like AI Verify to access the AI Model to be tested?</p>
          <div className="min-h-full flex justify-between gap-6 p-8"> 
          <div 
              className={`p-6 border rounded-lg cursor-pointer ${activeCard === 'file' ? 'bg-primary-600 border-primary-200' : 'border-gray-300'}`}
              onClick={() => handleMethodSelect('file')}
            >
              <h2 className="text-xl font-semibold mb-4">Upload AI Model</h2>
              <p className="text-sm text-gray-300">Supported frameworks: LightGBM, Scikit-learn, TensorFlow, XGBoost</p>
              <p className="text-sm mt-2 text-gray-300">*Compatible with tabular datasets only</p>
              <p className="text-sm mt-4 text-gray-300">How it works: AI Verify will run the testing dataset against the AI model uploaded to generate predictions.</p>
            </div>
            <div 
              className={`p-6 border rounded-lg cursor-pointer ${activeCard === 'pipeline' ? 'bg-primary-600 border-primary-200' : 'border-gray-300'}`}
              onClick={() => handleMethodSelect('pipeline')}
            >
              <h2 className="text-xl font-semibold mb-4">Upload Pipeline</h2>
              <p className="text-sm text-gray-300">Supported frameworks: Scikit-learn Pipeline</p>
              <p className="text-sm mt-2 text-gray-300">Supported datasets: Tabular, Image</p>
              <p className="text-sm mt-4 text-gray-300">How it works: AI Verify will run technical tests using the uploaded test dataset and pipeline.</p>
            </div>
            <div 
              className={`p-6 border rounded-lg cursor-pointer ${activeCard === 'api' ? 'bg-primary-600 border-primary-200' : 'border-gray-300'}`}
              onClick={() => handleMethodSelect('api')}
            >
              <h2 className="text-xl font-semibold mb-4">Connect to AI Model API</h2>
              <p className="text-sm text-gray-300">Supports any AI Framework. See: Supported API Configurations</p>
              <p className="text-sm mt-4 text-gray-300">How it works: AI Verify will call the model API to generate predictions for the testing dataset.</p>
            </div>
          </div>
          <div className='flex items-center justify-end ml-auto'>
            <Button 
                variant={ButtonVariant.PRIMARY}
                className="mb-8" 
                size='sm'
                onClick={() => handleNext()}
                disabled={!activeCard} 
                text='NEXT'
                />
            </div>
        </div>
        ) : (
          <div>
            {selectedMethod === 'file' && <ModelUploader onBack={handleBack} />}
            {selectedMethod === 'pipeline' && <PipelineUploader onBack={handleBack} />}
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadPage;
