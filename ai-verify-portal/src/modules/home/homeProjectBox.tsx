import { useState, useEffect, ReactElement } from "react";
import { useRouter } from "next/router";
import { Box, CircularProgress, Divider, IconButton, Tooltip, Typography, Chip } from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import ImportContactsIcon from '@mui/icons-material/ImportContacts';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import AccessTimeFilledIcon from '@mui/icons-material/AccessTimeFilled';
import EditIcon from '@mui/icons-material/Edit';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import { useSubscribeReportStatusUpdated } from "src/lib/projectService";
import Project, { ProjectReportStatus, Report } from "src/types/project.interface";
import { formatDate } from 'src/lib/utils';
import ConfirmationDialog from "src/components/confirmationDialog";
import { useCancelTestRuns } from 'src/lib/projectService';
import { content } from "./constants";
import clsx from "clsx";
import styles from './styles/projectCard.module.css';


type ProjectStatusProps = {
	projectId: string;
	reportStatus: ProjectReportStatus;
	reportAlgorithmGIDs: string[]; 
	updatedDateDisplay: string;
}

type ProjectBoxProps = {
	project: Project;
	onDeleteProject: () => void;
	onCloneProject: () => void;
}

type StatusBadgeColors = 'default'
	| 'primary'
	| 'secondary'
	| 'error'
	| 'info'
	| 'success'
	| 'warning'

function StatusBadge({
	reportStatus,
	projectId
}: Partial<ProjectStatusProps>) {
	const router = useRouter()
	let icon: ReactElement;
	let statusText = '';
	let color: StatusBadgeColors = 'default';

	const onStatusClick = () => projectId != undefined ? router.push(`/reportStatus/${projectId}`) : null;

	switch (reportStatus) {
		case ProjectReportStatus.GeneratingReport:
			color = 'secondary';
			statusText = content.generatingReport;
			return <Chip
				icon={<CircularProgress color='secondary' size="18px" />} 
				label={statusText}
				variant="outlined"
				color={color}
				onClick={onStatusClick}
				clickable/>
		case ProjectReportStatus.RunningTests:
			color = 'secondary';
			statusText = content.runningTests;
			return <Chip
				icon={<CircularProgress color='secondary' size="18px" />} 
				label={statusText}
				variant="outlined"
				color={color}
				onClick={onStatusClick}
				clickable/>
		case ProjectReportStatus.ReportGenerated:
			icon = <CheckCircleIcon />;
			statusText = content.reportGenerated;
			color='success';
			break;
		default:
			icon = <AccessTimeFilledIcon />;
			statusText = content.reportNotGenerated;
			color='warning'
	}
	return <Chip icon={icon} label={statusText} variant="outlined" color={color} sx={{ width: { md: '100px', lg: 'auto' }}}/>
}

function ProjectStatus({
	projectId,
	reportStatus,
	reportAlgorithmGIDs = [],
	updatedDateDisplay
}: ProjectStatusProps) {
	const [status, setStatus] = useState<ProjectReportStatus>();
	const [isRunningTestsOrGenerating, setIsRunningTestsOrGenerating] = useState(false);
  const cancelTestRuns = useCancelTestRuns();

	async function handleCancelRunClick() {
		try {
      const response = await cancelTestRuns(projectId, reportAlgorithmGIDs)
			if (response && response.status !== undefined) {
				setStatus(response.status);
				setIsRunningTestsOrGenerating(false);
			}
    } catch(err) {
      console.error("Cancel test run error:", err);
		}
	}

	useEffect(() => {
		setStatus(reportStatus);
		setIsRunningTestsOrGenerating(reportStatus === ProjectReportStatus.GeneratingReport || reportStatus === ProjectReportStatus.RunningTests);
	}, [])

	return (
		<Box sx={{ height:'40px', mb:1, display:'flex', alignItems:'center', justifyContent: 'space-between' }}>
			<div style={{ display: 'flex', alignItems: 'center'}}>
				<StatusBadge projectId={projectId} reportStatus={status}/>
				{isRunningTestsOrGenerating ? 
					<Chip
						icon={<StopCircleIcon style={{ color: '#f92727', marginLeft: '5px', fontSize: '22px'}} />} 
						label='Cancel'
						variant='filled'
						onClick={handleCancelRunClick}
						style={{ backgroundColor: '#fde0e0', marginLeft: '10px', color: '#474747'}}
						clickable/> : null
				}
			</div>
			<Box sx={{ width:'150px', textAlign:'right' }}>
				<Typography sx={{ fontWeight:'bold', fontSize: '13px' }}>{content.lastModified}</Typography>
				<Typography sx={{ fontSize: '13px'}}>{updatedDateDisplay}</Typography>
			</Box>
		</Box>
	)
}

