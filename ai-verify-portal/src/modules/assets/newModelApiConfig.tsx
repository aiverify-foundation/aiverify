import { TextInput } from 'src/components/textInput';
import { MinimalHeader } from '../home/header';
import styles from './styles/newModelApiConfig.module.css';
import { SelectInput } from 'src/components/selectInput';
import { useRef, useState } from 'react';
import { DragDropContext, DragUpdate } from 'react-beautiful-dnd';
import { optionsRequestMethods } from './selectOptions';
import {
  AuthType,
  BatchStrategy,
  MediaType,
  ModelAPIFormModel,
  ModelAPIGraphQLModel,
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
import { useMutation } from '@apollo/client';
import { GQL_CREATE_MODELAPI, GqlCreateModelAPIConfigResult } from './api/gql';

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

export const initialValues: ModelAPIFormModel = {
  name: '',
  description: '',
  modelType: ModelType.Classification,
  modelAPI: {
    url: '',
    urlParams: '',
    method: RequestMethod.POST,
    authType: AuthType.NO_AUTH,
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
    },
    requestConfig: {
      rateLimit: -1,
      batchStrategy: BatchStrategy.none,
      batchLimit: -1,
      maxConnections: -1,
      requestTimeout: 60000,
    },
    response: {
      statusCode: 200,
      mediaType: MediaType.APP_JSON,
      type: OpenApiDataTypes.INTEGER,
      field: 'data',
    },
  },
};

function NewModelApiConfigModule() {
  const [activeTab, setActiveTab] = useState<Tab>();
  const paramsFormikArrayHelpersRef = useRef<FieldArrayRenderProps>();
  const [addNewModelAPIConfig] =
    useMutation<GqlCreateModelAPIConfigResult>(GQL_CREATE_MODELAPI);

  async function createModelAPIConfig(formValues: ModelAPIFormModel) {
    const modelAPIInput: ModelAPIGraphQLModel = { ...formValues };

    if (formValues.modelAPI.method === RequestMethod.GET) {
      delete modelAPIInput.modelAPI.requestBody;
      // tidy pathParams - remove reactPropId
      const parameters = modelAPIInput.modelAPI.parameters;
      if (parameters && parameters.paths) {
        parameters.paths.pathParams = parameters.paths.pathParams.map(
          (param) => ({
            name: param.name,
            type: param.type,
          })
        );
      }
    } else {
      delete modelAPIInput.modelAPI.parameters;
      // tidy requestbody properties - remove reactPropId
      const requestBody = modelAPIInput.modelAPI.requestBody;
      if (requestBody && requestBody.properties) {
        requestBody.properties = requestBody.properties.map((prop) => ({
          field: prop.field,
          type: prop.type,
        }));
      }
    }

    //tidy additionalHeaders - remove reactPropId
    if (modelAPIInput.modelAPI.additionalHeaders) {
      modelAPIInput.modelAPI.additionalHeaders =
        modelAPIInput.modelAPI.additionalHeaders.map((header) => ({
          name: header.name,
          type: header.type,
          value: header.value,
        }));
    }
    console.log(modelAPIInput);

    try {
      const result = await addNewModelAPIConfig({
        variables: { model: modelAPIInput },
      });
      console.log(result);
    } catch (err) {
      console.error(err);
    }
  }

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
                    onSubmit={(values) => createModelAPIConfig(values)}>
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
                                    name="modelAPI.method"
                                    options={optionsRequestMethods}
                                    onChange={(val) =>
                                      setFieldValue('modelAPI.method', val)
                                    }
                                    value={values.modelAPI.method}
                                  />
                                </div>
                                <div style={{ flexGrow: 1 }}>
                                  <TextInput
                                    label="Model URL"
                                    name="modelAPI.url"
                                    onChange={handleChange}
                                    value={values.modelAPI.url}
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
                                  {values.modelAPI.method ===
                                    RequestMethod.GET &&
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
