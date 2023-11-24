import { useRouter } from 'next/router';
import React, { useState } from 'react';

import clsx from 'clsx';
import styles from './styles/new-asset.module.css';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Container from '@mui/material/Container';
import FolderIcon from '@mui/icons-material/Folder';
import { Icon } from '../../components/icon';
import { IconName } from '../../components/icon/iconNames';

import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';

import NewModelUploadModule from '../assets/newModelUpload';
import NewPipelineUploadModule from '../assets/newPipelineUpload';
import { MinimalHeader } from '../home/header';

type OptionCardProps = {
  highlighted?: boolean;
  onClick: () => void;
  testid: string;
  name: string;
  label: string;
  tip: string;
  icon: JSX.Element;
  children: JSX.Element[];
};

enum ModelAccess {
  MODEL_UPLOAD = 'model-upload',
  PIPELINE_UPLOAD = 'pipeline-upload',
  API = 'api',
}

function OptionCard(props: OptionCardProps) {
  const { highlighted, onClick, testid, name, label, icon, children } = props;
  return (
    <div
      className={clsx(
        styles.optionCard,
        highlighted ? styles.optionCard__highlighted : null
      )}
      onClick={onClick}
      data-testid={testid}>
      <div
        className={clsx(
          styles.optionCardHeader,
          highlighted ? styles.optionCardHeader__highlighted : null
        )}>
        <input
          type="radio"
          id={name}
          name="mode"
          value={name}
          checked={highlighted}
          onChange={() => undefined}></input>
        <div
          className={clsx(
            styles.optionItem,
            highlighted ? styles.optionItem__highlighted : null
          )}>
          <label>
            <div className={styles.optionIcon}>{icon}</div>
            {label}
          </label>
        </div>
      </div>
      <div className={styles.optionCardContent}>{children}</div>
    </div>
  );
}