export default function ProjectBox ({project, onDeleteProject, onCloneProject}: ProjectBoxProps) {
	const router = useRouter()
	const [ report, setReport ] = useState<Report | undefined>(project.report);
	const [ updatedReport, updatedReportLoading ] = useSubscribeReportStatusUpdated(project.id as string);
	const [ showDeleteConfirmation, setShowDeleteConfirmation ] = useState<boolean>(false);
	const [ lastModifiedDateDisplay, setLastModifiedDateDisplay ] = useState<string>('');
	let reportAlgorithmGIDs: string[] = [];
	if (project.report && project.report.tests) {
		reportAlgorithmGIDs = project.report.tests.map(test => test.algorithmGID);
	}

	useEffect(() => {
    if (updatedReportLoading)
      return;
    const data = updatedReport?.reportStatusUpdated;
		if (data != undefined) {
			setReport(prevState => ({
				...prevState,
				...data,
			}))
		}
  }, [updatedReport, updatedReportLoading]);

	useEffect(() => {
		const formattedLastModified = formatDate(project.createdAt);
		setLastModifiedDateDisplay(formattedLastModified);
	}, [project.createdAt])

	const deleteProjectHandler = () => {
		setShowDeleteConfirmation(true);
	}

	const onDeleteProjectConfirmationClose = (confirm: boolean) => {
		setShowDeleteConfirmation(false);
    if (!confirm || !project.id)
      return;
		onDeleteProject();
	}

	function handleViewReportClick(projectId: string | undefined) {
		return () => {
			if (!projectId) {
				console.error('projectId is undefined');
				return;
			}
			window.open(`/api/report/${projectId}`, '_blank');
		}
		
	}

	return (
		<Grid xs={4}>
			<div
				className={clsx(styles.projCardContainer, "aiv-projectcard")}
				style={{ display:'flex', borderRadius: '8px', minWidth: '370px' }}
				data-test-id={`aiv-project-card-${project.id}`}>
				<div
					key={`${project.id}-item`}
					style={{ padding:'12px  10px 12px 20px', height:'260px', flexGrow:1, display:'flex', flexDirection:'column' }}>
					<Tooltip
						title={<Typography fontSize={18}>{project.projectInfo.name}</Typography>}
						placement="bottom-start">
					<div>
					<Typography
						variant="heading3"
						color="text.strong"
						sx={{
							textOverflow: 'ellipsis',
							overflow: 'hidden',
							display: 'inline-block',
							width: '280px',
							whiteSpace: 'nowrap',
							textTransform: 'capitalize'
						}}>{project.projectInfo.name}</Typography></div></Tooltip>
					<div style={{ flexGrow:1 }}>
						{project.template && (
							<Typography variant='body1' sx={{ display:'flex', alignItems:'center',  textTransform: 'capitalize'}}>
								<ImportContactsIcon sx={{ mr: '5px' , fontSize:'20px'}} />
								{project.template.projectInfo.name}
							</Typography>
						)}
					</div>
					<ProjectStatus
						projectId={project.id as string}
						reportAlgorithmGIDs={reportAlgorithmGIDs}
						reportStatus={report?.status as ProjectReportStatus}
						updatedDateDisplay={lastModifiedDateDisplay}/>
				</div>
				<Divider orientation="vertical" flexItem />
				<Box sx={{ width:'70px', alignItems:'center', display:'flex', flexDirection:'column' }}>
					<Tooltip title="View Report" placement="right-start">
						<div><IconButton
							data-test-id="aiv-projectcard-view-report"
							aria-label="View Report" 
							sx={{ fontSize:'25px', mt:1 }}
							disabled={report?.status !== ProjectReportStatus.ReportGenerated}
							onClick={handleViewReportClick(project.id)}
						>
							<PictureAsPdfOutlinedIcon fontSize='inherit' />
						</IconButton></div>
					</Tooltip>
					<Tooltip title="Edit Project" placement="right-start">
						<div><IconButton
							data-testid="aiv-projectcard-edit-project" 
							aria-label="Edit Project" sx={{ fontSize:'25px', mt:1 }}
							onClick={() => router.push(`/project/${project.id}`)}>
							<EditIcon fontSize='inherit' />
						</IconButton></div>
					</Tooltip>
					<Tooltip title="Copy Project to new project" placement="right-start">
						<div><IconButton
							data-testid="aiv-projectcard-close-project" 
							aria-label="Copy Project" sx={{ fontSize:'25px', mt:1 }} onClick={onCloneProject}>
							<ContentCopyIcon fontSize='inherit' />
						</IconButton></div>
					</Tooltip>
					<Tooltip title="Delete Project" placement="right-start">
						<div><IconButton 
							data-testid="aiv-projectcard-delete-project" 
							aria-label="Delete Project" sx={{ fontSize:'25px', mt:1 }} onClick={deleteProjectHandler}>
							<DeleteIcon fontSize='inherit'  />
						</IconButton></div>
					</Tooltip>
				</Box>
			</div>
			{showDeleteConfirmation ?
				<ConfirmationDialog
					title='Remove Project'
					onClose={onDeleteProjectConfirmationClose}>
						<p style={{ height: 100, textAlign: 'center', marginTop: '20px' }}>Permanently remove the following project<br/> <Typography
							variant="heading5"
							color="text.strong"
							sx={{
								textTransform: 'capitalize',
							}}>{project.projectInfo.name}</Typography>
						</p>
				</ConfirmationDialog> : null}
		</Grid>
	)
}