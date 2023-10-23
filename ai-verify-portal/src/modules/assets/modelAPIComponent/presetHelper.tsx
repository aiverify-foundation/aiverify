import { AlertType, StandardAlert } from 'src/components/standardAlerts';
import { useState } from 'react';
import { SelectInput } from 'src/components/selectInput';
import { usePresetHelper } from './providers/presetHelperProvider';
import { ColorPalette } from 'src/components/colorPalette';
import { Tab } from './tabButtons';
import { Tooltip, TooltipPosition } from 'src/components/tooltip';
import { PresetGuideSteps, PresetHelpItem } from './types';
import { presetOptions } from './selectOptions';

type PresetHelperProps = {
  onToggleAllTabsClick: (showAllTabs: boolean) => void;
  onCloseIconClick: () => void;
  onSelect: (types: PresetHelpItem[]) => void;
};

function PresetHelper(props: PresetHelperProps) {
  const { onCloseIconClick, onSelect, onToggleAllTabsClick } = props;
  const [showAllTabs, setShowAllTabs] = useState(false);
  const {
    disableInputField,
    enableInputField,
    reset,
    addGuideStep,
    removeGuideStep,
    highlightInputFields,
    clearHighlightedFields,
    guideStepToFieldMap,
    selectTab,
  } = usePresetHelper();
  const [showToggleTabsBtn, setShowToggleTabsBtn] = useState(false);
  const guideSteps = Object.keys(guideStepToFieldMap);
  let orderedGuideSteps = [
    PresetGuideSteps.MODEL_URL,
    PresetGuideSteps.URL_PARAMS,
    PresetGuideSteps.REQUESTBODY_PARAMS,
    PresetGuideSteps.BEARER_TOKEN,
    PresetGuideSteps.USER_PASSWORD,
    PresetGuideSteps.RESPONSE_SETTINGS,
  ];
  orderedGuideSteps = orderedGuideSteps.filter(
    (step) => guideSteps.findIndex((val) => val === step) !== -1
  );

  function handleToggleAllTabsClick() {
    setShowAllTabs((prev) => !prev);
    if (onToggleAllTabsClick) onToggleAllTabsClick(showAllTabs);
  }

  function handleGuideSelect(types: PresetHelpItem[]) {
    if (types.length === 0) {
      setShowToggleTabsBtn(false);
    } else {
      setShowToggleTabsBtn(true);
    }

    if (
      types.indexOf(PresetHelpItem.GET) > -1 ||
      types.indexOf(PresetHelpItem.POST) > -1
    ) {
      disableInputField('modelAPI.method');
      addGuideStep(PresetGuideSteps.MODEL_URL, [
        { fieldName: 'modelAPI.method' },
      ]);
      if (types.indexOf(PresetHelpItem.POST) > -1) {
        removeGuideStep(PresetGuideSteps.URL_PARAMS);
        addGuideStep(PresetGuideSteps.REQUESTBODY_PARAMS, [
          { fieldName: 'reqBodyParamName', tabName: Tab.REQUEST_BODY },
          { fieldName: 'reqBodyPropDataType', tabName: Tab.REQUEST_BODY },
        ]);
      } else {
        removeGuideStep(PresetGuideSteps.REQUESTBODY_PARAMS);
        addGuideStep(PresetGuideSteps.URL_PARAMS, [
          { fieldName: 'urlParamName', tabName: Tab.REQUEST_BODY },
          { fieldName: 'urlPropDataType', tabName: Tab.URL_PARAMS },
        ]);
      }
    } else {
      enableInputField('modelAPI.method');
      removeGuideStep(PresetGuideSteps.MODEL_URL);
      removeGuideStep(PresetGuideSteps.REQUESTBODY_PARAMS);
      removeGuideStep(PresetGuideSteps.URL_PARAMS);
    }

    if (
      types.indexOf(PresetHelpItem.BASIC_AUTH) > -1 ||
      types.indexOf(PresetHelpItem.AUTH_TOKEN) > -1
    ) {
      disableInputField('modelAPI.authType');
      if (types.indexOf(PresetHelpItem.BASIC_AUTH) > -1) {
        removeGuideStep(PresetGuideSteps.BEARER_TOKEN);
        addGuideStep(PresetGuideSteps.USER_PASSWORD, [
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
        removeGuideStep(PresetGuideSteps.USER_PASSWORD);
        addGuideStep(PresetGuideSteps.BEARER_TOKEN, [
          {
            fieldName: 'modelAPI.authTypeConfig.token',
            tabName: Tab.AUTHENTICATION,
          },
        ]);
      }
    } else {
      enableInputField('modelAPI.authType');
      removeGuideStep(PresetGuideSteps.BEARER_TOKEN);
      removeGuideStep(PresetGuideSteps.USER_PASSWORD);
    }

    if (
      types.indexOf(PresetHelpItem.PATH) > -1 ||
      types.indexOf(PresetHelpItem.QUERY) > -1
    ) {
      disableInputField('modelAPI.parameters.paramType');
    } else {
      enableInputField('modelAPI.parameters.paramType');
    }

    if (types.indexOf(PresetHelpItem.RESPONSE)) {
      addGuideStep(PresetGuideSteps.RESPONSE_SETTINGS, [
        {
          fieldName: 'modelAPI.response.mediaType',
          tabName: Tab.AUTHENTICATION,
        },
      ]);
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
      if (stepName === PresetGuideSteps.MODEL_URL) {
        highlightInputFields(['modelAPI.url']);
      }
      if (stepName === PresetGuideSteps.REQUESTBODY_PARAMS) {
        highlightInputFields(['reqBodyParamName', 'reqBodyPropDataType']);
        selectTab(Tab.REQUEST_BODY);
      }
      if (stepName === PresetGuideSteps.URL_PARAMS) {
        highlightInputFields(['urlParamName', 'urlParamDataType']);
        selectTab(Tab.URL_PARAMS);
      }
      if (stepName === PresetGuideSteps.USER_PASSWORD) {
        highlightInputFields([
          'modelAPI.authTypeConfig.username',
          'modelAPI.authTypeConfig.password',
        ]);
        selectTab(Tab.AUTHENTICATION);
      }
      if (stepName === PresetGuideSteps.BEARER_TOKEN) {
        highlightInputFields(['modelAPI.authTypeConfig.token']);
        selectTab(Tab.AUTHENTICATION);
      }
      if (stepName === PresetGuideSteps.RESPONSE_SETTINGS) {
        highlightInputFields([
          'modelAPI.response.mediaType',
          'modelAPI.response.schema.type',
        ]);
        selectTab(Tab.RESPONSE);
      }
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
            <SelectInput<PresetHelpItem[]>
              width={500}
              label="Select a preset"
              name="forGuidePresets"
              options={presetOptions}
              onChange={handleGuideSelect}
            />
            {orderedGuideSteps.length ? (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div
                  style={{
                    color: ColorPalette.gray,
                    fontWeight: 600,
                    marginBottom: 4,
                    fontSize: 14,
                  }}>
                  You have to fill these inputs:
                </div>
                <ol
                  style={{
                    padding: 0,
                    margin: 0,
                    paddingLeft: 20,
                    height: 20,
                    display: 'flex',
                  }}>
                  {orderedGuideSteps.map((stepName) => (
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

export { PresetHelper, PresetHelpItem };
