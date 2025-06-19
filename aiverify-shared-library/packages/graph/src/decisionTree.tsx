// @ts-nocheck
import React, {
  useState,
  useRef,
  useEffect,
  Dispatch,
  SetStateAction,
  MutableRefObject,
} from "react";
import DecisionTreeGraph from "./decisionTreeGraph";
import { graphdataSchema, defintionSchema } from "./decisonTree.schema";

import Ajv from "ajv";
const ajv = new Ajv();
const validateGraphData = ajv.compile(graphdataSchema);
const validateDefinitions = ajv.compile(defintionSchema);

type OnChangeDataCallback = (key: string, value: any) => void;

const validateRequired = (data: any, names: string[]) => {
  for (let name of names) {
    if (!data[name] || data[name].length <= 0) return false;
  }
  return true;
};

function StepFinalResults({ data, onChangeData }) {
  return (
    <div>
      <h2
        style={{
          padding: "0 0 10px 0",
          margin: 0,
          width: "100%",
          textAlign: "center",
          borderBottom: "1px solid rgba(255,255,255,0.2)",
          color: "#ffffff",
        }}
      >
        Selected Metrics
      </h2>
      <ol
        style={{
          paddingRight: "10px",
          paddingLeft: "25px",
          marginTop: "10px",
          maxHeight: "300px",
          overflowY: "auto",
          color: "#ffffff",
        }}
      >
        {(data["metrics"] as any[])?.length > 0 ? (
          data["metrics"].map((metric) => (
            <li
              key={`metric-${metric}`}
              style={{
                marginBottom: "8px",
                lineHeight: "1.4",
                color: "#ffffff",
              }}
            >
              {metric}
            </li>
          ))
        ) : (
          <div
            style={{ textAlign: "center", color: "#cccccc", padding: "10px 0" }}
          >
            No metrics selected
          </div>
        )}
      </ol>
    </div>
  );
}

function StepOutcomeBranch({
  data,
  onChangeData,
  outcome,
  cy,
  setCanNext,
  metrics,
  setMetrics,
  isEditing,
}) {
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    if (!isEditing) {
      setCanNext(true); // Always allow navigation in view mode
      return;
    }

    const qn = cy.current.setOutcome(outcome);

    // Reconstruct the full path of questions based on existing selections
    const allQuestions = [qn];
    if (data.selections) {
      let currentQuestion = qn;
      while (currentQuestion) {
        const selectedChoice = currentQuestion
          .getChoices()
          .find((choice) => data.selections.edges.includes(choice.id()));
        if (selectedChoice) {
          const nextQuestion = selectedChoice.choose();
          if (nextQuestion && nextQuestion.data("type") === "question") {
            allQuestions.push(nextQuestion);
            currentQuestion = nextQuestion;
          } else {
            break;
          }
        } else {
          break;
        }
      }
    }
    setQuestions(allQuestions);

    // In edit mode, check if all questions have a selected choice
    const validateQuestions = () => {
      // If no questions, validation passes (though this shouldn't happen)
      if (allQuestions.length === 0) return true;

      // For each question, check if there's a selected choice
      for (const question of allQuestions) {
        const hasSelectedChoice = question
          .getChoices()
          .some((choice) => data.selections?.edges.includes(choice.id()));

        if (!hasSelectedChoice) {
          return false;
        }
      }
      return true;
    };

    setCanNext(validateQuestions());
  }, [outcome, data.selections, isEditing]);

  const handleChoice = (choice) => {
    if (!isEditing) return;

    // Remove the current edge from selections to ensure clean state
    const currentSelections = data.selections || { nodes: [], edges: [] };
    const sourceId = choice.source().id();

    // Filter out any existing edges from the same source node
    // This ensures we're replacing the previous choice from this question
    const filteredEdges = currentSelections.edges.filter((edgeId) => {
      const edge = cy.current.$id(edgeId);
      return edge.source().id() !== sourceId;
    });

    // Create new selections with the filtered edges plus the new choice
    const newSelections = {
      nodes: [...currentSelections.nodes],
      edges: [...filteredEdges, choice.id()],
    };

    // Apply the new selections
    onChangeData("selections", newSelections);

    // Reset graph visual state
    cy.current.nodes().removeClass("highlight");
    cy.current.edges().removeClass("edge-selected");

    // Re-apply selected outcome highlighting
    outcome.addClass("highlight");

    // Choose the new selection and update the visual path
    const nextqn = choice.choose();
    if (!nextqn) return;

    // Update nodes that should be highlighted based on the selection path
    const updatedNodes = [outcome.id()];
    // Include any nodes along the path to the current question
    questions.forEach((q) => updatedNodes.push(q.id()));
    // Add the newly chosen node
    updatedNodes.push(nextqn.id());

    // Create a new selections object with the updated node list
    const completeSelections = {
      nodes: updatedNodes,
      edges: newSelections.edges,
    };

    // Update the data with complete selections
    onChangeData("selections", completeSelections);

    let type = nextqn.data("type");
    if (type !== "question") {
      let mymetrics = [];
      if (type === "metric") {
        mymetrics = [nextqn.data("text")];
      } else {
        mymetrics = [
          nextqn.data("text_positive"),
          nextqn.data("text_negative"),
        ];
      }
      console.log("handleChoice - metrics:", mymetrics);
      // Always update metrics when a choice is made
      setMetrics(mymetrics);
      setCanNext(true); // Enable next if a final choice is made
      return;
    }

    let qn = choice.source();
    let qns = [...questions];
    let idx = qns.findIndex((e) => e.id() === qn.id());
    qns.splice(idx + 1);
    qns.push(nextqn);
    setQuestions(qns);

    // Check if we need to disable the Next button because a new question was added
    if (isEditing) {
      setCanNext(false);
    }
  };

  return (
    <div>
      <h2 style={{ padding: 0, margin: 0 }}>{outcome.data("text")}</h2>
      {questions.map((question) => (
        <div key={`question-${question.id()}`}>
          <h4 style={{ padding: 0, margin: 0, marginTop: "5px" }}>
            {question.data("text")}
          </h4>
          <div>
            {question.getChoices().map((choice) => (
              <div key={`choice-${choice.id()}`}>
                <input
                  type="radio"
                  id={`choice-${choice.id()}`}
                  name={`question-${question.id()}`}
                  value={`choice-${choice.id()}`}
                  checked={data.selections?.edges.includes(choice.id())}
                  onChange={() => handleChoice(choice)}
                  disabled={!isEditing}
                />
                &nbsp;
                <label htmlFor={`choice-${choice.id()}`}>
                  {choice.data("text")}
                </label>
              </div>
            ))}
          </div>
          {question.data("qn").map((qn, idx) => (
            <div key={`qn-${qn}-${idx}`}>{qn}</div>
          ))}
          <textarea
            rows="4"
            className="aiv-textarea"
            style={{ width: "100%", resize: "none" }}
            maxLength={128}
            value={data[`ans-${question.id()}`]}
            onChange={(e) =>
              onChangeData(`ans-${question.id()}`, e.target.value)
            }
            disabled={!isEditing}
          />
        </div>
      ))}
    </div>
  );
}

function Step1({
  data,
  onChangeData,
  outcomes,
  cy,
  selectedOutcomes,
  setSelectedOutcomes,
  setCanNext,
  isEditing,
}) {
  useEffect(() => {
    if (!isEditing) {
      setCanNext(true); // Always allow navigation in view mode
      return;
    }

    // In edit mode, check if at least one outcome is selected
    setCanNext(selectedOutcomes.length > 0);
  }, [isEditing, selectedOutcomes]);

  const handleOutcomeChange = (id) => {
    if (!isEditing) return;

    let idx = selectedOutcomes.findIndex((e) => e === id);
    let newValue = [...selectedOutcomes];
    let newSelections = { ...data.selections };

    if (idx >= 0) {
      // Outcome is being deselected
      newValue.splice(idx, 1);
      cy.current.chooseOutcome(id, false);

      // Remove all dependent nodes and edges
      const nodesToRemove = new Set([id]);
      const edgesToRemove = new Set();

      // Traverse and collect nodes & edges to remove
      const traverseRemove = (nodeId) => {
        cy.current
          .$id(nodeId)
          .outgoers()
          .forEach((el) => {
            if (el.isEdge()) {
              edgesToRemove.add(el.id());
            } else if (el.isNode()) {
              nodesToRemove.add(el.id());
              traverseRemove(el.id()); // Recursively remove dependent nodes
            }
          });
      };
      traverseRemove(id);

      // Filter out removed nodes & edges
      newSelections.nodes = newSelections.nodes.filter(
        (node) => !nodesToRemove.has(node)
      );
      newSelections.edges = newSelections.edges.filter(
        (edge) => !edgesToRemove.has(edge)
      );
    } else {
      // Outcome is being selected
      newValue.push(id);
      cy.current.chooseOutcome(id, true);
    }

    newValue.sort();
    onChangeData("selectedOutcomes", newValue);
    onChangeData("selections", newSelections);
    setSelectedOutcomes(newValue);

    // Update canNext based on whether at least one outcome is selected
    setCanNext(newValue.length > 0);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <h2 style={{ padding: 0, margin: 0 }}>
        What do you consider to be fair?
      </h2>
      <div>Please select the desired outcomes.</div>
      {outcomes &&
        outcomes.jsons().map((node) => (
          <div key={`ans-${node.data.id}`}>
            <h4 style={{ padding: 0, margin: 0, marginTop: "10px" }}>
              <input
                type="checkbox"
                id={`outcome-select-${node.data.id}`}
                style={{ marginRight: "5px" }}
                checked={selectedOutcomes.includes(node.data.id)}
                onChange={() => handleOutcomeChange(node.data.id)}
                disabled={!isEditing}
              />
              {node.data.text}
            </h4>
            {selectedOutcomes.includes(node.data.id) && (
              <>
                <ol
                  style={{
                    listStyleType: "lower-alpha",
                    paddingLeft: "20px",
                    margin: 0,
                  }}
                >
                  {node.data.qn.map((qn, idx) => (
                    <li key={`qn-${node.data.id}-${idx}`}>{qn}</li>
                  ))}
                </ol>
                <textarea
                  rows="4"
                  className="aiv-textarea"
                  style={{ width: "100%", resize: "none" }}
                  maxLength={128}
                  value={data[`ans-${node.data.id}`]}
                  onChange={(e) =>
                    onChangeData(`ans-${node.data.id}`, e.target.value)
                  }
                  disabled={!isEditing}
                />
              </>
            )}
          </div>
        ))}
    </div>
  );
}

