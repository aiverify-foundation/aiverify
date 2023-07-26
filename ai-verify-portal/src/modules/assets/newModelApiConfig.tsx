import { TextInput } from 'src/components/textInput';
import { MinimalHeader } from '../home/header';
import styles from './styles/newModelApiConfig.module.css';
import { SelectInput } from 'src/components/selectInput';
import { useRef, useState } from 'react';
import { DragDropContext, DragUpdate } from 'react-beautiful-dnd';
import { optionsRequestMethods } from './selectOptions';
import * as Yup from 'yup';
import {
  ModelAPIFormModel,
  ModelAPIGraphQLModel,
  RequestMethod,
  SaveResult,
} from './types';
import { Formik, Form, FieldArrayRenderProps, FormikErrors } from 'formik';
import { ModelApiLeftSection } from './newModelApiLeftSection';
import { Tab, TabButtonsGroup } from './newModelApiTabButtons';
import { TabContentURLParams } from './tabContentUrlParams';
import { TabContentRequestBody } from './tabContentRequestBody';
import { TabContentResponse } from './tabContentResponse';
import { TabContentAdditionalHeaders } from './tabContentAdditonalHeaders';
import { TabContentAuth } from './tabContentAuth';
import { useMutation } from '@apollo/client';
import {
  GQL_CREATE_MODELAPI,
  GQL_UPDATE_MODELAPI,
  GqlCreateModelAPIConfigResult,
  GqlUpdateModelAPIConfigResult,
} from './api/gql';
import { TabContentOthers } from './tabContentOthers';
import { ModalResult } from './modalResult';
import { ErrorWithMessage, toErrorWithMessage } from 'src/lib/errorUtils';
import { AlertType, StandardAlert } from 'src/components/standardAlerts';
import { useRouter } from 'next/router';
import { transformFormValuesToGraphModel } from './utils/modelApiUtils';
import { defaultFormValues } from './constants';

type FormikSetFieldvalueFn = (
  field: string,
  value: RequestMethod,
  shouldValidate?: boolean | undefined
) => Promise<void | FormikErrors<ModelAPIFormModel>>;

const urlPattern = new RegExp(
  '^([a-zA-Z]+:\\/\\/)?' + // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR IP (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
    '(\\#[-a-z\\d_]*)?$', // fragment locator
  'i'
);
/*
  This id is only used for react component `key` props for the list of urlparams and request body property fields rendered.
  Do not use it for any other purposes.
 */
function initReactKeyIdGenerator() {
  let count = 0;
  return () => `input${Date.now()}${count++}`;
}

export const getInputReactKeyId = initReactKeyIdGenerator();

const ModelAPIFormSchema = Yup.object().shape({
  name: Yup.string()
    .min(5, 'Too short. Min 5 characters')
    .max(128, 'Max 128 characters')
    .required('Required'),
  description: Yup.string()
    .min(20, 'Too short. Min 20 characters')
    .max(128, 'Max 128 characters')
    .required('Required'),
  modelAPI: Yup.object().shape({
    url: Yup.string()
      .matches(urlPattern, 'Invalid URL')
      .required('URL is required'),
    requestConfig: Yup.object().shape({
      rateLimit: Yup.number().min(-1, 'Invalid number').required('Required'),
      batchLimit: Yup.number().min(-1, 'Invalid number').required('Required'),
      maxConnections: Yup.number()
        .min(-1, 'Invalid number')
        .required('Required'),
      requestTimeout: Yup.number()
        .min(1, 'Invalid number')
        .required('Required'),
    }),
    authTypeConfig: Yup.object().shape({
      token: Yup.string()
        .min(32, 'Too short. Min 32 characters')
        .max(128, 'Max 128 characters'),
      username: Yup.string()
        .min(5, 'Too short. Min 5 characters')
        .max(128, 'Max 128 characters'),
      password: Yup.string()
        .min(5, 'Too short. Min 5 characters')
        .max(128, 'Max 128 characters'),
    }),
  }),
});

export type NewModelApiConfigModuleProps = {
  id?: string;
  formValues?: ModelAPIFormModel;
};

