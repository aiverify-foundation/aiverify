import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';
import { gql, useSubscription } from '@apollo/client';
import { FileUploader } from "react-drag-drop-files";
import * as _ from 'lodash';
import axios from "axios";


import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Container from '@mui/material/Container';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ClearIcon from '@mui/icons-material/Clear';
import CircularProgress from '@mui/material/CircularProgress';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import DoDisturbIcon from '@mui/icons-material/DoDisturb';
import UploadIcon from '@mui/icons-material/Upload';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import IconButton from '@mui/material/IconButton';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';

import Dataset from 'src/types/dataset.interface';
import { useUpdateDataset } from 'src/lib/assetService';
import { Dialog, DialogActions, DialogContent, DialogTitle, FormControl, LinearProgress, ListItemButton, ListItemIcon } from '@mui/material';
import MyTextField from 'src/components/myTextField';
import { AlertType, StandardAlert } from 'src/components/standardAlerts';
import { MinimalHeader } from '../home/header';

import styles from './styles/new-asset.module.css';



type DatasetsPickingProps = {
    updateValidatingState: (arg: boolean) => void,
    updateFileList: (arg: Dataset[]) => void,
}

enum FileStatus {
    PENDING = 'Pending',
    VALID = 'Valid',
    INVALID = 'Invalid',
    ERROR = 'Error',
    CANCELLED = 'Cancelled'
}

