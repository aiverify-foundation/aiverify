// @ts-nocheck
import React, { useState, useRef, useEffect, Dispatch, SetStateAction, MutableRefObject } from 'react';
import DecisionTreeGraph from './decisionTreeGraph';
import { graphdataSchema, defintionSchema } from './decisonTree.schema';

import Ajv from "ajv"
const ajv = new Ajv()
const validateGraphData = ajv.compile(graphdataSchema)
const validateDefinitions = ajv.compile(defintionSchema)


type OnChangeDataCallback = (key: string, value: any) => void;

const validateRequired = (data: any, names: string[]) => {
  for (let name of names) {
    if (!data[name] || data[name].length <= 0)
      return false;
  }
  return true;
}

function StepFinalResults ({ data, onChangeData }) {
  return (
    <div>
      <h2 style={{ padding:0, margin:0, width:"100%", textAlign:"center" }}>Selected Metrics</h2>
      <ol style={{ paddingRight:"10px" }}>
        {(data["metrics"] as any[]).map(metric => (
          <li key={`metric-${metric}`}>{metric}</li>
        ))}
      </ol>
    </div>
  )
}

function StepOutcomeBranch ({ data, onChangeData, outcome, cy, setCanNext, metrics, setMetrics }) {
  const [ questions, setQuestions ] = useState([]);

  useEffect(() => {
    setCanNext(false);
    setMetrics((prevState: any) => {
      return {
        ...prevState,
        [outcome.id()]: [],
      }
    })
    metrics[outcome.id()] = [];
    const qn = cy.current.setOutcome(outcome)
    setQuestions([qn]);
  }, [outcome, cy])

  const handleChoice = (choice) => {
    const nextqn = choice.choose() as cytoscape.NodeSingular|null;
    if (!nextqn)
      return;
    let type = nextqn.data("type")
    if (type !== "question") {
      let mymetrics = [];
      if (type === "metric") {
        mymetrics = [nextqn.data("text")]
      } else {
        mymetrics = [nextqn.data("text_positive"), nextqn.data("text_negative")]        
      }
      setMetrics(prevState => {
        return {
          ...prevState,
          [outcome.id()]: mymetrics,
        }
      });
      setCanNext(true);
      return;
    }
    setCanNext(false);
    let qn = choice.source();
    let qns = [...questions]
    let idx = qns.findIndex( e => e.id() === qn.id());
    qns.splice(idx+1);
    qns.push(nextqn);
    setQuestions(qns);
  }

  return (
    <div>
      <h2 style={{ padding:0, margin:0 }}>{outcome.data("text")}</h2>
      {questions.map(question => (
        <div key={`question-${question.id()}`}>
          <h4 style={{ padding:0, margin:0, marginTop:"5px" }}>{question.data("text")}</h4>
          <div>{question.getChoices().map( choice => (
            <div key={`choice-${choice.id()}`}>
              <input type="radio" id={`choice-${choice.id()}`} name={`question-${question.id()}`} value={`choice-${choice.id()}`} onClick={event => handleChoice(choice)} />&nbsp;
              <label htmlFor={`choice-${choice.id()}`}>{choice.data("text")}</label>
            </div>
          ))}</div>
          {question.data("qn").map(qn => (
            <div>{qn}</div>
          ))}
          <textarea rows="4" class="aiv-textarea" style={{ width:"100%", resize:"none" }} maxlength={128} value={data[`ans-${question.id()}`]} onChange={(e)=>onChangeData(`ans-${question.id()}`,e.target.value)} />
        </div>
      ))}
    </div>
  )
}

