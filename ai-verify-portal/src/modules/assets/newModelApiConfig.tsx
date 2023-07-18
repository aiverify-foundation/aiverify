import { TextInput } from 'src/components/textInput';
import { MinimalHeader } from '../home/header';
import styles from './styles/newModelApiConfig.module.css';
import { SelectInput, SelectOption } from 'src/components/selectInput';
import EditIcon from '@mui/icons-material/Edit';
import InfoIcon from '@mui/icons-material/Info';
import clsx from 'clsx';
import { ChangeEvent, useEffect, useState } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DragUpdate,
} from 'react-beautiful-dnd';
import { IconButton } from 'src/components/iconButton';
import {
  optionsAuthMethods,
  optionsMediaTypes,
  optionsModelTypes,
  optionsRequestMethods,
  optionsUrlParamTypes,
} from './selectOptions';
import {
  RequestHeader,
  RequestHeaderCaptureInput,
  RequestHeaderDisplayInput,
  RequestHeaderInputHeading,
} from './requestHeaderInput';
import {
  UrlParameter,
  UrlParamDisplayInput,
  UrlParamCaptureInput,
  UrlParamsInputHeading,
} from './requestUrlParamInput';
import {
  AuthType,
  MediaType,
  ModelAPIGraphQLModel,
  OpenApiDataTypes,
  RequestMethod,
  URLParamType,
} from './types';
import {
  BodyPayloadProperty,
  BodyPayloadPropertyCaptureInput,
  BodyPayloadPropertyDisplayInput,
  BodyPayloadPropertyInputHeading,
} from './requestBodyInput';
import { ApiConfigNameDescForm } from './apiConfigNameDescForm';
import { Tooltip, TooltipPosition } from 'src/components/tooltip';
import produce from 'immer';
import {
  ResponseProperty,
  ResponsePropertyInput,
  ResponsePropertyInputHeading,
} from './responsePropertyInput';
import { Formik, Form } from 'formik';
import { ModelType } from 'src/types/model.interface';
import { ModelApiLeftSection } from './newModelApiLeftSection';
import { TabButtonsGroup } from './newModelApiTabButtons';

type UrlParameterWithReactKeyId = UrlParameter & { id: string };
type BodyPayloadPropertyWithReactKeyId = BodyPayloadProperty & { id: string };
type RequestHeaderWithReactKeyId = RequestHeader & { id: string };
type ResponsePropertyWithReactKeyId = ResponseProperty & { id: string };

const defaultConfigNameDisplay = 'Configuration Name';
const defaultConfigDescDisplay = 'Description';

const emptyTuple: [string, string] = ['', ''];
const emptyKeyValue = { key: '', value: '' };
const defaultUrlParameter = {
  key: '',
  dataType: OpenApiDataTypes.INTEGER,
};
const defaultBodyPayloadProperty = {
  key: '',
  dataType: OpenApiDataTypes.INTEGER,
};

enum Tab {
  URL_PARAMS,
  HEADERS,
  AUTHENTICATION,
  REQUEST_BODY,
  RESPONSE,
}

/*
  This id is only used for react component `key` props for the list of urlparams and request body property fields rendered.
  Do not use it for any other purposes.
 */
function initReactKeyIdGenerator() {
  let count = 0;
  return () => `input${Date.now()}${count++}`;
}

const getInputReactKeyId = initReactKeyIdGenerator();

const initialValues: ModelAPIGraphQLModel = {
  name: '',
  description: '',
  modelType: ModelType.Classification,
  url: '',
  method: RequestMethod.POST,
  authType: AuthType.NO_AUTH,
  authTypeConfig: {},
  requestBody: {
    mediaType: MediaType.NONE,
    isArray: false,
    properties: [],
  },
  parameters: {
    queries: {
      mediaType: MediaType.NONE,
      isArray: false,
      queryParams: [],
    },
    paths: {
      mediaType: MediaType.NONE,
      isArray: false,
      pathParams: [],
    },
  },
  requestConfig: {
    rateLimit: -1,
    batchStrategy: '',
    batchLimit: -1,
    maxConnections: -1,
    requestTimeout: -1,
  },
  response: {
    statusCode: 200,
    mediaType: MediaType.NONE,
    type: OpenApiDataTypes.STRING,
  },
};

