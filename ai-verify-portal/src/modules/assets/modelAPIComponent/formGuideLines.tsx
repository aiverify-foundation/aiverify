import { AlertType, StandardAlert } from 'src/components/standardAlerts';
import { useState } from 'react';
import { SelectInput } from 'src/components/selectInput';
import { useFormGuide } from './providers/formGuideProvider';
import { ColorPalette } from 'src/components/colorPalette';
import { Tab } from './tabButtons';
import { useFormikContext } from 'formik';
import { ModelApiFormModel, RequestMethod } from './types';
import { Tooltip, TooltipPosition } from 'src/components/tooltip';

enum GuidelineType {
  POST,
  GET,
  QUERY,
  PATH,
  BASIC_AUTH,
  AUTH_TOKEN,
  NO_AUTH,
  HEADERS,
}

type FormGuidelinesProps = {
  onToggleAllTabsClick: (showAllTabs: boolean) => void;
  onCloseIconClick: () => void;
  onSelect: (types: GuidelineType[]) => void;
};

type PresetOption = {
  value: GuidelineType[];
  label: string;
};

const presetOptions: PresetOption[] = [
  // {
  //   value: [],
  //   label: 'None',
  // },
  {
    value: [GuidelineType.POST, GuidelineType.NO_AUTH],
    label: 'POST request, no authentication',
  },
  {
    value: [GuidelineType.POST, GuidelineType.BASIC_AUTH],
    label: 'POST request with Username/Password authentication',
  },
  {
    value: [GuidelineType.POST, GuidelineType.AUTH_TOKEN],
    label: 'POST request with Authentication Token',
  },
  {
    value: [GuidelineType.GET, GuidelineType.QUERY, GuidelineType.NO_AUTH],
    label: 'URL Query parameters, no authentication',
  },
  {
    value: [GuidelineType.GET, GuidelineType.QUERY, GuidelineType.BASIC_AUTH],
    label: 'URL Query parameters with Password authentication',
  },
  {
    value: [GuidelineType.GET, GuidelineType.QUERY, GuidelineType.AUTH_TOKEN],
    label: 'URL Query parameters with Authentication Token',
  },
  {
    value: [GuidelineType.GET, GuidelineType.PATH, GuidelineType.NO_AUTH],
    label: 'URL Path parameters, no authentication',
  },
  {
    value: [GuidelineType.GET, GuidelineType.PATH, GuidelineType.BASIC_AUTH],
    label: 'URL Path parameters with Password authentication',
  },
  {
    value: [GuidelineType.GET, GuidelineType.PATH, GuidelineType.AUTH_TOKEN],
    label: 'URL Path parameters with Authentication Token',
  },
];