function DatasetsPicking({updateValidatingState, updateFileList}: DatasetsPickingProps) {
    const [filesToUpload, setFilesToUpload] = useState<File[]>([])
    const [isUploading, setIsUploading] = useState<boolean>(false)
    const [progress, setProgress] = useState(0);
    const [isCancelled, setIsCancelled] = useState<boolean>(false)
    const [ alertTitle, setAlertTitle ] = useState<string | null>(null);
    const [ alertMessages, setAlertMessages ] = useState<string[]>([]);
    const [tryUpload, setTryUpload] = useState<boolean>(false)
    const [foldersToUpload, setFoldersToUpload] = useState<string[]>([])

    const ref = React.useRef<HTMLInputElement>(null);

    const handleSelectClick = () => {
        if (ref.current)
            ref.current.click();
    };

    useEffect(() => {
        if (ref.current !== null) {
            ref.current.setAttribute("directory", "");
            ref.current.setAttribute("webkitdirectory", "");
        }
    }, [ref]);

    const pickFolders = (event: React.ChangeEvent<HTMLInputElement>) => {
        const messages: string[] = [];
        if (!event.target)
            return;
        else {
            const { files } = event.target;
            // console.log("files selected are", files)
            const fileList = files as FileList;
            let isLargeFile = false;
            for (const file of fileList) {
                if (file.size > 4000000000) {
                    isLargeFile = true;
                }
            }
            if (isLargeFile == true) {
                messages.push("Maximum file upload size is 4GB. Please upload smaller files.")
                setAlertTitle("File selection error")
                setAlertMessages(messages)
            } else {
                setAlertTitle(null)
                setAlertMessages([])
                const pickedFiles = [
                    ...filesToUpload,
                    ...Array.from(fileList)
                ];
                setFilesToUpload(pickedFiles);
                if (fileList) {
                    const relativePath = fileList[0].webkitRelativePath;
                    const folder = relativePath.split("/");
                    // console.log("folder selected is: ", folder[0])
                    setFoldersToUpload(current => [...current, folder[0]]);
                }
            }
        }
    }

    function unpickDatasetFolder() {
        //clear filesToUpload
        setFilesToUpload([]);
        //clear foldersToUpload
        setFoldersToUpload([]);
    }

    function pickFiles(files: FileList) {
        const messages: string[] = [];
        if (!files)
            return;
        else {
            const fileList = files;
            if (fileList.length > 10) {
                messages.push("Maximum 10 files to be uploaded at once. Please select less files.")
                setAlertTitle("File selection error")
                setAlertMessages(messages)
            } else {
                let folderSelected = false;
                for (const file of fileList) {
                    if (file.size == 0){ // not always 0...
                        folderSelected = true;
                    }
                }
                if (folderSelected) {
                    messages.push("Folder upload not supported for drag and drop. For image datasets, please click on 'UPLOAD FOLDER' to select folder.")
                    setAlertTitle("File selection error")
                    setAlertMessages(messages)
                } else {
                    let isLargeFile = false;
                    for (const file of fileList) {
                        if (file.size > 4000000000) {
                            isLargeFile = true;
                        }
                    }
                    if (isLargeFile == true) {
                        messages.push("Maximum file size is 4GB. Please upload smaller files.")
                        setAlertTitle("File selection error")
                        setAlertMessages(messages)
                    } else {
                        setAlertTitle(null)
                        setAlertMessages([])
                        const pickedFiles = [
                            ...filesToUpload,
                            ...Array.from(fileList)
                        ];
                        setFilesToUpload(pickedFiles);
                    }
                }
            }         
        }
    }

    const unpickDatasetFile = (file: File) => {
        // console.log("Unpicking dataset: ", file.name)
        const idx = filesToUpload.indexOf(file);
        if (idx < 0)
            return;
        const ar = [...filesToUpload];
        ar.splice(idx, 1);
        setFilesToUpload(ar);
    }

    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;
        // console.log("isCancelled is now: ", isCancelled)

        const uploadDatasetFiles = async (signal: AbortSignal) => {

            if (!filesToUpload) {
                return;
            }
    
            const formData = new FormData();
            
            for (const file of filesToUpload) {
                formData.append('myFiles', file); 
                let folder = file.webkitRelativePath;
                if (folder.length > 0) {
                    // remove filename
                    folder = folder.split("/").slice(0,-1).join("/");
                    // console.log("folder", folder)
                }
                formData.append('myFolders', folder);
                // console.log('formData is : ', formData);
            }

            if (foldersToUpload.length != 0) {
                formData.append('myFolder', filesToUpload[0].webkitRelativePath.split("/").slice(0,-1).join("/"))
            }
    
            axios.post('/api/upload/data', formData, {
                signal: signal,
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        const progress = (progressEvent.loaded / progressEvent.total) * 50;
                        setProgress(progress);
                    }
                }
            }).then(response => {
                console.log("response is: ", response)
                const fileList: Dataset[] = []
                const data = response.data;
                for (const file of data) {
                    fileList.push(file as Dataset)
                }
                updateFileList(fileList)
                updateValidatingState(true)
                setIsUploading(false)
                // console.log("fileList is now: ", fileList)
            }).catch(error => {
                console.log(error)
                if (error.code == "ERR_CANCELLED"){
                    console.log("Upload cancelled")
                } else {
                    setAlertTitle("File upload error")
                    setAlertMessages(error.toString())
                }
                setFilesToUpload([])
                setProgress(0)
                setIsUploading(false)
                setIsCancelled(false)
            });
        }

        if (isCancelled) {
            controller.abort();
        } 
        
        if (isUploading) {
            uploadDatasetFiles(signal)
        }
        
        //cleanup function
        return () => {controller.abort();};

    }, [isCancelled, isUploading]);

    useEffect(() => {
        if (tryUpload) {
            const messages: string[] = [];
            if (foldersToUpload.length == 0 && filesToUpload.length > 10) {
                messages.push("Maximum 10 files to be uploaded at once. Please select less files.")
                setAlertTitle("File selection error")
                setAlertMessages(messages)
                setTryUpload(false)
            } else {
                //check if any files have the same name
                const alreadySeen: { [key: string]: boolean } = {};
                const filenames = filesToUpload.map(file => file.name);
                let isDuplicate = false;
                filenames.forEach(str => alreadySeen[str] ? isDuplicate = true : alreadySeen[str] = true);
                if (isDuplicate) {
                    messages.push("Please do not upload files with the same name.")
                    setAlertTitle("File selection error")
                    setAlertMessages(messages)
                    setTryUpload(false)
                } else {
                    setAlertTitle(null)
                    setAlertMessages([])
                    setIsUploading(true)
                    setTryUpload(false)
                }
            }
        }
    }, [tryUpload]);


    const Dropbox = () => 
        <Box sx={{height: '200px', display:'flex', flexDirection:'column', alignItems: 'center',
        backgroundColor:'#F3F0F5', border: '3px dotted', borderRadius: 3, pt:6}} data-testid="upload-file-dropbox">
            <UploadIcon/>
            <Typography sx={{ fontSize: 20 }} color="primary">
                Drag &#38; Drop or <b>Click to Browse</b>
            </Typography>
            <Typography sx={{ fontSize: 14 }}>
                Maximum 10 files per upload
            </Typography>
        </Box>
    
    const formatBytes = (bytes: number, decimals = 2) => {
        if (!+bytes) return '0 Bytes'

        const k = 1024
        const dm = decimals < 0 ? 0 : decimals
        const sizes: string[] = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

        const i: number = Math.floor(Math.log(bytes) / Math.log(k))

        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
    }


    return (
        <div style={{ display:'flex', flexDirection:'column', minHeight:'700px'}}>
        <div style={{ marginLeft:'3%', width: '90%', display:'flex', flexDirection:'row', justifyContent:'center', maxHeight:'240px', flexGrow: 2}}>
            <Box sx={{ flexGrow: 2, maxWidth: '580px'}}>
                <Typography sx={{ pl:2, fontSize: 20 }}>
                    Before uploading...
                </Typography>
                <Typography sx={{ pl:2, fontSize: 14 }}>
                    Check that the dataset file meets the following requirements.
                </Typography>
                <Box sx={{ width: '100%', border: '1px solid #C8C8C8', borderRadius: 3, p:3, m:2 }}>
                    <Typography sx={{ pl:2, fontSize: 14 }}>
                        <b>File Size:</b> Less than 4GB <br/>
                        <b>Data Format:</b> Pandas, Delimiter-separated Values (comma, tab, semicolon, pipe, space, colon), Image (jpeg, jpg, png)<br/>
                        {/* <b>Data Type:</b> Tabular, Image<br/> */}
                        <b>Serialiser Type:</b> Pickle or Joblib <br/>
                    </Typography>
                </Box>
            </Box>
            <Box sx={{ flexGrow: 3, pl:5, display:'flex', flexDirection:'column'}}>
                <FileUploader
                    multiple={true}
                    handleChange={pickFiles}
                    disabled={isUploading}
                    name="file-dropbox">
                    <Dropbox/>
                </FileUploader>
                <Box sx={{display: 'flex', flexDirection: 'row', alignItems: 'center'}}>
                    <Typography sx={{ fontSize: 14 }}>
                        For image datasets, 
                    </Typography>
                    <input disabled={isUploading || foldersToUpload.length != 0 || filesToUpload.length != 0} id="folder-input" type="file" ref={ref} onChange={pickFolders} style={{display: 'none'}}/>
                    <Button variant="text" onClick={handleSelectClick} data-testid="upload-folder-button">
                        Upload Folder
                    </Button>
                </Box>
            </Box>           
        </div>
        {alertTitle &&
            (<div style={{margin:'3%', width: '90%'}}>
                <StandardAlert
                    alertType={AlertType.ERROR}
                    headingText={alertTitle}
                    onCloseIconClick={()=>setAlertTitle(null)}>
                    <div>{alertMessages}</div>
                </StandardAlert>
            </div>)}
        <div style={{ marginLeft:'3%', width: '90%', flexGrow: 2}}>
            <Box sx={{ width: '100%', display:'flex', flexDirection:'column' }}>
                { isUploading == true && (
                    <div>
                        <Typography sx={{ pl:2, flexGrow:1, fontSize: 20 }}>
                            Uploading Files...
                        </Typography>
                        <div>
                            <LinearProgress variant="determinate" value={progress} />
                            <Button onClick={() => setIsCancelled(true)} data-testid="cancel-button">Cancel</Button>
                        </div>
                    </div>
                ) }
                { isUploading == false && foldersToUpload.length == 0 && (
                    <Typography sx={{ pl:2, flexGrow:1, fontSize: 20 }}>
                    Selected Files
                    </Typography>
                ) }
                {foldersToUpload.length == 0 && (
                    <Box sx={{ border: '1px solid #C8C8C8', borderRadius: 3, p:3, m:2, maxHeight: '300px', overflow: 'auto'}}>
                        <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
                        {filesToUpload.map( file => {
                            return (
                                <ListItem key={file.name}>
                                    <ListItemAvatar>
                                        <IconButton disabled={isUploading} onClick={() => {unpickDatasetFile(file)}} data-testid="unpick-file">
                                            <ClearIcon />
                                        </IconButton>
                                    </ListItemAvatar>
                                <ListItemText data-testid="dataset-upload-list" primary={file.name} secondary={formatBytes(file.size)} />
                            </ListItem>
                            );
                        })}
                        </List>
                    </Box>
                )}
                { isUploading == false && foldersToUpload.length != 0 && (
                    <Typography sx={{ pl:2, flexGrow:1, fontSize: 20 }}>
                    Selected Folders
                    </Typography>
                ) }
                {foldersToUpload.length != 0 && (
                    <Box sx={{ border: '1px solid #C8C8C8', borderRadius: 3, p:3, m:2, maxHeight: '300px', overflow: 'auto'}}>
                        <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
                        {foldersToUpload.map( (folder) => {
                            return (
                                <ListItem key={folder} >
                                    <ListItemAvatar>
                                        <IconButton disabled={isUploading} onClick={unpickDatasetFolder}>
                                            <ClearIcon />
                                        </IconButton>
                                    </ListItemAvatar>
                                <ListItemText primary={folder} />
                            </ListItem>
                            );
                        })}
                        </List>
                    </Box>
                )}
            </Box>
            <Container sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-end'}}>
                <Button variant="contained" component="label" disabled={filesToUpload.length==0 || isUploading==true } 
                onClick={() => setTryUpload(true)} data-testid="upload-datasets-button">
                    Upload selected files &gt;
                </Button>
            </Container>
        </div>
        </div>
    );
}


