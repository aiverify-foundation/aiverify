# AI Verify Shared Library Styles

This section describes the CSS classes that can be applied to MDX components.

## Colors

Developers can use the following color classnames while stying their components.

* c-primary
* c-secondary
* c-success
* c-info
* c-warning
* c-error

```
<h4 className="c-primary">Primary Test Color</h4>
<h4 className="c-secondary">Secondary Test Color</h4>
<h4 className="c-success">Success Test Color</h4>
<h4 className="c-info">Info Test Color</h4>
<h4 className="c-warning">Warning Test Color</h4>
<h4 className="c-error">Error Test Color</h4>
```

![Text Colors](./images/text_colors.png)

## Panel and Cards

The CSS classes `aiv-panel` and `aiv-card` provide difference surfaces to display contents.

### Panels

```
<div style={{ display:"flex" }}>
  <div className="aiv-panel" style={{ marginRight:"5px" }}>
    <h4>Primary panel</h4>
  </div>
  <div className="aiv-panel c-secondary" style={{ marginRight:"5px" }}>
    <h4>Secondary panel</h4>
  </div>
  <div className="aiv-panel c-success" style={{ marginRight:"5px"  }}>
    <h4>Success panel</h4>
  </div>
  <div className="aiv-panel c-info" style={{ marginRight:"5px" }}>
    <h4>Info panel</h4>
  </div>
  <div className="aiv-panel c-warning" style={{ marginRight:"5px"  }}>
    <h4>Warning panel</h4>
  </div>
  <div className="aiv-panel c-error">
    <h4>Error panel</h4>
  </div>
</div>
```

![Panels](./images/panel.png)

### Cards

```
<div style={{ display:"flex" }}>
  <div className="aiv-card" style={{ marginRight:"5px" }}>
    <h4>Primary card</h4>
  </div>
  <div className="aiv-card c-secondary" style={{ marginRight:"5px" }}>
    <h4>Secondary card</h4>
  </div>
  <div className="aiv-card c-success" style={{ marginRight:"5px"  }}>
    <h4>Success card</h4>
  </div>
  <div className="aiv-card c-info" style={{ marginRight:"5px" }}>
    <h4>Info card</h4>
  </div>
  <div className="aiv-card c-warning" style={{ marginRight:"5px"  }}>
    <h4>Warning card</h4>
  </div>
  <div className="aiv-card c-error" style={{  }}>
    <h4>Error card</h4>
  </div>
</div>
```

![Cards](./images/card.png)

## Styling Buttons

To style html buttons, use the `aiv-button` CSS className. To set to different colors, set the color classnames.

```
<div style={{ display:"flex" }}>
  <button className="aiv-button">Primary button</button>
  <button className="aiv-button c-secondary">Secondary button</button>
  <button className="aiv-button c-success">Secondary button</button>
  <button className="aiv-button c-info">Secondary button</button>
  <button className="aiv-button c-warning">Secondary button</button>
  <button className="aiv-button c-error">Secondary button</button>
</div>
```

![Buttons](./images/button.png)

## Styling Inputs

To style html input and textarea, use the `aiv-input` and `aiv-textarea` CSS classes.

```
<input className="aiv-input" />
<textarea className="aiv-textarea" />
```
