import { TextInput } from 'src/components/textInput';
import { MinimalHeader } from '../home/header';
import styles from './styles/newModelApiConfig.module.css';
import { SelectInput } from 'src/components/selectInput';
import { useRef, useState } from 'react';
import { DragDropContext, DragUpdate } from 'react-beautiful-dnd';
import { optionsRequestMethods } from './selectOptions';
import {
  AuthType,
  MediaType,
  ModelAPIFormModel,
  OpenApiDataTypes,
  RequestMethod,
} from './types';
import { Formik, Form, FieldArrayRenderProps } from 'formik';
import { ModelType } from 'src/types/model.interface';
import { ModelApiLeftSection } from './newModelApiLeftSection';
import { TabButtonsGroup } from './newModelApiTabButtons';
import { TabContentURLParams } from './tabContentUrlParams';
import { TabContentRequestBody } from './tabContentRequestBody';
import { TabContentResponse } from './tabContentResponse';
import { TabContentAdditionalHeaders } from './tabContentAdditonalHeaders';
import { TabContentAuth } from './tabContentAuth';

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

export const getInputReactKeyId = initReactKeyIdGenerator();

const initialValues: ModelAPIFormModel = {
  name: '',
  description: '',
  modelType: ModelType.Classification,
  url: '',
  method: RequestMethod.POST,
  authType: AuthType.NO_AUTH,
  authTypeConfig: {
    token: '',
    username: '',
    password: '',
  },
  additionalHeaders: [],
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
  const [activeTab, setActiveTab] = useState<Tab>();
  const paramsFormikArrayHelpersRef = useRef<FieldArrayRenderProps>();

  function handleBackClick() {
    history.back();
  }

  function handleTabClick(tab: Tab) {
    return setActiveTab(tab);
  }

  function handleDrop(droppedItem: DragUpdate) {
    if (!droppedItem.destination) return;
    if (paramsFormikArrayHelpersRef.current)
      paramsFormikArrayHelpersRef.current.move(
        droppedItem.source.index,
        droppedItem.destination.index
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
                                    <TabContentURLParams
                                      ref={paramsFormikArrayHelpersRef}
                                    />
                                  ) : null}

                                  {activeTab === Tab.REQUEST_BODY ? (
                                    <TabContentRequestBody />
                                  ) : null}

                                  {activeTab === Tab.HEADERS ? (
                                    <TabContentAdditionalHeaders />
                                  ) : null}

                                  {activeTab === Tab.RESPONSE ? (
                                    <TabContentResponse />
                                  ) : null}

                                  {activeTab === Tab.AUTHENTICATION ? (
                                    <TabContentAuth />
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
