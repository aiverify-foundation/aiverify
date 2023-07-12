import { TextInput } from 'src/components/textInput';
import { MinimalHeader } from '../home/header';
import styles from './styles/newModelApiConfig.module.css';
import { SelectInput } from 'src/components/selectInput';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import clsx from 'clsx';
import { ChangeEvent, useState } from 'react';
import { IconButton } from 'src/components/iconButton';
import { TextArea } from 'src/components/textArea';

type RequestHeader = {
  key: string;
  value: string;
};

type UrlParameter = {
  key: string;
  value: string;
  dataType: string;
};

type RequestHeaderDisplayProps = {
  header: RequestHeader;
  onRemoveBtnClick: (globalVar: RequestHeader) => void;
};

type UrlParamsDisplayProps = {
  param: UrlParameter;
  onRemoveBtnClick: (param: UrlParameter) => void;
};

type SelectOption = {
  value: string;
  label: string;
};

const REQUEST_METHODS = [
  { value: 'GET', label: 'GET' },
  { value: 'POST', label: 'POST' },
];

const AUTH_METHODS = [
  { value: 'none', label: 'None' },
  { value: 'bearer_token', label: 'Bearer Token' },
  { value: 'basic_auth', label: 'Basic Auth' },
];

const MEDIA_TYPES = [
  { value: 'none', label: 'None' },
  {
    value: 'application/x-www-form-urlencoded',
    label: 'application/x-www-form-urlencoded',
  },
  { value: 'multipart/form-data', label: 'multipart/form-data' },
  { value: 'application/json', label: 'application/json' },
  { value: 'text/plain', label: 'text/plain' },
];

const DEFAULT_REQUEST_HEADERS = [
  { key: 'Connection', value: 'keep-alive' },
  { key: 'Accept', value: '*/*' },
];

const DEFAULT_NAME_DISPLAY = 'API Config Name';
const DEFAULT_DESC_DISPLAY = 'Description of Config';

enum Tab {
  PARAMS,
  HEADERS,
  AUTHENTICATION,
  REQUESTBODY,
  RESPONSE,
}

function RequestHeaderInput(props: RequestHeaderDisplayProps) {
  const { header, onRemoveBtnClick } = props;

  function handleRemoveBtnClick(header: RequestHeader) {
    return () => onRemoveBtnClick(header);
  }

  return (
    <div id={`varkey-${header.key}`} className={styles.keyValRow}>
      <div className={styles.keyValCol}>
        <TextInput value={header.key} name="" style={{ marginBottom: 0 }} />
      </div>
      <div className={styles.keyValCol}>
        <TextInput value={header.value} name="" style={{ marginBottom: 0 }} />
      </div>
      <div className={styles.delIconContainer}>
        <IconButton
          iconComponent={CloseIcon}
          noOutline
          onClick={handleRemoveBtnClick(header)}
        />
      </div>
    </div>
  );
}

function UrlParamsInput(props: UrlParamsDisplayProps) {
  const { param, onRemoveBtnClick } = props;

  function handleRemoveBtnClick(param: UrlParameter) {
    return () => onRemoveBtnClick(param);
  }

  return (
    <div id={`varkey-${param.key}`} className={styles.keyValRow}>
      <div className={styles.keyValCol}>
        <TextInput value={param.key} name="" style={{ marginBottom: 0 }} />
      </div>
      <div className={styles.keyValCol}>
        <TextInput value={param.dataType} name="" style={{ marginBottom: 0 }} />
      </div>
      <div className={styles.keyValCol}>
        <TextInput value={param.value} name="" style={{ marginBottom: 0 }} />
      </div>
      <div className={styles.delIconContainer}>
        <IconButton
          iconComponent={CloseIcon}
          noOutline
          onClick={handleRemoveBtnClick(param)}
          style={{ marginRight: 42 }}
        />
      </div>
    </div>
  );
}

