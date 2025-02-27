# Guidelines for Creating Widget MDX Files in AI Verify

## Available Props

When creating widget MDX files, your component will receive the following props:

| Prop             | Type                            | Description                                                         |
| ---------------- | ------------------------------- | ------------------------------------------------------------------- |
| `id`             | string                          | Unique identifier for the widget instance on the grid               |
| `properties`     | Record<string, unknown>         | User-configurable properties defined in the widget's meta.json file |
| `testResult`     | TestResultData                  | Test results from algorithms mapped by `${widget.gid}:${cid}`       |
| `inputBlockData` | InputBlockData                  | Data from input blocks mapped by `${widget.gid}:${cid}`             |
| `getIBData`      | (id: string) => InputBlockData  | Helper function to get input block data by ID                       |
| `getResults`     | (id: string) => TestResultData  | Helper function to get algorithm results by ID                      |
| `width`          | number                          | Current width of the widget in pixels                               |
| `height`         | number                          | Current height of the widget in pixels                              |

## Guidelines for Creating Widget MDX Files

### 1. Basic Structure

```mdx
// Optional: Export the algorithm CID for easy reference
export const cid = "your_algorithm_cid";

// Your widget content

<div>
  <h3>Widget Title</h3>
  <p>Widget content goes here</p>
</div>
```

### 2. Accessing Properties

Properties defined in your widget's meta.json file can be used in the widget via `props.properties`. Text elements like headings, will be editable on the grid:

```mdx
<h1>{props.properties.heading1}</h1>
<p>{props.properties.text || "Default text if not provided"}</p>
```

### 3. Accessing Algorithm Results

Use the `getResults` helper function to access algorithm results:

```mdx
{
  props.getResults(cid) ? (
    <div>
      <p>Result: {JSON.stringify(props.getResults(cid).someValue)}</p>
    </div>
    ) : (
      <div>No data available</div>
    )
}
```

### 4. Importing Components

You can import other MDX components to reuse functionality:

```mdx
import { MyChart } from "./chart.mdx";

<MyChart
  data={props.getResults(cid)}
  width={props.width}
  height={props.height}
/>
```

### 5. Responsive Design

Use the provided width and height props to make your widget responsive (This is useful for charts which normally need explicit width and height):

```mdx
<div style={{ width: props.width, height: props.height }}>
  <MyVisualization data={props.getResults(cid)} />
</div>

// Example of a responsive container which resizes based on the width and height of the widget(eg: resizing on grid layout)

// container div with chart-container and chart-bar classes and explicit width and height
<div className="chart-container chart-bar" style={{ width: props.width, height: props.height }}>
  // header is included in this container, so it needs to be factored in when calculating the height of the chart container
  <h4 style={{ padding:5, margin:0, textAlign:"center" }}>{metric}</h4>
  // chart container must have explicit height and and factor in the header height
  <div style={{ height: "calc(100% - 40px)" }}>
    <BarChart
      data={mydata.data}
      xAxisDataKey="outputClass"
      bars={mydata.bars}
      chartProps={{ layout: "vertical" }}
      legendProps={{ wrapperStyle }}
    />
  </div>
</div>
```

### 6. Error Handling

Always handle cases where data might be missing:

```mdx
{props.getResults(cid) ? (

<MyChart data={props.getResults(cid)} />) : (
<div>No algorithm results available</div>
)}
```

### 7. Using React Components

You can use React components and hooks within your MDX:

```mdx
import React, { useState, useEffect } from "react";

export const MyWidget = (props) => {
  const [processedData, setProcessedData] = useState(null);

  useEffect(() => {
    if (props.getResults(cid)) {
      // Process data
      setProcessedData(transformData(props.getResults(cid)));
    }
  }, [props.getResults(cid)]);

  return (
    <div>
      {processedData ? (
        <div>Processed data: {JSON.stringify(processedData)}</div>
      ) : (
        <div>Loading or no data...</div>
      )}
    </div>
  );
};

<MyWidget {...props} />
```

### 8. Styling

You can use inline styles or import style objects:

```mdx
import { styles } from "./styles.mdx";

<div style={{ width: "100%" }}>
  <table style={styles.table}>
    <tr>
      <th style={styles.header}>Property</th>
      <td style={styles.cell}>{props.properties.someProperty}</td>
    </tr>
  </table>
</div>
```

### 9. Best Practices

- Keep widgets focused on a single responsibility
- Handle all potential data states (loading, error, empty, success)
- Use descriptive variable names
- Comment complex logic
- Test with mock data before deployment
- Ensure your widget degrades gracefully when resized

### 10. Example: Complete Widget

```mdx
export const cid = "my_algorithm";

import React from "react";
import { MyChart } from "./chart.mdx";

const styles = {
container: {
padding: '10px',
border: '1px solid #eee',
borderRadius: '4px',
},
header: {
color: '#333',
marginBottom: '10px',
}
};

{props.getResults(cid) ? (

{" "}
<div style={styles.container}>
  <h3 style={styles.header}>{props.properties.title || "My Widget"}</h3>
  <p>{props.properties.description || ""}</p>

  <MyChart
    data={props.getResults(cid).results}
    width={props.width}
    height={props.height - 100} // Adjust for header height
  />
</div>) : (
<div style={styles.container}>
  <h3 style={styles.header}>No Data Available</h3>
  <p>Please run the algorithm to see results.</p>
</div>
)}
```

### 11. Columns

Use css grid to create columns:

Here's an example of a widget that uses css grid to create containing lines charts:

```mdx
return (
  <div className="chart-container" style={{
    display: "grid", // Creates a CSS grid layout
    gridTemplateColumns: "repeat(3, 1fr)", // Creates 3 equal-width columns
    gap: "20px", // Adds 20px spacing between grid items
    height }}> // Uses the height prop passed to the widget
      {mydata.data.map((each_feature, index) => {
        return (
          <div key={`${id}-${index}`}>
            {Object.entries(each_feature).map(function ([key, value]) {
              return (
                <div key={`${id}-${key}`} style={{ height:"calc(100% - 40px)" }}>
                  <h5 style={{ textAlign: "center" }}>{key}</h5>
                  <LineChart data={value}
                    xAxisDataKey="feature_value"
                    xAxisProps={{ width:"100%", fontSize:8}}
                    yAxisProps={{ fontSize:8}}
                    lines={[{ dataKey:"ale"}]}
                  />
                </div>
              )
            })}
          </div>
        )
      })
    }
  </div>
```


### 12. Using Keys in React Components

When rendering lists of elements in React components within MDX files, always use unique key props. The widget receives an `id` prop which is unique per widget instance - use this to generate unique keys:

