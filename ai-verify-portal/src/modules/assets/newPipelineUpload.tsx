import { useRouter } from 'next/router';
import React, { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { gql, useSubscription } from '@apollo/client';
import * as _ from 'lodash';
import axios from "axios";
import { useDropzone, FileWithPath } from "react-dropzone";

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
import StopCircleIcon from '@mui/icons-material/StopCircle';
import IconButton from '@mui/material/IconButton';
import UploadIcon from '@mui/icons-material/Upload';

import FormControl from '@mui/material/FormControl';

import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';

import ModelFile, { ModelType } from 'src/types/model.interface';
import { useUpdateModel } from 'src/lib/assetService';
import { Dialog, DialogActions, DialogContent, DialogTitle, LinearProgress, ListItemButton, ListItemIcon, SelectChangeEvent } from '@mui/material';
import MySelect from 'src/components/mySelect';
import MyTextField from 'src/components/myTextField';
import { AlertType, StandardAlert } from 'src/components/standardAlerts';
import { MinimalHeader } from '../home/header';


type PipelinesPickingProps = {
    updateValidatingState: (arg: boolean) => void,
    updateFileList: (arg: ModelFile[]) => void,
}

enum FileStatus {
    PENDING = 'Pending',
    VALID = 'Valid',
    INVALID = 'Invalid',
    ERROR = 'Error',
    CANCELLED = 'Cancelled'
}

function PipelinesPicking({updateValidatingState, updateFileList}: PipelinesPickingProps) {
    const [filesToUpload, setFilesToUpload] = useState<File[]>([])
    const [foldersToUpload, setFoldersToUpload] = useState<string[]>([])
    const [modelTypes, setModelTypes] = useState<string[]>([])
    const [folderModelType, setFolderModelType] = useState<string>("Classification")
    const [isUploading, setIsUploading] = useState<boolean>(false)
    const [progress, setProgress] = useState(0);
    const [isCancelled, setIsCancelled] = useState<boolean>(false)
    const [ alertTitle, setAlertTitle ] = useState<string | null>(null);
    const [ alertMessages, setAlertMessages ] = useState<string[]>([]);
    const [tryUpload, setTryUpload] = useState<boolean>(false)

    const ref = React.useRef<HTMLInputElement>(null);

    const handleSelectClick = () => {
        if (ref.current) {
            ref.current.setAttribute("directory", "");
            ref.current.setAttribute("webkitdirectory", "");
            ref.current.click();
        }
    };

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
                // check if all the files start w the same (if they are in the same folder)
                const folderList: string[] = [];
                for (const file of fileList) {
                    if (file.webkitRelativePath) {
                        // console.log("file.webkitRelativePath is: ", file.webkitRelativePath)
                        folderList.push(file.webkitRelativePath?.split("/")[0]);
                    }
                }
                const firstFolder = folderList[0];

                // use Array.every to check if all strings in the editedStrings array are equivalent
                if ( !folderList.every((str) => str === firstFolder) ) {
                    messages.push("Maximum 1 folder per upload.")
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
                        const folder = relativePath.split("/")[0];
                        // console.log("folder selected is: ", folder)
                        setFoldersToUpload(current => [...current, folder]);
                    }
                }

                
            }
        }
    }

    function pickPipeline (files: FileWithPath[]) {
      const messages: string[] = [];
      if (!files)
            return;
      else {
          const fileList = files;
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
            // check if all the files start w the same (if they are in the same folder)
            const folderList: string[] = [];
            for (const file of fileList) {
                if (file.path) {
                    folderList.push(file.path?.split("/")[1]);
                }
            }
            const firstFolder = folderList[0];

            // use Array.every to check if all strings in the editedStrings array are equivalent
            if ( !folderList.every((str) => str === firstFolder) ) {
                messages.push("Maximum 1 folder per upload.")
                setAlertTitle("File selection error")
                setAlertMessages(messages)
            } else {
                
                //type files in FileList into FileWithPath
                
                if (fileList) {
                    // console.log("fileList[0] is: ", fileList[0])
                    const firstFile = fileList[0]
                    const folder = firstFile.path?.split("/")[1];
                    if (folder){
                        const pickedFiles = [
                            ...filesToUpload,
                            ...Array.from(fileList)
                        ];
                        setFilesToUpload(pickedFiles);
                        // console.log("folder selected is: ", folder)
                        setFoldersToUpload(current => [...current, folder]);
                        setAlertTitle(null)
                        setAlertMessages([])
                    } else {
                        messages.push("Pipeline upload only supports folders.")
                        setAlertTitle("File selection error")
                        setAlertMessages(messages)
                    }
                    
                }
            }  
          }
      }
    }

    function unpickModelFolder() {
        //clear filesToUpload
        setFilesToUpload([]);
        //clear foldersToUpload
        setFoldersToUpload([]);
        //clear setModelTypes that was set to folderModelType by default
        setModelTypes([]);
    }

    const onSetFolderModelType = (key: number, value: string) => {
        setFolderModelType(value);
    }

    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;
        // console.log("isCancelled is now: ", isCancelled)

        const uploadModelFiles = async (signal: AbortSignal) => {

            if (!filesToUpload) {
                return;
            }

            const formData = new FormData();

            for (const { index, value } of filesToUpload.map((value, index) => ({ index, value }))) {
                formData.append('myModelFiles', value); 
                // console.log("value is: ", value)
                const file1 = value as FileWithPath;
                const file2 = value as File;
                //let folder = file.webkitRelativePath;
                //let folder = file.path;
                let folder;
                if (file1.path) {
                    folder = file1.path;
                } else {
                    folder = file2.webkitRelativePath;
                }
                // console.log("folder is: ", folder)
                if (folder) {
                    // console.log("folder in pipeline is: ", folder)
                    if (folder.length > 0) {
                        // remove filename
                        folder = folder.split("/").slice(0,-1).join("/");
                    }
                    formData.append('myModelFolders', folder);
                    formData.append('myModelType', modelTypes[index])
                    // console.log('formData is : ', formData);
                }
            }
            // console.log("foldersToUpload is: ", foldersToUpload);
            if (foldersToUpload.length != 0) {
                // formData.append('myModelFolder', filesToUpload[0].webkitRelativePath.split("/").slice(0,-1).join("/"))
                formData.append('myModelFolder', foldersToUpload[0])
                formData.append('myFolderModelType', folderModelType)
                formData.append('type', "pipeline")
            }

            

            axios.post('/api/upload/model', formData, {
                signal: signal,
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        const progress = (progressEvent.loaded / progressEvent.total) * 50;
                        setProgress(progress);
                    }
                }
            }).then(response => {
                const fileList: ModelFile[] = []
                const data = response.data;
                for (const file of data) {
                    fileList.push(file as ModelFile)
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
            uploadModelFiles(signal)
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


    function UploadBox() {
      // const { handleUpload } = pickFiles();
    
      const onDrop = useCallback(
        (files: FileWithPath[]) => {
          pickPipeline(files);
        },
        [pickPipeline]
      );
    
      const {
        getRootProps,
        getInputProps,
        isDragActive,
        inputRef,
        //isDragReject,
      } = useDropzone({
        // accept: ["image/jpeg", "image/pjpeg", "image/png", "image/gif"],
        onDrop,
      });

      useEffect(() => {
        // console.log("Input ref is: ", inputRef.current)
        if (inputRef.current !== null) {
          inputRef.current.setAttribute("directory", "");
          inputRef.current.setAttribute("webkitdirectory", "");
          // inputRef.current.setAttribute("onChange", {pickFolders});
        }
      }, [inputRef]);
    
      const renderDragMessage = useCallback(() => {
        if (!isDragActive) {
          return (
            <div>
                <input disabled={isUploading || foldersToUpload.length != 0 || filesToUpload.length != 0} 
                id="folder-input" type="file" ref={ref} onChange={pickFolders} style={{display: 'none'}}/>
                <Box sx={{height: '200px', display:'flex', flexDirection:'column', alignItems: 'center'}}
                onClick={handleSelectClick} data-testid="upload-file-dropbox">
                    <UploadIcon/>
                    <Typography sx={{ fontSize: 20 }} color="primary">
                        Drag &#38; Drop or <b>Click to Browse</b>
                    </Typography>
                    <Typography sx={{ fontSize: 14 }}>
                        Maximum 1 folder per upload
                    </Typography>
                </Box>
            </div>
          );
        } else {
            return (
                <div>
                    <Box sx={{height: '200px', display:'flex', flexDirection:'column', alignItems: 'center'}}>
                        <UploadIcon/>
                        <Typography sx={{ fontSize: 20 }} color="primary">
                            <b>Drop Folder Here</b>
                        </Typography>
                        <Typography sx={{ fontSize: 14 }}>
                            Maximum 1 folder per upload
                        </Typography>
                    </Box>
                </div>
            )
        }
    
      }, [isDragActive]);
    
      return (
        <Box sx={{height: '200px', display:'flex', flexDirection:'column', alignItems: 'center',
        backgroundColor:'#F3F0F5', border: '3px dotted', borderRadius: 3, p:6}} {...getRootProps({
          onClick: event => event.stopPropagation()
        })}>
          <input {...getInputProps()}/>
          {renderDragMessage()}
        </Box>
      );
    }

    return (
        <div style={{ display:'flex', flexDirection:'column', minHeight:'700px'}}>
            <div style={{ marginLeft:'3%', width: '90%', display:'flex', flexDirection:'row', justifyContent:'center', maxHeight:'240px', flexGrow: 2}}>
                <Box sx={{ flexGrow: 2}}>
                    <Typography sx={{ pl:2, fontSize: 20 }}>
                        Before uploading...
                    </Typography>
                    <Typography sx={{ pl:2, fontSize: 14 }}>
                        Check that the pipeline file meets the following requirements.
                    </Typography>
                    <Box sx={{ width: '100%', border: '1px solid #C8C8C8', borderRadius: 3, p:3, m:2 }}>
                        <Typography sx={{ pl:2, fontSize: 14 }}>
                            <b>File Size:</b> Less than 4GB <br/>
                            <b>Model Format:</b> Scikit-learn Pipeline<br/>
                            <b>Serialiser Type:</b> Pickle or Joblib<br/>
                        </Typography>
                    </Box>
                </Box>
                <Box sx={{ flexGrow: 3, pl:5, display:'flex', flexDirection:'column'}}>
                  <UploadBox></UploadBox>
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
                                Uploading Folder...
                            </Typography>
                            <div>
                                <LinearProgress variant="determinate" value={progress} />
                                <Button onClick={() => setIsCancelled(true)}>Cancel</Button>
                            </div>
                        </div>
                    ) }
                    { isUploading == false && (
                        <Typography sx={{ pl:2, flexGrow:1, fontSize: 20 }}>
                        Selected Folders
                        </Typography>
                    ) }
                    {foldersToUpload.length == 0 && (
                        <Box sx={{ border: '1px solid #C8C8C8', borderRadius: 3, p:3, m:2, maxHeight: '35vh', overflow: 'auto'}} />
                    )}
                    {foldersToUpload.length != 0 && (
                    <Box sx={{ border: '1px solid #C8C8C8', borderRadius: 3, p:3, m:2, maxHeight: '300px', overflow: 'auto'}}>
                        <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
                        {foldersToUpload.map( (folder, index) => {
                            return (
                                <ListItem 
                                key={folder} 
                                secondaryAction={
                                    <FormControl sx={{ m: 1, minWidth: 300 }} size="small">
                                        <MySelect
                                        id='model-type'
                                        title="Model Type"
                                        inputProps={{
                                            multiline: true,
                                            onChange: (e: SelectChangeEvent) => onSetFolderModelType(index, e.target.value),
                                            placeholder: "Model Type",
                                            defaultValue: 'Classification',
                                        }}
                                        items={['Classification', 'Regression']}
                                        FormControlProps={{
                                            sx: {mt:1, mb:1},
                                        }}
                                        isDisabled={isUploading} // not working
                                    />
                                    </FormControl>
                                }
                                >
                                    <ListItemAvatar>
                                    <IconButton disabled={isUploading} onClick={unpickModelFolder}>
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
                    <Button variant="contained" component="label" disabled={filesToUpload.length==0 || isUploading==true} 
                    onClick={() => setTryUpload(true)} data-testid="upload-models-button">
                        Upload selected files &gt;
                    </Button>
                </Container>
            </div>
        </div>
    );
}


type PipelinesValidatingProps = {
    filesValidating: ModelFile[],
    updateFile: (arg: Partial<ModelFile>) => void,
    onBackClick?: () => void
}

function PipelinesValidating({filesValidating, updateFile, onBackClick}: PipelinesValidatingProps) {
    const router = useRouter();
    const [ focus, setFocus ] = useState<(ModelFile & { _id?: string}) | null>(null);
    const [ edit, setEdit ] = useState<ModelFile & { _id?: string} | null>(null);
    const [ openDialog, setOpenDialog ] = useState<boolean>(false);
    const [ modelsValidating, setModelsValidating ] = useState<(ModelFile & { _id?: string})[]>([]);
    const [ isFailed, setIsFailed ] = useState(false);
    const [ duplicateName, setDuplicateName ] = useState<string>("");
    const [ validationDone, setValidationDone ] = useState<boolean>(false);

    const updateModelFn = useUpdateModel();

    //update files displayed with latest data from parent
    useEffect(() => {
        setModelsValidating(filesValidating)
    }, [filesValidating])

    useEffect(() => {
        // console.log("modelsValidating just updated to: ", JSON.stringify(modelsValidating));
        if (focus) {
            // console.log("Updating Focus...");
            const modelFile = modelsValidating.find((e: ModelFile) => e.id?.toString() === focus.id);
            if (modelFile) {
                setFocus(modelFile);
            }
        }else{
            // console.log("No files focused");
            onSetFocus(modelsValidating[0])
        }
    }, [JSON.stringify(modelsValidating)])

    useEffect(() => {
        const stillValidating = modelsValidating.find((e: ModelFile) => e.status.toString() === FileStatus.PENDING);
        if (stillValidating) {
            setValidationDone(false);
        } else {
            setValidationDone(true);
        }
    }, [modelsValidating])

    const onSetFocus = (modelFile: ModelFile) => {
        setFocus(modelFile);
        setEdit(modelFile);
    }

    const setCancelled = async (id: string, modelFile: Partial<ModelFile> ) => {
        const newModelFile = {...modelFile, status: "Cancelled"};
        const modelFileInput = _.pick(newModelFile, ["status"]);

        await updateModelFn(id, modelFileInput);
        updateFile(newModelFile);
    }

    useEffect(() => {
        const timerId = setTimeout(() => {
            console.log('Timeout ended');
            setIsFailed(true);
            for ( const modelValidating of modelsValidating ) {
                if (modelValidating.status == FileStatus.PENDING) {
                    if (modelValidating._id) {
                        const modelFile = modelValidating;
                        const newModelFile = {...modelFile, status: "Error"};  
                        const modelFileInput = _.pick(newModelFile, ["status"]);
                        if (modelFile._id) {
                            updateModelFn(modelFile._id.toString(), modelFileInput);
                            updateFile(newModelFile);
                        }
                    }
                }
            }
            
        }, 60000);
        
        return () => clearTimeout(timerId);
    }, [modelsValidating]);


    const showDialog = () => {
        setOpenDialog(true);
    }

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setDuplicateName("");
    }

    const onUpdateModel = async (id: any, model: Partial<ModelFile> ) => {
        const modelInput = _.pick(model, ['description', 'name', 'modelType']);
		const response = await updateModelFn(id.toString(), modelInput)
        if (response == "Duplicate File") {
            console.log("Another file with the same name already exists, unable to update name to: ", modelInput.name)
            if (modelInput.name) setDuplicateName(modelInput.name?.toString());
        } else {
            updateFile(model);
            handleCloseDialog();
        }
	}

    const onChange = (key: string, value: string) => {
        if (!focus || !edit)
            return;

        if (key === "modelType"){
            const modelType = value as ModelType;
            setEdit({...edit, modelType});
        }else if (key === "description"){
            setEdit({...edit, description: value});
        }else if (key === "name"){
            setEdit({...edit, name: value});
        }
    }

    function handleBackClick() {
        if (onBackClick) {
            onBackClick();
            return;
        }
        router.push('/assets/models');
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

                        <List sx={{ width: '100%', bgcolor: 'background.paper'}}>
                            {!isFailed && modelsValidating && modelsValidating.map(modelValidating =>

                                <div key={modelValidating._id} onClick={() => onSetFocus(modelValidating)}
                                style={{ backgroundColor: (modelValidating._id == focus?._id) ? '#F3F0F5' : '' }}>
                                <ListItemButton>
                                    <ListItemAvatar>
                                        { modelValidating.status == FileStatus.PENDING && (
                                            <CircularProgress size={20} />
                                        ) }
                                        { modelValidating.status == FileStatus.VALID && (
                                            <CheckCircleOutlineIcon color="primary"/>
                                        ) }
                                        { modelValidating.status == FileStatus.INVALID && (
                                            <HighlightOffIcon color="error"/>
                                        ) }
                                        { modelValidating.status == FileStatus.ERROR && (
                                            <ErrorOutlineIcon color="error" />
                                        ) }
                                        { modelValidating.status == FileStatus.CANCELLED && (
                                            <DoDisturbIcon color="error" />
                                        ) }
                                    </ListItemAvatar>
                                    <ListItemText primary={modelValidating.name} secondary={modelValidating.size} />
                                    <ListItemIcon>
                                        <IconButton sx={{visibility:(modelValidating.status == FileStatus.PENDING)?'visible':'hidden'}} onClick={()=> setCancelled(modelValidating._id as string, modelValidating)}>
                                            <StopCircleIcon />
                                        </IconButton>
                                    </ListItemIcon>
                                </ListItemButton>
                                <hr style={{margin:0, color: '#C8C8C8', backgroundColor: '#C8C8C8', height: '1px', border: 0, borderStyle: 'solid'}} />
                                </div>
                            )}
                            
                            {isFailed && modelsValidating && modelsValidating.map(modelValidating =>
                                <div key={modelValidating._id} onClick={() => onSetFocus(modelValidating)}
                                style={{ backgroundColor: (modelValidating._id == focus?._id) ? '#F3F0F5' : '' }}>
                                <ListItemButton>
                                    <ListItemAvatar>
                                        { modelValidating.status == FileStatus.PENDING && (
                                            //File upload and validation failed
                                            <ErrorOutlineIcon color="error" />
                                        ) }
                                        { modelValidating.status == FileStatus.VALID && (
                                            <CheckCircleOutlineIcon color="primary"/>
                                        ) }
                                        { modelValidating.status == FileStatus.INVALID && (
                                            <HighlightOffIcon color="error"/>
                                        ) }
                                        { modelValidating.status == FileStatus.ERROR && (
                                            <ErrorOutlineIcon color="error" />
                                        ) }
                                        { modelValidating.status == FileStatus.CANCELLED && (
                                            <DoDisturbIcon color="error" />
                                        ) }
                                    </ListItemAvatar>
                                        { modelValidating.status == FileStatus.PENDING && (
                                            //File upload and validation failed
                                            <ListItemText primary={modelValidating.name} secondary={`File upload failed. Please try again.`} />
                                        ) }
                                        { modelValidating.status == FileStatus.VALID && (
                                            <ListItemText primary={modelValidating.name} secondary={modelValidating.size} />
                                        ) }
                                        { modelValidating.status == FileStatus.INVALID && (
                                            <ListItemText primary={modelValidating.name} secondary={modelValidating.size} />
                                        ) }
                                        { modelValidating.status == FileStatus.ERROR && (
                                            <ListItemText primary={modelValidating.name} secondary={`File upload failed. Please try again.`} />
                                        ) }
                                        { modelValidating.status == FileStatus.CANCELLED && (
                                            <ListItemText primary={modelValidating.name} secondary={`File validation cancelled. Please upload again`} />
                                        ) }
                                </ListItemButton>
                                <hr style={{margin:0, color: '#C8C8C8', backgroundColor: '#C8C8C8', height: '1px', border: 0, borderStyle: 'solid'}} />
                                </div>
                            )}
                        </List>
                    </Box>
                    {(focus && edit && (
                        <Box sx={{ width: '40%', overflow: 'auto', maxHeight: '500px', p:2, m:1, display: 'flex', flexDirection: 'column', flex: 1, border: '1px solid #C8C8C8', borderRadius: 3 }}>
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
                                <b>Size:</b> {focus.size?focus.size:'-'} <br/>
                                {(focus.status == FileStatus.VALID)?
                                <Typography sx={{fontSize: 14 }}>
                                    <b>Serializer:</b> {focus.serializer} <br/>
                                    <b>Model Format:</b> {focus.modelFormat} <br/>
                                    <b>Description:</b> {focus.description}<br/>
                                    <b>Model Type:</b> {focus.modelType} <br/>
                                </Typography>
                                :''}
                            </Typography>
                            { focus.errorMessages && (
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
                        Back to all Models &gt;
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
                    <DialogTitle>Edit Model Information</DialogTitle>
                    <DialogContent>
                    <Typography sx={{mb:2, fontWeight:'bold', size: '14px' }}>{edit.name}</Typography>
                    <FormControl sx={{ mt: 1, width: '100%' }} >
                        <MyTextField
                            id='model-name'
                            title="Model Name"
                            inputProps={{
                                multiline: true,
                                onChange: (e: ChangeEvent<HTMLInputElement>) => onChange('name', e.target.value),
                                value: edit.name,
                                placeholder: "Enter name to identify this AI model",
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
                                <Box sx={{backgroundColor: '#FADFDF', borderRadius: 3, p:2, m:1, overflowWrap: 'anywhere' }}>
                                    {edit.errorMessages}
                                </Box>
                            </Typography>
                        )}
                        <p><b>File Name</b> <br/>{edit.filename}</p>
                        <p><b>Type</b> <br/>{edit.type}</p>
                        <p><b>Date Uploaded</b> <br/>{new Date(edit.ctime).toLocaleString()}</p>
                        <p><b>Size</b> {edit.size}</p>
                        <p><b>Serializer</b> {edit.serializer}</p>
                        <p><b>Model Format</b> {edit.modelFormat}</p>
                    </Typography>     
                    <FormControl sx={{ width: '100%' }} >
                        <MySelect
                            id='model-type'
                            title="Model Type"
                            inputProps={{
                                multiline: true,
                                onChange: (e: SelectChangeEvent) => onChange('modelType', e.target.value),
                                value: edit.modelType,
                                placeholder: "Select Model Type",
                            }}
                            items={['Classification', 'Regression']}
                            FormControlProps={{
                                sx: {mt:1, mb:1}
                            }}
                        />
                        <MyTextField
                            id='model-description'
                            title="Model Description"
                            inputProps={{
                                multiline: true,
                                onChange: (e: ChangeEvent<HTMLInputElement>) => onChange('description', e.target.value),
                                value: edit.description,
                                placeholder: "Enter AI model description",
                            }}
                            FormControlProps={{
                                sx: {mt:1, mb:1}
                            }}
                        />
                    </FormControl>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>Cancel</Button>
                        <Button onClick={() => onUpdateModel(edit._id, edit)}>Save & Close</Button>
                    </DialogActions>
                </Dialog>
            )}
        </div>
    )


}



export default function NewPipelineUploadModule({ withoutLayoutContainer = false, onBackIconClick } : { withoutLayoutContainer?: boolean, onBackIconClick?: () => void  }) {
    const router = useRouter();
    const [ isValidating, setIsValidating ] = useState<boolean>(false);
    const [ fileList, setFileList ] = useState<(ModelFile & { _id?: string })[]>([]);
    const [ filesValidating, setFilesValidating ] = useState<(ModelFile & { _id?: string })[]>([]);

    const VALIDATE_MODEL_UPDATED = gql`
        subscription validateModelUpdated {
            validateModelStatusUpdated {
                _id
                status
                serializer
                modelFormat
                errorMessages
            }
        }
    `;

    useSubscription(
        VALIDATE_MODEL_UPDATED, {
            fetchPolicy: 'network-only',
            onData: payload => {
                console.log('Status updated Event----', payload);
                const { data } = payload;
                if (data == undefined || data.data.validateModelStatusUpdated == undefined) return;
                const updatedFileInfo = data.data.validateModelStatusUpdated;
                if (updatedFileInfo.status.toUpperCase() === 'PENDING') return; // we only care about status other then 'pending'
        
                setFilesValidating(current => {
                    // going into this code block, updatedFileInfo.status is either Valid or Invalid
                    const updatedFilesValidating = current.map(file => {
                        //id saved as _id even though filesValidating from modelsPicking is saved as ModelFile, how to fix?
                        if (file._id === updatedFileInfo._id) {
                            file.status = updatedFileInfo.status;
                            file.serializer = updatedFileInfo.serializer;
                            file.modelFormat = updatedFileInfo.modelFormat;
                            file.errorMessages = updatedFileInfo.errorMessages;
                        }
                        return file;
                    });
                    return updatedFilesValidating;
                })
            }
        }
    );



    const updateFileList = (modelFiles: ModelFile[]):void => {
        setFileList(modelFiles)
    }

    const updateValidatingState = (validatingState: boolean):void => {
        setIsValidating(validatingState)
    }

    const updateFile = (modelFile: Partial<ModelFile> & { _id?: string}):void => {
        setFilesValidating(current => {
            // going into this code block, updatedFileInfo.status is either Valid or Invalid
            const updatedFilesValidating = current.map(file => {
                if (file._id === modelFile._id) {
                    if (modelFile.modelType) {
                        file.modelType = modelFile.modelType;
                    }
                    if (modelFile.name) {
                        file.name = modelFile.name;
                    }
                    if (modelFile.description) {
                        file.description = modelFile.description;
                    }
                    if (modelFile.status) {
                        file.status = modelFile.status;
                    }
                }
                return file;
            });
            return updatedFilesValidating;
        })
    }

    //populate filesValidating with Dataset[] from picking
    useEffect(() => {
        if (fileList.length === 0) return;
        // console.log("fileList is now: ", fileList);

        //add most recently uploaded datasets to datasetsValidating list (regardless of pending/done state)
        for (const file of fileList) {
            const fileValidating = filesValidating.find(e => e.id?.toString() === file.id?.toString());
            if (fileValidating) {
                // console.log("File ", file.name, " already in modelsValidating")
            } else {
                // console.log("File ", file.name, " is not in modelsValidating, adding file to modelsValidating")
                setFilesValidating(filesValidating => (
                    [...filesValidating, {...file}]
                ));
            }
        }
    }, [fileList])

    function handleBackIconClick() {
        if (onBackIconClick) {
            onBackIconClick();
            return;
        }
        router.push('/assets/newModel');
    }

    if (withoutLayoutContainer) {
        return <Paper sx={{ p:2, m:2, display:'flex', flexDirection:'column', height: '80vh', minHeight: '800px', paddingBottom: '50px'}} >
            <Box sx={{ mb: 2, height:'5%', display:'flex', alignItems:'center'}}>
                <Button startIcon={<NavigateBeforeIcon />} color="secondary" sx={{mr:1}}
                    onClick={handleBackIconClick}
                />
                <Typography variant="h6" sx={{ pl:2, flexGrow:1, fontWeight:'bold' }}>
                    Add New AI Model &gt; Upload Pipeline File
                </Typography>
            </Box>
            { isValidating==false && (
                <PipelinesPicking updateValidatingState={updateValidatingState} updateFileList={updateFileList}></PipelinesPicking>
            )}
            { isValidating==true && (
                <PipelinesValidating filesValidating={filesValidating} updateFile={updateFile} onBackClick={handleBackIconClick}></PipelinesValidating>
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
                            onClick={() => router.push('/assets/newModel')} data-testid="newpipelineupload-back-button"
                        />
                        <Typography variant="h6" sx={{ pl:2, flexGrow:1, fontWeight:'bold' }}>
                            Add New AI Model &gt; Upload Pipeline File
                        </Typography>
                    </Box>
                    { isValidating==false && (
                        <PipelinesPicking updateValidatingState={updateValidatingState} updateFileList={updateFileList}></PipelinesPicking>
                    )}
                    { isValidating==true && (
                        <PipelinesValidating filesValidating={filesValidating} updateFile={updateFile}></PipelinesValidating>
                    )}
                </Paper>
                </Container>
            </Container>
            </div>
        </div>
      
    );
}
