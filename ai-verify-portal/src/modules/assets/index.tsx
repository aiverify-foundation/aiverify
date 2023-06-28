import { useRouter } from 'next/router';

import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Unstable_Grid2';
import Container from '@mui/material/Container';

import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import FolderIcon from '@mui/icons-material/Folder';
import AddIcon from '@mui/icons-material/Add';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import HomeMenuButtonComponent from '../home/homeMenuButton';
import { MinimalHeader } from '../home/header';

import styles from './styles/new-asset.module.css';

/**
 * Assets page component
 */
export default function AssetsModule() {
  const router = useRouter();

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
              }}>
              <Box sx={{ height: '5%', display: 'flex', alignItems: 'center' }}>
                <Button
                  startIcon={<NavigateBeforeIcon />}
                  color="secondary"
                  sx={{ mr: 1 }}
                  onClick={() => router.push('/home')}
                  data-testid="assets-back-button"
                />
                <Typography
                  variant="h6"
                  sx={{ pl: 2, flexGrow: 1, fontWeight: 'bold' }}>
                  Manage Assets
                </Typography>
              </Box>
              <Box sx={{ p: 10, height: '95%' }}>
                <Grid container spacing={2} sx={{ mb: 1 }}>
                  <Grid xs={4}>
                    <div
                      className={styles.newButton}
                      onClick={() => router.push('/assets/newDataset')}
                      data-testid="add-new-dataset-button">
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'row',
                          gap: '20px',
                          height: '30px',
                          alignItems: 'center',
                        }}>
                        <InsertDriveFileIcon></InsertDriveFileIcon>
                        <div style={{ fontSize: '18px', fontWeight: '500' }}>
                          New Dataset
                        </div>
                      </div>
                      <AddIcon></AddIcon>
                    </div>
                  </Grid>
                  <Grid xs={4}>
                    <div
                      className={styles.newButton}
                      onClick={() => router.push('/assets/newModel')}
                      data-testid="add-new-model-button">
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'row',
                          gap: '20px',
                          height: '30px',
                          alignItems: 'center',
                        }}>
                        <InsertDriveFileIcon></InsertDriveFileIcon>
                        <div style={{ fontSize: '18px', fontWeight: '500' }}>
                          New AI Model
                        </div>
                      </div>
                      <AddIcon></AddIcon>
                    </div>
                  </Grid>
                </Grid>
                <Typography
                  variant="h6"
                  sx={{ pb: 2, fontWeight: 'bold', marginTop: '50px' }}>
                  Select Folder to open
                </Typography>
                <Grid container spacing={2} sx={{ mb: 1 }}>
                  <Grid xs={4}>
                    <HomeMenuButtonComponent
                      testid="open-dataset-list-button"
                      title="Datasets"
                      description="Datasets for testing, ground-truth & background"
                      onClick={() => router.push('/assets/datasets')}
                      MyIcon={FolderIcon}
                    />
                  </Grid>
                  <Grid xs={4}>
                    <HomeMenuButtonComponent
                      testid="open-model-list-button"
                      title="AI Models"
                      description="AI Models & Pipelines to be tested" //AI Models, Pipelines & API Configs
                      onClick={() => router.push('/assets/models')}
                      MyIcon={FolderIcon}
                    />
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </Container>
        </Container>
      </div>
    </div>
  );
}
