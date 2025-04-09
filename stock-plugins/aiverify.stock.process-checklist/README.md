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

The plugin now includes functionality to export all process checklists to Excel format. This implementation uses the following files:

- `inputs/exportUtil.js`: Contains the export logic to convert checklists to Excel format
- `inputs/exportProcessChecklists.summary.mdx`: Contains the React component that provides the export button UI
- `inputs/exportProcessChecklists.meta.json`: Metadata for the export functionality

### Integration in Portal

To use the export functionality in the portal, use the `useMDXSummaryBundle` hook to load the export MDX bundle:

```tsx
// In your React component
import { useState } from "react";
import { useMDXSummaryBundle } from "@/hooks/useMDXSummaryBundle";
import { useConfigFilesData } from "@/hooks/fetchConfigFiles";

// In your component
const [isExporting, setIsExporting] = useState(false);
const gid = "aiverify.stock.process_checklist";
const cid = "export_process_checklists";
const { data: mdxBundle } = useMDXSummaryBundle(gid, cid);
const { configFiles } = useConfigFilesData();

// Then render the ExportProcessChecklists component from the MDX bundle
// with your data as props
```

### Process Checklist Order

The process checklists have been organized with a `groupNumber` property to ensure they appear in the following order:

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
