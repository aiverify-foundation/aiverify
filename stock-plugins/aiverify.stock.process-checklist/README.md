# AI Verify Process Checklist

## Description

Process checklist for AI Verify framework

## Plugin Content

| Name                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Description                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| Overview                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Overview of AI Verify testing framework                     |
| Principle Summary Header                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Summary header to be displayed before the principle summary |
| Overall Summary                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Summary of all the processs checklists responses            |
| Area Descriptions                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | List the framework areas and provide descriptions           |
| Area Header                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Header and description for each framework area              |
| <ul><li>Summary - Accountability</li><li>Summary - Data Governance</li><li>Summary - Explainability</li><li>Summary - Fairness</li><li>Summary - Human Agency & Oversight</li><li>Summary - Inclusive Growth, Societal & Environmental Well-Being</li><li>Summary - Reproducibility</li><li>Summary - Robustness</li><li>Summary - Safety</li><li>Summary - Security</li><li>Summary - Transparency</li></ul>                                                                              | Summary of the process checklist for each of the principles |
| <ul><li>User Responses - Accountability</li><li>User Responses - Data Governance</li><li>User Responses - Explainability</li><li>User Responses - Fairness</li><li>User Responses - Human Agency & Oversight</li><li>User Responses - Inclusive Growth, Societal & Environmental Well-Being</li><li>User Responses - Reproducibility</li><li>User Responses - Robustness</li><li>User Responses - Safety</li><li>User Responses - Security</li><li>User Responses - Transparency</li></ul> | List the user responses for the process checklists          |
| Export Process Checklists                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Utility to export all process checklists to Excel format    |

## Export Functionality

The plugin includes functionality to export all process checklists to Excel format. This implementation uses the following files:

- `inputs/exportUtil.js`: Contains the export logic to convert checklists to Excel format
- `inputs/exportProcessChecklists.summary.mdx`: Contains the React component that provides the export button UI
- `inputs/exportProcessChecklists.meta.json`: Metadata for the export functionality

### Excel Export Features

The Excel export functionality includes:

- **Fully Styled Excel Documents**: Export generates professional Excel sheets with proper styling, including colors, bold text, borders, and alignment.
- **HTML to Text Conversion**: Automatically converts HTML tags like `<br/>` to proper newlines in all content fields.
- **Dynamic Cell Sizing**: Adjusts row heights based on content length to ensure readability.
- **Proper Merged Cell Handling**: Ensures correctly styled merged cells across the document.
- **Special Case Handling**: Properly manages special cases like the Inclusive Growth checklist which uses non-standard naming conventions.

### Integration in Portal

To use the export functionality in the portal, use the `useMDXSummaryBundle` hook to load the export MDX bundle:

```tsx
// In your React component
import { useState } from 'react';
import { useMDXSummaryBundle } from '@/hooks/useMDXSummaryBundle';
import { useConfigFilesData } from '@/hooks/fetchConfigFiles';

// In your component
const [isExporting, setIsExporting] = useState(false);
const gid = 'aiverify.stock.process_checklist';
const cid = 'export_process_checklists';
const { data: mdxBundle } = useMDXSummaryBundle(gid, cid);
const { configFiles } = useConfigFilesData();

// Then render the ExportProcessChecklists component from the MDX bundle
// with your data as props
```

### Excel Import/Export Compatibility

The export function generates Excel files that are compatible with the import functionality, ensuring a seamless workflow for users who need to:

1. Export checklists for offline completion
2. Import completed checklists back into the system

Both the export and import processes properly handle text formatting, including converting between HTML tags and Excel-friendly newlines.

### Process Checklist Order

The process checklists are organized with a `groupNumber` property in their respective meta.json files to ensure they appear in the following order:

1. Transparency 
2. Explainability
3. Reproducibility
4. Safety
5. Security
6. Robustness
7. Fairness
8. Data governance 
9. Accountability
10. Human agency oversight
11. Inclusive Growth, Societal & Environmental Well-being
12. Organisational Considerations

### Special Case: Inclusive Growth Checklist

The Inclusive Growth checklist uses a non-standard naming convention:

- Standard checklists use: `config_<principle>.ts`
- Inclusive Growth uses: `config_inclusive_growth_soc_env.ts`

The export functionality has been updated to handle this special case properly, ensuring that:
- The correct configuration file is loaded
- The summary justification is extracted correctly
- All styling and formatting is consistent across all checklists
