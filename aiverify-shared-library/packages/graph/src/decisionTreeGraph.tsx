import React, { useRef, useEffect, useState } from "react";
import cytoscape from "cytoscape";
import dagre from "cytoscape-dagre";
import cytoscapeDomNode from "cytoscape-dom-node";

cytoscape.use(dagre);
cytoscape.use(cytoscapeDomNode);

const LINE_COLOR = "#212529";
const TEXT_COLOR = "#202020";
const EDGE_TEXT_COLOR = "#202020";
const BACKGROUND_COLOR = "#FFF";
const HIGHLIGH_COLOR = "#ff0d57";
const HIGHLIGH_TEXT_COLOR = "#f9f9f9";
const SELECT_COLOR = "#1E88E5";
const SELECT_COLOR2 = "#13B755";
const SELECT_TEXT_COLOR = "#f9f9f9";

// export type DecisionTreeObject = {
//   cy: cytoscape.Core;
//   graphdata: cytoscape.CollectionReturnValue;
// }

// my api extensions
cytoscape("core", "resetGraph", function () {
  // @ts-ignore
  let cy = this;
  // Remove highlight classes from all nodes and edges
  cy.nodes().removeClass("highlight");
  cy.edges().removeClass("edge-selected");

  // Only retain highlights for outcome nodes that are specifically chosen
  let outcomes = cy.nodes('[type = "outcome"]').filter(".highlight");

  // Don't remove highlights from outcomes
  outcomes.addClass("highlight");

  cy.fit(cy.nodes(), "10px");
  return cy;
});

cytoscape("core", "outcomes", function () {
  // @ts-ignore
  let cy = this;
  return cy.nodes('[type = "outcome"]');
});

cytoscape("core", "setOutcome", function (outcomeNode: cytoscape.NodeSingular) {
  // @ts-ignore
  let cy = this;
  const successors = outcomeNode.successors();
  // successors.classes([]);
  successors.filter("node").removeClass("highlight");
  successors.filter("edge").removeClass("edge-selected");
  let descendentNodes = successors.targets();
  // let branch = descendentNodes.union(outcomeNode);
  // cy.fit(branch, '10px')
  const firstChild = descendentNodes[0];
  firstChild.addClass("highlight");
  return firstChild;
});

cytoscape("core", "chooseOutcome", function (id: string, on: boolean) {
  // @ts-ignore
  let cy = this;
  let node = cy.$id(id);
  if (on) {
    node.addClass("highlight");
  } else {
    node.removeClass("highlight");
  }
});

cytoscape("core", "getSelections", function () {
  // @ts-ignore
  let cy = this;
  // let outcomes = cy.$('node[type="outcome"]').$('.highlight');
  let nodes: string[] = [];
  let edges: string[] = [];
  (cy.nodes(".highlight") as any[]).forEach((node) => {
    nodes.push(node.id());
  });
  (cy.edges(".edge-selected") as any[]).forEach((edge) => {
    edges.push(edge.id());
  });
  return {
    nodes,
    edges,
  };
});

cytoscape("collection", "getChoices", function () {
  // @ts-ignore
  let qn = this;
  return qn.outgoers("edge").toArray();
});

cytoscape("collection", "choose", function () {
  // @ts-ignore
  let edge = this;
  if (edge.hasClass("edge-selected")) return null;
  let qn = edge.source();
  let nextqn = edge.target();

  // qn.successors().classes([]); // remove all classes
  qn.successors("node").removeClass("highlight");
  qn.successors("edge").removeClass("edge-selected");
  edge.addClass("edge-selected");
  nextqn.addClass("highlight");
  return nextqn;
});

export type DecisionTreeGraphProps = {
  graphdata: {
    nodes: any[];
    edges: any[];
  };
  definitions: any;
  width?: number | string;
  height?: number | string;
  onReady?: (cy: cytoscape.Core) => void;
  layoutOptions: any;
  isEditing?: boolean;
};

export const substitute = (paragraph: string, definitions: any) => {
  return paragraph.replace(/\[(\w+)\]/g, (match, p1) => {
    // console.log("match", match, p1);
    let str = definitions[p1] ? definitions[p1] : "<INVALID>";
    str = str.toLowerCase().trim();
    return str.charAt(0).toUpperCase() + str.slice(1);
  });
};

