import React, { useState, useEffect, ChangeEvent } from 'react';
import { gql, useQuery } from '@apollo/client';
import * as _ from 'lodash';

import { Chip, SelectChangeEvent, SxProps, Theme } from '@mui/material';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Container from '@mui/material/Container';
import Tooltip from '@mui/material/Tooltip';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';
import FolderIcon from '@mui/icons-material/Folder';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CancelIcon from '@mui/icons-material/Cancel';
import { Icon } from '../../components/icon';
import { IconName } from '../../components/icon/iconNames';

import Pagination from '@mui/material/Pagination';
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarQuickFilter,
  GridSelectionModel,
  GridEventListener,
  gridPageCountSelector,
  gridPageSelector,
  useGridApiContext,
  useGridSelector,
  GridRenderCellParams,
} from '@mui/x-data-grid';
import type {} from '@mui/x-data-grid/themeAugmentation';

import FormControl from '@mui/material/FormControl';
import MyTextField from 'src/components/myTextField';
import MySelect from 'src/components/mySelect';
import {
  AlertBox,
  AlertBoxFixedPositions,
  AlertBoxSize,
} from 'src/components/alertBox';
import { AlertType, StandardAlert } from 'src/components/standardAlerts';
import ModelFile, { ModelType } from 'src/types/model.interface';
import { useUpdateModel, useDeleteModelFile } from 'src/lib/assetService';
import { useRouter } from 'next/router';

type Props = {
  showSelectModelBtn?: boolean;
  onModelSelected?: (model: ModelFile) => void;
  containerStyles?: React.CSSProperties | SxProps<Theme>;
  gridStyles?: React.CSSProperties | SxProps<Theme>;
};

enum FocusStatus {
  VALID = 'Valid',
  INVALID = 'Invalid',
  ERROR = 'Error',
  CANCELLED = 'Cancelled',
}

enum ModelFilters {
  CLASSIFICATION = 'Classification',
  REGRESSION = 'Regression',
  FILE = 'File',
  FOLDER = 'Folder',
  PIPELINE = 'Pipeline',
  // API
}

const GET_MODELS = gql`
  query Query {
    modelFiles {
      id
      name
      filename
      filePath
      modelAPI {
        method
        url
        urlParams
        authType
        authTypeConfig
        additionalHeaders {
          name
          type
          value
        }
        parameters {
          paths {
            mediaType
            isArray
            maxItems
            pathParams {
              name
              type
            }
          }
          queries {
            mediaType
            name
            isArray
            maxItems
            queryParams {
              name
              type
            }
          }
        }
        requestBody {
          mediaType
          isArray
          name
          maxItems
          properties {
            field
            type
          }
        }
        response {
          statusCode
          mediaType
          type
          field
        }
        requestConfig {
          rateLimit
          batchStrategy
          batchLimit
          maxConnections
          requestTimeout
        }
      }
      ctime
      size
      status
      description
      serializer
      modelFormat
      modelType
      errorMessages
      type
    }
  }
`;

