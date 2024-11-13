/**
 * Parse the RJSF schema and extracts the ui:widgets and ui:options
 * 
 * @param rootSchema 
 * @param datasetList 
 * @param testDataset 
 * @returns 
 */
export const parseRJSFSchema = async (rootSchema: any, getDatasets:()=>Promise<any[]>, testDataset: any) => {
  let datasets = null;
  let uiWidget = {}
  let stack = [{
    schema: rootSchema,
    uiw: uiWidget,
  }];
  while (stack.length > 0) {
    let cur = stack.pop() as any;
    if (!cur.schema.type) {
      console.log("Schema type not found", cur.schema);
      break;
    }
    switch (cur.schema.type) {
      case 'object':
        if (!cur.schema.properties) {
          console.log("Schema properties not found", cur.schema);
          break;
        }
        for (const prop of Object.keys(cur.schema.properties)) {
          cur.uiw[prop] = {};
          stack.push({
            schema: cur.schema.properties[prop],
            uiw: cur.uiw[prop],
          })
        }
        break;
      case 'array':
        if (!cur.schema.items) {
          console.log("Schema items not found", cur.schema);
          break;
        }
        cur.uiw['items'] = {};
        stack.push({
          schema: cur.schema.items,
          uiw: cur.uiw['items'],
        })
        break;
      case 'string':
      case 'number':
      case 'integer':
      case 'boolean':
        if (cur.schema['ui:widget']) {
          const uiWidget = cur.schema['ui:widget'];
          if (uiWidget === 'selectDataset') {
            if (!datasets)
              datasets = await getDatasets();
            if (datasets)
              cur.schema.enum = datasets.map(e => e.filePath);
          } else if (uiWidget === 'selectTestDataFeature') {
            if (testDataset && testDataset.dataColumns)
              cur.schema.enum = (testDataset.dataColumns as any[]).map(e => e.name);
          } else {
            cur.uiw['ui:widget'] = uiWidget;
          }
          if (cur.schema['ui:options']) {
            cur.uiw['ui:options'] = cur.schema['ui:options']
          }  
      }
        break;
    }
  }
  return uiWidget;
}