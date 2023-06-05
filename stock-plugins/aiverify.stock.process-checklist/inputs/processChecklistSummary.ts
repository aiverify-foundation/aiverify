export const getTotal = (config) => {
  let total = 0;
  for (let section of config.sections) {
    for (let check of section.checklist) {
      total += check.processes.length;
    }
  }
  return total;
}

export const getCompleted = (data) => {
  return Object.keys(data)
    .filter(k=>k.startsWith("completed-"))
    .reduce((acc,key) => {
      if (data[key] && data[key].length > 0)
       acc++;
      return acc;
    }, 0);
}