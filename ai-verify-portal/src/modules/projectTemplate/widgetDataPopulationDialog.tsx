import React, { useState } from 'react';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import InfoIcon from '@mui/icons-material/Info';
import {
  AlertBox,
  AlertBoxSize,
  DraggableAbsolutionPositon,
} from 'src/components/alertBox';
import {
  ReportWidgetItem,
  GlobalVariable,
} from 'src/types/projectTemplate.interface';
import { UserDefinedProperty } from 'src/types/plugin.interface';
import { OutlinedInput } from '@mui/material';
import { ListMenu, ListMenuItem } from 'src/components/listMenu';
import styles from './styles/widget-dialog.module.css';
import clsx from 'clsx';

type WidgetPopulateDataDialogProps = {
  defaultPosition: DraggableAbsolutionPositon;
  reportWidget: ReportWidgetItem;
  globalVars: GlobalVariable[];
  onClose: () => void;
  onChangeProperty?: (prop: UserDefinedProperty, value: string) => void;
};

function InputHelperTooltip({ text }: { text: string }) {
  const [showHelper, setShowHelper] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <div
        onMouseOver={() => setShowHelper(true)}
        onMouseOut={() => setShowHelper(false)}>
        <InfoIcon style={{ fontSize: '17px', color: '#b8b1b1' }} />
      </div>
      {showHelper ? (
        <div
          style={{
            position: 'absolute',
            display: 'inline-block',
            backgroundColor: '#F3F0F5',
            border: '1px solid #cfcfcf',
            maxWidth: 370,
            width: 'max-content',
            padding: 10,
            borderRadius: 2,
            fontSize: '14px',
            zIndex: 2,
            bottom: 20,
            right: 20,
            boxShadow: '0px 0px 5px 0px rgba(0,0,0,0.1)',
          }}>
          {text}
        </div>
      ) : null}
    </div>
  );
}

export default function WidgetDataPopulationDialog(
  props: WidgetPopulateDataDialogProps
) {
  const {
    reportWidget,
    globalVars,
    defaultPosition,
    onClose,
    onChangeProperty,
  } = props;
  const [showGlobalVarsMenu, setShowGlobalVarsMenu] = useState(false);
  const [selectedProperty, setSelectedProperty] =
    useState<UserDefinedProperty>();
  const { widget, properties: filledProperties } = reportWidget;
  const { properties } = widget;

  function handleInputFocus(prop: UserDefinedProperty) {
    return () => {
      setSelectedProperty(prop);
      setShowGlobalVarsMenu(false);
    };
  }

  function handleUseGlobalVarsClick(prop: UserDefinedProperty) {
    return () => {
      if (
        showGlobalVarsMenu &&
        selectedProperty &&
        selectedProperty.key === prop.key
      ) {
        setShowGlobalVarsMenu(false);
        return;
      }
      setSelectedProperty(prop);
      setShowGlobalVarsMenu(true);
    };
  }

  const handleChangeProperty = (prop: UserDefinedProperty, value: string) => {
    if (onChangeProperty) onChangeProperty(prop, value);
  };

  function handleCloseClick() {
    if (onClose) {
      onClose();
    }
  }

  function handleOnChange(prop: UserDefinedProperty) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target) handleChangeProperty(prop, e.target.value);
    };
  }

  function handleGlobalVarSelect(
    prop: UserDefinedProperty | undefined,
    gVar: GlobalVariable
  ) {
    return () => {
      if (!prop) return;
      handleChangeProperty(prop, `{${gVar.key}}`);
      setShowGlobalVarsMenu(false);
    };
  }

  return (
    <AlertBox
      draggable
      id="widgetPropertiesDialog"
      size={AlertBoxSize.MEDIUM}
      containerStyles={{ position: 'relative', zIndex: 200, height: '400px' }}
      defaultPosition={defaultPosition}
      onCloseIconClick={handleCloseClick}>
      <AlertBox.Header isDragHandle>
        <div className={styles.headingContainer}>
          <div style={{ marginLeft: '15px' }}>Widget Content</div>
          <div className={styles.dragIconWrapper}>
            <DragIndicatorIcon style={{ opacity: 0.3 }} />
          </div>
        </div>
      </AlertBox.Header>
      <AlertBox.Body hasFooter>
        <div style={{ fontSize: '16px' }}>
          Widget:{' '}
          <span style={{ fontWeight: 'bold' }}>{reportWidget.widget.name}</span>
        </div>
        <p style={{ fontSize: '14px' }}>
          Fill these input field(s) to populate the text content or values, on
          the widget. <br /> You can use variables. Add new variables on the
          Global Variables panel.
        </p>
        <div>
          <div className={styles.propertyInputHeader}>
            <div style={{ flexGrow: 2 }}>Text / Value</div>
            <div style={{ width: '100px', textAlign: 'center' }}>Variable</div>
          </div>
          {properties &&
            properties.map((prop) => {
              let variable = '';
              let value = filledProperties && filledProperties[prop.key];
              if (value && value.startsWith('{') && value.endsWith('}')) {
                variable = value.substring(1, value.length - 1);
                const gVar = globalVars.find((gvar) => gvar.key === variable);
                value = gVar != undefined ? gVar.value : value;
              }
              const isPropertyFocused = selectedProperty
                ? selectedProperty.key
                : undefined;
              return (
                <div
                  key={`${reportWidget.key}-${prop.key}`}
                  className={styles.propertyInputContainer}>
                  <div className={styles.propertyInputField}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        width: 450,
                      }}>
                      <label
                        style={{ textTransform: 'capitalize', fontSize: 14 }}>
                        {prop.key}
                      </label>
                      {Boolean(prop.helper) ? (
                        <InputHelperTooltip text={prop.helper as string} />
                      ) : null}
                    </div>
                    <div style={{ display: 'flex' }}>
                      <OutlinedInput
                        value={value}
                        onChange={handleOnChange(prop)}
                        onFocus={handleInputFocus(prop)}
                        type="text"
                        placeholder={prop.helper}
                        style={{
                          height: '36px',
                          flexGrow: 2,
                          outline: 'none',
                          border:
                            prop.key === isPropertyFocused
                              ? '1px solid rgb(75, 37, 90)'
                              : 'none',
                        }}
                      />
                      <button
                        className={clsx(
                          'aivBase-button aivBase-button--outlined aivBase-button--small',
                          styles.useVarBtn,
                          variable ? styles.noTextTransform : styles.capitalize
                        )}
                        onClick={handleUseGlobalVarsClick(prop)}>
                        {variable || 'select'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </AlertBox.Body>
      <AlertBox.Footer>
        <div className={styles.footerContent}>
          <button
            className="aivBase-button aivBase-button--secondary aivBase-button--small"
            onClick={handleCloseClick}>
            OK
          </button>
        </div>
      </AlertBox.Footer>
      {showGlobalVarsMenu ? (
        <div className={styles.variablesMenu}>
          <div
            style={{
              background: '#702F8A',
              color: '#FFFFFF',
              padding: '5px 10px',
            }}>
            Global Variables
          </div>
          <ListMenu>
            {globalVars.map((globalVar) => (
              <ListMenuItem
                key={`gvar-${globalVar.key}`}
                id="explortAsPlugin"
                displayText={globalVar.key}
                onClick={handleGlobalVarSelect(selectedProperty, globalVar)}
              />
            ))}
          </ListMenu>
        </div>
      ) : null}
    </AlertBox>
  );
}