function Step1 ({ data, onChangeData, cy, outcomes, selectedOutcomes, setSelectedOutcomes, setCanNext }) {
  const validate = () => {
    return validateRequired(data, ["selectedOutcomes"])
  }
  useEffect(() => {
    onChangeData("metrics", []); // remove old selections
    onChangeData("selections", undefined); // remove old selections
    cy.current.resetGraph();
    setCanNext(validate());
  },[])
  const handleOutcomeChange = (id) => {
    let idx = selectedOutcomes.findIndex(e => e === id);
    let newValue = [...selectedOutcomes];
    if (idx >= 0) {
      newValue.splice(idx, 1)
      cy.current.chooseOutcome(id, false);
    } else {
      newValue.push(id);
      cy.current.chooseOutcome(id, true);
    }
    newValue.sort();
    onChangeData('selectedOutcomes', newValue);
    setSelectedOutcomes(newValue);
    setCanNext(validate())
  }
  return (
    <div style={{ display:"flex", flexDirection:"column" }}>
      <h2 style={{ padding:0, margin:0 }}>What do you consider to be fair?</h2>
      <div>Please select the desired outcomes.</div>
      {outcomes && outcomes.jsons().map(node => (
        <div key={`ans-${node.data.id}`}>
          <h4 style={{ padding:0, margin:0, marginTop:"10px" }}>
            <input type="checkbox" id={`outcome-select-${node.data.id}`}
              style={{ marginRight:'5px' }}
              defaultChecked={selectedOutcomes.includes(node.data.id)}
              onChange={() => handleOutcomeChange(node.data.id)}
            />
            {node.data.text}
          </h4>
          {selectedOutcomes.includes(node.data.id) && (
            <>
              <ol style={{ listStyleType:"lower-alpha", paddingLeft:"20px", margin:0 }}>
                {node.data.qn.map( (qn,idx) => (
                  <li key={`qn-${node.data.id}-${idx}`}>{qn}</li>
                ))}
              </ol>
              <textarea rows="4" class="aiv-textarea" style={{ width:"100%", resize:"none" }} maxlength={128} value={data[`ans-${node.data.id}`]} onChange={(e)=>onChangeData(`ans-${node.data.id}`,e.target.value)} />
            </>
          )}
        </div>
      ))}
    </div>
  )
}

function Step0 ({ data, definitions, onChangeData, setCanNext }) {
  const validate = () => {
    return validateRequired(data, definitions.map(def => def.key));
  }
  useEffect(() => {
    setCanNext(validate())
  }, [])
  const myChangeData = (key, value) => {
    onChangeData(key, value);
    setCanNext(validate())
  }
  return (
    <div style={{ display:"flex", flexDirection:"column" }}>
      <h2 style={{ margin:0, padding:0 }}>Definitions</h2>
      <div>The following definitions will be used to contextualise the fairness tree to the use case.</div>
      {definitions && definitions.map(item => (
        <React.Fragment key={`definition-${item.key}`}>
          <label htmlFor={item.key} style={{ marginTop:"10px", fontWeight:600 }}>{item.name}*</label>
          <small>{item.description}</small>
          <input type="text" id={item.key} class="aiv-input" style={{ marginTop:"5px" }} value={data[item.key]} onChange={(e)=>myChangeData(item.key,e.target.value)} required />
        </React.Fragment>
      ))}
    </div>
  )
}


export type DecisionTreeProps = {
  graphdata: any;
  definitions?: any[];
  data: any;
  onChangeData: (key: string, value: any) => void;
  width?: string;
  height?: string;
}

