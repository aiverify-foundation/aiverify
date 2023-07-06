import { useRouter } from 'next/router';

import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Unstable_Grid2';
import Container from '@mui/material/Container';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import StorageIcon from '@mui/icons-material/Storage';
import PowerIcon from '@mui/icons-material/Power';
import ImportContactsIcon from '@mui/icons-material/ImportContacts';

import HomeMenuButtonComponent from './homeMenuButton';
import HomeProjectListComponent from './homeProjectList';
import Project from 'src/types/project.interface';
import { MinimalHeader } from './header';

type Props = {
  projects: Project[];
};

/**
 * Homepage component
 */
export default function HomeModule({ projects }: Props) {
  const router = useRouter();

  return (
    <div>
      <MinimalHeader enableMenu={false} />
      <div className="layoutContentArea">
        <Container maxWidth={false} className="scrollContainer">
          <Container maxWidth="xl" className="mainContainer">
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Box
                sx={{
                  height: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
                  pb: '12px',
                }}>
                <Typography variant="heading4">
                  Welcome, what would you like to do today?
                </Typography>
              </Box>
              <Grid container spacing={2} sx={{ mb: '45px' }}>
                <Grid xs={3}>
                  <HomeMenuButtonComponent
                    testid="new-project-button"
                    title="Create New Project"
                    description="Test an AI Model and generate reports"
                    onClick={() => router.push('/project/create')}
                    MyIcon={MenuBookIcon}
                  />
                </Grid>
                <Grid xs={3}>
                  <HomeMenuButtonComponent
                    testid="manage-models-data-button"
                    title="Models & Data"
                    description="Manage models and datasets"
                    onClick={() => router.push('/assets')}
                    MyIcon={StorageIcon}
                  />
                </Grid>
                <Grid xs={3}>
                  <HomeMenuButtonComponent
                    testid="manage-plugins-button"
                    title="Plugins"
                    description="Manage plugins"
                    onClick={() => router.push('/plugins')}
                    MyIcon={PowerIcon}
                  />
                </Grid>
                <Grid xs={3}>
                  <HomeMenuButtonComponent
                    testid="build-new-template-button"
                    title="Report Templates"
                    description="Manage report templates"
                    onClick={() => router.push('/projectTemplates')}
                    MyIcon={ImportContactsIcon}
                  />
                </Grid>
              </Grid>
              <HomeProjectListComponent projects={projects} />
            </Box>
          </Container>
        </Container>
      </div>
    </div>
  );
}