function Step0({ data, definitions, onChangeData, setCanNext, isEditing }) {
  useEffect(() => {
    if (!isEditing) {
      setCanNext(true);
      return; // Always allow navigation in view mode
    }

    // In edit mode, validate required fields
    const validateFields = () => {
      if (!definitions || definitions.length === 0) return true;

      // Check if all definition fields are filled
      for (const def of definitions) {
        if (!data[def.key] || data[def.key].trim() === "") {
          return false;
        }
      }
      return true;
    };

    setCanNext(validateFields());
  }, [isEditing, definitions, data]);

  // Add onChange handler to update canNext when definitions change
  const handleInputChange = (key, value) => {
    onChangeData(key, value);

    // Only validate in edit mode
    if (isEditing && definitions) {
      // Check if all fields are filled
      const allFilled = definitions.every(
        (def) =>
          data[def.key] !== undefined &&
          data[def.key] !== null &&
          data[def.key].trim() !== ""
      );

      setCanNext(allFilled);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <h2 style={{ margin: 0, padding: 0 }}>Definitions</h2>
      <div>
        The following definitions will be used to contextualise the fairness
        tree to the use case.
      </div>
      {definitions &&
        definitions.map((item) => (
          <React.Fragment key={`definition-${item.key}`}>
            <label
              htmlFor={item.key}
              style={{ marginTop: "10px", fontWeight: 600 }}
            >
              {item.name}*
            </label>
            <small>{item.description}</small>
            <input
              type="text"
              id={item.key}
              className="aiv-input"
              style={{ marginTop: "5px" }}
              value={data[item.key] || ""}
              onChange={(e) => handleInputChange(item.key, e.target.value)}
              disabled={!isEditing}
              required
            />
          </React.Fragment>
        ))}
    </div>
  );
}

export type DecisionTreeProps = {
  graphdata: any;
  definitions?: any[];
  data: any;
  onChangeData: (key: string, value: any) => void;
  width?: string;
  height?: string;
};

export default function DecisionTree({
  graphdata,
  definitions,
  data,
  onChangeData,
  width,
  height,
  isEditing = false,
}: DecisionTreeProps) {
  const cy = useRef<cytoscape.Core | null>(null);
  // Initialize to step 99 (final tree) if data exists and not in edit mode
  const [step, setStep] = useState(
    isEditing ? 0 : data["metrics"]?.length > 0 ? 99 : 0
  );
  const [canNext, setCanNext] = useState<boolean>(!isEditing);
  const [outcomes, setOutcomes] = useState(null);
  const [selectedOutcomes, setSelectedOutcomes] = useState(
    data["selectedOutcomes"] || []
  );
  const [metrics, setMetrics] = useState<any>(data["metrics"] || null);

  const resetGraphView = () => {
    if (cy.current) {
      cy.current.fit(cy.current.nodes(), 20);
      cy.current.center();
    }
  };

  const onReady = (cyobj) => {
    cy.current = cyobj;
    let coll = cy.current.outcomes();
    // Apply selections from data
    if (data["selections"]) {
      for (let id of data["selections"].nodes) {
        cyobj.$id(id).addClass("highlight");
      }
      for (let id of data["selections"].edges) {
        cyobj.$id(id).addClass("edge-selected");
      }
      // Also highlight the outcome nodes
      for (let outcome of selectedOutcomes) {
        coll.$id(outcome).addClass("highlight");
      }
    }
    setOutcomes(coll);
    cyobj.fit(cyobj.nodes(), "10px");
  };

  /* const onReady2 = (cyobj) => {
    if (data["selections"]) {
      for (let id of data["selections"].nodes) {
        cyobj.$id(id).addClass("highlight");
      }
      for (let id of data["selections"].edges) {
        cyobj.$id(id).addClass("edge-selected");
      }
    }
    cyobj.fit(cyobj.nodes(), "10px");
  }; */

  useEffect(() => {
    console.log("step:", step, "metrics:", metrics);
    if (step == 99 && metrics) {
      const currValue = (data["metrics"] || []).join(",");
      const newValue = Object.values(metrics).flat();
      onChangeData("selections", cy.current.getSelections());
      if (currValue != newValue.join(",")) {
        onChangeData("metrics", newValue);
      }
    }
  }, [step, metrics]);

  // Add a new effect to track metrics changes during editing
  useEffect(() => {
    if (isEditing && metrics && metrics.length > 0) {
      console.log("Updating metrics during editing:", metrics);
      onChangeData(
        "metrics",
        Array.isArray(metrics) ? metrics : Object.values(metrics).flat()
      );
    }
  }, [metrics, isEditing]);

  const onNext = () => {
    if (step >= selectedOutcomes.length + 1) {
      setStep(99);
    } else {
      setStep(step + 1);
    }
  };

  const onPrev = () => {
    if (step <= 0) return;
    if (step == 99) {
      setStep(selectedOutcomes.length + 1);
    } else {
      setStep(step - 1);
    }
  };

  if (!validateGraphData(graphdata)) {
    return <div>Invalid Graph Data</div>;
  }

  if (definitions && !validateDefinitions(definitions)) {
    return <div>Invalid Definitions</div>;
  }

  return (
    <div
      style={{
        width: width || "100%",
        height: height || "100%",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {step == 99 ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            width: "100%",
            marginTop: "10px",
          }}
        >
          <div>
            <button
              className="aiv-button"
              style={{ padding: 10, border: 0, marginRight: 2 }}
              onClick={() => setStep(0)}
            >
              View Inputs
            </button>
          </div>
          <div style={{ flexGrow: 1, width: "100%" }}>
            <DecisionTreeGraph
              graphdata={graphdata}
              definitions={data}
              onReady={onReady}
              isEditing={isEditing}
            />
          </div>
          <div
            style={{
              position: "absolute",
              right: "20px",
              top: "60px",
              width: "300px",
              minHeight: "100px",
              maxHeight: "400px",
              zIndex: 100,
              boxShadow: "0 2px 10px rgba(0, 0, 0, 0.2)",
              borderRadius: "4px",
              overflow: "hidden",
            }}
          >
            <div
              className="aiv-card"
              style={{
                height: "100%",
                padding: "15px",
                backgroundColor: "#3d3a40",
                color: "#ffffff",
                border: "1px solid rgba(0,0,0,0.125)",
              }}
            >
              <StepFinalResults data={data} onChangeData={onChangeData} />
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            height: "100%",
            width: "100%",
          }}
        >
          <div
            style={{ width: "500px", display: "flex", flexDirection: "column" }}
          >
            <div className="mb-2 flex gap-2">
              <button
                className="aiv-button"
                style={{ padding: 10, border: 0, marginRight: 2 }}
                onClick={onPrev}
                disabled={step <= 0}
              >
                Prev
              </button>
              <button
                className="aiv-button"
                style={{ padding: 10, border: 0 }}
                onClick={onNext}
                disabled={!canNext}
              >
                Next
              </button>
            </div>
            <div
              style={{
                flexGrow: 1,
                overflowY: "auto",
                overflowX: "hidden",
                padding: "10px",
                backgroundColor: "#3d3a40",
              }}
            >
              {step == 0 && (
                <Step0
                  data={data}
                  definitions={definitions}
                  onChangeData={onChangeData}
                  setCanNext={setCanNext}
                  isEditing={isEditing}
                />
              )}
              {step == 1 && outcomes && (
                <Step1
                  data={data}
                  onChangeData={onChangeData}
                  outcomes={outcomes}
                  cy={cy}
                  selectedOutcomes={selectedOutcomes}
                  setSelectedOutcomes={setSelectedOutcomes}
                  setCanNext={setCanNext}
                  isEditing={isEditing}
                />
              )}
              {step > 1 && step <= selectedOutcomes.length + 1 && (
                <StepOutcomeBranch
                  data={data}
                  onChangeData={onChangeData}
                  outcome={outcomes.$id(selectedOutcomes[step - 2])}
                  cy={cy}
                  setCanNext={setCanNext}
                  metrics={metrics}
                  setMetrics={setMetrics}
                  isEditing={isEditing}
                />
              )}
            </div>
          </div>
          <div
            style={{
              flexGrow: 1,
              height: "100%",
              display: step < 1 ? "none" : "block",
              padding: "10px",
            }}
          >
            {step > 0 && (
              <DecisionTreeGraph
                graphdata={graphdata}
                definitions={data}
                onReady={onReady}
                isEditing={isEditing}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