function NewModelApiConfigModule() {
  const [configName, setConfigName] = useState<string>();
  const [configDesc, setConfigDesc] = useState<string>();
  const [isEditName, setIsEditName] = useState(false);
  const [requestMethod, setRequestMethod] = useState<SelectOption>(
    REQUEST_METHODS[1]
  );
  const [authType, setAuthType] = useState<SelectOption>(AUTH_METHODS[0]);
  const [mediaType, setMediaType] = useState<SelectOption>(MEDIA_TYPES[0]);
  const [activeTab, setActiveTab] = useState<Tab>(Tab.AUTHENTICATION);
  const [newHeader, setNewHeader] = useState<RequestHeader>({
    key: '',
    value: '',
  });
  const [newParam, setNewParam] = useState<UrlParameter>({
    key: '',
    value: '',
    dataType: '',
  });
  const [requestHeaders, setRequestHeaders] = useState<RequestHeader[]>(
    DEFAULT_REQUEST_HEADERS
  );
  const [urlParams, setUrlParams] = useState<UrlParameter[]>([]);

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
      value: prev.value,
      dataType: prev.dataType,
    }));
  }

  function handleParamValueChange(e: ChangeEvent<HTMLInputElement>) {
    setNewParam((prev) => ({
      key: prev.key,
      value: e.target.value,
      dataType: prev.dataType,
    }));
  }

  function handleParamDatatypeChange(e: ChangeEvent<HTMLInputElement>) {
    setNewParam((prev) => ({
      key: prev.key,
      value: prev.value,
      dataType: e.target.value,
    }));
  }

  function handleMediaTypeChange(option: SelectOption) {
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
      value: '',
      dataType: '',
    });
  }

  function handleRequestMethodChange(option: SelectOption) {
    setRequestMethod(option);
  }

  function handleAuthTypeChange(option: SelectOption) {
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
                            {configName || DEFAULT_NAME_DISPLAY}
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
                            {configDesc || DEFAULT_DESC_DISPLAY}
                          </div>
                          {/* <IconButton iconComponent={EditIcon} noOutline /> */}
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
                          options={REQUEST_METHODS}
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
                        <div
                          className={clsx(
                            styles.tabBtn,
                            activeTab === Tab.PARAMS
                              ? styles.tabBtn__selected
                              : null
                          )}
                          onClick={handleTabClick(Tab.PARAMS)}>
                          Parameters
                        </div>
                        <div
                          className={clsx(
                            styles.tabBtn,
                            activeTab === Tab.HEADERS
                              ? styles.tabBtn__selected
                              : null
                          )}
                          onClick={handleTabClick(Tab.HEADERS)}>
                          Headers
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
                        <div
                          className={clsx(
                            styles.tabBtn,
                            activeTab === Tab.REQUESTBODY
                              ? styles.tabBtn__selected
                              : null
                          )}
                          onClick={handleTabClick(Tab.REQUESTBODY)}>
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
                      </div>

                      <div className={styles.tabsDivider} />
                      <div className={styles.tabContent}>
                        {activeTab === Tab.AUTHENTICATION ? (
                          <div style={{ padding: '0 10px' }}>
                            <div style={{ display: 'flex' }}>
                              <div style={{ marginRight: 10 }}>
                                <SelectInput
                                  width={200}
                                  label="Authentication Type"
                                  name="authType"
                                  options={AUTH_METHODS}
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

                        {activeTab === Tab.HEADERS ? (
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                            }}>
                            <div style={{ display: 'flex', marginBottom: 10 }}>
                              <div className={styles.headingName}>
                                Header Name
                              </div>
                              <div className={styles.headingVal}>Value</div>
                              <div></div>
                            </div>
                            <div style={{ marginBottom: 10 }}>
                              {requestHeaders.map((header) => (
                                <RequestHeaderInput
                                  key={header.key}
                                  header={header}
                                  onRemoveBtnClick={handleDeleteHeaderClick}
                                />
                              ))}
                            </div>
                            <div style={{ display: 'flex' }}>
                              <div className={styles.keyInput}>
                                <TextInput
                                  name=""
                                  onChange={handleHeaderKeyChange}
                                  value={newHeader.key}
                                />
                              </div>
                              <div className={styles.valInput}>
                                <TextInput
                                  name=""
                                  onChange={handleHeaderValueChange}
                                  value={newHeader.value}
                                />
                              </div>
                              <div className={styles.iconContainer}>
                                <IconButton
                                  iconComponent={AddIcon}
                                  onClick={handleAddHeader}>
                                  <div
                                    style={{
                                      color: '#676767',
                                      fontSize: 15,
                                      margin: '0 6px',
                                    }}>
                                    Add
                                  </div>
                                </IconButton>
                              </div>
                            </div>
                          </div>
                        ) : null}

                        {activeTab === Tab.PARAMS ? (
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                            }}>
                            <div style={{ display: 'flex', marginBottom: 10 }}>
                              <div className={styles.headingName}>
                                Parameter Name
                              </div>
                              <div className={styles.headingVal}>Data Type</div>
                              <div className={styles.headingVal}>Value</div>
                            </div>
                            <div style={{ marginBottom: 10 }}>
                              {urlParams.map((param) => (
                                <UrlParamsInput
                                  key={param.key}
                                  param={param}
                                  onRemoveBtnClick={handleDeleteUrlParamClick}
                                />
                              ))}
                            </div>
                            <div style={{ display: 'flex' }}>
                              <div className={styles.keyInput}>
                                <TextInput
                                  name=""
                                  onChange={handleParamKeyChange}
                                  value={newParam.key}
                                />
                              </div>
                              <div className={styles.valInput}>
                                <TextInput
                                  name=""
                                  onChange={handleParamDatatypeChange}
                                  value={newParam.dataType}
                                />
                              </div>
                              <div className={styles.valInput}>
                                <TextInput
                                  name=""
                                  onChange={handleParamValueChange}
                                  value={newParam.value}
                                />
                              </div>
                              <div className={styles.iconContainer}>
                                <IconButton
                                  iconComponent={AddIcon}
                                  onClick={handleAddUrlParam}>
                                  <div
                                    style={{
                                      color: '#676767',
                                      fontSize: 15,
                                      margin: '0 6px',
                                    }}>
                                    Add
                                  </div>
                                </IconButton>
                              </div>
                            </div>
                          </div>
                        ) : null}

                        {activeTab === Tab.REQUESTBODY ? (
                          <div style={{ padding: '0 10px' }}>
                            <div style={{ display: 'flex' }}>
                              <div style={{ marginRight: 10 }}>
                                <SelectInput
                                  width={300}
                                  label="Media Type"
                                  name="mediaType"
                                  options={MEDIA_TYPES}
                                  onChange={handleMediaTypeChange}
                                  value={mediaType}
                                />
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
