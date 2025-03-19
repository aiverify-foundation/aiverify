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
      <h2 style={{ padding: 0, margin: 0, width: "100%", textAlign: "center" }}>
        Selected Metrics
      </h2>
      <ol style={{ paddingRight: "10px" }}>
        {(data["metrics"] as any[]).map((metric) => (
          <li key={`metric-${metric}`}>{metric}</li>
        ))}
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
    setCanNext(true);
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
  }, [outcome, data.selections]);

  const handleChoice = (choice) => {
    if (!isEditing) return;

    const nextqn = choice.choose();
    if (!nextqn) return;

    // Update selections in the data
    const selections = data.selections || { nodes: [], edges: [] };
    const newSelections = {
      nodes: [...selections.nodes],
      edges: [...selections.edges, choice.id()],
    };
    onChangeData("selections", newSelections);

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
      setMetrics(mymetrics);
      return;
    }

    let qn = choice.source();
    let qns = [...questions];
    let idx = qns.findIndex((e) => e.id() === qn.id());
    qns.splice(idx + 1);
    qns.push(nextqn);
    setQuestions(qns);
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
    setCanNext(true); // Always allow navigation in view mode
  }, []);

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
    setCanNext(true); // Always allow navigation in view mode
  }, []);

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
              value={data[item.key]}
              onChange={(e) => onChangeData(item.key, e.target.value)}
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
  // Initialize to step 99 (final tree) if data exists
  // const [step, setStep] = useState(data["metrics"]?.length > 0 ? 99 : 0);
  const [step, setStep] = useState(
    isEditing ? 0 : data["metrics"]?.length > 0 ? 99 : 0
  );
  const [canNext, setCanNext] = useState<boolean>(true);
  const [outcomes, setOutcomes] = useState(null);
  const [selectedOutcomes, setSelectedOutcomes] = useState(
    data["selectedOutcomes"] || []
  );
  const [metrics, setMetrics] = useState<any>(data["metrics"] || null);

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
        height: height || "calc(100vh - 300px)",
        position: "relative",
        padding: "10px",
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
              Go back to Step 0
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
          <div style={{ height: "150px", display: "flex" }}>
            <div
              className="aiv-card"
              style={{ marginRight: "10px", textAlign: "left" }}
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
            marginTop: "10px",
          }}
        >
          <div
            style={{ width: "500px", display: "flex", flexDirection: "column" }}
          >
            <div>
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