type DatasetsValidatingProps = {
    filesValidating: Dataset[],
    updateFile: (arg: Partial<Dataset>) => void,
    onBackClick?: () => void
}

function DatasetsValidating({filesValidating, updateFile, onBackClick}: DatasetsValidatingProps) {
    const router = useRouter();
    const [ focus, setFocus ] = useState<(Dataset & { _id?: string}) | null>(null);
    const [ edit, setEdit ] = useState<Dataset & { _id?: string} | null>(null);
    const [ openDialog, setOpenDialog ] = useState<boolean>(false);
    const [ datasetsValidating, setDatasetsValidating ] = useState<(Dataset & { _id?: string})[]>([])
    const [ isFailed, setIsFailed ] = useState(false);
    const [ duplicateName, setDuplicateName ] = useState<string>("");
    const [ validationDone, setValidationDone ] = useState<boolean>(false);

    const updateDatasetFn = useUpdateDataset()

    //update files displayed with latest data from parent
    useEffect(() => {
        setDatasetsValidating(filesValidating)
    }, [filesValidating])

    useEffect(() => {
        // console.log("datasetsValidating just updated to: ", JSON.stringify(datasetsValidating));
        if (focus) {
            // console.log("Updating Focus...");
            const dataset = datasetsValidating.find((e: Dataset) => e.id?.toString() === focus.id);
            if (dataset) {
                setFocus(dataset);
            }
        }else{
            // console.log("No files focused");
            onSetFocus(datasetsValidating[0]);
        }
    }, [JSON.stringify(datasetsValidating)])

    useEffect(() => {
        const stillValidating = datasetsValidating.find((e: Dataset) => e.status.toString() === FileStatus.PENDING);
        if (stillValidating) {
            setValidationDone(false);
        } else {
            setValidationDone(true);
        }
    }, [datasetsValidating])

    const onSetFocus = (dataset: Dataset) => {
        setFocus(dataset);
        setEdit(dataset);
    }

    const setCancelled = async (id: string, dataset: Partial<Dataset> ) => {
        const newDataset = {...dataset, status: "Cancelled"};
        const datasetInput = _.pick(newDataset, ["status"]);

        await updateDatasetFn(id, datasetInput)
        updateFile(newDataset);
    }


    useEffect(() => {
        const timerId = setTimeout(() => {
            console.log('Timeout ended');
            setIsFailed(true);
            /// call file deletion for files that are still in pending
            for ( const datasetValidating of datasetsValidating ) {
                if (datasetValidating.status == FileStatus.PENDING) {
                    if (datasetValidating._id) {
                        const dataset = datasetValidating;
                        const newDataset = {...dataset, status: "Error"};
                        const datasetInput = _.pick(newDataset, ["status"]);
                        if (dataset._id) {
                            updateDatasetFn(dataset._id.toString(), datasetInput);
                            updateFile(newDataset);
                        }
                    }
                }
            }
            
        }, 60000);
        
        return () => clearTimeout(timerId);
    }, [datasetsValidating]);

    const showDialog = () => {
        setOpenDialog(true);
    }

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setDuplicateName("");
    }

    const onUpdateDataset = async (id: any, dataset: Partial<Dataset> ) => {
        const datasetInput = _.pick(dataset, ['description', 'name']);
        // console.log("datasetInput is: ", datasetInput);
		const response = await updateDatasetFn(id.toString(), datasetInput)
        // console.log("response is: ", response)
        if (response == "Duplicate File") {
            console.log("Another file with the same name already exists, unable to update name to: ", datasetInput.name)
            if (datasetInput.name) setDuplicateName(datasetInput.name?.toString());
        } else {
            updateFile(dataset);
            handleCloseDialog();
        }     
	}

    const onChange = (key: string, value: string) => {
        if (!focus || !edit)
            return;

        if (key === "name"){
            setEdit({...edit, name: value});
        }else if (key === "description"){
            setEdit({...edit, description: value});
        }

    }

    function handleBackClick() {
        if (onBackClick) {
            onBackClick();
            return;
        }
        router.push('/assets/datasets');
    }


    return (
        <div>
            <div style={{ margin:'3%', width: '90%', display:'flex', flexDirection:'column'}}>
                {validationDone==true?
                    <Typography sx={{ pl:2, pt:2, fontSize: 20 }}>
                    Validation Complete
                    </Typography>:
                    <Typography sx={{ pl:2, pt:2, fontSize: 20 }}>
                    Validating Uploads...
                    </Typography>
                }
                <div style={{ width: '100%', display:'flex', flexDirection:'row', maxHeight: '80%'}}>
                    <Box sx={{ overflow: 'auto', width: '60%', maxHeight: '500px', border: '1px solid #C8C8C8', borderRadius: 3, p:3, m:2 }}>
                    
                        <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
                            {!isFailed && datasetsValidating && datasetsValidating.map(datasetValidating => 
                                <div key={datasetValidating._id} onClick={() => onSetFocus(datasetValidating)}
                                style={{ backgroundColor: (datasetValidating._id == focus?._id) ? '#F3F0F5' : '' }}>
                                    <ListItemButton>
                                        <ListItemAvatar>
                                            { datasetValidating.status == FileStatus.PENDING && (
                                                <CircularProgress size={20} />
                                            ) }
                                            { datasetValidating.status == FileStatus.VALID && (
                                                <CheckCircleOutlineIcon color="primary"/>
                                            ) }
                                            { datasetValidating.status == FileStatus.INVALID && (
                                                <HighlightOffIcon color="error"/>
                                            ) }
                                            { datasetValidating.status == FileStatus.ERROR && (
                                                <ErrorOutlineIcon color="error" />
                                            ) }
                                            { datasetValidating.status == FileStatus.CANCELLED && (
                                                <DoDisturbIcon color="error" />
                                            ) }
                                        </ListItemAvatar>
                                        <ListItemText primary={datasetValidating.name} secondary={datasetValidating.size} sx={{width: 360}}/>
                                        <ListItemIcon>
                                            <IconButton sx={{visibility:(datasetValidating.status == FileStatus.PENDING)?'visible':'hidden'}} 
                                            onClick={()=> setCancelled(datasetValidating._id as string, datasetValidating)} data-testid="cancel-validation-button">
                                                <StopCircleIcon />
                                            </IconButton>
                                        </ListItemIcon>
                                    </ListItemButton>
                                    <hr style={{margin:0, color: '#C8C8C8', backgroundColor: '#C8C8C8', height: '1px', border: 0, borderStyle: 'solid'}} />
                                </div>
                            )}
                            {isFailed && datasetsValidating && datasetsValidating.map(datasetValidating =>
                                <div key={datasetValidating._id} onClick={() => onSetFocus(datasetValidating)}
                                style={{ backgroundColor: (datasetValidating._id == focus?._id) ? '#F3F0F5' : '' }}>
                                <ListItemButton>
                                    <ListItemAvatar>
                                        { datasetValidating.status == FileStatus.PENDING && (
                                            //File upload and validation failed
                                            <ErrorOutlineIcon color="error" />
                                        ) }
                                        { datasetValidating.status == FileStatus.VALID && (
                                            <CheckCircleOutlineIcon color="primary"/>
                                        ) }
                                        { datasetValidating.status == FileStatus.INVALID && (
                                            <HighlightOffIcon color="error"/>
                                        ) }
                                        { datasetValidating.status == FileStatus.ERROR && (
                                            <ErrorOutlineIcon color="error" />
                                        ) }
                                        { datasetValidating.status == FileStatus.CANCELLED && (
                                            <DoDisturbIcon color="error" />
                                        ) }
                                    </ListItemAvatar>
                                        { datasetValidating.status == FileStatus.PENDING && (
                                            //File upload and validation failed
                                            <ListItemText primary={datasetValidating.name} secondary={`File upload failed. Please try again.`} />
                                        ) }
                                        { datasetValidating.status == FileStatus.VALID && (
                                            <ListItemText primary={datasetValidating.name} secondary={datasetValidating.size} />
                                        ) }
                                        { datasetValidating.status == FileStatus.INVALID && (
                                            <ListItemText primary={datasetValidating.name} secondary={datasetValidating.size} />
                                        ) }
                                        { datasetValidating.status == FileStatus.ERROR && (
                                            <ListItemText primary={datasetValidating.name} secondary={`File upload failed. Please upload again.`} />
                                        ) }
                                        { datasetValidating.status == FileStatus.CANCELLED && (
                                            <ListItemText primary={datasetValidating.name} secondary={`File validation cancelled. Please upload again`} />
                                        ) }
                                </ListItemButton>
                                    <hr style={{margin:0, color: '#C8C8C8', backgroundColor: '#C8C8C8', height: '1px', border: 0, borderStyle: 'solid'}} />
                                </div>
                        )}
                        </List>
                    </Box>
                    {(focus && edit && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', overflow: 'auto', width: '40%', maxHeight: '500px', height: '100%', border: '1px solid #C8C8C8', borderRadius: 3, p:3, m:2 }}>
                            {focus && focus.status == FileStatus.VALID && (
                                <Button color="secondary" sx={{mr:1, alignSelf:'flex-end'}} 
                                onClick={() => showDialog()}>
                                    Edit
                                </Button>
                            )}
                            <Typography sx={{fontWeight: 'bold', mb: 3}}> {focus.name}</Typography>
                            <Typography sx={{fontSize: 14 }}>
                                <b>Status:</b> {focus.status} <br/>
                                <b>Type:</b> {focus.type} <br/>
                                <b>Date Uploaded:</b> {new Date(focus.ctime).toLocaleString()} <br/>
                                <b>Size:</b> {focus.size} <br/>
                                {(focus.status == FileStatus.VALID)?
                                <Typography sx={{fontSize: 14 }}>
                                    <b>Shape:</b> {focus.numRows} Rows | {focus.numCols} Cols <br/>
                                    <b>Serializer:</b> {focus.serializer} <br/>
                                    <b>Data Format:</b> {focus.dataFormat} <br/>
                                    <b>Description:</b> {focus.description}<br/>
                                </Typography>
                                :''}
                            </Typography>
                            {focus.status == FileStatus.VALID && (
                                <TableContainer component={Paper} sx={{ maxWidth: '100%', marginTop: '10px'}}>
                                <Table sx={{ width: '100%'}}>
                                    <TableHead sx={{ backgroundColor: '#F5F1F3'}}>
                                    <TableRow>
                                        <TableCell><b>Datatype</b></TableCell>
                                        <TableCell><b>Column Name</b></TableCell>
                                    </TableRow>
                                    </TableHead>
                                    <TableBody>
                                    {focus.dataColumns && focus.dataColumns.map((dataColumn) => (
                                        <TableRow
                                        key={dataColumn.name}
                                        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                        >
                                        <TableCell>
                                        <div className={styles.badge}>{dataColumn.datatype}</div>
                                        </TableCell>
                                        <TableCell component="th" scope="row">
                                            {dataColumn.name}
                                        </TableCell>
                                        
                                        </TableRow>
                                    ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            )}
                            {focus.errorMessages && (
                                <Box sx={{ width: '90%', backgroundColor: '#FADFDF', borderRadius: 3, p:3, m:2, overflowWrap: 'anywhere' }}>
                                    <Typography sx={{fontSize: 14 }}>{focus.errorMessages}</Typography>
                                </Box>
                            )}
                        </Box>
                    ))}
                </div>
                <Container sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-end'}}>
                    <Button variant="contained" component="label"
                        onClick={handleBackClick} >
                        Back to all Datasets &gt;
                    </Button>
                </Container>
            </div>
            {edit && (
                <Dialog
                    open={openDialog}
                    onClose={handleCloseDialog}
                    maxWidth="md"
                    fullWidth
                >
                    <DialogTitle>Edit Dataset Information</DialogTitle>
                    <DialogContent>
                        <Typography sx={{mb:2, fontWeight:'bold', size: '14px' }}>{edit.name}</Typography>
                        <FormControl sx={{ mt: 1, width: '100%' }} >
                            <MyTextField
                                id='dataset-name'
                                title="Dataset Name"
                                inputProps={{
                                    multiline: true,
                                    onChange: (e: any) => onChange('name', e.target.value),
                                    value: edit.name,
                                    placeholder: "Enter name to identify this dataset",
                                }}
                                FormControlProps={{
                                    sx: {mt:1, mb:1}
                                }}
                            />
                            {duplicateName && (duplicateName != "") && (
                                <Typography sx={{mb:2, size: '12px', color: 'red'}}>
                                    <i>Another file with the same name already exists, unable to update name to: {duplicateName}</i>
                                </Typography>
                            )}
                        </FormControl>
                        <Typography sx={{fontSize: 14, lineHeight: '150%'}}>
                            <p><b>Status</b> <br/>{edit.status} </p>
                            {edit.errorMessages && (
                                <Typography sx={{fontSize: 14 }}>
                                    <Box sx={{backgroundColor: '#FADFDF', borderRadius: 3, p:2, m:1 }}>
                                        {edit.errorMessages}
                                    </Box>
                                </Typography>
                            )}
                            <p><b>File Name</b> <br/>{edit.filename}</p>
                            <p><b>Type</b> <br/>{edit.type}</p>
                            <p><b>Date Uploaded</b> <br/>{new Date(edit.ctime).toLocaleString()}</p>
                            <p><b>Size</b> {edit.size}</p>
                            <p><b>Shape:</b> {edit.numRows} Rows | {edit.numCols} Cols</p>
                            <p><b>Serializer</b> {edit.serializer}</p>
                            <p><b>Data Format</b> {edit.dataFormat}</p>
                        </Typography>
                        <FormControl sx={{ width: '100%' }} >
                            <MyTextField
                                id='dataset-description'
                                title="Dataset Description"
                                inputProps={{
                                    multiline: true,
                                    onChange: (e: any) => onChange('description', e.target.value),
                                    value: edit.description,
                                    placeholder: "Enter dataset description",
                                }}
                                FormControlProps={{
                                    sx: {mt:1, mb:1}
                                }}
                            />
                        </FormControl>
                        {edit.status == FileStatus.VALID && (
                            <TableContainer component={Paper} sx={{ maxWidth: '400px', marginTop: '10px'}}>
                            <Table sx={{ width: '100%'}}>
                                <TableHead sx={{ backgroundColor: '#F5F1F3'}}>
                                <TableRow>
                                    <TableCell><b>Datatype</b></TableCell>
                                    <TableCell><b>Column Name</b></TableCell>
                                </TableRow>
                                </TableHead>
                                <TableBody>
                                {edit.dataColumns && edit.dataColumns.map((dataColumn) => (
                                    <TableRow
                                    key={dataColumn.name}
                                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                    >
                                    <TableCell>
                                    <div className={styles.badge}>{dataColumn.datatype}</div>
                                    </TableCell>
                                    <TableCell component="th" scope="row">
                                        {dataColumn.name}
                                    </TableCell>
                                    
                                    </TableRow>
                                ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>Cancel</Button>
                        <Button onClick={() => onUpdateDataset(edit._id, edit)}>Save & Close</Button>
                    </DialogActions>
                </Dialog>
            )}
        </div>
    )

}




export default function NewDatasetModule({ withoutLayoutContainer = false, onBackIconClick } : { withoutLayoutContainer?: boolean, onBackIconClick?: () => void  }) {
    const router = useRouter();
    const [ isValidating, setIsValidating ] = React.useState<boolean>(false);
    const [ fileList, setFileList ] = useState<Dataset[]>([]);
    const [ filesValidating, setFilesValidating ] = useState<(Dataset & {_id?: string})[]>([]); //👈 Sort out id at Dataset type definition level.
   

    const VALIDATE_DATASET_UPDATED = gql`
        subscription validateDatasetUpdated {
            validateDatasetStatusUpdated {
                _id
                dataColumns {
                    name
                    datatype
                    label
                }
                numRows
                numCols
                status
                serializer
                dataFormat
                errorMessages
            }
        }
    `;


    useSubscription(
        VALIDATE_DATASET_UPDATED, {
            fetchPolicy: 'network-only',
            onData: payload => {
                console.log('Status updated Event----', payload);
                const { data } = payload;
                if (data == undefined || data.data.validateDatasetStatusUpdated == undefined) return;
                const updatedFileInfo = data.data.validateDatasetStatusUpdated;
                if (updatedFileInfo.status.toUpperCase() === 'PENDING') return; // we only care about status other then 'pending'
        
                setFilesValidating(current => {
                    // going into this code block, updatedFileInfo.status is either Valid or Invalid
                    const updatedFilesValidating = current.map(file => {
                        //id saved as id even though filesValidating from datasetPicking is saved as Dataset, how to fix?
                        if (file._id === updatedFileInfo._id) {
                            file.status = updatedFileInfo.status;
                            file.dataColumns = updatedFileInfo.dataColumns;
                            file.numRows = updatedFileInfo.numRows;
                            file.numCols = updatedFileInfo.numCols;
                            file.serializer = updatedFileInfo.serializer;
                            file.dataFormat = updatedFileInfo.dataFormat;
                            file.errorMessages = updatedFileInfo.errorMessages;
                        }
                        return file;
                    });
                    return updatedFilesValidating;
                })
            }
        }
    );

    function handleBackIconClick() {
        if (onBackIconClick) {
            onBackIconClick();
            return;
        }
        router.push('/assets/datasets');
    }


    const updateFileList = (datasetFiles: Dataset[]):void => {
        setFileList(datasetFiles)
    }

    const updateValidatingState = (validatingState: boolean):void => {
        setIsValidating(validatingState)
    }

    const updateFile = (dataset: Partial<Dataset> & { _id?: string}):void => {
        setFilesValidating(current => {
            // going into this code block, updatedFileInfo.status is either Valid or Invalid
            const updatedFilesValidating = current.map(file => {
                if (file._id === dataset._id) {
                    if (dataset.name) {
                        file.name = dataset.name;
                    }
                    if (dataset.description) {
                        file.description = dataset.description;
                    }
                    if (dataset.status) {
                        file.status = dataset.status;
                    }
                }
                return file;
            });
            return updatedFilesValidating;
        })
    }

    // useEffect(() => {
    //     console.log("fileList updated to : ", fileList)
    // }, [fileList])


    //populate filesValidating with Dataset[] from picking
    useEffect(() => {
        if (fileList.length === 0) return;
        // console.log("fileList is now: ", fileList);

        //add most recently uploaded datasets to datasetsValidating list (regardless of pending/done state)
        for (const file of fileList) {
            const fileValidating = filesValidating.find(e => e.id?.toString() === file.id?.toString());
            if (fileValidating) {
                // console.log("File ", file.name, " already in datasetsValidating")
            } else {
                // console.log("File ", file.name, " is not in datasetsValidating, adding file to datasetsValidating")
                setFilesValidating(filesValidating => (
                    [...filesValidating, {...file}]
                ));
            }
        }
    }, [fileList])

    if (withoutLayoutContainer) {
        return <Paper sx={{ p:2, m:2, display:'flex', flexDirection:'column', height: '80vh', minHeight: '800px', paddingBottom: '50px'}} >
            <Box sx={{ mb: 2, height:'5%', display:'flex', alignItems:'center'}}>
                <Button startIcon={<NavigateBeforeIcon />} color="secondary" sx={{mr:1}}
                    onClick={handleBackIconClick}
                />
                <Typography variant="h6" sx={{ pl:2, flexGrow:1, fontWeight:'bold' }}>
                    Add New Datasets
                </Typography>
            </Box>
            { isValidating==false && (
                <DatasetsPicking updateValidatingState={updateValidatingState} updateFileList={updateFileList}></DatasetsPicking>
            )}
            { isValidating==true && (
                <DatasetsValidating filesValidating={filesValidating} updateFile={updateFile} onBackClick={handleBackIconClick}></DatasetsValidating>
            )}
        </Paper>
    }

    return (
        <div>
            <MinimalHeader />
            <div className="layoutContentArea">
            <Container maxWidth={false} className="scrollContainer">
                <Container maxWidth="xl" className="mainContainer">
                    <Paper sx={{ p:2, m:2, display:'flex', flexDirection:'column', height: '80vh', minHeight: '800px', paddingBottom: '50px'}} >
                        <Box sx={{ mb: 2, height:'5%', display:'flex', alignItems:'center'}}>
                            <Button startIcon={<NavigateBeforeIcon />} color="secondary" sx={{mr:1}}
                                onClick={() => router.push('/assets/datasets')} data-testid="newdataset-back-button"
                            />
                            <Typography variant="h6" sx={{ pl:2, flexGrow:1, fontWeight:'bold' }}>
                                Add New Datasets
                            </Typography>
                        </Box>
                        { isValidating==false && (
                            <DatasetsPicking updateValidatingState={updateValidatingState} updateFileList={updateFileList}></DatasetsPicking>
                        )}
                        { isValidating==true && (
                            <DatasetsValidating filesValidating={filesValidating} updateFile={updateFile}></DatasetsValidating>
                        )}
                    </Paper>
                </Container>
            </Container>
            </div>
        </div>
      
    );
}