import { getTotal } from "../inputs/processChecklistSummary";
import { config as genericConfig } from "../inputs/config_generic";
import { config as fairnessConfig } from "../inputs/config_fairness";
import { config as ethicsAccountabilityConfig } from "../inputs/config_ethics_and_accountability";
import { config as transparencyConfig } from "../inputs/config_transparency";

export const processChecklistCids = [
  "generic_process_checklist",
  "fairness_process_checklist",
  "ethics_and_accountability_process_checklist",
  "transparency_process_checklist",
];

export const processChecklistConfigs = {
  [processChecklistCids[0]]: genericConfig,
  [processChecklistCids[1]]: fairnessConfig,
  [processChecklistCids[2]]: ethicsAccountabilityConfig,
  [processChecklistCids[3]]: transparencyConfig,
};

export const processChecklistConfigsByPrinciple = processChecklistCids.reduce(
  (acc, cid, index) => {
    const config = processChecklistConfigs[cid] as any;
    // console.log("config", cid, config)
    config.index = index;
    config.cid = cid;
    let count = 0;
    for (const section of config.sections) {
      for (const check of section.checklist) {
        check.index = count++;
      }
    }
    acc[config.principle] = config;
    return acc;
  },
  {}
);

export const responseOptions = ["Yes", "No", "Not Applicable"];

const _totalQuestions = Object.values(processChecklistConfigs).reduce(
  (acc, config) => {
    acc[config.principle] = getTotal(config);
    return acc;
  },
  {}
);

// console.log("_totalQuestions", _totalQuestions)

export interface ProcessChecklistStatistics {
  totalQuestions: number;
  numCompleted: number;
  numYes: number;
  numNo: number;
  numNotApplicable: number;
}

export function getTotalQuestions(principle): number | undefined {
  return _totalQuestions[principle];
}

export function getPrincipleCompletionStatistics(
  config,
  data
): ProcessChecklistStatistics {
  // let totalQuestions = principle.processes.length;
  const totalQuestions = _totalQuestions[config.principle];
  let numYes = 0;
  let numNo = 0;
  let numNotApplicable = 0;
  let numCompleted = 0;
  // let numEmpty = totalQuestions - principle.processes.length;
  for (const key of Object.keys(data)) {
    if (!key.startsWith("completed-")) continue;
    numCompleted++;
    const value = data[key];
    switch (value) {
      case "Yes":
        numYes++;
        break;
      case "No":
        numNo++;
        break;
      case "Not Applicable":
        numNotApplicable++;
        break;
    }
  }
  return {
    totalQuestions,
    numCompleted,
    numYes,
    numNo,
    numNotApplicable,
  };
}

export function getCompletionStatistics(getIBData) {
  const totals: ProcessChecklistStatistics = {
    totalQuestions: 0,
    numCompleted: 0,
    numYes: 0,
    numNo: 0,
    numNotApplicable: 0,
  };

  const stats = {};

  for (const cid of processChecklistCids) {
    const config = processChecklistConfigs[cid];
    const data = getIBData(cid) || {};
    const substats = getPrincipleCompletionStatistics(config, data);
    totals.totalQuestions += substats.totalQuestions;
    totals.numCompleted += substats.numCompleted;
    totals.numYes += substats.numYes;
    totals.numNo += substats.numNo;
    totals.numNotApplicable += substats.numNotApplicable;
    // stats[principle.principle.value as string] = substats;
    stats[cid] = substats;
  }
  stats["totals"] = totals;

  return stats;
}

export function getNotImplementedTestableCriteria(config, data) {
  const tc = [];
  for (const section of config.sections) {
    for (const check of section.checklist) {
      for (const ps of check.processes) {
        const key = `completed-${ps.pid}`;
        if (!data[key] || data[key] !== "Yes") {
          tc.push(check.testableCriteria);
          break;
        }
      }
    }
  }
  return tc;
}
