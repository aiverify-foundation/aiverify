import JSZip from 'jszip';

const gid = `aiverify.stock.process_checklist`;

export async function fetchConfigFiles(): Promise<Record<string, any>> {
  try {
    // Step 1: Fetch the ZIP file from the API
    const response = await fetch(`/api/plugins/${gid}/input_blocks`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch config files');
    }

    // Step 2: Get the response as an ArrayBuffer
    const arrayBuffer = await response.arrayBuffer();

    // Step 3: Load the ZIP file using JSZip
    const zip = await JSZip.loadAsync(arrayBuffer);

    // Step 4: Extract the config files from the ZIP
    const configFiles: Record<string, any> = {};
    const configFileNames = [
      'config_transparency',
      'config_explainability',
      'config_reproducibility',
      'config_safety',
      'config_security',
      'config_robustness',
      'config_fairness',
      'config_data_governance',
      'config_accountability',
      'config_human_agency_oversight',
      'config_inclusive_growth_soc_env',
      'config_organisational_considerations',
    ];

    for (const fileName of configFileNames) {
      const file = zip.file(`${fileName}.ts`);
      if (file) {
        const content = await file.async('string');

        // Step 5: Parse the content as a JavaScript module
        const config = await parseConfigModule(content);
        if (config) {
          configFiles[fileName] = config;
        }
      }
    }

    return configFiles;
  } catch (error) {
    console.error('Error fetching config files:', error);
    return {};
  }
}

// Helper function to parse the config file content as a module
async function parseConfigModule(content: string): Promise<any> {
  try {
    const blob = new Blob([content], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const module = await import(/* webpackIgnore: true */ url);
    URL.revokeObjectURL(url);

    // Validate that the module exports a `config` object
    if (module && typeof module.config === 'object' && module.config !== null) {
      return module.config;
    } else {
      console.error(
        'Invalid config file: `config` object is missing or invalid'
      );
      return null;
    }
  } catch (error) {
    console.error('Error parsing config file:', error);
    return null;
  }
}
