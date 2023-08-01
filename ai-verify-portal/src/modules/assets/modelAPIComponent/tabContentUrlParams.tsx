import { SelectInput } from 'src/components/selectInput';
import { Tooltip, TooltipPosition } from 'src/components/tooltip';
import InfoIcon from '@mui/icons-material/Info';
import {
  ModelAPIFormModel,
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
import { FieldArray, FieldArrayRenderProps, useFormikContext } from 'formik';
import { optionsUrlParamTypes } from './selectOptions';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { getInputReactKeyId } from '.';

const PropExistsMsg = 'Parameter exists';
const RequiredMsg = 'Required';

const defaultUrlParameter: UrlParam = {
  reactPropId: '',
  name: '',
  type: OpenApiDataTypes.INTEGER,
};

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
  const [paramType, setParamType] = useState<URLParamType>();
  const [newParam, setNewParam] = useState<UrlParam>(defaultUrlParameter);
  const [errorMsg, setErrorMsg] = useState<string>();
  const { values, setFieldValue } = useFormikContext<ModelAPIFormModel>();
  const formArrayHelpersRef = useRef<FieldArrayRenderProps>();
  const urlParamsStr = values.modelAPI.parameters.paths
    ? values.modelAPI.parameters.paths.pathParams.reduce((prev, param) => {
        return `${prev}/{${param.name}}`;
      }, '')
    : '';
  useImperativeHandle(ref, () => formArrayHelpersRef.current, []);

  function handleParamTypeChange(val: URLParamType) {
    if (errorMsg !== undefined) setErrorMsg(undefined);
    if (val === paramType) return;
    setParamType(val);

    if (val === URLParamType.QUERY && values.modelAPI.parameters.paths) {
      setFieldValue(
        queryParamsFieldName,
        values.modelAPI.parameters.paths.pathParams
      );
      setFieldValue(
        `${queriesFieldName}.mediaType`,
        values.modelAPI.parameters.paths.mediaType
      );
      setFieldValue(
        `${queriesFieldName}.isArray`,
        values.modelAPI.parameters.paths.isArray
      );
      setFieldValue(pathsFieldName, undefined);
    } else if (
      val === URLParamType.PATH &&
      values.modelAPI.parameters.queries
    ) {
      setFieldValue(
        pathParamsFieldName,
        values.modelAPI.parameters.queries.queryParams
      );
      setFieldValue(
        `${pathsFieldName}.mediaType`,
        values.modelAPI.parameters.queries.mediaType
      );
      setFieldValue(
        `${pathsFieldName}.isArray`,
        values.modelAPI.parameters.queries.isArray
      );
      setFieldValue(queriesFieldName, undefined);
    }
  }

  function handleNewParamChange(value: UrlParam) {
    if (errorMsg !== undefined) setErrorMsg(undefined);
    setNewParam((prev) => ({
      ...value,
      reactPropId:
        prev.reactPropId === '' ? getInputReactKeyId() : prev.reactPropId,
    }));
  }

  function handleAddedParamChange(idx: number) {
    return (val: UrlParam) => {
      setFieldValue(
        `${
          paramType === URLParamType.QUERY
            ? queryParamsFieldName
            : pathParamsFieldName
        }[${idx}]`,
        val
      );
    };
  }

  function handleAddClick(formikArrayHelpers: FieldArrayRenderProps) {
    return () => {
      if (newParam.name.trim() === '') setErrorMsg(RequiredMsg);
      const urlParams =
        paramType === URLParamType.QUERY
          ? values.modelAPI.parameters.queries?.queryParams
          : values.modelAPI.parameters.paths?.pathParams;
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
          ? values.modelAPI.parameters.queries?.queryParams
          : values.modelAPI.parameters.paths?.pathParams;
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

  useEffect(() => {
    setParamType(
      values.modelAPI.parameters.queries
        ? URLParamType.QUERY
        : URLParamType.PATH
    );
  }, []);

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
          disabled={disabled}
          label="URL Parameter Type"
          name="urlParamType"
          options={optionsUrlParamTypes}
          value={paramType}
          onChange={handleParamTypeChange}
        />
        {paramType === URLParamType.QUERY ? (
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
        ) : (
          <div
            style={{
              marginLeft: 10,
              fontSize: 14,
            }}>
            e.g. https://hostname/predict/
            <span className={styles.paramHighlight}>&#123;age&#125;</span>/
            <span className={styles.paramHighlight}>&#123;gender&#125;</span>
          </div>
        )}
        <Tooltip
          backgroundColor="#676767"
          fontColor="#FFFFFF"
          content={
            <div>
              <div style={{ marginBottom: 5 }}>
                Example of URL with 2 parameters defined - &quot;age&quot; &
                &quot;gender&quot;
              </div>
              Before running tests, you will be prompted to map your test
              dataset attributes to these parameters.
            </div>
          }
          position={TooltipPosition.right}
          offsetLeft={8}
          offsetTop={42}>
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
                    values.modelAPI.parameters.queries
                  ) {
                    params = values.modelAPI.parameters.queries.queryParams;
                  } else if (
                    paramType === URLParamType.PATH &&
                    values.modelAPI.parameters.paths
                  ) {
                    params = values.modelAPI.parameters.paths.pathParams;
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
                                disabled={disabled}
                                value={param}
                                onChange={handleAddedParamChange(index)}
                                onDeleteClick={handleDeleteClick(
                                  arrayHelpers,
                                  index
                                )}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {!disabled ? (
                        <UrlParamCaptureInput
                          disabled={disabled}
                          showAddBtn
                          value={newParam}
                          onChange={handleNewParamChange}
                          onAddClick={handleAddClick(arrayHelpers)}
                          paramError={errorMsg}
                        />
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
