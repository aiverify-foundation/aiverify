import React, { useState, useEffect } from 'react';
import { gql, useQuery } from '@apollo/client';
import * as _ from 'lodash';

import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Tooltip from '@mui/material/Tooltip';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';
import CancelIcon from '@mui/icons-material/Cancel';
import FolderIcon from '@mui/icons-material/Folder';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';

import Pagination from '@mui/material/Pagination';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { DataGrid, GridToolbarContainer, GridToolbarQuickFilter, GridSelectionModel, GridEventListener, gridPageCountSelector, gridPageSelector, useGridApiContext, useGridSelector, GridRenderCellParams } from '@mui/x-data-grid';
import type { } from '@mui/x-data-grid/themeAugmentation';

import FormControl from '@mui/material/FormControl';
import MyTextField from 'src/components/myTextField';
import Dataset from 'src/types/dataset.interface';
import { useUpdateDataset, useDeleteDataset } from 'src/lib/assetService';
import { Chip, SxProps, Theme } from '@mui/material';
import {
    AlertBox,
    AlertBoxFixedPositions,
    AlertBoxSize,
} from 'src/components/alertBox';
import { AlertType, StandardAlert } from 'src/components/standardAlerts';

import styles from './styles/new-asset.module.css';
  

type Props = {
    showSelectDatasetBtn?: boolean;
    onDatasetSelected?: (dataset: Dataset) => void;
    containerStyles?: React.CSSProperties | SxProps<Theme>;
    gridStyles?: React.CSSProperties | SxProps<Theme>;
}

enum FocusStatus {
    VALID = 'Valid',
    INVALID = 'Invalid',
    ERROR = 'Error',
    CANCELLED = 'Cancelled'
}

enum DatasetFilters {
    FILE = 'File',
    FOLDER = 'Folder',
}

const GET_DATASETS = gql`
query Query {
    datasets {
        id
        name
        filename
        filePath
        ctime
        size
        status
        description
        dataColumns {
            id
            name
            datatype
            label
        }
        numRows
        numCols
        serializer
        dataFormat
        errorMessages
        type
    }
}
`


