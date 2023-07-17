import { TextInput } from 'src/components/textInput';
import { MinimalHeader } from '../home/header';
import styles from './styles/newModelApiConfig.module.css';
import { SelectInput, SelectOption } from 'src/components/selectInput';
import EditIcon from '@mui/icons-material/Edit';
import InfoIcon from '@mui/icons-material/Info';
import clsx from 'clsx';
import { ChangeEvent, useEffect, useState } from 'react';
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
} from './urlParamInput';
import {
  AuthType,
  MediaType,
  OpenApiDataTypes,
  RequestMethod,
  URLParamType,
} from './types';
import {
  BodyPayloadProperty,
  BodyPayloadPropertyCaptureInput,
  BodyPayloadPropertyDisplayInput,
  BodyPayloadPropertyInputHeading,
} from './bodyPayloadInput';
import { ApiConfigNameDescForm } from './apiConfigNameDescForm';
import { Tooltip, TooltipPosition } from 'src/components/tooltip';
import produce from 'immer';

type UrlParameterWithReactKeyId = UrlParameter & { id: string };
type BodyPayloadPropertyWithReactKeyId = BodyPayloadProperty & { id: string };
type RequestHeaderWithReactKeyId = RequestHeader & { id: string };

const defaultConfigNameDisplay = 'Configuration Name';
const defaultConfigDescDisplay = 'Description';

const emptyKeyValue = { key: '', value: '' };
const defaultUrlParameter = {
  key: '',
  dataType: OpenApiDataTypes.STRING,
};
const defaultBodyPayloadProperty = {
  key: '',
  dataType: OpenApiDataTypes.STRING,
};

enum Tab {
  URL_PARAMS,
  HEADERS,
  AUTHENTICATION,
  REQUEST_BODY,
  RESPONSE,
}

/*
  This running number id is only used for react component `key` props for the list if urlparams and request body property fields rendered.
  Do not use it for any other purposes.
 */
function genInputReactKey() {
  let count = 0;
  return () => `input${count++}`;
}

const getInputReactKeyId = genInputReactKey();