function NewModelOptions({
  projectFlow = false,
  currentProjectId,
  onBackIconClick,
}: {
  projectFlow?: boolean;
  currentProjectId?: string;
  onBackIconClick?: () => void;
}) {
  const router = useRouter();
  const [mode, setMode] = React.useState<ModelAccess>();
  const [showNewModelUpload, setShowNewModelUpload] = useState(false);
  const [showNewPipelineUpload, setShowNewPipelineUpload] = useState(false);

  function Options() {
    return (
      <div
        style={{
          height: '70vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-around',
        }}>
        <div
          style={{
            height: '60vh',
            display: 'flex',
            flexDirection: 'row',
            gap: '20px',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <OptionCard
            highlighted={mode === ModelAccess.MODEL_UPLOAD}
            onClick={handleCardClick(ModelAccess.MODEL_UPLOAD)}
            name="model-upload"
            label="Upload AI Model"
            tip="for simple prediction models"
            icon={<FolderIcon></FolderIcon>}
            testid="new-model-option">
            <b>Supported frameworks</b>
            <div>LightGBM, Scikit-learn, TensorFlow, XGBoost</div>
            <br />
            <div>
              *Compatible with <b>tabular datasets only</b>
            </div>
            <br />
            <b>How It Works </b>
            <div>
              AI Verify will run the testing dataset against the AI model
              uploaded to generate predictions.
            </div>
          </OptionCard>
          <OptionCard
            highlighted={mode === ModelAccess.PIPELINE_UPLOAD}
            onClick={handleCardClick(ModelAccess.PIPELINE_UPLOAD)}
            name="pipeline-upload"
            label="Upload Pipeline"
            tip="for multi-model AI/ data preprocessing"
            icon={<Icon name={IconName.PIPELINE} size={24} />}
            testid="new-pipeline-option">
            <b>Supported frameworks</b>
            <div>Scikit-learn Pipeline</div>
            <br />
            <b>Supported datasets</b>
            <div>Tabular, Image</div>
            <br />
            <b>How It Works </b>
            <div>
              AI Verify will run technical tests using the uploaded test dataset
              and pipeline.
            </div>
          </OptionCard>
          <OptionCard
            highlighted={mode === ModelAccess.API}
            onClick={handleCardClick(ModelAccess.API)}
            name="api"
            label="Connect to AI Model API"
            tip="if the AI model file is not available for upload"
            testid="new-model-api-config"
            icon={<FolderIcon />}>
            <b>Supports</b>
            <div>
              Any AI Framework. <br />
              See: Supported API Configurations
              <br />
              <br />
            </div>
            <b>How It Works </b>
            <div>
              AI Verify will call the model API to generate predictions for the
              testing dataset.
            </div>
          </OptionCard>
        </div>
        <div
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            marginBottom: '50px',
          }}>
          <Button
            variant="contained"
            component="label"
            disabled={!mode}
            onClick={handleNextClick}
            data-testid="newmodel-next-button">
            Next &gt;
          </Button>
        </div>
      </div>
    );
  }

  function handleCardClick(mode: ModelAccess) {
    return () => {
      setMode(mode);
    };
  }

  function handleNextClick() {
    if (projectFlow) {
      if (mode === ModelAccess.MODEL_UPLOAD) {
        setShowNewModelUpload(true);
      } else if (mode === ModelAccess.PIPELINE_UPLOAD) {
        setShowNewPipelineUpload(true);
      } else if (mode === ModelAccess.API) {
        router.push({
          pathname: '/assets/newModelApiConfig',
          query: {
            from: 'selectModel',
            projectId: currentProjectId,
          },
        });
      }
      return;
    }

    if (mode == ModelAccess.MODEL_UPLOAD) {
      return router.push('/assets/newModelUpload');
    } else if (mode == ModelAccess.PIPELINE_UPLOAD) {
      return router.push('/assets/newPipelineUpload');
    } else if (mode == 'api') {
      return router.push('/assets/newModelApiConfig');
    }
  }

  function handleBackIconClick() {
    if (projectFlow && onBackIconClick) {
      setShowNewModelUpload(false);
      setShowNewPipelineUpload(false);
      onBackIconClick();
      return;
    } else {
      router.push('/assets/models');
    }
  }

  if (projectFlow) {
    if (showNewModelUpload) {
      return (
        <NewModelUploadModule
          withoutLayoutContainer
          onBackIconClick={handleBackIconClick}
        />
      );
    } else if (showNewPipelineUpload) {
      return (
        <NewPipelineUploadModule
          withoutLayoutContainer
          onBackIconClick={handleBackIconClick}
        />
      );
    } else {
      return (
        <Paper
          sx={{
            p: 2,
            m: 2,
            display: 'flex',
            flexDirection: 'column',
            height: '80vh',
            minHeight: '800px',
            paddingBottom: '50px',
          }}>
          <Box sx={{ mb: 2, height: '5%', display: 'flex' }}>
            <Button
              startIcon={<NavigateBeforeIcon />}
              color="secondary"
              sx={{ mr: 1 }}
              onClick={handleBackIconClick}
            />
            <Box sx={{ pl: 2, flexGrow: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Add New AI Model
              </Typography>
              <Typography sx={{ fontSize: 14 }}>
                How would you like AI Verify to access the AI model to be
                tested?
              </Typography>
            </Box>
          </Box>
          <Options />
        </Paper>
      );
    }
  } else {
    return <Options />;
  }
}

export default function NewModelModule({
  isProjectFlow = false,
  withoutLayoutContainer = false,
  currentProjectId,
  onBackIconClick,
}: {
  isProjectFlow?: boolean;
  currentProjectId?: string;
  withoutLayoutContainer?: boolean;
  onBackIconClick?: () => void;
}) {
  const router = useRouter();

  function handleBackIconClick() {
    if (onBackIconClick) {
      onBackIconClick();
      return;
    }
  }

  if (withoutLayoutContainer) {
    return (
      <NewModelOptions
        projectFlow={true}
        currentProjectId={currentProjectId}
        onBackIconClick={handleBackIconClick}></NewModelOptions>
    );
  }

  return (
    <div>
      <MinimalHeader />
      <div className="layoutContentArea">
        <Container maxWidth={false} className="scrollContainer">
          <Container maxWidth="xl" className="mainContainer">
            <Paper
              sx={{
                p: 2,
                m: 2,
                display: 'flex',
                flexDirection: 'column',
                height: '80vh',
                justifyContent: 'space-between',
              }}>
              <Box sx={{ height: '5%', display: 'flex' }}>
                <Button
                  startIcon={<NavigateBeforeIcon />}
                  color="secondary"
                  sx={{ mr: 1 }}
                  onClick={() => router.push('/assets/models')}
                  data-testid="newmodel-back-button"
                />
                <Box sx={{ pl: 2, flexGrow: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Add New AI Model
                  </Typography>
                  <Typography sx={{ fontSize: 14 }}>
                    How would you like AI Verify to access the AI model to be
                    tested?
                  </Typography>
                </Box>
              </Box>
              <NewModelOptions projectFlow={isProjectFlow}></NewModelOptions>
            </Paper>
          </Container>
        </Container>
      </div>
    </div>
  );
}
