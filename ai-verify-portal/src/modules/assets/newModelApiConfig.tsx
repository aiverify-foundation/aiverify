import { TextInput } from 'src/components/textInput';
import { MinimalHeader } from '../home/header';
import styles from './styles/newModelApiConfig.module.css';
import { SelectInput, SelectOption } from 'src/components/selectInput';
import EditIcon from '@mui/icons-material/Edit';
import clsx from 'clsx';
import { ChangeEvent, useEffect, useState } from 'react';
import { IconButton } from 'src/components/iconButton';
import { TextArea } from 'src/components/textArea';
import {
  optionsAuthMethods,
  optionsMediaTypes,
  optionsRequestMethods,
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
import { RequestMethod } from './types';
import {
  BodyPayloadProperty,
  BodyPayloadPropertyCaptureInput,
  BodyPayloadPropertyDisplayInput,
  BodyPayloadPropertyInputHeading,
} from './bodyPayloadInput';

const defaultRequestHeaders = [
  { key: 'Connection', value: 'keep-alive' },
  { key: 'Accept', value: '*/*' },
];

const defaultConfigNameDisplay = 'API Config Name';
const defaultConfigDescDisplay = 'Description of Config';

enum Tab {
  URL_PARAMS,
  HEADERS,
  AUTHENTICATION,
  REQUEST_BODY,
  RESPONSE,
}

function NewModelApiConfigModule() {
  const [configName, setConfigName] = useState<string>();
  const [configDesc, setConfigDesc] = useState<string>();
  const [isEditName, setIsEditName] = useState(false);
  const [requestMethod, setRequestMethod] = useState<SelectOption | null>(
    optionsRequestMethods[1]
  );
  const [authType, setAuthType] = useState<SelectOption | null>(
    optionsAuthMethods[0]
  );
  const [mediaType, setMediaType] = useState<SelectOption | null>(
    optionsMediaTypes[0]
  );
  const [activeTab, setActiveTab] = useState<Tab>();
  const [newHeader, setNewHeader] = useState<RequestHeader>({
    key: '',
    value: '',
  });
  const [newParam, setNewParam] = useState<UrlParameter>({
    key: '',
    dataType: '',
  });
  const [newPayloadProperty, setNewPayloadProperty] =
    useState<BodyPayloadProperty>({
      key: '',
      dataType: '',
    });
  const [requestHeaders, setRequestHeaders] = useState<RequestHeader[]>(
    defaultRequestHeaders
  );
  const [urlParams, setUrlParams] = useState<UrlParameter[]>([]);
  const [payloadProperties, setPayloadProperties] = useState<
    BodyPayloadProperty[]
  >([]);

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

  function handleRequestMethodChange(option: SelectOption | null) {
    setRequestMethod(option);
  }

  function handleAuthTypeChange(option: SelectOption | null) {
    setAuthType(option);
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
          : Tab.HEADERS
      );
    }
  }, [requestMethod]);

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
                    {!isEditName ? (
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div>
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
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                        }}>
                        <TextInput
                          label="Config Name"
                          name="configName"
                          value={configName}
                          style={{ marginBottom: 10 }}
                          onChange={handleConfigNameChange}
                        />
                        <TextArea
                          label="Description"
                          name="configDesc"
                          value={configDesc}
                          onChange={handleConfigDescriptionChange}
                        />
                        <div style={{ textAlign: 'right' }}>
                          <button
                            style={{ width: 100 }}
                            className="aivBase-button aivBase-button--secondary aivBase-button--small"
                            onClick={handleEditNameCancelClick}>
                            Cancel
                          </button>
                          <button
                            style={{ width: 100, marginRight: 0 }}
                            className="aivBase-button aivBase-button--primary aivBase-button--small"
                            onClick={handleEditNameOkClick}>
                            OK
                          </button>
                        </div>
                      </div>
                    )}
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
                      <div className={styles.tabsBtnGroup}>
                        {requestMethod &&
                        requestMethod.value === RequestMethod.GET ? (
                          <div
                            className={clsx(
                              styles.tabBtn,
                              activeTab === Tab.URL_PARAMS
                                ? styles.tabBtn__selected
                                : null
                            )}
                            onClick={handleTabClick(Tab.URL_PARAMS)}>
                            URL Parameters
                          </div>
                        ) : null}
                        <div
                          className={clsx(
                            styles.tabBtn,
                            activeTab === Tab.HEADERS
                              ? styles.tabBtn__selected
                              : null
                          )}
                          onClick={handleTabClick(Tab.HEADERS)}>
                          Request Headers
                        </div>
                        <div
                          className={clsx(
                            styles.tabBtn,
                            activeTab === Tab.REQUEST_BODY
                              ? styles.tabBtn__selected
                              : null
                          )}
                          onClick={handleTabClick(Tab.REQUEST_BODY)}>
                          Request Body
                        </div>
                        <div
                          className={clsx(
                            styles.tabBtn,
                            activeTab === Tab.RESPONSE
                              ? styles.tabBtn__selected
                              : null
                          )}
                          onClick={handleTabClick(Tab.RESPONSE)}>
                          Response
                        </div>
                        <div
                          className={clsx(
                            styles.tabBtn,
                            activeTab === Tab.AUTHENTICATION
                              ? styles.tabBtn__selected
                              : null
                          )}
                          onClick={handleTabClick(Tab.AUTHENTICATION)}>
                          Authentication
                        </div>
                      </div>
                      <div className={styles.tabsDivider} />
                      <div className={styles.tabContent}>
                        {activeTab === Tab.URL_PARAMS ? (
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                            }}>
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
                          <div style={{ padding: '0 10px' }}>
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
                                  onRemoveBtnClick={
                                    handleDeletePayloadPropClick
                                  }
                                />
                              ))}
                              <BodyPayloadPropertyCaptureInput
                                newProperty={newPayloadProperty}
                                onKeynameChange={handlePayloadPropKeyChange}
                                onDatatypeChange={
                                  handlePayloadPropDatatypeChange
                                }
                                onAddClick={handleAddPayloadProperty}
                              />
                            </div>
                          </div>
                        ) : null}

                        {activeTab === Tab.AUTHENTICATION ? (
                          <div style={{ padding: '0 10px' }}>
                            <div style={{ display: 'flex' }}>
                              <div style={{ marginRight: 10 }}>
                                <SelectInput
                                  width={200}
                                  label="Authentication Type"
                                  name="authType"
                                  options={optionsAuthMethods}
                                  onChange={handleAuthTypeChange}
                                  value={authType}
                                />
                              </div>
                              <div style={{ flexGrow: 1 }}>
                                <TextInput label="Token" name="bearerToken" />
                              </div>
                            </div>
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
                    onClick={() => null}>
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
