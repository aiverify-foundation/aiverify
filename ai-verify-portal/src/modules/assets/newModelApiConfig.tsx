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
import { AuthType, RequestMethod, URLParamType } from './types';
import {
  BodyPayloadProperty,
  BodyPayloadPropertyCaptureInput,
  BodyPayloadPropertyDisplayInput,
  BodyPayloadPropertyInputHeading,
} from './bodyPayloadInput';
import { ApiConfigNameDescForm } from './apiConfigNameDescForm';
import { Tooltip, TooltipPosition } from 'src/components/tooltip';

const defaultRequestHeaders = [
  { key: 'Connection', value: 'keep-alive' },
  { key: 'Accept', value: '*/*' },
];

const defaultConfigNameDisplay = 'API Config Name';
const defaultConfigDescDisplay = 'Description of Config';

const emptyKeyValue = { key: '', value: '' };
const emptyKeyDatatype = {
  key: '',
  dataType: '',
};

enum Tab {
  URL_PARAMS,
  HEADERS,
  AUTHENTICATION,
  REQUEST_BODY,
  RESPONSE,
}

function NewModelApiConfigModule() {
  const [configName, setConfigName] = useState<string>('');
  const [configDesc, setConfigDesc] = useState<string>('');
  const [isEditName, setIsEditName] = useState(false);
  const [modelType, setModelType] = useState<SelectOption | null>(
    optionsModelTypes[0]
  );
  const [requestMethod, setRequestMethod] = useState<SelectOption | null>(
    optionsRequestMethods[1]
  );
  const [authType, setAuthType] = useState<SelectOption | null>(
    optionsAuthMethods[0]
  );
  const [urlParamType, setUrlParamType] = useState<SelectOption | null>(
    optionsUrlParamTypes[0]
  );
  const [mediaType, setMediaType] = useState<SelectOption | null>(
    optionsMediaTypes[0]
  );
  const [activeTab, setActiveTab] = useState<Tab>();
  const [newHeader, setNewHeader] = useState<RequestHeader>(emptyKeyValue);
  const [newParam, setNewParam] = useState<UrlParameter>(emptyKeyDatatype);
  const [newPayloadProperty, setNewPayloadProperty] =
    useState<BodyPayloadProperty>(emptyKeyDatatype);
  const [requestHeaders, setRequestHeaders] = useState<RequestHeader[]>(
    defaultRequestHeaders
  );
  const [urlParams, setUrlParams] = useState<UrlParameter[]>([]);
  const [payloadProperties, setPayloadProperties] = useState<
    BodyPayloadProperty[]
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

  function handleParamKeyChange(e: ChangeEvent<HTMLInputElement>) {
    setNewParam((prev) => ({
      key: e.target.value,
      dataType: prev.dataType,
    }));
  }

  function handleParamDatatypeChange(e: ChangeEvent<HTMLInputElement>) {
    setNewParam((prev) => ({
      key: prev.key,
      dataType: e.target.value,
    }));
  }

  function handlePayloadPropKeyChange(e: ChangeEvent<HTMLInputElement>) {
    setNewPayloadProperty((prev) => ({
      key: e.target.value,
      dataType: prev.dataType,
    }));
  }

  function handlePayloadPropDatatypeChange(e: ChangeEvent<HTMLInputElement>) {
    setNewPayloadProperty((prev) => ({
      key: prev.key,
      dataType: e.target.value,
    }));
  }

  function handleMediaTypeChange(option: SelectOption | null) {
    setMediaType(option);
  }

  function handleAddHeader() {
    setRequestHeaders([...requestHeaders, newHeader]);
    setNewHeader({
      key: '',
      value: '',
    });
  }

  function handleAddUrlParam() {
    setUrlParams([...urlParams, newParam]);
    setNewParam({
      key: '',
      dataType: '',
    });
  }

  function handleAddPayloadProperty() {
    setPayloadProperties([...payloadProperties, newPayloadProperty]);
    setNewPayloadProperty({
      key: '',
      dataType: '',
    });
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
      activeTab !== Tab.REQUEST_BODY &&
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
        ) : null}
        <div
          className={clsx(
            styles.tabBtn,
            activeTab === Tab.REQUEST_BODY ? styles.tabBtn__selected : null
          )}
          onClick={handleTabClick(Tab.REQUEST_BODY)}>
          Request Body
        </div>
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
                                        are defined below - &quot;age&quot; &
                                        &quot;gender&quot;
                                      </div>
                                      Before running a test, you will be
                                      prompted to map dataset attribute names to
                                      these parameters. Those attribute names
                                      will replace these parameters in the final
                                      request URL.
                                    </div>
                                  ) : (
                                    <div>
                                      <div style={{ marginBottom: 5 }}>
                                        This is an example where 2 parameters
                                        are defined below - &quot;age&quot; &
                                        &quot;gender&quot;
                                      </div>
                                      Before running a test, you will be
                                      prompted to map dataset attribute names to
                                      these parameters. Those corresponding
                                      values of those attribute names will
                                      replace these parameters in the final
                                      request URL.
                                    </div>
                                  )
                                }
                                position={TooltipPosition.right}
                                offsetLeft={8}
                                offsetTop={62}>
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
                                key={param.key}
                                param={param}
                                onRemoveBtnClick={handleDeleteUrlParamClick}
                              />
                            ))}
                            <UrlParamCaptureInput
                              newParam={newParam}
                              onKeynameChange={handleParamKeyChange}
                              onDatatypeChange={handleParamDatatypeChange}
                              onAddClick={handleAddUrlParam}
                            />
                          </div>
                        ) : null}

                        {activeTab === Tab.HEADERS ? (
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                            }}>
                            <RequestHeaderInputHeading />
                            {requestHeaders.map((header) => (
                              <RequestHeaderDisplayInput
                                key={header.key}
                                header={header}
                                onRemoveBtnClick={handleDeleteHeaderClick}
                              />
                            ))}
                            <RequestHeaderCaptureInput
                              newHeader={newHeader}
                              onKeynameChange={handleHeaderKeyChange}
                              onValueChange={handleHeaderValueChange}
                              onAddClick={handleAddHeader}
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
                                name="mediaType"
                                options={optionsMediaTypes}
                                onChange={handleMediaTypeChange}
                                value={mediaType}
                              />
                            </div>
                            <BodyPayloadPropertyInputHeading />
                            {payloadProperties.map((property) => (
                              <BodyPayloadPropertyDisplayInput
                                key={property.key}
                                property={property}
                                onRemoveBtnClick={handleDeletePayloadPropClick}
                              />
                            ))}
                            <BodyPayloadPropertyCaptureInput
                              newProperty={newPayloadProperty}
                              onKeynameChange={handlePayloadPropKeyChange}
                              onDatatypeChange={handlePayloadPropDatatypeChange}
                              onAddClick={handleAddPayloadProperty}
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