export default function ModelListComponent({
  showSelectModelBtn,
  onModelSelected,
  containerStyles,
  gridStyles,
}: Props) {
  const [focus, setFocus] = useState<ModelFile | null>(null);
  const [edit, setEdit] = useState<ModelFile | null>(null);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [myFiles, setMyFiles] = useState<ModelFile[]>([]);
  const [filters, setFilters] = useState<ModelFilters[]>([]);
  const [tableData, setTableData] = useState<ModelFile[]>([]);
  const [selectionModel, setSelectionModel] =
    React.useState<GridSelectionModel>([]);
  const [duplicateName, setDuplicateName] = useState<string>('');
  const [showDeleteConfirmationDialog, setShowDeleteConfirmationDialog] =
    useState<boolean>(false);
  const [alertTitle, setAlertTitle] = useState<string | null>(null);
  const [alertMessages, setAlertMessages] = useState<string[]>([]);
  const router = useRouter();

  const updateModelFn = useUpdateModel();

  const { data, startPolling } = useQuery(GET_MODELS);

  useEffect(() => {
    startPolling(3000);
  }, [startPolling]);

  const showDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setDuplicateName('');
  };

  const onUpdateModel = async (id: any, model: Partial<ModelFile>) => {
    const modelInput = _.pick(model, ['description', 'name', 'modelType']);
    const response = await updateModelFn(id.toString(), modelInput);
    if (response == 'Duplicate File') {
      console.log(
        'Another file with the same name already exists, unable to update name to: ',
        modelInput.name
      );
      if (modelInput.name) setDuplicateName(modelInput.name?.toString());
    } else {
      handleCloseDialog();
    }
  };

  const onChange = (key: string, value: string) => {
    if (!focus || !edit) return;

    if (key === 'modelType') {
      const modelType = value as ModelType;
      setEdit({ ...edit, modelType });
    } else if (key === 'description') {
      setEdit({ ...edit, description: value });
    } else if (key === 'name') {
      setEdit({ ...edit, name: value });
    }
  };

  const handleRowClick: GridEventListener<'rowClick'> = (params) => {
    const focusedItem = params.row;
    if (focusedItem == focus) {
      setFocus(null);
      setEdit(null);
    } else {
      setFocus(focusedItem);
      setEdit(focusedItem);
    }
  };

  const deleteModelFileFn = useDeleteModelFile();

  const onDeleteModelFile = async (ids: GridSelectionModel) => {
    const selectedIds = ids.map((id) => id.toString());
    const newSelected = [...selectedIds];
    const messages: string[] = [];
    for (const id of selectedIds) {
      // console.log("Deleting modelFile: ", id)
      const idx = data?.modelFiles.findIndex((e: ModelFile) => e.id === id);

      if (idx < 0) return;

      const ar = [...data?.modelFiles];
      ar.splice(idx, 1);

      const response = await deleteModelFileFn(id);
      if (response != id) {
        setAlertTitle('File deletion error');
        messages.push(response);
      }
      const index = newSelected.indexOf(id);
      newSelected.splice(index, 1);
    }
    setFocus(null);
    setShowDeleteConfirmationDialog(false);
    setAlertMessages(messages);
  };

  function handleModelBtnClick() {
    if (onModelSelected) {
      console.log(focus);
      onModelSelected(focus as ModelFile);
    }
  }

  const handleFilterBtnClick = (filter: ModelFilters) => {
    const indexOfFilter = filters.indexOf(filter);
    let updatedFilters = [...filters];
    if (indexOfFilter > -1) {
      updatedFilters.splice(indexOfFilter, 1);
    } else {
      updatedFilters = [...filters, filter];
    }
    setFilters(updatedFilters);
  };

  //useEffect to setMyFiles() according to filters
  useEffect(() => {
    if (data) {
      if (filters.length === 0) {
        const ar = data.modelFiles;
        setMyFiles(ar);
        return;
      }
      const ar = data.modelFiles as ModelFile[];
      const filteredFiles = ar.reduce<ModelFile[]>((collection, current) => {
        if (
          current.modelType &&
          current.modelType.toString() == ModelFilters.CLASSIFICATION &&
          filters.indexOf(ModelFilters.CLASSIFICATION) > -1
        ) {
          return [...collection, current];
        }
        if (
          current.modelType &&
          current.modelType.toString() == ModelFilters.REGRESSION &&
          filters.indexOf(ModelFilters.REGRESSION) > -1
        ) {
          return [...collection, current];
        }
        if (
          current.type &&
          current.type == ModelFilters.FILE &&
          filters.indexOf(ModelFilters.FILE) > -1
        ) {
          return [...collection, current];
        }
        if (
          current.type &&
          current.type == ModelFilters.FOLDER &&
          filters.indexOf(ModelFilters.FOLDER) > -1
        ) {
          return [...collection, current];
        }
        if (
          current.type &&
          current.type == ModelFilters.PIPELINE &&
          filters.indexOf(ModelFilters.PIPELINE) > -1
        ) {
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
        const focusedItem = data?.modelFiles.find(
          (e: ModelFile) => e.id?.toString() === focus.id?.toString()
        );
        setFocus(focusedItem);
        setEdit(focusedItem);
      }
    }
  }, [JSON.stringify(data), myFiles]);

  const columns = [
    {
      field: 'type',
      hideable: false,
      headerName: 'Type',
      flex: 0.1,
      renderCell: (params: GridRenderCellParams) => {
        if (params.value.toString() === 'Folder') {
          return (
            <Tooltip title="Folder">
              <FolderIcon></FolderIcon>
            </Tooltip>
          );
        } else if (params.value.toString() === 'Pipeline') {
          return (
            <div>
              <Tooltip title="Pipeline">
                <Icon name={IconName.PIPELINE} size={24} color="#676767" />
              </Tooltip>
            </div>
          );
        } else {
          return (
            <Tooltip title="File">
              <InsertDriveFileIcon></InsertDriveFileIcon>
            </Tooltip>
          );
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
          <Typography sx={{ fontSize: 16, fontWeight: 'medium' }}>
            {params.value}
          </Typography>
          <Typography sx={{ fontSize: 14 }}>{params.row.size}</Typography>
        </Box>
      ),
    },
    {
      field: 'modelType',
      hideable: false,
      headerName: 'Model Type',
      flex: 0.3,
      renderCell: (params: GridRenderCellParams) => {
        if (params.row.status.toString() === 'Valid') {
          if (params.value) {
            return (
              <Typography sx={{ fontSize: 14 }}>{params.value}</Typography>
            );
          } else {
            return (
              <Chip
                icon={<CancelIcon />}
                label="Unspecified"
                variant="outlined"
                color="warning"
                sx={{ width: { md: '100px', lg: 'auto' } }}
              />
            );
          }
        } else {
          return (
            <Chip
              icon={<CancelIcon />}
              label="Model Invalid"
              variant="outlined"
              color="error"
              sx={{ width: { md: '100px', lg: 'auto' } }}
            />
          );
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
  ];

  function CustomToolbar() {
    return (
      <GridToolbarContainer
        sx={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
        }}>
        <GridToolbarQuickFilter sx={{ flex: '2 2' }} />
        <div
          data-testid="model-list-filters"
          style={{ flex: '1 1', minWidth: '500px' }}>
          <span style={{ margin: '10px' }}>Filter by: </span>
          <Chip
            label={ModelFilters.CLASSIFICATION}
            variant={
              filters.indexOf(ModelFilters.CLASSIFICATION) > -1
                ? 'filled'
                : 'outlined'
            }
            color="default"
            sx={{ mr: '5px' }}
            clickable
            onClick={() => handleFilterBtnClick(ModelFilters.CLASSIFICATION)}
          />
          <Chip
            label={ModelFilters.REGRESSION}
            variant={
              filters.indexOf(ModelFilters.REGRESSION) > -1
                ? 'filled'
                : 'outlined'
            }
            color="default"
            sx={{ mr: '5px' }}
            clickable
            onClick={() => handleFilterBtnClick(ModelFilters.REGRESSION)}
          />
          <Chip
            label={ModelFilters.FILE}
            variant={
              filters.indexOf(ModelFilters.FILE) > -1 ? 'filled' : 'outlined'
            }
            color="default"
            sx={{ mr: '5px' }}
            clickable
            onClick={() => handleFilterBtnClick(ModelFilters.FILE)}
          />
          <Chip
            label={ModelFilters.FOLDER}
            variant={
              filters.indexOf(ModelFilters.FOLDER) > -1 ? 'filled' : 'outlined'
            }
            color="default"
            sx={{ mr: '5px' }}
            clickable
            onClick={() => handleFilterBtnClick(ModelFilters.FOLDER)}
          />
          <Chip
            label={ModelFilters.PIPELINE}
            variant={
              filters.indexOf(ModelFilters.PIPELINE) > -1
                ? 'filled'
                : 'outlined'
            }
            color="default"
            sx={{ mr: '5px' }}
            clickable
            onClick={() => handleFilterBtnClick(ModelFilters.PIPELINE)}
          />
        </div>
        {selectionModel.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
            }}>
            <Typography>{selectionModel.length} selected</Typography>
            <Tooltip title="Delete">
              <IconButton
                onClick={() => {
                  setShowDeleteConfirmationDialog(true);
                }}>
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
      {alertTitle && (
        <Container sx={{ padding: 1, width: '100%' }}>
          <StandardAlert
            alertType={AlertType.ERROR}
            headingText={alertTitle}
            onCloseIconClick={() => setAlertTitle(null)}>
            <div>
              {alertMessages}
              {/* {alertMessages && alertMessages.map(message => {
                        <div>{message}</div>
                    })} */}
            </div>
          </StandardAlert>
        </Container>
      )}
      {showDeleteConfirmationDialog ? (
        <AlertBox
          size={AlertBoxSize.MEDIUM}
          fixedPosition={AlertBoxFixedPositions.CENTER}
          onCloseIconClick={() => {
            setShowDeleteConfirmationDialog(false);
          }}>
          <AlertBox.Header
            heading="Confirm File Deletion"
            isDragHandle></AlertBox.Header>
          <AlertBox.Body hasFooter>
            <div>
              Are you sure you want to delete these file(s) from AI Verify?
            </div>
          </AlertBox.Body>
          <AlertBox.Footer>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                width: '600px',
              }}>
              <Button
                variant="outlined"
                component="label"
                sx={{ m: 2 }}
                onClick={() => {
                  setShowDeleteConfirmationDialog(false);
                }}>
                Cancel
              </Button>
              <Button
                variant="contained"
                component="label"
                sx={{ m: 2 }}
                onClick={() => {
                  onDeleteModelFile(selectionModel);
                }}>
                Delete Files
              </Button>
            </div>
          </AlertBox.Footer>
        </AlertBox>
      ) : null}
      <Box
        justifyContent="center"
        sx={{
          pl: 10,
          pr: 10,
          pb: 10,
          height: '70vh',
          width: '100%',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'stretch',
          ...containerStyles,
        }}>
        <DataGrid
          sx={{
            p: 2,
            flex: 2,
            borderRadius: 3,
            m: 1,
            ...gridStyles,
            '&.MuiDataGrid-root .MuiDataGrid-cell:focus-within': {
              outline: 'none !important',
            },
          }}
          rows={tableData}
          columns={columns}
          initialState={{
            sorting: {
              sortModel: [{ field: 'ctime', sort: 'desc' }],
            },
          }}
          checkboxSelection={!showSelectModelBtn}
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
            noRowsLabel:
              'No models loaded. Click "NEW MODEL +" to load new models.',
          }}
        />
        {focus && edit && (
          <Box
            sx={{
              overflow: 'auto',
              maxHeight: '500px',
              p: 2,
              m: 1,
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              border: '1px solid #C8C8C8',
              borderRadius: 3,
            }}>
            {focus &&
              focus.status == FocusStatus.VALID &&
              focus.type !== 'API' && (
                <Button
                  color="secondary"
                  sx={{ mr: 1, alignSelf: 'flex-end' }}
                  onClick={showDialog}>
                  Edit
                </Button>
              )}
            <Typography sx={{ mb: 2, fontWeight: 'bold', size: '14px' }}>
              {focus.name}
            </Typography>
            <Typography sx={{ fontSize: 14 }}>
              {focus.type !== 'API' ? (
                <>
                  <b>Status:</b> {focus.status} <br />
                </>
              ) : null}
              <b>Type:</b> {focus.type} <br />
              {focus.type !== 'API' ? (
                <>
                  <b>Date Uploaded:</b> {new Date(focus.ctime).toLocaleString()}{' '}
                  <br />
                </>
              ) : null}
              {focus.type !== 'API' ? (
                <>
                  <b>Size:</b> {focus.size ? focus.size : '-'} <br />
                </>
              ) : null}
            </Typography>

            {focus.status == FocusStatus.VALID ? (
              <Typography sx={{ fontSize: 14 }}>
                {focus.type !== 'API' ? (
                  <>
                    <b>Serializer:</b> {focus.serializer} <br />
                    <b>Model Format:</b> {focus.modelFormat} <br />
                  </>
                ) : null}
                <b>Description:</b> {focus.description}
                <br />
                <b>Model Type:</b> {focus.modelType} <br />
              </Typography>
            ) : (
              ''
            )}
            {focus && focus.type === 'API' && focus.id ? (
              <button
                style={{ width: 240, marginTop: 20 }}
                className="aivBase-button aivBase-button--secondary aivBase-button--medum"
                onClick={() => {
                  router.push(`/assets/modelApiConfig/${focus.id}`);
                }}>
                View / Edit Configuration
              </button>
            ) : null}

            {focus.errorMessages && (
              <Box
                sx={{
                  width: '90%',
                  backgroundColor: '#FADFDF',
                  borderRadius: 3,
                  p: 3,
                  m: 2,
                  overflowWrap: 'anywhere',
                }}>
                <Typography sx={{ fontSize: 14 }}>
                  {focus.errorMessages}
                </Typography>
              </Box>
            )}
            {showSelectModelBtn && focus.status == FocusStatus.VALID && (
              <Button
                onClick={handleModelBtnClick}
                variant="contained"
                style={{ margin: 10 }}>
                Use Model
              </Button>
            )}
          </Box>
        )}
      </Box>
      {edit && (
        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth>
          <DialogTitle>Edit Model Information</DialogTitle>
          <DialogContent>
            <Typography sx={{ mb: 2, fontWeight: 'bold', size: '14px' }}>
              {edit.name}
            </Typography>
            <FormControl sx={{ mt: 1, width: '100%' }}>
              <MyTextField
                id="model-name"
                title="Model Name"
                inputProps={{
                  multiline: true,
                  onChange: (e: ChangeEvent<HTMLInputElement>) =>
                    onChange('name', e.target.value),
                  value: edit.name,
                  placeholder: 'Enter name to identify this AI model',
                }}
                FormControlProps={{
                  sx: { mt: 1, mb: 1 },
                }}
              />
              {duplicateName && duplicateName != '' && (
                <Typography sx={{ mb: 2, size: '12px', color: 'red' }}>
                  <i>
                    Another file with the same name already exists, unable to
                    update name to: {duplicateName}
                  </i>
                </Typography>
              )}
            </FormControl>
            <Typography sx={{ fontSize: 14, lineHeight: '150%' }}>
              <p>
                <b>Status</b> <br />
                {edit.status}{' '}
              </p>
              {edit.errorMessages && (
                <Typography sx={{ fontSize: 14 }}>
                  <Box
                    sx={{
                      backgroundColor: '#FADFDF',
                      borderRadius: 3,
                      p: 2,
                      m: 1,
                      overflowWrap: 'anywhere',
                    }}>
                    {edit.errorMessages}
                  </Box>
                </Typography>
              )}
              <p>
                <b>File Name</b> <br />
                {edit.filename}
              </p>
              <p>
                <b>Type</b> <br />
                {edit.type}
              </p>
              <p>
                <b>Date Uploaded</b> <br />
                {new Date(edit.ctime).toLocaleString()}
              </p>
              <p>
                <b>Size</b> {edit.size ? edit.size : '-'}
              </p>
              <p>
                <b>Serializer</b> {edit.serializer}
              </p>
              <p>
                <b>Model Format</b> {edit.modelFormat}
              </p>
            </Typography>
            <FormControl sx={{ width: '100%' }}>
              <MySelect
                id="model-type"
                title="Model Type"
                inputProps={{
                  multiline: true,
                  onChange: (e: SelectChangeEvent) =>
                    onChange('modelType', e.target.value),
                  value: edit.modelType,
                  placeholder: 'Select Model Type',
                }}
                items={['Classification', 'Regression']}
                FormControlProps={{
                  sx: { mt: 1, mb: 1 },
                }}
              />
              <MyTextField
                id="model-description"
                title="Model Description"
                inputProps={{
                  multiline: true,
                  onChange: (e: ChangeEvent<HTMLInputElement>) =>
                    onChange('description', e.target.value),
                  value: edit.description,
                  placeholder: 'Enter AI model description',
                }}
                FormControlProps={{
                  sx: { mt: 1, mb: 1 },
                }}
              />
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={() => onUpdateModel(edit.id, edit)}>
              Save & Close
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </React.Fragment>
  );
}
