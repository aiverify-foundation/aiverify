function TabContentURLParams() {
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
        <SelectInput
          label="URL Parameter Type"
          name="urlParamType"
          options={optionsUrlParamTypes}
          value={urlParamType}
          onChange={handleUrlParamTypeChange}
        />
        {urlParamType && urlParamType.value === URLParamType.QUERY ? (
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
            urlParamType && urlParamType.value === URLParamType.QUERY ? (
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
            {urlParams.map((param, index) => (
              <Draggable key={param.id} draggableId={param.id} index={index}>
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
