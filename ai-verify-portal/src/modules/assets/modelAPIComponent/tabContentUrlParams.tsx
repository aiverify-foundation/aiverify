import { SelectInput } from 'src/components/selectInput';
import { Tooltip, TooltipPosition } from 'src/components/tooltip';
import InfoIcon from '@mui/icons-material/Info';
import {
  MediaType,
  ModelApiFormModel,
  OpenApiDataTypes,
  URLParamType,
  UrlParam,
} from './types';
import styles from './styles/newModelApiConfig.module.css';
import {
  UrlParamCaptureInput,
  UrlParamsInputHeading,
} from './requestUrlParamInput';
import { Draggable, Droppable } from 'react-beautiful-dnd';
import {
  FieldArray,
  FieldArrayRenderProps,
  FormikErrors,
  FormikTouched,
  useFormikContext,
} from 'formik';
import { optionsUrlParamTypes } from './selectOptions';
import {
  ChangeEvent,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { getInputReactKeyId } from '.';
import { CheckBox } from 'src/components/checkbox';
import { TextInput } from 'src/components/textInput';
import { usePresetHelper } from './providers/presetHelperProvider';
import { ColorPalette } from 'src/components/colorPalette';

const PropExistsMsg = 'Parameter exists';
const RequiredMsg = 'Required';

const defaultUrlParameter: UrlParam = {
  reactPropId: '',
  name: '',
  type: OpenApiDataTypes.INTEGER,
};

const queryTypeFieldName = 'modelAPI.parameters.paramType';
const pathsFieldName = 'modelAPI.parameters.paths';
const queriesFieldName = 'modelAPI.parameters.queries';
const pathParamsFieldName = 'modelAPI.parameters.paths.pathParams';
const queryParamsFieldName = 'modelAPI.parameters.queries.queryParams';
const urlParamsFieldName = 'modelAPI.urlParams';

type TabContentURLParamsProps = {
  disabled?: boolean;
};

//forwardRef needed because parent component needs a ref to Formik's fieldArray-ArrayHelpers.move method from this component, for drag and drop feature
const TabContentURLParams = forwardRef<
  FieldArrayRenderProps | undefined,
  TabContentURLParamsProps
>(function Content({ disabled = false }, ref) {
  const [newParam, setNewParam] = useState<UrlParam>(defaultUrlParameter);
  const [errorMsg, setErrorMsg] = useState<string>();
  const [selectedParamType, setSelectedParamType] = useState<URLParamType>();
  const { values, errors, touched, setFieldValue, handleChange } =
    useFormikContext<ModelApiFormModel>();
  const formArrayHelpersRef = useRef<FieldArrayRenderProps>();
  const { inputFieldsDisabledStatus } = usePresetHelper();
  const parameters = values.modelAPI.parameters;
  useImperativeHandle(ref, () => formArrayHelpersRef.current, []);
  const paramType = parameters && parameters.paramType;
  const queryIsArrayInputChecked =
    paramType === URLParamType.QUERY &&
    parameters &&
    parameters.queries &&
    parameters.queries.isArray != undefined
      ? parameters.queries.isArray
      : false;
  const pathIsArrayInputChecked: boolean =
    paramType === URLParamType.PATH &&
    parameters &&
    parameters.paths &&
    parameters.paths.isArray != undefined
      ? parameters.paths.isArray
      : false;
  let urlParamsStr = '';
  if (!pathIsArrayInputChecked) {
    urlParamsStr =
      parameters && parameters.paths
        ? parameters.paths.pathParams.reduce((prev, param) => {
            return `${prev}/{${param.name}}`;
          }, '')
        : '';
  } else {
    urlParamsStr =
      parameters && parameters.paths ? `/{${parameters.paths.name}}` || '' : '';
  }
  let paramErrors: FormikErrors<UrlParam>[] | string | undefined;
  let touchedParamFields: FormikTouched<UrlParam>[] | undefined;
  if (errors.modelAPI && errors.modelAPI.parameters) {
    if (
      paramType === URLParamType.QUERY &&
      errors.modelAPI.parameters.queries
    ) {
      paramErrors = errors.modelAPI.parameters.queries.queryParams as
        | FormikErrors<UrlParam>[]
        | string
        | undefined;
    } else if (
      paramType === URLParamType.PATH &&
      errors.modelAPI.parameters.paths
    ) {
      paramErrors = errors.modelAPI.parameters.paths.pathParams as
        | FormikErrors<UrlParam>[]
        | string
        | undefined;
    }
  }
  if (touched.modelAPI && touched.modelAPI.parameters) {
    if (
      paramType === URLParamType.QUERY &&
      touched.modelAPI.parameters.queries
    ) {
      touchedParamFields = touched.modelAPI.parameters.queries.queryParams;
    } else if (
      paramType === URLParamType.PATH &&
      touched.modelAPI.parameters.paths
    ) {
      touchedParamFields = touched.modelAPI.parameters.paths.pathParams;
    }
  }

  // overloading just to make the type compatible with formik's `handleChange` signature
  function handleNewParamChange(e: ChangeEvent<HTMLInputElement>): void;
  function handleNewParamChange(arg: UrlParam): void;
  function handleNewParamChange(arg: UrlParam | ChangeEvent<HTMLInputElement>) {
    if ('name' in arg) {
      if (errorMsg !== undefined) setErrorMsg(undefined);
      setNewParam((prev) => ({
        ...arg,
        reactPropId:
          prev.reactPropId === '' ? getInputReactKeyId() : prev.reactPropId,
      }));
    }
  }

  useEffect(() => {
    if (errorMsg !== undefined) setErrorMsg(undefined);
    if (!selectedParamType && !paramType) {
      // fresh tab, no params data - set defaults
      setFieldValue(queryTypeFieldName, URLParamType.QUERY);
      setFieldValue(`${queriesFieldName}.queryParams`, []);
      setFieldValue(`${queriesFieldName}.isArray`, false);
      setFieldValue(`${queriesFieldName}.mediaType`, MediaType.NONE);
      setSelectedParamType(URLParamType.QUERY);
    } else if (!selectedParamType && paramType) {
      // on initial reder
      setSelectedParamType(paramType);
      return; // exit because this is initial render
    } else if (selectedParamType && !paramType) {
      // on save
      setFieldValue(queryTypeFieldName, selectedParamType);
      return;
    } else if (paramType === selectedParamType) {
      // on same param type selected as before
      return; //no-op because there is no change of selected param type
    }

    if (paramType === URLParamType.QUERY && parameters && parameters.paths) {
      setFieldValue(queryParamsFieldName, parameters.paths.pathParams);
      setFieldValue(
        `${queriesFieldName}.mediaType`,
        parameters.paths.mediaType
      );
      setFieldValue(`${queriesFieldName}.isArray`, parameters.paths.isArray);
      setFieldValue(`${queriesFieldName}.name`, parameters.paths.name);
      setFieldValue(pathsFieldName, undefined);
      setSelectedParamType(URLParamType.QUERY);
    } else if (
      paramType === URLParamType.PATH &&
      parameters &&
      parameters.queries
    ) {
      setFieldValue(pathParamsFieldName, parameters.queries.queryParams);
      setFieldValue(
        `${pathsFieldName}.mediaType`,
        parameters.queries.mediaType
      );
      setFieldValue(`${pathsFieldName}.isArray`, parameters.queries.isArray);
      setFieldValue(`${pathsFieldName}.name`, parameters.queries.name);
      setFieldValue(queriesFieldName, undefined);
      setSelectedParamType(URLParamType.PATH);
    }
  }, [paramType]);

  function handleAddClick(formikArrayHelpers: FieldArrayRenderProps) {
    return () => {
      if (newParam.name.trim() === '') setErrorMsg(RequiredMsg);
      const urlParams =
        paramType === URLParamType.QUERY
          ? parameters?.queries?.queryParams
          : parameters?.paths?.pathParams;
      const isExist =
        urlParams &&
        urlParams.findIndex((param) => param.name === newParam.name) > -1;
      if (isExist) {
        setErrorMsg(PropExistsMsg);
        return;
      }
      formikArrayHelpers.push(newParam);
      setNewParam(defaultUrlParameter);
    };
  }

  function handleDeleteClick(
    formikArrayHelpers: FieldArrayRenderProps,
    index: number
  ) {
    return () => {
      const urlParams =
        paramType === URLParamType.QUERY
          ? parameters?.queries?.queryParams
          : parameters?.paths?.pathParams;
      if (urlParams && urlParams[index].name === newParam.name) {
        setErrorMsg(undefined);
      }
      formikArrayHelpers.remove(index);
    };
  }

  useEffect(() => {
    setFieldValue(
      urlParamsFieldName,
      paramType === URLParamType.PATH ? urlParamsStr : undefined
    );
  }, [urlParamsStr]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
      }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
        }}>
        <SelectInput<URLParamType>
          disabled={disabled || inputFieldsDisabledStatus[queryTypeFieldName]}
          label="URL Parameter Type"
          name={queryTypeFieldName}
          options={optionsUrlParamTypes}
          value={parameters?.paramType}
          onSyntheticChange={handleChange}
        />
        {paramType === URLParamType.QUERY && !parameters?.queries?.isArray ? (
          <div
            style={{
              marginLeft: 10,
              fontSize: 14,
            }}>
            e.g. https://hostname/predict?
            <span className={styles.paramHighlight}>age</span>
            =&#123;value&#125;&
            <span className={styles.paramHighlight}>gender</span>
            =&#123;value&#125;
          </div>
        ) : null}
        {paramType === URLParamType.QUERY && parameters?.queries?.isArray ? (
          <div
            style={{
              marginLeft: 10,
              fontSize: 14,
            }}>
            e.g. https://hostname/predict?data=&#123;
            <span className={styles.paramHighlight}>age</span>: value,&nbsp;
            <span className={styles.paramHighlight}>gender</span>: value&#125;
          </div>
        ) : null}
        {paramType === URLParamType.PATH && !parameters?.paths?.isArray ? (
          <div
            style={{
              marginLeft: 10,
              fontSize: 14,
            }}>
            e.g. https://hostname/predict/
            <span className={styles.paramHighlight}>&#123;age&#125;</span>/
            <span className={styles.paramHighlight}>&#123;gender&#125;</span>
          </div>
        ) : null}
        {paramType === URLParamType.PATH && parameters?.paths?.isArray ? (
          <div
            style={{
              marginLeft: 10,
              fontSize: 14,
            }}>
            e.g. https://hostname/predict/&#123;
            <span className={styles.paramHighlight}>age</span>: value,&nbsp;
            <span className={styles.paramHighlight}>gender</span>: value&#125;
          </div>
        ) : null}
        <Tooltip
          backgroundColor="#676767"
          fontColor="#FFFFFF"
          content={
            <div>
              <div style={{ marginBottom: 8 }}>
                Example of URL with 2 parameters defined - &quot;age&quot; &
                &quot;gender&quot;
              </div>
              Before running tests, you will be prompted to map your test
              dataset attributes to these parameters.
            </div>
          }
          position={TooltipPosition.right}
          offsetLeft={8}>
          <div
            style={{
              display: 'flex',
              color: '#991e66',
              marginLeft: 15,
            }}>
            <InfoIcon style={{ fontSize: 22 }} />
          </div>
        </Tooltip>
      </div>
      {paramType === URLParamType.QUERY ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'flex-start',
          }}>
          <CheckBox
            label="Format as array"
            disabled={disabled}
            checked={queryIsArrayInputChecked}
            name={`${queriesFieldName}.isArray`}
            onChange={handleChange}
            style={{ marginBottom: 15 }}
          />
          {queryIsArrayInputChecked ? (
            <div style={{ display: 'flex', marginBottom: 20 }}>
              <TextInput
                disabled={disabled || !queryIsArrayInputChecked}
                label="Array Variable Name"
                name={`${queriesFieldName}.name`}
                onChange={handleChange}
                value={
                  parameters && parameters.queries
                    ? parameters.queries.name
                    : undefined
                }
                maxLength={128}
                style={{ marginBottom: 0, marginRight: 8, width: 200 }}
              />
              <TextInput
                label="Max Items"
                disabled={disabled || !queryIsArrayInputChecked}
                name={`${queriesFieldName}.maxItems`}
                onChange={handleChange}
                value={
                  parameters && parameters.queries
                    ? parameters.queries.maxItems
                    : undefined
                }
                maxLength={128}
                style={{ marginBottom: 0, marginRight: 8, width: 200 }}
              />
            </div>
          ) : null}
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'flex-start',
          }}>
          <CheckBox
            label="Format as array"
            disabled={disabled}
            checked={pathIsArrayInputChecked}
            name={`${pathsFieldName}.isArray`}
            onChange={handleChange}
            style={{ marginBottom: 15 }}
          />
          {pathIsArrayInputChecked ? (
            <div style={{ display: 'flex', marginBottom: 20 }}>
              <TextInput
                disabled={disabled}
                label="Array Variable Name"
                name={`${pathsFieldName}.name`}
                onChange={handleChange}
                value={
                  parameters && parameters.paths
                    ? parameters.paths.name
                    : undefined
                }
                maxLength={128}
                style={{ marginBottom: 0, marginRight: 8, width: 200 }}
              />
              <TextInput
                label="Max Items"
                disabled={disabled}
                name={`${pathsFieldName}.maxItems`}
                onChange={handleChange}
                value={
                  parameters && parameters.paths
                    ? parameters.paths.maxItems
                    : undefined
                }
                maxLength={128}
                style={{ marginBottom: 0, marginRight: 8, width: 200 }}
              />
            </div>
          ) : null}
        </div>
      )}
      <UrlParamsInputHeading />
      <Droppable droppableId="list-container">
        {(provided) => {
          const fieldArrayName =
            paramType === URLParamType.QUERY
              ? queryParamsFieldName
              : pathParamsFieldName;
          return (
            <div
              className="list-container"
              {...provided.droppableProps}
              ref={provided.innerRef}>
              <FieldArray name={fieldArrayName}>
                {(arrayHelpers) => {
                  formArrayHelpersRef.current = arrayHelpers;
                  let params: UrlParam[] = [];
                  if (
                    paramType === URLParamType.QUERY &&
                    parameters &&
                    parameters.queries
                  ) {
                    params = parameters.queries.queryParams;
                  } else if (
                    paramType === URLParamType.PATH &&
                    parameters &&
                    parameters.paths
                  ) {
                    params = parameters.paths.pathParams;
                  }
                  return (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                      }}>
                      {params.map((param, index) => (
                        <Draggable
                          isDragDisabled={disabled}
                          key={param.reactPropId}
                          draggableId={param.reactPropId}
                          index={index}>
                          {(provided) => (
                            <div
                              className="item-container"
                              ref={provided.innerRef}
                              {...provided.dragHandleProps}
                              {...provided.draggableProps}>
                              <UrlParamCaptureInput
                                isFormikBinded
                                paramInputName={`${
                                  paramType === URLParamType.QUERY
                                    ? queryParamsFieldName
                                    : pathParamsFieldName
                                }.${index}.name`}
                                paramTypeName={`${
                                  paramType === URLParamType.QUERY
                                    ? queryParamsFieldName
                                    : pathParamsFieldName
                                }.${index}.type`}
                                disabled={disabled}
                                value={param}
                                onChange={handleChange}
                                onDeleteClick={handleDeleteClick(
                                  arrayHelpers,
                                  index
                                )}
                                paramError={
                                  Boolean(
                                    paramErrors &&
                                      typeof paramErrors === 'object' &&
                                      paramErrors[index]?.name &&
                                      touchedParamFields &&
                                      touchedParamFields[index]
                                  )
                                    ? paramErrors && paramErrors[index].name
                                    : undefined
                                }
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {!disabled ? (
                        <div style={{ marginTop: 5 }}>
                          <UrlParamCaptureInput
                            disabled={disabled}
                            showAddBtn
                            value={newParam}
                            onChange={handleNewParamChange}
                            onAddClick={handleAddClick(arrayHelpers)}
                            paramError={errorMsg}
                          />
                          {Object.keys(touched).length &&
                          typeof paramErrors === 'string' ? (
                            <div
                              style={{
                                color: ColorPalette.alertRed,
                                fontSize: 14,
                              }}>
                              {paramErrors}
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  );
                }}
              </FieldArray>
            </div>
          );
        }}
      </Droppable>
    </div>
  );
});

export { TabContentURLParams };