function NewModelApiConfigModule() {
  const [configName, setConfigName] = useState<string>('');
  const [configDesc, setConfigDesc] = useState<string>('');
  const [isEditName, setIsEditName] = useState(false);
  const [modelType, setModelType] = useState<SelectOption>(
    optionsModelTypes[0]
  );
  const [requestMethod, setRequestMethod] = useState<SelectOption>(
    optionsRequestMethods[1]
  );
  const [authType, setAuthType] = useState<SelectOption>(optionsAuthMethods[0]);
  const [urlParamType, setUrlParamType] = useState<SelectOption>(
    optionsUrlParamTypes[0]
  );
  const [requestMediaType, setRequestMediaType] = useState<SelectOption>(
    optionsMediaTypes[0]
  );
  const [responseMediaType, setResponseMediaType] = useState<SelectOption>(
    optionsMediaTypes[0]
  );
  const [activeTab, setActiveTab] = useState<Tab>();
  const [newHeader, setNewHeader] = useState<RequestHeader>(emptyKeyValue);
  const [newResponseProperty, setNewResponseProperty] =
    useState<RequestHeader>(emptyKeyValue);
  const [newParam, setNewParam] = useState<UrlParameter>(defaultUrlParameter);
  const [newRequestProperty, setNewRequestProperty] =
    useState<BodyPayloadProperty>(defaultBodyPayloadProperty);
  const [requestHeaders, setRequestHeaders] = useState<
    RequestHeaderWithReactKeyId[]
  >([]);
  const [urlParams, setUrlParams] = useState<UrlParameterWithReactKeyId[]>([]);
  const [requestProperties, setRequestProperties] = useState<
    BodyPayloadPropertyWithReactKeyId[]
  >([]);
  const [responseProperties, setResponseProperties] = useState<
    ResponsePropertyWithReactKeyId[]
  >([]);
  const [bearerToken, setBearerToken] = useState<string>('');
  const [basicAuthUserPwd, setBasicAuthUserPwd] =
    useState<[string, string]>(emptyTuple);

  function handleBackClick() {
    history.back();
  }

  function handleTabClick(tab: Tab) {
    return setActiveTab(tab);
  }

  function handleEditNameClick() {
    setIsEditName(true);
  }

  function handleEditNameCancelClick() {
    setIsEditName(false);
  }

  function handleEditNameOkClick() {
    setIsEditName(false);
  }

  function handleConfigNameChange(e: ChangeEvent<HTMLInputElement>) {
    setConfigName(e.target.value);
  }

  function handleConfigDescriptionChange(e: ChangeEvent<HTMLTextAreaElement>) {
    setConfigDesc(e.target.value);
  }

  function handleRequestMediaTypeChange(option: SelectOption) {
    setRequestMediaType(option);
  }

  function handleResponseMediaTypeChange(option: SelectOption) {
    setResponseMediaType(option);
  }

  function handleAuthUserChange(e: ChangeEvent<HTMLInputElement>) {
    setBasicAuthUserPwd((prev) => [e.target.value, prev[1]]);
  }

  function handleAuthPasswordChange(e: ChangeEvent<HTMLInputElement>) {
    setBasicAuthUserPwd((prev) => [prev[0], e.target.value]);
  }

  function handleModelTypeChange(option: SelectOption) {
    setModelType(option);
  }

  function handleRequestMethodChange(option: SelectOption) {
    setRequestMethod(option);
  }

  function handleUrlParamTypeChange(option: SelectOption) {
    setUrlParamType(option);
  }

  function handleAuthTypeChange(option: SelectOption) {
    setAuthType(option);
  }

  function handleBearerTokenChange(e: ChangeEvent<HTMLInputElement>) {
    setBearerToken(e.target.value);
  }

  function handleNewHeaderKeyChange(e: ChangeEvent<HTMLInputElement>) {
    setNewHeader((prev) => ({ key: e.target.value, value: prev.value }));
  }

  function handleNewHeaderValueChange(e: ChangeEvent<HTMLInputElement>) {
    setNewHeader((prev) => ({ key: prev.key, value: e.target.value }));
  }

  function handleNewResponsePropertyNameChange(
    e: ChangeEvent<HTMLInputElement>
  ) {
    setNewResponseProperty((prev) => ({
      key: e.target.value,
      value: prev.value,
    }));
  }

  function handleNewResponsePropertyValueChange(
    e: ChangeEvent<HTMLInputElement>
  ) {
    setNewResponseProperty((prev) => ({
      key: prev.key,
      value: e.target.value,
    }));
  }

  function handleNewParamKeyChange(e: ChangeEvent<HTMLInputElement>) {
    setNewParam((prev) => ({
      key: e.target.value,
      dataType: prev.dataType,
    }));
  }

  function handleNewParamDatatypeChange(option: SelectOption) {
    if (!option) return;
    setNewParam((prev) => ({
      key: prev.key,
      dataType: option.value,
    }));
  }

  function handleNewRequestPropertyKeyChange(e: ChangeEvent<HTMLInputElement>) {
    setNewRequestProperty((prev) => ({
      key: e.target.value,
      dataType: prev.dataType,
    }));
  }

  function handleNewRequestPropertyDatatypeChange(option: SelectOption) {
    if (!option) return;
    setNewRequestProperty((prev) => ({
      key: prev.key,
      dataType: option.value,
    }));
  }

  function handleCurrentParamKeyChange(paramKeyName: string) {
    return (e: ChangeEvent<HTMLInputElement>) => {
      setUrlParams(
        produce((draft) => {
          const urlParam = draft.find((param) => param.key === paramKeyName);
          if (urlParam) urlParam.key = e.target.value;
        })
      );
    };
  }

  function handleCurrentParamDatatypeChange(paramKeyName: string) {
    return (option: SelectOption) => {
      if (!option) return;
      setUrlParams(
        produce((draft) => {
          const urlParam = draft.find((param) => param.key === paramKeyName);
          if (urlParam) urlParam.dataType = option.value;
        })
      );
    };
  }

  function handleCurrentBodyPropKeyChange(propKeyName: string) {
    return (e: ChangeEvent<HTMLInputElement>) => {
      setRequestProperties(
        produce((draft) => {
          const urlParam = draft.find((param) => param.key === propKeyName);
          if (urlParam) urlParam.key = e.target.value;
        })
      );
    };
  }

  function handleCurrentBodyPropDatatypeChange(propKeyName: string) {
    return (option: SelectOption) => {
      if (!option) return;
      setRequestProperties(
        produce((draft) => {
          const urlParam = draft.find((param) => param.key === propKeyName);
          if (urlParam) urlParam.dataType = option.value;
        })
      );
    };
  }

  function handleCurrentHeaderKeynameChange(headerKeyName: string) {
    return (e: ChangeEvent<HTMLInputElement>) => {
      setRequestHeaders(
        produce((draft) => {
          const header = draft.find((header) => header.key === headerKeyName);
          if (header) header.key = e.target.value;
        })
      );
    };
  }

  function handleCurrentHeaderValueChange(headerKeyName: string) {
    return (e: ChangeEvent<HTMLInputElement>) => {
      setRequestHeaders(
        produce((draft) => {
          const header = draft.find((header) => header.key === headerKeyName);
          if (header) header.value = e.target.value;
        })
      );
    };
  }

  function handleCurrentResponsePropertyNameChange(propName: string) {
    return (e: ChangeEvent<HTMLInputElement>) => {
      setResponseProperties(
        produce((draft) => {
          const prop = draft.find((prop) => prop.key === propName);
          if (prop) prop.key = e.target.value;
        })
      );
    };
  }

  function handleCurrentResponsePropertyValueChange(propName: string) {
    return (e: ChangeEvent<HTMLInputElement>) => {
      setResponseProperties(
        produce((draft) => {
          const prop = draft.find((prop) => prop.key === propName);
          if (prop) prop.value = e.target.value;
        })
      );
    };
  }

  function handleAddHeader() {
    setRequestHeaders(
      produce((draft) => {
        draft.push({
          key: newHeader.key,
          value: newHeader.value,
          id: getInputReactKeyId(),
        });
      })
    );
    setNewHeader(emptyKeyValue);
  }

  function handleAddUrlParam() {
    setUrlParams(
      produce((draft) => {
        draft.push({
          key: newParam.key,
          dataType: newParam.dataType,
          id: getInputReactKeyId(),
        });
      })
    );
    setNewParam(defaultUrlParameter);
  }

  function handleAddRequestProperty() {
    setRequestProperties(
      produce((draft) => {
        draft.push({
          key: newRequestProperty.key,
          dataType: newRequestProperty.dataType,
          id: getInputReactKeyId(),
        });
      })
    );
    setNewRequestProperty(defaultBodyPayloadProperty);
  }

  function handleAddResponseProperty() {
    setResponseProperties(
      produce((draft) => {
        draft.push({
          key: newResponseProperty.key,
          value: newResponseProperty.value,
          id: getInputReactKeyId(),
        });
      })
    );
    setNewResponseProperty(emptyKeyValue);
  }

  function handleDeleteUrlParamClick(param: UrlParameter) {
    const idx = urlParams.findIndex(
      (currentParam) => currentParam.key === param.key
    );
    if (idx === -1) return;
    setUrlParams(
      produce((draft) => {
        draft.splice(idx, 1);
      })
    );
  }

  function handleDeleteHeaderClick(header: RequestHeader) {
    const idx = requestHeaders.findIndex(
      (currentHeader) => currentHeader.key === header.key
    );
    if (idx === -1) return;
    setRequestHeaders(
      produce((draft) => {
        draft.splice(idx, 1);
      })
    );
  }

  function handleDeleteRequestPropertyClick(property: BodyPayloadProperty) {
    const idx = requestProperties.findIndex(
      (currentProp) => currentProp.key === property.key
    );
    if (idx === -1) return;
    setRequestProperties(
      produce((draft) => {
        draft.splice(idx, 1);
      })
    );
  }

  function handleDeleteResponsePropertyClick(property: ResponseProperty) {
    const idx = responseProperties.findIndex(
      (currentProp) => currentProp.key === property.key
    );
    if (idx === -1) return;
    setResponseProperties(
      produce((draft) => {
        draft.splice(idx, 1);
      })
    );
  }
  function handleDrop(droppedItem: DragUpdate) {
    if (!droppedItem.destination) return;
    setUrlParams(
      produce((draft) => {
        const [reorderedItem] = draft.splice(droppedItem.source.index, 1);
        if (droppedItem.destination)
          draft.splice(droppedItem.destination.index, 0, reorderedItem);
      })
    );
  }

  // useEffect(() => {
  //   if (
  //     activeTab !== Tab.AUTHENTICATION &&
  //     activeTab !== Tab.RESPONSE &&
  //     activeTab !== Tab.HEADERS
  //   ) {
  //     setActiveTab(
  //       requestMethod && requestMethod.value === RequestMethod.GET
  //         ? Tab.URL_PARAMS
  //         : Tab.REQUEST_BODY
  //     );
  //   }
  // }, [requestMethod]);

  useEffect(() => {
    console.log(urlParams);
    console.log(requestProperties);
    console.log(requestHeaders);
    console.log(responseProperties);
  }, [urlParams, requestProperties, requestHeaders, responseProperties]);

  return (
    <div>
      <DragDropContext onDragEnd={handleDrop}>
        <MinimalHeader />
        <div className="layoutContentArea">
          <div className="scrollContainer">
            <div className="mainContainer">
              <div className={styles.container__limits}>
                <div className={styles.layout}>
                  <Formik
                    initialValues={initialValues}
                    onSubmit={(values) => console.log(values)}>
                    {({ values, handleChange, setFieldValue }) => {
                      return (
                        <Form>
                          <div style={{ marginBottom: '25px' }}>
                            <h3 className="screenHeading">API Configuration</h3>
                            <p className="headingDescription">
                              Add the API configurations needed to connect to
                              the AI model server
                            </p>
                          </div>
                          <div className={styles.apiConfigForm}>
                            <div className={styles.leftSection}>
                              <ModelApiLeftSection />
                            </div>
                            <div className={styles.vDivider} />
                            <div className={styles.rightSection}>
                              <div style={{ display: 'flex' }}>
                                <div style={{ marginRight: 10 }}>
                                  <SelectInput
                                    width={140}
                                    label="Request Method"
                                    name="method"
                                    options={optionsRequestMethods}
                                    onChange={(val) =>
                                      setFieldValue('method', val)
                                    }
                                    value={values.method}
                                  />
                                </div>
                                <div style={{ flexGrow: 1 }}>
                                  <TextInput
                                    label="Model URL"
                                    name="url"
                                    onChange={handleChange}
                                    value={values.url}
                                  />
                                </div>
                              </div>
                              <div className={styles.tabs}>
                                <TabButtonsGroup
                                  onTabClick={handleTabClick}
                                  activeTab={activeTab}
                                />
                                <div className={styles.tabsDivider} />
                                <div className={styles.tabContent}>
                                  {values.method === RequestMethod.GET &&
                                  activeTab === Tab.URL_PARAMS ? (
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
                                        <SelectInput
                                          label="URL Parameter Type"
                                          name="urlParamType"
                                          options={optionsUrlParamTypes}
                                          value={urlParamType}
                                          onChange={handleUrlParamTypeChange}
                                        />
                                        {urlParamType &&
                                        urlParamType.value ===
                                          URLParamType.QUERY ? (
                                          <div
                                            style={{
                                              marginLeft: 10,
                                              fontSize: 14,
                                            }}>
                                            e.g. https://hostname/predict?
                                            <span
                                              className={styles.paramHighlight}>
                                              age
                                            </span>
                                            =&#123;value&#125;&
                                            <span
                                              className={styles.paramHighlight}>
                                              gender
                                            </span>
                                            =&#123;value&#125;
                                          </div>
                                        ) : (
                                          <div
                                            style={{
                                              marginLeft: 10,
                                              fontSize: 14,
                                            }}>
                                            e.g. https://hostname/predict/
                                            <span
                                              className={styles.paramHighlight}>
                                              &#123;age&#125;
                                            </span>
                                            /
                                            <span
                                              className={styles.paramHighlight}>
                                              &#123;gender&#125;
                                            </span>
                                          </div>
                                        )}
                                        <Tooltip
                                          backgroundColor="#676767"
                                          fontColor="#FFFFFF"
                                          content={
                                            urlParamType &&
                                            urlParamType.value ===
                                              URLParamType.QUERY ? (
                                              <div>
                                                <div
                                                  style={{ marginBottom: 5 }}>
                                                  Example of URL with 2
                                                  parameters defined -
                                                  &quot;age&quot; &
                                                  &quot;gender&quot;
                                                </div>
                                                Before running tests, you will
                                                be prompted to map your test
                                                dataset attributes to these
                                                parameters.
                                              </div>
                                            ) : (
                                              <div>
                                                <div
                                                  style={{ marginBottom: 5 }}>
                                                  Example of URL with 2
                                                  parameters are defined -
                                                  &quot;age&quot; &
                                                  &quot;gender&quot;
                                                </div>
                                                Before running tests, you will
                                                be prompted to map your dataset
                                                attributes to these parameters.
                                              </div>
                                            )
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
                                            <InfoIcon
                                              style={{ fontSize: 22 }}
                                            />
                                          </div>
                                        </Tooltip>
                                      </div>
                                      <UrlParamsInputHeading />
                                      <Droppable droppableId="list-container">
                                        {(provided) => (
                                          <div
                                            className="list-container"
                                            {...provided.droppableProps}
                                            ref={provided.innerRef}>
                                            {urlParams.map((param, index) => (
                                              <Draggable
                                                key={param.id}
                                                draggableId={param.id}
                                                index={index}>
                                                {(provided) => (
                                                  <div
                                                    className="item-container"
                                                    ref={provided.innerRef}
                                                    {...provided.dragHandleProps}
                                                    {...provided.draggableProps}>
                                                    <UrlParamDisplayInput
                                                      key={param.id}
                                                      param={param}
                                                      onKeynameChange={handleCurrentParamKeyChange(
                                                        param.key
                                                      )}
                                                      onDatatypeChange={handleCurrentParamDatatypeChange(
                                                        param.key
                                                      )}
                                                      onRemoveBtnClick={
                                                        handleDeleteUrlParamClick
                                                      }
                                                    />
                                                  </div>
                                                )}
                                              </Draggable>
                                            ))}
                                            {provided.placeholder}
                                          </div>
                                        )}
                                      </Droppable>
                                      <UrlParamCaptureInput
                                        newParam={newParam}
                                        onKeynameChange={
                                          handleNewParamKeyChange
                                        }
                                        onDatatypeChange={
                                          handleNewParamDatatypeChange
                                        }
                                        onAddClick={handleAddUrlParam}
                                      />
                                    </div>
                                  ) : null}

                                  {activeTab === Tab.REQUEST_BODY ? (
                                    <div
                                      style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                      }}>
                                      <div style={{ marginBottom: 5 }}>
                                        <SelectInput
                                          width={300}
                                          label="Media Type"
                                          name="requestBody.mediaType"
                                          options={optionsMediaTypes}
                                          onChange={(val) =>
                                            setFieldValue(
                                              'requestBody.mediaType',
                                              val
                                            )
                                          }
                                          value={
                                            values.requestBody &&
                                            values.requestBody.mediaType
                                          }
                                        />
                                      </div>
                                      {values.requestBody &&
                                      values.requestBody.mediaType !==
                                        MediaType.NONE ? (
                                        <div>
                                          <BodyPayloadPropertyInputHeading />
                                          {requestProperties.map((property) => (
                                            <BodyPayloadPropertyDisplayInput
                                              key={property.id}
                                              property={property}
                                              onDatatypeChange={handleCurrentBodyPropDatatypeChange(
                                                property.key
                                              )}
                                              onPropertyNameChange={handleCurrentBodyPropKeyChange(
                                                property.key
                                              )}
                                              onRemoveBtnClick={
                                                handleDeleteRequestPropertyClick
                                              }
                                            />
                                          ))}
                                          <BodyPayloadPropertyCaptureInput
                                            newProperty={newRequestProperty}
                                            onKeynameChange={
                                              handleNewRequestPropertyKeyChange
                                            }
                                            onDatatypeChange={
                                              handleNewRequestPropertyDatatypeChange
                                            }
                                            onAddClick={
                                              handleAddRequestProperty
                                            }
                                          />
                                        </div>
                                      ) : null}
                                    </div>
                                  ) : null}

                                  {activeTab === Tab.HEADERS ? (
                                    <div
                                      style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                      }}>
                                      {/* <div style={{ display: 'flex', marginBottom: 5 }}>
                                  <TextInput
                                    placeholder="requestTimeout"
                                    label="Request Timeout"
                                    name="requestTimeout"
                                    style={{ width: 200, marginRight: 15 }}
                                  />
                                  <TextInput
                                    placeholder="rateLimit"
                                    label="Rate Limit"
                                    name="rateLimit"
                                    style={{ width: 200, marginRight: 15 }}
                                  />
                                  <TextInput
                                    placeholder="maxConnections"
                                    label="Max Connections"
                                    name="maxConnections"
                                    style={{ width: 200, marginRight: 15 }}
                                  />
                                </div> */}
                                      {/* <h4 style={{ fontSize: 15, fontWeight: 300 }}>
                                  Additional Headers
                                </h4> */}
                                      <RequestHeaderInputHeading />
                                      {requestHeaders.map((header) => (
                                        <RequestHeaderDisplayInput
                                          key={header.id}
                                          header={header}
                                          onKeynameChange={handleCurrentHeaderKeynameChange(
                                            header.key
                                          )}
                                          onValueChange={handleCurrentHeaderValueChange(
                                            header.key
                                          )}
                                          onRemoveBtnClick={
                                            handleDeleteHeaderClick
                                          }
                                        />
                                      ))}
                                      <RequestHeaderCaptureInput
                                        newHeader={newHeader}
                                        onKeynameChange={
                                          handleNewHeaderKeyChange
                                        }
                                        onValueChange={
                                          handleNewHeaderValueChange
                                        }
                                        onAddClick={handleAddHeader}
                                      />
                                    </div>
                                  ) : null}

                                  {activeTab === Tab.RESPONSE ? (
                                    <div
                                      style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                      }}>
                                      <div
                                        style={{
                                          marginBottom: 5,
                                          display: 'flex',
                                        }}>
                                        <SelectInput
                                          width={300}
                                          label="Media Type"
                                          name="response.mediaType"
                                          options={optionsMediaTypes}
                                          onChange={(val) =>
                                            setFieldValue(
                                              'response.mediaType',
                                              val
                                            )
                                          }
                                          value={values.response.mediaType}
                                          style={{ marginRight: 8 }}
                                        />
                                      </div>
                                      <h4
                                        style={{
                                          fontSize: 15,
                                          fontWeight: 300,
                                        }}>
                                        Additional Properties
                                      </h4>
                                      <ResponsePropertyInputHeading />
                                      {responseProperties.map((prop) => (
                                        <ResponsePropertyInput
                                          key={prop.id}
                                          property={prop}
                                          onKeynameChange={handleCurrentResponsePropertyNameChange(
                                            prop.key
                                          )}
                                          onValueChange={handleCurrentResponsePropertyValueChange(
                                            prop.key
                                          )}
                                          onRemoveBtnClick={
                                            handleDeleteResponsePropertyClick
                                          }
                                        />
                                      ))}
                                      <ResponsePropertyInput
                                        showAddBtn
                                        property={newResponseProperty}
                                        onKeynameChange={
                                          handleNewResponsePropertyNameChange
                                        }
                                        onValueChange={
                                          handleNewResponsePropertyValueChange
                                        }
                                        onAddClick={handleAddResponseProperty}
                                      />
                                    </div>
                                  ) : null}

                                  {activeTab === Tab.AUTHENTICATION ? (
                                    <div
                                      style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                      }}>
                                      <SelectInput
                                        width={200}
                                        label="Authentication Type"
                                        name="authType"
                                        options={optionsAuthMethods}
                                        onChange={handleAuthTypeChange}
                                        value={authType}
                                      />
                                      {authType &&
                                      authType.value ===
                                        AuthType.BEARER_TOKEN ? (
                                        <div style={{ flexGrow: 1 }}>
                                          <TextInput
                                            label="Token"
                                            name="bearerToken"
                                            value={bearerToken}
                                            onChange={handleBearerTokenChange}
                                            style={{ width: 560 }}
                                          />
                                        </div>
                                      ) : null}
                                      {authType &&
                                      authType.value === AuthType.BASIC ? (
                                        <div style={{ display: 'flex' }}>
                                          <TextInput
                                            label="User"
                                            name="authUser"
                                            value={basicAuthUserPwd[0]}
                                            onChange={handleAuthUserChange}
                                            style={{
                                              marginRight: 8,
                                              width: 300,
                                            }}
                                          />
                                          <TextInput
                                            label="Password"
                                            name="authPassword"
                                            value={basicAuthUserPwd[1]}
                                            onChange={handleAuthPasswordChange}
                                            style={{ width: 300 }}
                                          />
                                        </div>
                                      ) : null}
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className={styles.buttons}>
                            <button
                              style={{ width: 100 }}
                              className="aivBase-button aivBase-button--secondary aivBase-button--medum"
                              onClick={handleBackClick}>
                              Back
                            </button>
                            <button
                              type="submit"
                              style={{ width: 100, marginRight: 0 }}
                              className="aivBase-button aivBase-button--primary aivBase-button--medium">
                              Save
                            </button>
                          </div>
                        </Form>
                      );
                    }}
                  </Formik>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DragDropContext>
    </div>
  );
}

export { NewModelApiConfigModule };