function FormGuidelines(props: FormGuidelinesProps) {
  const { onCloseIconClick, onSelect, onToggleAllTabsClick } = props;
  const [showAllTabs, setShowAllTabs] = useState(false);
  const {
    disableInputField,
    enableInputField,
    reset,
    addGuideStep,
    removeGuideStep,
    selectGuideStep,
    highlightInputFields,
    clearHighlightedFields,
    guideStepToFieldMap,
    selectTab,
    clearSelectedTab,
  } = useFormGuide();
  const { values } = useFormikContext<ModelApiFormModel>();
  const [showToggleTabsBtn, setShowToggleTabsBtn] = useState(false);
  const guideSteps = Object.keys(guideStepToFieldMap);

  function handleToggleAllTabsClick() {
    setShowAllTabs((prev) => !prev);
    if (onToggleAllTabsClick) onToggleAllTabsClick(showAllTabs);
  }

  function handleGuideSelect(types: GuidelineType[]) {
    if (types.length === 0) {
      setShowToggleTabsBtn(false);
    } else {
      setShowToggleTabsBtn(true);
    }

    if (
      types.indexOf(GuidelineType.GET) > -1 ||
      types.indexOf(GuidelineType.POST) > -1
    ) {
      disableInputField('modelAPI.method');
      addGuideStep('Model URL', [{ fieldName: 'modelAPI.method' }]);
      if (types.indexOf(GuidelineType.POST) > -1) {
        removeGuideStep('URL Parameters');
        addGuideStep('Parameters in request data', [
          { fieldName: 'reqBodyParamName', tabName: Tab.REQUEST_BODY },
          { fieldName: 'reqBodyPropDataType', tabName: Tab.REQUEST_BODY },
        ]);
      } else {
        removeGuideStep('Parameters in request data');
        addGuideStep('URL Parameters', [
          { fieldName: 'urlParamName', tabName: Tab.REQUEST_BODY },
          { fieldName: 'urlPropDataType', tabName: Tab.URL_PARAMS },
        ]);
      }
    } else {
      enableInputField('modelAPI.method');
      removeGuideStep('Model URL');
      removeGuideStep('Parameters in request data');
      removeGuideStep('URL Parameters');
    }

    if (
      types.indexOf(GuidelineType.BASIC_AUTH) > -1 ||
      types.indexOf(GuidelineType.AUTH_TOKEN) > -1
    ) {
      disableInputField('modelAPI.authType');
      if (types.indexOf(GuidelineType.BASIC_AUTH) > -1) {
        removeGuideStep('Auth Token');
        addGuideStep('Username/Password', [
          {
            fieldName: 'modelAPI.authTypeConfig.username',
            tabName: Tab.AUTHENTICATION,
          },
          {
            fieldName: 'modelAPI.authTypeConfig.password',
            tabName: Tab.AUTHENTICATION,
          },
        ]);
      } else {
        removeGuideStep('Username/Password');
        addGuideStep('Auth Token', [
          {
            fieldName: 'modelAPI.authTypeConfig.token',
            tabName: Tab.AUTHENTICATION,
          },
        ]);
      }
    } else {
      enableInputField('modelAPI.authType');
      removeGuideStep('Auth Token');
      removeGuideStep('Username/Password');
    }

    if (
      types.indexOf(GuidelineType.PATH) > -1 ||
      types.indexOf(GuidelineType.QUERY) > -1
    ) {
      disableInputField('modelAPI.parameters.paramType');
    } else {
      enableInputField('modelAPI.parameters.paramType');
    }

    if (onSelect) onSelect(types);
  }

  function handleCloseIconClick() {
    reset();
    if (onCloseIconClick) onCloseIconClick();
  }

  function handleGuideStepMouseover(stepName: string) {
    return () => {
      clearHighlightedFields();
      if (stepName === 'Model URL') {
        highlightInputFields(['modelAPI.url']);
      }
      if (stepName === 'Parameters in request data') {
        highlightInputFields(['reqBodyParamName', 'reqBodyPropDataType']);
        selectTab(Tab.REQUEST_BODY);
      }
      if (stepName === 'URL Parameters') {
        highlightInputFields(['urlParamName', 'urlParamDataType']);
        selectTab(Tab.URL_PARAMS);
      }
      if (stepName === 'Username/Password') {
        highlightInputFields([
          'modelAPI.authTypeConfig.username',
          'modelAPI.authTypeConfig.password',
        ]);
        selectTab(Tab.AUTHENTICATION);
      }
      if (stepName === 'Auth Token') {
        highlightInputFields(['modelAPI.authTypeConfig.token']);
      }
      selectGuideStep(stepName);
    };
  }

  function handleGuideStepMouseLeave() {
    clearHighlightedFields();
  }

  return (
    <div
      style={{
        width: '100%',
        margin: 'auto',
        marginTop: '20px',
      }}>
      <StandardAlert
        alertType={AlertType.NONE}
        disableCloseIcon={false}
        onCloseIconClick={handleCloseIconClick}>
        <div style={{ fontSize: 15, width: '100%' }}>
          <div style={{ display: 'flex', gap: 50 }}>
            <SelectInput<GuidelineType[]>
              width={500}
              label="Select a preset"
              name="forGuidePresets"
              options={presetOptions}
              onChange={handleGuideSelect}
            />
            {guideSteps.length ? (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div
                  style={{
                    color: ColorPalette.gray,
                    fontWeight: 600,
                    marginBottom: 4,
                    fontSize: 14,
                  }}>
                  You need to fill these inputs:
                </div>
                <ol
                  style={{
                    padding: 0,
                    margin: 0,
                    paddingLeft: 20,
                    height: 20,
                    display: 'flex',
                  }}>
                  {guideSteps.map((stepName) => (
                    <li
                      key={stepName.split(' ').join('-')}
                      style={{ paddingRight: 25, marginRight: 20 }}>
                      <button
                        type="button"
                        style={{
                          textTransform: 'none',
                          padding: 0,
                          margin: 0,
                          cursor: 'default',
                        }}
                        className="aivBase-button aivBase-button--link aivBase-button--small"
                        onMouseOver={handleGuideStepMouseover(stepName)}
                        onMouseLeave={handleGuideStepMouseLeave}>
                        {stepName}
                      </button>
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}
          </div>
          <div style={{ textAlign: 'right', width: '100%' }}>
            {showToggleTabsBtn ? (
              <div
                style={{
                  position: 'absolute',
                  right: 15,
                  bottom: 5,
                }}>
                {!showAllTabs ? (
                  <Tooltip
                    backgroundColor={ColorPalette.gray}
                    fontColor={ColorPalette.white}
                    content={
                      <div style={{ marginBottom: 5, textAlign: 'left' }}>
                        Show all other available tabs and settings
                      </div>
                    }
                    position={TooltipPosition.left}
                    offsetLeft={-10}>
                    <button
                      type="button"
                      style={{
                        textTransform: 'none',
                        padding: 0,
                        margin: 0,
                      }}
                      className="aivBase-button aivBase-button--link aivBase-button--small"
                      onClick={handleToggleAllTabsClick}>
                      {showAllTabs ? 'Hide other tabs' : 'Show all tabs'}
                    </button>
                  </Tooltip>
                ) : (
                  <button
                    type="button"
                    style={{
                      textTransform: 'none',
                      padding: 0,
                      margin: 0,
                    }}
                    className="aivBase-button aivBase-button--link aivBase-button--small"
                    onClick={handleToggleAllTabsClick}>
                    {showAllTabs ? 'Hide other tabs' : 'Show all tabs'}
                  </button>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </StandardAlert>
    </div>
  );
}

export { FormGuidelines, GuidelineType };