function NewModelApiConfigModule(props: NewModelApiConfigModuleProps) {
  const { id, formValues } = props;
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    if (formValues) {
      return formValues.modelAPI.method === RequestMethod.POST
        ? Tab.REQUEST_BODY
        : Tab.URL_PARAMS;
    }
    return Tab.REQUEST_BODY;
  });
  const [showPageLevelAlert, setShowPageLevelAlert] = useState(false);
  const [saveResult, setSaveResult] = useState<ErrorWithMessage | SaveResult>();
  const [saveInProgress, setSaveInProgress] = useState(false);
  const paramsFormikArrayHelpersRef = useRef<FieldArrayRenderProps>();
  const [addNewModelAPIConfig] =
    useMutation<GqlCreateModelAPIConfigResult>(GQL_CREATE_MODELAPI);
  const [updateModelAPIConfig] =
    useMutation<GqlUpdateModelAPIConfigResult>(GQL_UPDATE_MODELAPI);
  const router = useRouter();
  const initialFormValues = formValues || defaultFormValues;

  async function saveNewApiConfig(values: ModelAPIFormModel) {
    const gqlModelAPIInput: ModelAPIGraphQLModel =
      transformFormValuesToGraphModel(values);

    try {
      const result = await addNewModelAPIConfig({
        variables: { model: gqlModelAPIInput },
      });
      if (result.data && result.data.createModelAPI.id) {
        setSaveResult(result.data.createModelAPI);
        setSaveInProgress(false);
      }
    } catch (err) {
      setSaveResult(toErrorWithMessage(err));
      setSaveInProgress(false);
    }
  }

  async function updateApiConfig(
    modelFileId: string,
    values: ModelAPIFormModel
  ) {
    if (!id) {
      console.error(`model api ID undefined`);
      return;
    }
    const gqlModelAPIInput: ModelAPIGraphQLModel =
      transformFormValuesToGraphModel(values);

    try {
      const result = await updateModelAPIConfig({
        variables: { modelFileId, model: gqlModelAPIInput },
      });
      if (result.data && result.data.updateModelAPI.id) {
        setSaveResult(result.data.updateModelAPI);
        setSaveInProgress(false);
      }
    } catch (err) {
      setSaveResult(toErrorWithMessage(err));
      setSaveInProgress(false);
    }
  }

  function handleFormSubmit(values: ModelAPIFormModel) {
    setSaveInProgress(true);
    if (id != undefined) {
      updateApiConfig(id, values);
    } else {
      saveNewApiConfig(values);
    }
  }

  function handleBackClick() {
    history.back();
  }

  function handleCloseAlertClick() {
    setShowPageLevelAlert(false);
  }

  function handleTabClick(tab: Tab) {
    return setActiveTab(tab);
  }

  function handleCloseResultClick() {
    if (saveResult && 'id' in saveResult) {
      if (!id) {
        router.push(`/assets/modelApiConfig/${saveResult.id}`);
      } else {
        location.reload();
      }
      setSaveResult(undefined);
      return;
    }
    setSaveResult(undefined);
  }

  function handleRequestMethodChange(setFieldValue: FormikSetFieldvalueFn) {
    return (val: RequestMethod) => {
      if (
        activeTab !== Tab.AUTHENTICATION &&
        activeTab !== Tab.RESPONSE &&
        activeTab !== Tab.HEADERS &&
        activeTab !== Tab.OTHERS
      ) {
        setActiveTab(
          val === RequestMethod.GET ? Tab.URL_PARAMS : Tab.REQUEST_BODY
        );
      }
      setFieldValue('modelAPI.method', val);
    };
  }

  function handleDrop(droppedItem: DragUpdate) {
    if (!droppedItem.destination) return;
    if (paramsFormikArrayHelpersRef.current)
      paramsFormikArrayHelpersRef.current.move(
        droppedItem.source.index,
        droppedItem.destination.index
      );
  }

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
                    initialValues={initialFormValues}
                    validationSchema={ModelAPIFormSchema}
                    onSubmit={handleFormSubmit}>
                    {({
                      values,
                      handleChange,
                      setFieldValue,
                      errors,
                      touched,
                    }) => {
                      return (
                        <Form>
                          <div style={{ marginBottom: '25px' }}>
                            <h3 className="screenHeading">API Configuration</h3>
                            <p className="headingDescription">
                              Add the API configurations needed to connect to
                              the AI model server
                            </p>
                          </div>
                          <div className={styles.pageLevelError}>
                            {showPageLevelAlert &&
                            Object.keys(errors).length &&
                            Object.keys(touched).length ? (
                              <StandardAlert
                                alertType={AlertType.ERROR}
                                headingText="Field-level errors"
                                onCloseIconClick={handleCloseAlertClick}>
                                <div style={{ display: 'flex', fontSize: 14 }}>
                                  <div>
                                    Please ensure all the necessary inputs are
                                    valid
                                  </div>
                                </div>
                              </StandardAlert>
                            ) : null}
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
                                    onChange={handleRequestMethodChange(
                                      setFieldValue
                                    )}
                                    value={values.modelAPI.method}
                                  />
                                </div>
                                <div style={{ flexGrow: 1 }}>
                                  <TextInput
                                    label="Model URL"
                                    name="modelAPI.url"
                                    onChange={handleChange}
                                    value={values.modelAPI.url}
                                    error={
                                      Boolean(
                                        errors.modelAPI?.url &&
                                          touched.modelAPI?.url
                                      )
                                        ? errors.modelAPI?.url
                                        : undefined
                                    }
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

                                  {activeTab === Tab.OTHERS ? (
                                    <TabContentOthers />
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
                              disabled={saveInProgress}
                              type="submit"
                              style={{ width: 100, marginRight: 0 }}
                              className="aivBase-button aivBase-button--primary aivBase-button--medium"
                              onClick={() => setShowPageLevelAlert(true)}>
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
      {saveResult ? (
        <ModalResult
          title="Create New Model API Config"
          onCloseClick={handleCloseResultClick}
          onOkClick={handleCloseResultClick}>
          <div>
            {'id' in saveResult ? (
              <StandardAlert
                disableCloseIcon
                alertType={AlertType.SUCCESS}
                headingText="New Model API Config successfully created"
                style={{ border: 'none' }}>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    fontSize: 14,
                  }}>
                  <div>
                    Config Name:&nbsp;
                    <span style={{ fontWeight: 800 }}>{saveResult.name}</span>
                  </div>
                  <div>
                    Model Type:&nbsp;
                    <span style={{ fontWeight: 800 }}>
                      {saveResult.modelType}
                    </span>
                  </div>
                </div>
              </StandardAlert>
            ) : (
              <StandardAlert
                disableCloseIcon
                alertType={AlertType.ERROR}
                headingText="Check configuration"
                style={{ border: 'none' }}>
                <div style={{ display: 'flex', fontSize: 14 }}>
                  <div>{saveResult.message}</div>
                </div>
              </StandardAlert>
            )}
          </div>
        </ModalResult>
      ) : null}
    </div>
  );
}

export { NewModelApiConfigModule };