export default function DatasetListComponent({
    showSelectDatasetBtn = false,
    onDatasetSelected,
    containerStyles,
    gridStyles,
}: Props) {
    const [ focus, setFocus ] = useState<Dataset | null>(null);
    const [ edit, setEdit ] = useState<Dataset | null>(null);
    const [ openDialog, setOpenDialog ] = useState<boolean>(false);
    const [ myFiles, setMyFiles ] = useState<Dataset[]>([]);
    const [ filters, setFilters ] = useState<DatasetFilters[]>([]);
    const [ tableData, setTableData ] = useState<Dataset[]>([]);
    const [ selectionModel, setSelectionModel ] = React.useState<GridSelectionModel>([]);
    const [ duplicateName, setDuplicateName ] = useState<string>("");
    const [ showDeleteConfirmationDialog, setShowDeleteConfirmationDialog ] = useState<boolean>(false)
    const [ alertTitle, setAlertTitle ] = useState<string | null>(null);
    const [ alertMessages, setAlertMessages ] = useState<string[]>([]);
    const updateDatasetFn = useUpdateDataset();

    const { data, startPolling } = useQuery(GET_DATASETS);

    useEffect(() => {
        startPolling(3000);
    }, [startPolling])

    const showDialog = () => {
        setOpenDialog(true);
    }

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setDuplicateName("");
    }

    const onUpdateDataset = async (id: string, dataset: Partial<Dataset> ) => {
        const datasetInput = _.pick(dataset, ['description', 'name']);
        // console.log("datasetInput is: ", datasetInput);

        const response = await updateDatasetFn(id.toString(), datasetInput)
        // console.log("response is: ", response)
        if (response == "Duplicate File") {
            console.log("Another file with the same name already exists, unable to update name to: ", datasetInput.name)
            if (datasetInput.name) setDuplicateName(datasetInput.name?.toString());
        } else {
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

    const handleRowClick: GridEventListener<'rowClick'> = (params) => {
        const focusedItem = params.row;
        if ( focusedItem == focus ) {
            setFocus(null);
            setEdit(null);
        } else {
            setFocus(focusedItem);
            setEdit(focusedItem);
        }
    };

    const deleteDatasetFn = useDeleteDataset();


    const onDeleteDataset = async (ids: GridSelectionModel) => {
        const selectedIds = ids.map((id) => id.toString());
        const newSelected = [...selectedIds];
        const messages: string[] = [];
        for (const id of selectedIds) {
            const idx = data?.datasets.findIndex((e: Dataset) => e.id === id);

            if (idx < 0)
                return;

            const ar = [...data?.datasets];
            ar.splice(idx, 1);

            const response = await deleteDatasetFn(id)
            if (response != id) {
                setAlertTitle("File deletion error")
                messages.push(response)
            }
            const index = newSelected.indexOf(id);
            newSelected.splice(index, 1);
        }
        setFocus(null);
        setShowDeleteConfirmationDialog(false)
        setAlertMessages(messages)
    }

    function handleSelectDatasetBtnClick() {
        if (onDatasetSelected) {
            onDatasetSelected(focus as Dataset);
        }
    }

    const handleFilterBtnClick = (filter: DatasetFilters) => {
		const indexOfFilter = filters.indexOf(filter);
		let updatedFilters = [...filters];
		if (indexOfFilter > -1) {
			updatedFilters.splice(indexOfFilter, 1);
		} else {
			updatedFilters = [...filters, filter];
		}
		setFilters(updatedFilters);
	}

    //useEffect to setMyFiles() according to filters
    useEffect(() => {
        if (data) {
            if (filters.length === 0) {
                const ar = data.datasets;
                setMyFiles(ar);
                return;
            }
            const ar = data.datasets as Dataset[];
            const filteredFiles = ar.reduce<Dataset[]>((collection, current) => {
                if (current.type && current.type.toString() == DatasetFilters.FILE && filters.indexOf(DatasetFilters.FILE) > -1) {
                    return [...collection, current];
                }
                if (current.type && current.type.toString() == DatasetFilters.FOLDER && filters.indexOf(DatasetFilters.FOLDER) > -1) {
                    return [...collection, current];
                }
                return collection;
            }, []);
            setMyFiles(filteredFiles);
        }
	}, [filters, JSON.stringify(data)]);

    useEffect(() => {
       
        // set table data
        if (data) {
            const ar = myFiles;
            setTableData(ar);

            // update focus and edit
            if (focus) {
                const focusedItem = data?.datasets.find((e: Dataset) => e.id?.toString() === focus.id?.toString());
                setFocus(focusedItem);
                setEdit(focusedItem);
            }
        } 

    }, [JSON.stringify(data), myFiles])


    const columns = [
        { 
            field: 'type',
            hideable: false,
            headerName: 'Type',
            flex: 0.1,
            renderCell: (params: GridRenderCellParams) => {
                if ( params.value.toString() === "Folder" ) {
                    return <Tooltip title="Folder"><FolderIcon></FolderIcon></Tooltip>
                } else {
                    return <Tooltip title="File"><InsertDriveFileIcon></InsertDriveFileIcon></Tooltip>
                }
            }, 
        },
        { 
            field: 'name',
            hideable: false,
            headerName: 'Name',
            flex: 1, 
            minWidth: 150,
            renderCell: (params: GridRenderCellParams) => (
                <Box>
                    <Typography sx={{ fontSize: 16, fontWeight: 'medium'}}>
                        {params.value}
                    </Typography>
                    <Typography sx={{ fontSize: 14 }}>
                        {params.row.size}
                    </Typography>
                </Box>
            ), 
        },
        {
            field: 'numRows',
            hideable: false,
            headerName: 'Rows',
            flex: 0.4,
            renderCell: (params: GridRenderCellParams) => {
                if ( params.row.status.toString() === "Valid" ) {
                    return (
                        <Typography sx={{ fontSize: 16 }}>
                        {params.value} Rows
                        </Typography>
                    )
                    
                } else {
                    return (
                        <Chip icon={<CancelIcon/>} label="Invalid" variant="outlined" color='error' sx={{ width: { md: '100px', lg: 'auto' }}}/>
                    )
                }
            }, 
        },
        {
            field: 'numCols',
            hideable: false,
            headerName: 'Columns',
            flex: 0.4,
            renderCell: (params: GridRenderCellParams) => {
                if ( params.row.status.toString() === "Valid" ) {
                    return (
                        <Typography sx={{ fontSize: 16 }}>
                        {params.value} Cols
                        </Typography>
                    )
                } else {
                    return (
                        <Chip icon={<CancelIcon/>} label="Invalid" variant="outlined" color='error' sx={{ width: { md: '100px', lg: 'auto' }}}/>
                    )
                }
            }, 
        },
        { 
            field: 'ctime', 
            hideable: false, 
            headerName: 'Date', 
            flex: 0.5, 
            minWidth: 50,
            renderCell: (params: GridRenderCellParams) => (
                <Typography sx={{ fontSize: 16 }}>
                    {new Date(params.value).toLocaleString()}
                </Typography>
            ),
        },
    ]

    function CustomToolbar() {
        return (
          <GridToolbarContainer sx={{display: 'flex', flexDirection:'row', justifyContent:'space-between'}}>
            <GridToolbarQuickFilter sx={{flex:'2 2'}}/>
            <div style={{flex:'1 1', minWidth:'250px'}}>
                <span style={{ margin: '10px'}}>Filter by: </span>
                <Chip	
                    label={DatasetFilters.FILE}
                    variant={filters.indexOf(DatasetFilters.FILE) > -1 ? 'filled' : 'outlined'}
                    color='default' sx={{ mr: '5px' }} clickable
                    onClick={() => handleFilterBtnClick(DatasetFilters.FILE)}/>
                <Chip
                    label={DatasetFilters.FOLDER}
                    variant={filters.indexOf(DatasetFilters.FOLDER) > -1 ? 'filled' : 'outlined'}
                    color='default' sx={{ mr: '5px' }} clickable
                    onClick={() => handleFilterBtnClick(DatasetFilters.FOLDER)}/>
            </div>
            {selectionModel.length > 0 && (
                <div style={{display: 'flex', flexDirection:'row', alignItems:'center'}}>
                    <Typography>
                        {selectionModel.length} selected
                    </Typography>
                    <Tooltip title="Delete">
                        <IconButton onClick={() => { setShowDeleteConfirmationDialog(true) }}>
                        <DeleteIcon />
                        </IconButton>
                    </Tooltip>
                </div>
            )}
          </GridToolbarContainer>
        );
    }

    function CustomPagination() {
        const apiRef = useGridApiContext();
        const page = useGridSelector(apiRef, gridPageSelector);
        const pageCount = useGridSelector(apiRef, gridPageCountSelector);
      
        return (
          <Pagination
            color="primary"
            count={pageCount}
            page={page + 1}
            onChange={(event, value) => apiRef.current.setPage(value - 1)}
          />
        );
    }

    return (
        <React.Fragment>
            {showDeleteConfirmationDialog ? 
                <AlertBox
                    size={AlertBoxSize.MEDIUM}
                    fixedPosition={AlertBoxFixedPositions.CENTER}
                    onCloseIconClick={() => { setShowDeleteConfirmationDialog(false) }}>
                    <AlertBox.Header heading="Confirm File Deletion" isDragHandle></AlertBox.Header>
                    <AlertBox.Body hasFooter>
                        <div>Are you sure you want to delete these file(s) from AI Verify?</div>
                    </AlertBox.Body>
                    <AlertBox.Footer>
                        <div style={{ display: 'flex', justifyContent: 'center', width: '600px'}}>
                            <Button variant="outlined" component="label" sx={{m:2}}
                                onClick={() => { setShowDeleteConfirmationDialog(false) }}>
                                Cancel
                            </Button>
                            <Button variant="contained" component="label" sx={{m:2}}
                                onClick={() => {onDeleteDataset(selectionModel)}}>
                                Delete Files
                            </Button>
                        </div>
                    </AlertBox.Footer>
                </AlertBox> : null }
                {alertTitle &&
                    (<div style={{margin:'3%', width: '90%'}}>
                        <StandardAlert
                            alertType={AlertType.ERROR}
                            headingText={alertTitle}
                            onCloseIconClick={()=>setAlertTitle(null)}>
                            <div>{alertMessages}</div>
                        </StandardAlert>
                    </div>)}
            <Box justifyContent="center" sx={{
                pl:10,
                pr:10,
                pb:10,
                height:'70vh',
                width: '100%',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'stretch',
                ...containerStyles
            }}>
            <DataGrid
                sx={{
                    p:2,
                    flex: 2,
                    borderRadius: 3,
                    m:1,
                    ...gridStyles,
                    "&.MuiDataGrid-root .MuiDataGrid-cell:focus-within": {
                        outline: "none !important",
                    }
                }}
                rows={tableData}
                columns={columns}
                initialState={{
                    sorting: {
                      sortModel: [{ field: 'ctime', sort: 'desc' }],
                    },
                }}
                checkboxSelection={!showSelectDatasetBtn}
                disableSelectionOnClick
                disableColumnSelector
                disableColumnFilter
                hideFooterSelectedRowCount
                pagination
                autoPageSize
                onRowClick={handleRowClick}
                components={{ 
                    Toolbar: CustomToolbar,
                    Pagination: CustomPagination,
                }}
                onSelectionModelChange={(newSelectionModel) => {
                    setSelectionModel(newSelectionModel);
                }}
                selectionModel={selectionModel}
                localeText={{
                    noRowsLabel:'No dataset files uploaded. Click "NEW DATASET +" to upload new dataset files.',
                }}
            />
            {focus && edit && (
                <Box sx={{ overflow: 'auto', maxHeight: '500px', p:2, m:1, display: 'flex', flexDirection: 'column', flex: 1, border: '1px solid #C8C8C8', borderRadius: 3}}>
                    {focus && focus.status == FocusStatus.VALID && (
                        <Button color="secondary" sx={{mr:1, alignSelf:'flex-end'}} 
                        onClick={showDialog}>
                            Edit
                        </Button>
                    )}
                    <Typography sx={{mb:2, fontWeight:'bold', size: '14px' }}>{focus.name}</Typography>
                    <Typography sx={{fontSize: 14 }}>
                    <b>Status:</b> {focus.status} <br/>
                    <b>Type:</b> {focus.type} <br/>
                    <b>Date Uploaded:</b> {new Date(focus.ctime).toLocaleString()} <br/>
                    <b>Size:</b> {focus.size?focus.size:'-'}<br/>
                    </Typography>
                    
                    {(focus.status == FocusStatus.VALID)?
                    <Typography sx={{fontSize: 14 }}>
                        <b>Shape:</b> {focus.numRows} Rows | {focus.numCols} Cols <br/>
                        <b>Serializer:</b> {focus.serializer} <br/>
                        <b>Data Format:</b> {focus.dataFormat} <br/>
                        <b>Description:</b> {focus.description}<br/>
                    </Typography>
                    :''}
                    
                    {focus.status == FocusStatus.VALID && (
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
                        <Box sx={{ width: '90%', backgroundColor: '#FADFDF', borderRadius: 3, p:3, m:2, overflowWrap: 'anywhere'}}>
                            <Typography sx={{fontSize: 14 }}>{focus.errorMessages}</Typography>
                        </Box>
                    )}
                    {showSelectDatasetBtn && (focus.status == FocusStatus.VALID) && (
                        <Button onClick={handleSelectDatasetBtnClick} variant="contained" style={{margin:10}}>Use Dataset</Button>
                    )}
                </Box>
            )}
            </Box>
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
                                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange('name', e.target.value),
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
                                    <Box sx={{backgroundColor: '#FADFDF', borderRadius: 3, p:2, m:1, overflowWrap: 'anywhere' }}>
                                        {edit.errorMessages}
                                    </Box>
                                </Typography>
                            )}
                            <p><b>File Name</b> <br/>{edit.filename}</p>
                            <p><b>Type</b> <br/>{edit.type}</p>
                            <p><b>Date Uploaded</b> <br/>{new Date(edit.ctime).toLocaleString()}</p>
                            <p><b>Size</b> {edit.size?edit.size:'-'}</p>
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
                                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange('description', e.target.value),
                                    value: edit.description,
                                    placeholder: "Enter dataset description",
                                }}
                                FormControlProps={{
                                    sx: {mt:1, mb:1}
                                }}
                            />
                        </FormControl>
                        {edit.status.toString() === 'Valid' && (
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
                        <Button onClick={() => onUpdateDataset(edit.id as string, edit)}>Save & Close</Button>
                    </DialogActions>
                </Dialog>
            )}
        </React.Fragment>
    )
  }