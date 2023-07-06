import { useRouter } from 'next/router';

import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Container from '@mui/material/Container';

import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';

import DatasetListComponent from './datasetList';
import { MinimalHeader } from '../home/header';

/**
 * Datasets page component
 */
export default function DatasetsModule() {
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
              <Box
                sx={{
                  mb: 2,
                  height: '5%',
                  display: 'flex',
                  alignItems: 'center',
                }}>
                <Button
                  startIcon={<NavigateBeforeIcon />}
                  color="secondary"
                  sx={{ mr: 1 }}
                  onClick={() => router.push('/assets')}
                  data-testid="datasets-back-button"
                />
                <Typography
                  variant="h6"
                  sx={{ pl: 2, flexGrow: 1, fontWeight: 'bold' }}>
                  Manage Assets &gt; Datasets
                </Typography>
              </Box>
              <Container
                sx={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'row-reverse',
                }}>
                <Button
                  variant="contained"
                  sx={{ mb: 1 }}
                  onClick={() => router.push('/assets/newDataset')}
                  data-testid="add-new-datasets-button">
                  New Dataset &#43;
                </Button>
              </Container>
              <DatasetListComponent />
            </Paper>
          </Container>
        </Container>
      </div>
    </div>
  );
}
