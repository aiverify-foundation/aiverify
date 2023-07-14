import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import InputAdornment from '@mui/material/InputAdornment';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Unstable_Grid2';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import Project, { ProjectReportStatus } from 'src/types/project.interface';
import OutlinedInput from '@mui/material/OutlinedInput';
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import SearchIcon from '@mui/icons-material/Search';
import { useDeleteProject, useCloneProject } from 'src/lib/projectService';
import ProjectBox from './homeProjectBox';
import { debounce } from 'lodash';
import Button from '@mui/material/Button';
import { useTheme } from '@mui/material';
import Fuse from 'fuse.js';
import { content } from './constants';
import { serializeSearchResult } from './utils/serializeFuseSearchResult';

const fuseSearchOptions = {
  includeMatches: true,
  findAllMatches: true,
  useExtendedSearch: true,
  keys: ['projectInfo.name', 'projectInfo.description'],
};

type ProjectListProps = {
  projects: Project[];
};

export default function HomeProjectListComponent({
  projects,
}: ProjectListProps) {
  const deleteProjectFn = useDeleteProject();
  const cloneProjectFn = useCloneProject();
  const [myProjects, setMyProjects] = useState<Project[]>(projects);
  const [filters, setFilters] = useState<ProjectReportStatus[]>([]);
  const searchInputRef = useRef<HTMLInputElement>();
  const theme = useTheme();
  const router = useRouter();
  const widgetsFuseRef = useRef<Fuse<Project>>();

  const onDeleteProject = async (id: string) => {
    const idx = myProjects.findIndex((e) => e.id === id);
    if (idx < 0) return;

    const ar = [...myProjects];
    ar.splice(idx, 1);

    await deleteProjectFn(id);
    setMyProjects(ar);
  };

  const onCloneProject = async (id: string) => {
    const doc = await cloneProjectFn(id);
    const ar = [...myProjects, doc];
    setMyProjects(ar);
  };

  const handleFilterBtnClick = (filter: ProjectReportStatus) => {
    if (searchInputRef.current && searchInputRef.current.value.length) {
      searchInputRef.current.value = '';
    }
    const indexOfFilter = filters.indexOf(filter);
    let updatedFilters = [...filters];
    if (indexOfFilter > -1) {
      updatedFilters.splice(indexOfFilter, 1);
    } else {
      updatedFilters = [...filters, filter];
    }
    setFilters(updatedFilters);
  };

  const handleClearSearchBtnClick = () => {
    if (searchInputRef.current && searchInputRef.current.value.length) {
      searchInputRef.current.value = '';
      setMyProjects(projects);
    }
  };

  const handleTextChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
    if (e.target.value.trim() === '') {
      setMyProjects(projects);
      return;
    }
  };

  const debouncedSearch = debounce(async (text: string) => {
    if (!text) {
      setMyProjects(projects);
      return;
    }
    if (!widgetsFuseRef.current) return;

    const fuseSearchResult = widgetsFuseRef.current.search(`'${text}`);
    setMyProjects(serializeSearchResult(fuseSearchResult));
  }, 500);

  useEffect(() => {
    if (filters.length === 0) {
      setMyProjects(projects);
      return;
    }
    const filteredProjects = projects.reduce<Project[]>(
      (collection, current) => {
        if (
          current.report == undefined &&
          filters.indexOf(ProjectReportStatus.NotGenerated) > -1
        ) {
          return [...collection, current];
        }
        if (current.report && filters.indexOf(current.report.status) > -1) {
          return [...collection, current];
        }
        return collection;
      },
      []
    );
    setMyProjects(filteredProjects);
  }, [filters, projects]);

  useEffect(() => {
    return () => debouncedSearch.cancel();
  }, [debouncedSearch]);

  useEffect(() => {
    widgetsFuseRef.current = new Fuse(projects, fuseSearchOptions);
  }, []);

  return (
    <Stack>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: '25px' }}>
        <MenuBookIcon sx={{ mr: 1, width: '30px', height: '30px' }} />
        <Typography variant="heading4" sx={{ mt: 0.5 }}>
          {content.projectsListHeading}
        </Typography>
      </Box>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <OutlinedInput
            inputRef={searchInputRef}
            id="search"
            type="text"
            placeholder="Search project"
            sx={{ height: '36px', width: '300px', mb: '25px' }}
            onChange={handleTextChange}
            startAdornment={
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            }
          />
          <Button
            variant="text"
            sx={{
              textTransform: 'none',
              width: '80px',
              height: '36px',
              color: theme.palette.text.strong,
              fontSize: '14px',
              ml: '5px',
            }}
            onClick={handleClearSearchBtnClick}>
            Clear
          </Button>
        </div>
        <div>
          <span style={{ marginRight: '10px' }}>{content.filterHeading}</span>
          <Chip
            label={content.reportGenerated}
            variant={
              filters.indexOf(ProjectReportStatus.ReportGenerated) > -1
                ? 'filled'
                : 'outlined'
            }
            color="default"
            sx={{ mr: '5px' }}
            clickable
            onClick={() =>
              handleFilterBtnClick(ProjectReportStatus.ReportGenerated)
            }
          />
          <Chip
            label={content.reportNotGenerated}
            variant={
              filters.indexOf(ProjectReportStatus.NotGenerated) > -1
                ? 'filled'
                : 'outlined'
            }
            color="default"
            sx={{ mr: '5px' }}
            clickable
            onClick={() =>
              handleFilterBtnClick(ProjectReportStatus.NotGenerated)
            }
          />
          <Chip
            label={content.runningTests}
            variant={
              filters.indexOf(ProjectReportStatus.RunningTests) > -1
                ? 'filled'
                : 'outlined'
            }
            color="default"
            sx={{ mr: '5px' }}
            clickable
            onClick={() =>
              handleFilterBtnClick(ProjectReportStatus.RunningTests)
            }
          />
          <Chip
            label={content.generatingReport}
            variant={
              filters.indexOf(ProjectReportStatus.GeneratingReport) > -1
                ? 'filled'
                : 'outlined'
            }
            color="default"
            sx={{ mr: '5px' }}
            clickable
            onClick={() =>
              handleFilterBtnClick(ProjectReportStatus.GeneratingReport)
            }
          />
        </div>
      </div>
      <Grid container spacing={2}>
        {myProjects.map((project) => (
          <ProjectBox
            key={`${project.id}-box`}
            project={project}
            onDeleteProject={() => onDeleteProject(project.id as string)}
            onCloneProject={() => onCloneProject(project.id as string)}
          />
        ))}
        <Grid xs={4}>
          <Paper sx={{ display: 'flex', borderRadius: '8px' }}>
            <Box
              sx={{
                p: 2,
                height: '260px',
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: '100%',
                  height: '100%',
                  cursor: 'pointer',
                }}
                onClick={() => router.push('/project/create')}>
                <AddCircleOutlineOutlinedIcon
                  sx={{ fontSize: '45px', color: '#d2d2d2' }}
                />
                <p style={{ textAlign: 'center', marginTop: '6px' }}>
                  <span style={{ fontWeight: 'bold', marginTop: '8px' }}>
                    Create New Project
                  </span>
                  <br />
                  <span style={{ fontSize: '13px' }}>
                    Start a new project to test an AI Model and generate reports
                  </span>
                </p>
              </div>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Stack>
  );
}
