import { SelectInput, SelectOption } from "src/components/selectInput";
import { Tooltip, TooltipPosition } from "src/components/tooltip";
import InfoIcon from '@mui/icons-material/Info';
import { ModelAPIGraphQLModel, OpenApiDataTypes, URLParamType, UrlParam } from "./types";
import styles from './styles/newModelApiConfig.module.css';
import { UrlParamCaptureInput, UrlParamDisplayInput, UrlParamsInputHeading } from "./requestUrlParamInput";
import { Draggable, Droppable } from "react-beautiful-dnd";
import { FieldArray, useFormikContext } from "formik";
import { optionsUrlParamTypes } from "./selectOptions";
import { ChangeEvent, useState } from "react";
import { getInputReactKeyId } from "./newModelApiConfig";

const defaultUrlParameter: UrlParam = {
  reactPropId: '',
  name: '',
  type: OpenApiDataTypes.INTEGER,
};

type TabContentURLParams = {
  urlQueryType: URLParamType
}

function TabContentURLParams(props: TabContentURLParams) {
  const [paramType, setParamType] = useState<URLParamType>(URLParamType.QUERY);
  const [newParam, setNewParam] = useState<UrlParam>(() => ({
    ...defaultUrlParameter,
    reactPropIid: getInputReactKeyId()
  }));
  const { values } = useFormikContext<ModelAPIGraphQLModel>();

  function handleParamTypeChange(val: URLParamType) {
    setParamType(val);
  }

  function handleNewParamKeyChange(e: ChangeEvent<HTMLInputElement>) {
    setNewParam((prev) => ({
      reactPropId: prev.reactPropId,
      name: e.target.value,
      type: prev.type,
    }));
  }

  function handleNewParamDatatypeChange(option: SelectOption) {
    if (!option) return;
    setNewParam((prev) => ({
      reactPropId: prev.reactPropId,
      name: prev.name,
      type: option.value as OpenApiDataTypes,
    }));
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
      }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
        }}>
        <SelectInput<URLParamType>
          label="URL Parameter Type"
          name="urlParamType"
          options={optionsUrlParamTypes}
          value={paramType}
          onChange={handleParamTypeChange}
        />
        {paramType === URLParamType.QUERY ? (
          <div
            style={{
              marginLeft: 10,
              fontSize: 14,
            }}>
            e.g. https://hostname/predict?
            <span className={styles.paramHighlight}>age</span>
            =&#123;value&#125;&
            <span className={styles.paramHighlight}>gender</span>
            =&#123;value&#125;
          </div>
        ) : (
          <div
            style={{
              marginLeft: 10,
              fontSize: 14,
            }}>
            e.g. https://hostname/predict/
            <span className={styles.paramHighlight}>&#123;age&#125;</span>/
            <span className={styles.paramHighlight}>&#123;gender&#125;</span>
          </div>
        )}
        <Tooltip
          backgroundColor="#676767"
          fontColor="#FFFFFF"
          content={
            paramType === URLParamType.QUERY ? (
              <div>
                <div style={{ marginBottom: 5 }}>
                  Example of URL with 2 parameters defined - &quot;age&quot; &
                  &quot;gender&quot;
                </div>
                Before running tests, you will be prompted to map your test
                dataset attributes to these parameters.
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: 5 }}>
                  Example of URL with 2 parameters are defined - &quot;age&quot;
                  & &quot;gender&quot;
                </div>
                Before running tests, you will be prompted to map your dataset
                attributes to these parameters.
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
      <Droppable droppableId="list-container">
        {(provided) => (
          <div
            className="list-container"
            {...provided.droppableProps}
            ref={provided.innerRef}>
              <FieldArray name="parameters.queries.queryParams">
                {({ insert, remove, push}) => {
                  return (
                    <div>
                      {values.parameters?.queries?.queryParams.map((param, index) => (
                        <Draggable key={param.reactPropId} draggableId={param.reactPropId} index={index}>
                          {(provided) => (
                            <div
                              className="item-container"
                              ref={provided.innerRef}
                              {...provided.dragHandleProps}
                              {...provided.draggableProps}>
                              <UrlParamDisplayInput
                                key={param.id}
                                param={param}
                                onKeynameChange={handleCurrentParamKeyChange(param.key)}
                                onDatatypeChange={handleCurrentParamDatatypeChange(
                                  param.key
                                )}
                                onRemoveBtnClick={handleDeleteUrlParamClick}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                    </div>
                  )
                }}
              </FieldArray>
            {provided.placeholder}
          </div>
        )}
      </Droppable>
      <UrlParamCaptureInput
        newParam={newParam}
        onKeynameChange={handleNewParamKeyChange}
        onDatatypeChange={handleNewParamDatatypeChange}
        onAddClick={handleAddUrlParam}
      />
    </div>
  );
}
