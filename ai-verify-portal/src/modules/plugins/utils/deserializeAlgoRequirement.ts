import { AlgoDependency } from '../pluginDetails';

// 👇 This needs more work (PEPS requirements.txt dependency can be defined in various patterns)
export function deserializeAlgoRequirement(
  algoReq: string
): AlgoDependency | undefined {
  const regx = /([a-zA-Z0-9-_.@]*)([=><]{1,2})(\d*.\d*.\d*)/;
  const matches = algoReq.trim().match(regx);
  if (matches && matches.length > 0) {
    return [matches[1], matches[2], matches[3]];
  }
  console.error(`Error deserializing ${algoReq}`);
  return;
}

export function extractRequirementString(algoReq: string): string {
  const parts = algoReq.split(';');
  return parts[0].trim();
}