export default function DecisionTree({ graphdata, definitions, data, onChangeData, width, height }: DecisionTreeProps) {
  const cy = useRef<cytoscape.Core|null>(null);
  const [ step, setStep ] = useState((data["metrics"] && data["metrics"].length > 0)?99:0);
  const [ canNext, setCanNext ] = useState<boolean>(false);
  const [ outcomes, setOutcomes ] = useState(null);
  const [ selectedOutcomes, setSelectedOutcomes ] = useState(data['selectedOutcomes'] || []);
  const [ metrics, setMetrics ] = useState<any>(null);

  const onReady = (cyobj) => {
    cy.current = cyobj;
    let coll = cy.current.outcomes()
    for (let outcome of selectedOutcomes) {
      coll.$id(outcome).addClass("highlight");
    }
    setOutcomes(coll)
    cy.current.fit(cy.current.nodes(), "10px")
  }

  const onReady2 = (cyobj) => {
    if (data["selections"]) {
      for (let id of data["selections"].nodes) {
        cyobj.$id(id).addClass("highlight");
      }
      for (let id of data["selections"].edges) {
        cyobj.$id(id).addClass("edge-selected");
      }
    }
    cyobj.fit(cyobj.nodes(), "10px")  
  }

  useEffect(() => {
    if (step == 99 && metrics) {
      const currValue = (data["metrics"] || []).join(",");
      const newValue = Object.values(metrics).flat();
      onChangeData("selections", cy.current.getSelections())
      if (currValue != newValue.join(",")) {
        onChangeData("metrics", newValue);
      }
    }
  }, [step, metrics])

  const onNext = () => {
    if (step == 0) {
    } else if (step == 1) {
      setMetrics({});
    }
    if (step == selectedOutcomes.length+1) { // last qn
      setStep(99); // go to last step
    } else {
      setStep(step+1);
    }
  }

  const onPrev = () => {
    if (step <= 0)
      return;
    if (step == 99) {
      setStep(1);
    } else {
      setStep(step-1);
    }
  }

  if (!validateGraphData(graphdata)) {
    return <div>Invalid Graph Data</div>;
  }

  if (definitions && !validateDefinitions(definitions)) {
    return <div>Invalid Definitions</div>
  }

  return (
    <div style={{ width:width||"100%", height:height||"calc(100vh - 100px)", position:"relative", padding:"10px", overflow:"hidden" }}>
      {step == 99?(
        <div style={{ display:"flex", flexDirection:"column", height:"100%", width:"100%" }}>
          <div style={{ flexGrow:1, width:"100%" }}>
            <DecisionTreeGraph graphdata={graphdata} definitions={data} onReady={onReady2} />
          </div>
          <div style={{ height:"200px", display:"flex" }}>
            <div class="aiv-card" style={{ marginRight:"10px", textAlign:"left" }}>
              <StepFinalResults data={data} onChangeData={onChangeData} />
            </div>
            <div class="aiv-card c-secondary" style={{ width:"400px", display:"flex", flexDirection:"column", padding:"10px", alignItems:"center" }}>
              <h4 style={{ padding:0, margin:0 }}>Do you want to reset the metric selections?</h4>
              <div class="c-warning" style={{ textAlign:"center" }}>Warning: Clicking below button will clear all metrics selection.</div>
              <div style={{ display:"block", marginTop:"5px" }}>
                <button class="aiv-button c-warning" onClick={onPrev} >Reset Graph</button>
              </div>
            </div>
          </div>
        </div>
      ):(
        <div style={{ display:"flex", height:"100%", width:"100%" }}>
          <div style={{ width:"500px", display:'flex', flexDirection:'column' }}>
            <div>
              <button class='aiv-button' style={{ padding:10, border:0, marginRight:2 }} onClick={onPrev} disabled={(step<=0)}>Prev</button>
              <button class='aiv-button' style={{ padding:10, border:0 }} onClick={onNext} disabled={!canNext}>Next</button>
            </div>
            <div style={{ flexGrow:1, overflowY: 'auto', overflowX: 'hidden', padding:'10px', marginTop:"10px", backgroundColor:"#F3F0F5" }}>
              {step == 0 && (
                <Step0 data={data} definitions={definitions} onChangeData={onChangeData} setCanNext={setCanNext} />
              )}
              {step == 1 && outcomes && (
                <Step1 data={data} onChangeData={onChangeData} outcomes={outcomes} cy={cy} selectedOutcomes={selectedOutcomes} setSelectedOutcomes={setSelectedOutcomes} setCanNext={setCanNext} />
              )}
              {step > 1 && step <= selectedOutcomes.length+1 && (
                <StepOutcomeBranch data={data} onChangeData={onChangeData} outcome={outcomes.$id(selectedOutcomes[step-2])} cy={cy} setCanNext={setCanNext} metrics={metrics} setMetrics={setMetrics} />
              )}
            </div>
          </div>
          <div style={{ flexGrow:1, height:"100%", display:(step<1)?"none":"block", padding:"10px" }}>
            {(step > 0) && <DecisionTreeGraph graphdata={graphdata} definitions={data} onReady={onReady} />}
          </div>
        </div>
      )}
    </div>
  )
}