function NewModelApiConfigModule() {
  const [configName, setConfigName] = useState<string>('');
  const [configDesc, setConfigDesc] = useState<string>('');
  const [isEditName, setIsEditName] = useState(false);
  const [modelType, setModelType] = useState<SelectOption | null>(
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
  const [newParam, setNewParam] = useState<UrlParameter>(defaultUrlParameter);
  const [newPayloadProperty, setNewPayloadProperty] =
    useState<BodyPayloadProperty>(defaultBodyPayloadProperty);
  const [requestHeaders, setRequestHeaders] = useState<
    RequestHeaderWithReactKeyId[]
  >([]);
  const [urlParams, setUrlParams] = useState<UrlParameterWithReactKeyId[]>([]);
  const [payloadProperties, setPayloadProperties] = useState<
    BodyPayloadPropertyWithReactKeyId[]
  >([]);
  const [bearerToken, setBearerToken] = useState<string>('');
  const [basicAuthUserPwd, setBasicAuthUserPwd] = useState<[string, string]>([
    '',
    '',
  ]);

  function handleBackClick() {
    history.back();
  }

  function handleTabClick(tab: Tab) {
    return () => setActiveTab(tab);
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

  function handleHeaderKeyChange(e: ChangeEvent<HTMLInputElement>) {
    setNewHeader((prev) => ({ key: e.target.value, value: prev.value }));
  }

  function handleHeaderValueChange(e: ChangeEvent<HTMLInputElement>) {
    setNewHeader((prev) => ({ key: prev.key, value: e.target.value }));
  }

  function handleNewParamKeyChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.value.trim() === '') return;
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
      setPayloadProperties(
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
      setPayloadProperties(
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

  function handleNewBodyPropKeyChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.value.trim() === '') return;
    setNewPayloadProperty((prev) => ({
      key: e.target.value,
      dataType: prev.dataType,
    }));
  }

  function handleNewBodyPropDatatypeChange(option: SelectOption) {
    if (!option) return;
    setNewPayloadProperty((prev) => ({
      key: prev.key,
      dataType: option.value,
    }));
  }

  function handleRequestMediaTypeChange(option: SelectOption) {
    setRequestMediaType(option);
  }

  function handleResponseMediaTypeChange(option: SelectOption) {
    setResponseMediaType(option);
  }

  function handleNewAddHeader() {
    const newReqHeader = { ...newHeader, id: getInputReactKeyId() };
    setRequestHeaders([...requestHeaders, newReqHeader]);
    setNewHeader(emptyKeyValue);
  }

  function handleAddUrlParam() {
    const newUrlParam = { ...newParam, id: getInputReactKeyId() };
    setUrlParams([...urlParams, newUrlParam]);
    setNewParam(defaultUrlParameter);
  }

  function handleAddPayloadProperty() {
    const newProperty = { ...newPayloadProperty, id: getInputReactKeyId() };
    setPayloadProperties([...payloadProperties, newProperty]);
    setNewPayloadProperty(defaultBodyPayloadProperty);
  }

  function handleAuthUserChange(e: ChangeEvent<HTMLInputElement>) {
    setBasicAuthUserPwd((prev) => [e.target.value, prev[1]]);
  }

  function handleAuthPasswordChange(e: ChangeEvent<HTMLInputElement>) {
    setBasicAuthUserPwd((prev) => [prev[0], e.target.value]);
  }

  function handleModelTypeChange(option: SelectOption | null) {
    setModelType(option);
  }

  function handleRequestMethodChange(option: SelectOption | null) {
    setRequestMethod(option);
  }

  function handleUrlParamTypeChange(option: SelectOption | null) {
    setUrlParamType(option);
  }

  function handleAuthTypeChange(option: SelectOption | null) {
    setAuthType(option);
  }

  function handleBearerTokenChange(e: ChangeEvent<HTMLInputElement>) {
    setBearerToken(e.target.value);
  }

  function handleDeleteUrlParamClick(param: UrlParameter) {
    const currentParams = [...urlParams];
    const idx = currentParams.findIndex(
      (currentParam) => currentParam.key === param.key
    );
    currentParams.splice(idx, 1);
    setUrlParams(currentParams);
  }

  function handleDeleteHeaderClick(header: RequestHeader) {
    const currentHeaders = [...requestHeaders];
    const idx = currentHeaders.findIndex(
      (currentHeader) => currentHeader.key === header.key
    );
    currentHeaders.splice(idx, 1);
    setRequestHeaders(currentHeaders);
  }

  function handleDeletePayloadPropClick(property: BodyPayloadProperty) {
    const currentProps = [...payloadProperties];
    const idx = currentProps.findIndex(
      (currentProp) => currentProp.key === property.key
    );
    currentProps.splice(idx, 1);
    setPayloadProperties(currentProps);
  }

  useEffect(() => {
    if (
      activeTab !== Tab.AUTHENTICATION &&
      activeTab !== Tab.RESPONSE &&
      activeTab !== Tab.HEADERS
    ) {
      setActiveTab(
        requestMethod && requestMethod.value === RequestMethod.GET
          ? Tab.URL_PARAMS
          : Tab.REQUEST_BODY
      );
    }
  }, [requestMethod]);

  useEffect(() => {
    console.log(urlParams);
    console.log(payloadProperties);
  }, [urlParams, payloadProperties]);

  function LeftSectionContent() {
    return (
      <div>
        {!isEditName ? (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
              <div className={styles.configName}>
                {configName || defaultConfigNameDisplay}
              </div>
              <IconButton
                iconComponent={EditIcon}
                noOutline
                style={{ fontSize: 12 }}
                onClick={handleEditNameClick}
              />
            </div>
            <div>
              <div className={styles.description}>
                {configDesc || defaultConfigDescDisplay}
              </div>
            </div>
          </div>
        ) : (
          <ApiConfigNameDescForm
            name={configName}
            desc={configDesc}
            onNameChange={handleConfigNameChange}
            onDescChange={handleConfigDescriptionChange}
            onCancelClick={handleEditNameCancelClick}
            onOKClick={handleEditNameOkClick}
          />
        )}
        <div style={{ marginTop: 25 }}>
          <SelectInput
            label="Model Type"
            name="modelType"
            options={optionsModelTypes}
            value={modelType}
            onChange={handleModelTypeChange}
          />
        </div>
      </div>
    );
  }

  function TabButtonsGroup() {
    return (
      <div className={styles.tabsBtnGroup}>
        {requestMethod && requestMethod.value === RequestMethod.GET ? (
          <div
            className={clsx(
              styles.tabBtn,
              activeTab === Tab.URL_PARAMS ? styles.tabBtn__selected : null
            )}
            onClick={handleTabClick(Tab.URL_PARAMS)}>
            URL Parameters
          </div>
        ) : (
          <div
            className={clsx(
              styles.tabBtn,
              activeTab === Tab.REQUEST_BODY ? styles.tabBtn__selected : null
            )}
            onClick={handleTabClick(Tab.REQUEST_BODY)}>
            Request Body
          </div>
        )}

        <div
          className={clsx(
            styles.tabBtn,
            activeTab === Tab.HEADERS ? styles.tabBtn__selected : null
          )}
          onClick={handleTabClick(Tab.HEADERS)}>
          Request Headers
        </div>
        <div
          className={clsx(
            styles.tabBtn,
            activeTab === Tab.RESPONSE ? styles.tabBtn__selected : null
          )}
          onClick={handleTabClick(Tab.RESPONSE)}>
          Response
        </div>
        <div
          className={clsx(
            styles.tabBtn,
            activeTab === Tab.AUTHENTICATION ? styles.tabBtn__selected : null
          )}
          onClick={handleTabClick(Tab.AUTHENTICATION)}>
          Authentication
        </div>
      </div>
    );
  }

  return (
    <div>
      <MinimalHeader />
      <div className="layoutContentArea">
        <div className="scrollContainer">
          <div className="mainContainer">
            <div className={styles.container__limits}>
              <div className={styles.layout}>
                <div style={{ marginBottom: '25px' }}>
                  <h3 className="screenHeading">API Configuration</h3>
                  <p className="headingDescription">
                    Add the API configurations needed to connect to the AI model
                    server
                  </p>
                </div>
                <div className={styles.apiConfigForm}>
                  <div className={styles.leftSection}>
                    <LeftSectionContent />
                  </div>
                  <div className={styles.vDivider} />
                  <div className={styles.rightSection}>
                    <div style={{ display: 'flex' }}>
                      <div style={{ marginRight: 10 }}>
                        <SelectInput
                          width={140}
                          label="Request Method"
                          name="requestMethod"
                          options={optionsRequestMethods}
                          onChange={handleRequestMethodChange}
                          value={requestMethod}
                        />
                      </div>
                      <div style={{ flexGrow: 1 }}>
                        <TextInput label="Model URL" name="apiUrl" />
                      </div>
                    </div>
                    <div className={styles.tabs}>
                      <TabButtonsGroup />
                      <div className={styles.tabsDivider} />
                      <div className={styles.tabContent}>
                        {activeTab === Tab.URL_PARAMS ? (
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                            }}>
                            <div
                              style={{ display: 'flex', alignItems: 'center' }}>
                              <SelectInput
                                label="URL Parameter Type"
                                name="urlParamType"
                                options={optionsUrlParamTypes}
                                value={urlParamType}
                                onChange={handleUrlParamTypeChange}
                              />
                              {urlParamType &&
                              urlParamType.value === URLParamType.QUERY ? (
                                <div style={{ marginLeft: 10, fontSize: 14 }}>
                                  e.g. https://hostname/predict?
                                  <span className={styles.paramHighlight}>
                                    age
                                  </span>
                                  =&#123;age_value&#125;&
                                  <span className={styles.paramHighlight}>
                                    gender
                                  </span>
                                  =&#123;gender_value&#125;
                                </div>
                              ) : (
                                <div style={{ marginLeft: 10, fontSize: 14 }}>
                                  e.g. https://hostname/predict/
                                  <span className={styles.paramHighlight}>
                                    &#123;age&#125;
                                  </span>
                                  /
                                  <span className={styles.paramHighlight}>
                                    &#123;gender&#125;
                                  </span>
                                </div>
                              )}
                              <Tooltip
                                content={
                                  urlParamType &&
                                  urlParamType.value === URLParamType.QUERY ? (
                                    <div>
                                      <div style={{ marginBottom: 5 }}>
                                        This is an example where 2 parameters
                                        are defined - &quot;age&quot; &
                                        &quot;gender&quot;
                                      </div>
                                      Before running a test, you will be
                                      prompted to map dataset attributes to
                                      these parameters.
                                    </div>
                                  ) : (
                                    <div>
                                      <div style={{ marginBottom: 5 }}>
                                        This is an example where 2 parameters
                                        are defined - &quot;age&quot; &
                                        &quot;gender&quot;
                                      </div>
                                      Before running a test, you will be
                                      prompted to map dataset attributes to
                                      these parameters.
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
                                  <InfoIcon style={{ fontSize: 22 }} />
                                </div>
                              </Tooltip>
                            </div>
                            <UrlParamsInputHeading />
                            {urlParams.map((param) => (
                              <UrlParamDisplayInput
                                key={param.id}
                                param={param}
                                onKeynameChange={handleCurrentParamKeyChange(
                                  param.key
                                )}
                                onDatatypeChange={handleCurrentParamDatatypeChange(
                                  param.key
                                )}
                                onRemoveBtnClick={handleDeleteUrlParamClick}
                              />
                            ))}
                            <UrlParamCaptureInput
                              newParam={newParam}
                              onKeynameChange={handleNewParamKeyChange}
                              onDatatypeChange={handleNewParamDatatypeChange}
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
                                name="requestMediaType"
                                options={optionsMediaTypes}
                                onChange={handleRequestMediaTypeChange}
                                value={requestMediaType}
                              />
                            </div>
                            {requestMediaType &&
                            requestMediaType.value !== MediaType.NONE ? (
                              <div>
                                <BodyPayloadPropertyInputHeading />
                                {payloadProperties.map((property) => (
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
                                      handleDeletePayloadPropClick
                                    }
                                  />
                                ))}
                                <BodyPayloadPropertyCaptureInput
                                  newProperty={newPayloadProperty}
                                  onKeynameChange={handleNewBodyPropKeyChange}
                                  onDatatypeChange={
                                    handleNewBodyPropDatatypeChange
                                  }
                                  onAddClick={handleAddPayloadProperty}
                                />
                              </div>
                            ) : null}
                          </div>
                        ) : null}

                        {activeTab === Tab.RESPONSE ? (
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                            }}>
                            <div style={{ marginBottom: 5 }}>
                              <SelectInput
                                width={300}
                                label="Media Type"
                                name="responseMediaType"
                                options={optionsMediaTypes}
                                onChange={handleResponseMediaTypeChange}
                                value={responseMediaType}
                              />
                            </div>
                          </div>
                        ) : null}

                        {activeTab === Tab.HEADERS ? (
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                            }}>
                            <div style={{ display: 'flex', marginBottom: 5 }}>
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
                            </div>
                            <h4 style={{ fontSize: 15, fontWeight: 300 }}>
                              Additional Headers
                            </h4>
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
                                onRemoveBtnClick={handleDeleteHeaderClick}
                              />
                            ))}
                            <RequestHeaderCaptureInput
                              newHeader={newHeader}
                              onKeynameChange={handleHeaderKeyChange}
                              onValueChange={handleHeaderValueChange}
                              onAddClick={handleNewAddHeader}
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
                            authType.value === AuthType.BEARER_TOKEN ? (
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
                            {authType && authType.value === AuthType.BASIC ? (
                              <div style={{ display: 'flex' }}>
                                <TextInput
                                  label="User"
                                  name="authUser"
                                  value={basicAuthUserPwd[0]}
                                  onChange={handleAuthUserChange}
                                  style={{ marginRight: 8, width: 300 }}
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
                    style={{ width: 100, marginRight: 0 }}
                    className="aivBase-button aivBase-button--primary aivBase-button--medium"
                    onClick={() => null}>
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { NewModelApiConfigModule };