export default function DecisionTreeGraph({
  graphdata,
  definitions,
  width,
  height,
  onReady,
  layoutOptions = {},
  isEditing = false,
}: DecisionTreeGraphProps) {
  // Default to not editing if not provided
  const cyRef = useRef<HTMLDivElement>(null);
  const cy = useRef<cytoscape.Core | null>(null);
  const [showResetButton, setShowResetButton] = useState(false);
  // const graphdata = useRef<cytoscape.CollectionReturnValue|null>(null);

  const style: cytoscape.Stylesheet[] = [
    {
      selector: "node",
      style: {
        "text-wrap": "wrap",
        width: "340px",
        height: "100px",
        "text-max-width": "330px",
        "font-size": "28px",
        "font-family": "sans-serif",
        "text-valign": "center",
        "text-halign": "center",
        "background-color": BACKGROUND_COLOR,
        color: TEXT_COLOR,
        "border-width": "1px",
        "border-color": LINE_COLOR,
        label: "data(text)",
        shape: "round-rectangle",
      },
    },
    {
      selector: 'node[type="question"]',
      style: {
        shape: "diamond",
        width: "520px",
        height: "220px",
        "text-max-width": "360px",
      },
    },
    {
      selector: 'node[type="outcome"]',
      style: {
        width: "500px",
        height: "150px",
        "text-max-width": "490px",
      },
    },
    {
      selector: 'node[type="metric2"]',
      style: {
        width: "340px",
        height: "210px",
        "background-opacity": 0,
      },
    },
    {
      selector: ".hidden",
      style: {
        display: "none",
      },
    },
    {
      selector: ".highlight",
      style: {
        "border-width": "4px",
        "border-color": HIGHLIGH_COLOR,
        "background-color": HIGHLIGH_COLOR,
        color: HIGHLIGH_TEXT_COLOR,
      },
    },
    {
      selector: ".answer",
      style: {
        // "border-width": "4px",
        // "border-color": SELECT_COLOR,
        "border-opacity": 0.7,
        "background-color": SELECT_COLOR,
        color: SELECT_TEXT_COLOR,
        // "text-outline-color": "yellow",
      },
    },
    {
      selector: ".selected-metric",
      style: {
        // "border-width": "4px",
        // "border-color": SELECT_COLOR2,
        "border-opacity": 0.7,
        "background-color": SELECT_COLOR2,
        color: SELECT_TEXT_COLOR,
        // "text-outline-color": "yellow",
      },
    },
    {
      selector: "edge[text]", // default edge style
      style: {
        label: "data(text)",
        "text-wrap": "wrap",
        // "text-max-width": "100px",
        "text-max-width": "200px",
        "line-color": LINE_COLOR,
        width: 1,
        "target-arrow-color": LINE_COLOR,
        "curve-style": "taxi",
        "target-arrow-shape": "triangle",
        // "font-size": "12px",
        "font-size": "24px",
        // "font-size": "26px",
        color: TEXT_COLOR,
        "taxi-direction": "downward",
      },
    },
    {
      selector: ".edge-selected",
      style: {
        "line-color": HIGHLIGH_COLOR,
        "target-arrow-color": HIGHLIGH_COLOR,
        width: 3,
      },
    },
  ]; // styles

  const defaultLayoutOptions: any = {
    name: "dagre",
    nodeDimensionsIncludeLabels: true,
    padding: 20,
    spacingFactor: 1.0,
    fit: true,
  };

  const createMetricDomNode = (node: any) => {
    let div = document.createElement("div");
    div.style.width = "340px";
    div.style.height = "210px";
    div.style.fontSize = "26px";
    div.style.fontFamily = "sans-serif";
    div.style.lineHeight = "1";
    div.style.textAlign = "center";
    // div.innerHTML = `node ${node.data.id}`;
    let child1 = document.createElement("div");
    child1.style.height = "50%";
    child1.style.display = "flex";
    child1.style.justifyContent = "center";
    child1.style.alignItems = "center";
    child1.style.backgroundColor = "#CED4DA";
    child1.style.color = "#000";
    child1.style.padding = "5px";
    child1.innerHTML = node.data.text_positive;
    div.appendChild(child1);
    let child2 = document.createElement("div");
    child2.style.height = "50%";
    child2.style.display = "flex";
    child2.style.justifyContent = "center";
    child2.style.alignItems = "center";
    child2.style.backgroundColor = "#495057";
    child2.style.color = "#FFF";
    child2.style.padding = "5px";
    child2.innerHTML = node.data.text_negative;
    div.appendChild(child2);
    return div;
  };

  const resetView = () => {
    if (cy.current) {
      cy.current.fit(cy.current.nodes(), 20);
      cy.current.center();
      setShowResetButton(false);
    }
  };

  const checkViewBounds = () => {
    if (!cy.current) return;
    
    const extent = cy.current.extent();
    const containerBB = cy.current.container().getBoundingClientRect();
    const zoom = cy.current.zoom();
    
    // Show reset button if zoom is too small or content is out of view
    const minZoom = 0.1;
    const shouldShowReset = zoom < minZoom || 
      extent.x1 > containerBB.width || 
      extent.x2 < 0 || 
      extent.y1 > containerBB.height || 
      extent.y2 < 0;
    
    setShowResetButton(shouldShowReset);
  };

  useEffect(() => {
    if (!graphdata || !definitions) return;

    let elements = { ...graphdata };
    for (let node of elements.nodes) {
      if (node.data.stext)
        node.data.text = substitute(node.data.stext, definitions);
      if (node.data.gqn)
        node.data.qn = (node.data.gqn as string[]).map((qn) =>
          substitute(qn, definitions)
        );
      if (node.data.type && node.data.type === "metric2") {
        // node.data.text = node.data.text_positive;
        node.data.dom = createMetricDomNode(node);
      }
    }
    for (let edge of elements.edges) {
      if (edge.data.stext)
        edge.data.text = substitute(edge.data.stext, definitions);
    }

    // graphdata.current = data;
    cy.current = cytoscape({
      container: cyRef.current,

      boxSelectionEnabled: isEditing,
      autounselectify: !isEditing,
      autoungrabify: !isEditing,

      layout: {
        ...defaultLayoutOptions,
        ...layoutOptions,
      },

      style,

      elements,
      
      // Add zoom and pan limits
      minZoom: 0.1,
      maxZoom: 3,
      wheelSensitivity: 0.5,
    });

    // @ts-ignore
    cy.current.domNode();

    // Add event listeners for zoom and pan changes
    cy.current.on('zoom pan', checkViewBounds);
    
    // Add double-click to reset view
    cy.current.on('tap', (evt) => {
      if (evt.target === cy.current) {
        // Double-click on background
        const now = Date.now();
        const lastTap = cy.current.scratch('lastTap') || 0;
        if (now - lastTap < 300) {
          resetView();
        }
        cy.current.scratch('lastTap', now);
      }
    });

    // graphdata.current = cy.current.elements().remove();

    if (onReady) {
      cy.current.ready(() => {
        onReady(cy.current!);
        // Initial bounds check
        setTimeout(checkViewBounds, 100);
      });
    }
    // let coll = cy.current.collection(elements);
    // coll.add(elements);
    // cy.current.add(coll.ele);

    // graphdata.current.restore();
    // let layout = cy.current.elements().layout(defaultLayoutOptions);
    // layout.run();
  }, [graphdata, definitions, isEditing]);

  // handles interactivity changes based on isEditing
  useEffect(() => {
    console.log("isEditing in decisiontreegraph:", isEditing);
    if (cy.current) {
      console.log("Updating interactivity with isEditing:", isEditing);
      cy.current.boxSelectionEnabled(isEditing);
      cy.current.autounselectify(!isEditing);
      cy.current.autoungrabify(!isEditing);
    }
  }, [isEditing]);

  return (
    <div
      ref={cyRef}
      style={{ width: width || "100%", height: height || "100%", position: "relative" }}
    >
      {showResetButton && (
        <button
          onClick={resetView}
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            zIndex: 1000,
            padding: "8px 12px",
            backgroundColor: "#ff0d57",
            color: "#ffffff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: "bold",
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
          }}
          title="Double-click background or click here to reset view"
        >
          Reset View
        </button>
      )}
    </div>
  );
}
