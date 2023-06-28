import PluginManagerType from 'src/types/pluginManager.interface';
import { ApiResult } from '../src/modules/plugins/api/plugins';
import AIFPlugin from 'src/types/plugin.interface';
import { DependencyStatusResult } from 'src/modules/plugins/api/algorithms';

const pluginsListResponse: ApiResult<PluginManagerType> = {
  status: 200,
  data: {
    plugins: [
      {
        gid: 'aiverify.stock.algorithms.partial_dependence_plot',
        version: '0.1.0',
        name: 'Partial Dependence Plot',
        author: 'Test User',
        description:
          'Partial dependence plot (PDP) depicts the relationship between a small number of input variable and target. They show how predictions partially depend on values of the input variables of interests.',
        algorithms: [
          {
            cid: 'partial_dependence_plot',
            name: 'Partial Dependence Plot',
            modelType: ['classification', 'regression'],
            version: '0.1.0',
            author: 'Test User',
            description:
              'Partial dependence plot (PDP) depicts the relationship between a small number of input variable and target. They show how predictions partially depend on values of the input variables of interests.',
            tags: ['Partial Dependence Plot', 'classification', 'regression'],
            requireGroundTruth: false,
            type: 'Algorithm',
            gid: 'aiverify.stock.algorithms.partial_dependence_plot:partial_dependence_plot',
            pluginGID: 'aiverify.stock.algorithms.partial_dependence_plot',
            algoPath:
              '/home/amdlahir/projects/ai-verify/ai-verify-portal/plugins/aiverify.stock.algorithms.partial_dependence_plot/algorithms/partial_dependence_plot',
            requirements: [
              'numpy==1.24.1 ; python_version >= "3.10" and python_version < "3.12"',
              'scipy==1.10.0 ; python_version >= "3.10" and python_version < "3.12"',
            ],
            inputSchema: {
              $schema: 'https://json-schema.org/draft/2020-12/schema',
              $id: 'https://gitlab.com/imda_dsl/t2po/ai-verify/ai-verify-stock-plugins/partial_dependence_plot/input.schema.json',
              title: 'Algorithm Plugin Input Arguments',
              description: 'A schema for algorithm plugin input arguments',
              type: 'object',
              required: [
                'target_feature_name',
                'percentiles',
                'grid_resolution',
              ],
              properties: {
                target_feature_name: {
                  title: 'Target Feature Name',
                  description: 'Target Feature Name (e.g. Interest_Rate)',
                  type: 'string',
                },
                percentiles: {
                  title: 'Cut-off percentiles',
                  description: 'Cut-off percentiles (e.g. [0.01, 0.99])',
                  type: 'array',
                  minItems: 2,
                  maxItems: 2,
                  items: {
                    type: 'number',
                  },
                },
                grid_resolution: {
                  title: 'Grid Resolution',
                  description: 'Grid Resolution (e.g. 25)',
                  type: 'number',
                },
              },
            },
            outputSchema: {
              $schema: 'https://json-schema.org/draft/2020-12/schema',
              $id: 'https://gitlab.com/imda_dsl/t2po/ai-verify/ai-verify-stock-plugins/partial_dependence_plot/output.schema.json',
              title: 'Algorithm Plugin Output Arguments',
              description: 'A schema for algorithm plugin output arguments',
              type: 'object',
              required: ['feature_names', 'output_classes', 'results'],
              minProperties: 1,
              properties: {
                feature_names: {
                  type: 'array',
                  description: 'Array of feature names',
                  minItems: 1,
                  items: {
                    type: 'string',
                  },
                },
                output_classes: {
                  type: 'array',
                  description: 'Array of output classes',
                  minItems: 1,
                  items: {
                    type: 'string',
                  },
                },
                results: {
                  description: 'Matrix of feature values (# feature names)',
                  type: 'array',
                  minItems: 1,
                  items: {
                    description: 'Matrix of PDP values (# output classes)',
                    type: 'array',
                    minItems: 1,
                    items: {
                      type: 'array',
                      description: 'Array of values for each PDP',
                      minItems: 1,
                      items: {
                        type: 'number',
                      },
                    },
                  },
                },
              },
            },
          },
        ],
        isStock: false,
        installedAt: 1678686862514,
      },
      {
        gid: 'aiverify.stock.decorators',
        name: 'AI Verify Stock Decorators',
        version: '1.0.0',
        reportWidgets: [
          {
            cid: 'divider',
            name: 'Divider',
            tags: ['stock', 'decorator'],
            properties: [],
            widgetSize: {
              minW: 1,
              minH: 1,
              maxW: 12,
              maxH: 1,
            },
            dependencies: [],
            mockdata: [],
            type: 'ReportWidget',
            gid: 'aiverify.stock.decorators:divider',
            version: '1.0.0',
            pluginGID: 'aiverify.stock.decorators',
            mdxPath: 'aiverify.stock.decorators/widgets/divider.mdx',
            status: 'OK',
          },
          {
            cid: 'header1',
            name: 'Header 1',
            tags: ['stock', 'decorator', 'header'],
            properties: [
              {
                key: 'title',
                helper: 'Enter the header title',
                default: '',
              },
              {
                key: 'text',
                helper: 'Enter the text for paragraph below header',
                default: '',
              },
            ],
            widgetSize: {
              minW: 1,
              minH: 2,
              maxW: 12,
              maxH: 36,
            },
            dependencies: [],
            mockdata: [],
            type: 'ReportWidget',
            gid: 'aiverify.stock.decorators:header1',
            version: '1.0.0',
            pluginGID: 'aiverify.stock.decorators',
            mdxPath: 'aiverify.stock.decorators/widgets/header1.mdx',
            status: 'OK',
          },
          {
            cid: 'header2',
            name: 'Header 2',
            tags: ['stock', 'decorator', 'header'],
            properties: [
              {
                key: 'title',
                helper: 'Enter the header title',
                default: '',
              },
              {
                key: 'text',
                helper: 'Enter the text for paragraph below header',
                default: '',
              },
            ],
            widgetSize: {
              minW: 1,
              minH: 1,
              maxW: 12,
              maxH: 36,
            },
            dependencies: [],
            mockdata: [],
            type: 'ReportWidget',
            gid: 'aiverify.stock.decorators:header2',
            version: '1.0.0',
            pluginGID: 'aiverify.stock.decorators',
            mdxPath: 'aiverify.stock.decorators/widgets/header2.mdx',
            status: 'OK',
          },
          {
            cid: 'header3',
            name: 'Header 3',
            tags: ['stock', 'decorator', 'header'],
            properties: [
              {
                key: 'title',
                helper: 'Enter the header title',
                default: '',
              },
              {
                key: 'text',
                helper: 'Enter the text for paragraph below header',
                default: '',
              },
            ],
            widgetSize: {
              minW: 1,
              minH: 1,
              maxW: 12,
              maxH: 36,
            },
            dependencies: [],
            mockdata: [],
            type: 'ReportWidget',
            gid: 'aiverify.stock.decorators:header3',
            version: '1.0.0',
            pluginGID: 'aiverify.stock.decorators',
            mdxPath: 'aiverify.stock.decorators/widgets/header3.mdx',
            status: 'OK',
          },
          {
            cid: 'header4',
            name: 'Header 4',
            tags: ['stock', 'decorator', 'header'],
            properties: [
              {
                key: 'title',
                helper: 'Enter the header title',
                default: '',
              },
              {
                key: 'text',
                helper: 'Enter the text for paragraph below header',
                default: '',
              },
            ],
            widgetSize: {
              minW: 1,
              minH: 1,
              maxW: 12,
              maxH: 36,
            },
            dependencies: [],
            mockdata: [],
            type: 'ReportWidget',
            gid: 'aiverify.stock.decorators:header4',
            version: '1.0.0',
            pluginGID: 'aiverify.stock.decorators',
            mdxPath: 'aiverify.stock.decorators/widgets/header4.mdx',
            status: 'OK',
          },
          {
            cid: 'header5',
            name: 'Header 5',
            tags: ['stock', 'decorator', 'header'],
            properties: [
              {
                key: 'title',
                helper: 'Enter the header title',
                default: '',
              },
              {
                key: 'text',
                helper: 'Enter the text for paragraph below header',
                default: '',
              },
            ],
            widgetSize: {
              minW: 1,
              minH: 1,
              maxW: 12,
              maxH: 36,
            },
            dependencies: [],
            mockdata: [],
            type: 'ReportWidget',
            gid: 'aiverify.stock.decorators:header5',
            version: '1.0.0',
            pluginGID: 'aiverify.stock.decorators',
            mdxPath: 'aiverify.stock.decorators/widgets/header5.mdx',
            status: 'OK',
          },
          {
            cid: 'header6',
            name: 'Header 6',
            tags: ['stock', 'decorator', 'header'],
            properties: [
              {
                key: 'title',
                helper: 'Enter the header title',
                default: '',
              },
              {
                key: 'text',
                helper: 'Enter the text for paragraph below header',
                default: '',
              },
            ],
            widgetSize: {
              minW: 1,
              minH: 1,
              maxW: 12,
              maxH: 36,
            },
            dependencies: [],
            mockdata: [],
            type: 'ReportWidget',
            gid: 'aiverify.stock.decorators:header6',
            version: '1.0.0',
            pluginGID: 'aiverify.stock.decorators',
            mdxPath: 'aiverify.stock.decorators/widgets/header6.mdx',
            status: 'OK',
          },
        ],
        isStock: true,
        installedAt: 1679903556691,
      },
      {
        gid: 'aiverify.stock.fairness-metrics-toolbox-widgets',
        name: 'Widgets for Fairness Metrics Toolbox',
        version: '0.1.0',
        author: 'Leong Peck Yoke',
        description:
          'Stock widgets to display results from Fairness Metrics Toolbox (FMT) algoritm',
        reportWidgets: [
          {
            cid: 'false-discovery-rate-chart',
            name: 'Chart for False Discovery Rate metric',
            description: 'Show bar chart for False Discovery Rate metric',
            tags: ['stock', 'chart', 'fairness'],
            properties: [],
            widgetSize: {
              minW: 12,
              minH: 12,
              maxW: 12,
              maxH: 36,
            },
            dependencies: [
              {
                gid: 'aiverify.stock.algorithms.fairness_metrics_toolbox:fairness_metrics_toolbox',
                version: '0.1.0',
                valid: true,
              },
              {
                gid: 'aiverify.stock.fairness-metrics-toolbox-widgets:fairness-tree',
                valid: true,
              },
            ],
            mockdata: [],
            type: 'ReportWidget',
            gid: 'aiverify.stock.fairness-metrics-toolbox-widgets:false-discovery-rate-chart',
            version: '0.1.0',
            pluginGID: 'aiverify.stock.fairness-metrics-toolbox-widgets',
            mdxPath:
              'aiverify.stock.fairness-metrics-toolbox-widgets/widgets/false-discovery-rate-chart.mdx',
            status: 'OK',
          },
          {
            cid: 'false-negative-rate-chart',
            name: 'Chart for False Negative Rate metric',
            description: 'Show bar chart for False Negative Rate metric',
            tags: ['stock', 'chart', 'fairness'],
            properties: [],
            widgetSize: {
              minW: 12,
              minH: 12,
              maxW: 12,
              maxH: 36,
            },
            dependencies: [
              {
                gid: 'aiverify.stock.algorithms.fairness_metrics_toolbox:fairness_metrics_toolbox',
                version: '0.1.0',
                valid: true,
              },
              {
                gid: 'aiverify.stock.fairness-metrics-toolbox-widgets:fairness-tree',
                valid: true,
              },
            ],
            mockdata: [],
            type: 'ReportWidget',
            gid: 'aiverify.stock.fairness-metrics-toolbox-widgets:false-negative-rate-chart',
            version: '0.1.0',
            pluginGID: 'aiverify.stock.fairness-metrics-toolbox-widgets',
            mdxPath:
              'aiverify.stock.fairness-metrics-toolbox-widgets/widgets/false-negative-rate-chart.mdx',
            status: 'OK',
          },
          {
            cid: 'false-omission-rate-chart',
            name: 'Chart for False Omission Rate metric',
            description: 'Show bar chart for False Omission Rate metric',
            tags: ['stock', 'chart', 'fairness'],
            properties: [],
            widgetSize: {
              minW: 12,
              minH: 12,
              maxW: 12,
              maxH: 36,
            },
            dependencies: [
              {
                gid: 'aiverify.stock.algorithms.fairness_metrics_toolbox:fairness_metrics_toolbox',
                version: '0.1.0',
                valid: true,
              },
              {
                gid: 'aiverify.stock.fairness-metrics-toolbox-widgets:fairness-tree',
                valid: true,
              },
            ],
            mockdata: [],
            type: 'ReportWidget',
            gid: 'aiverify.stock.fairness-metrics-toolbox-widgets:false-omission-rate-chart',
            version: '0.1.0',
            pluginGID: 'aiverify.stock.fairness-metrics-toolbox-widgets',
            mdxPath:
              'aiverify.stock.fairness-metrics-toolbox-widgets/widgets/false-omission-rate-chart.mdx',
            status: 'OK',
          },
          {
            cid: 'false-positive-rate-chart',
            name: 'Chart for False Positive Rate metric',
            description: 'Show bar chart for False Positive Rate metric',
            tags: ['stock', 'chart', 'fairness'],
            properties: [],
            widgetSize: {
              minW: 12,
              minH: 12,
              maxW: 12,
              maxH: 36,
            },
            dependencies: [
              {
                gid: 'aiverify.stock.algorithms.fairness_metrics_toolbox:fairness_metrics_toolbox',
                version: '0.1.0',
                valid: true,
              },
              {
                gid: 'aiverify.stock.fairness-metrics-toolbox-widgets:fairness-tree',
                valid: true,
              },
            ],
            mockdata: [],
            type: 'ReportWidget',
            gid: 'aiverify.stock.fairness-metrics-toolbox-widgets:false-positive-rate-chart',
            version: '0.1.0',
            pluginGID: 'aiverify.stock.fairness-metrics-toolbox-widgets',
            mdxPath:
              'aiverify.stock.fairness-metrics-toolbox-widgets/widgets/false-positive-rate-chart.mdx',
            status: 'OK',
          },
          {
            cid: 'introduction',
            name: 'Introduction to the FMT Algorithm',
            description: 'Widget to provide introduction for the FMT',
            tags: [],
            properties: [],
            widgetSize: {
              minW: 12,
              minH: 9,
              maxW: 12,
              maxH: 10,
            },
            dependencies: [],
            mockdata: [],
            type: 'ReportWidget',
            gid: 'aiverify.stock.fairness-metrics-toolbox-widgets:introduction',
            version: '0.1.0',
            pluginGID: 'aiverify.stock.fairness-metrics-toolbox-widgets',
            mdxPath:
              'aiverify.stock.fairness-metrics-toolbox-widgets/widgets/introduction.mdx',
            status: 'OK',
          },
          {
            cid: 'negative-predictive-value-parity-chart',
            name: 'Chart for Negative Predictive Value Parity metric',
            description:
              'Show bar chart for Negative Predictive Value Parity metric',
            tags: ['stock', 'chart', 'fairness'],
            properties: [],
            widgetSize: {
              minW: 12,
              minH: 12,
              maxW: 12,
              maxH: 36,
            },
            dependencies: [
              {
                gid: 'aiverify.stock.algorithms.fairness_metrics_toolbox:fairness_metrics_toolbox',
                version: '0.1.0',
                valid: true,
              },
              {
                gid: 'aiverify.stock.fairness-metrics-toolbox-widgets:fairness-tree',
                valid: true,
              },
            ],
            mockdata: [],
            type: 'ReportWidget',
            gid: 'aiverify.stock.fairness-metrics-toolbox-widgets:negative-predictive-value-parity-chart',
            version: '0.1.0',
            pluginGID: 'aiverify.stock.fairness-metrics-toolbox-widgets',
            mdxPath:
              'aiverify.stock.fairness-metrics-toolbox-widgets/widgets/negative-predictive-value-parity-chart.mdx',
            status: 'OK',
          },
          {
            cid: 'positive-predictive-value-parity-chart',
            name: 'Chart for Positive Predictive Value Parity metric',
            description:
              'Show bar chart for Positive Predictive Value Parity metric',
            tags: ['stock', 'chart', 'fairness'],
            properties: [],
            widgetSize: {
              minW: 12,
              minH: 12,
              maxW: 12,
              maxH: 36,
            },
            dependencies: [
              {
                gid: 'aiverify.stock.algorithms.fairness_metrics_toolbox:fairness_metrics_toolbox',
                version: '0.1.0',
                valid: true,
              },
              {
                gid: 'aiverify.stock.fairness-metrics-toolbox-widgets:fairness-tree',
                valid: true,
              },
            ],
            mockdata: [],
            type: 'ReportWidget',
            gid: 'aiverify.stock.fairness-metrics-toolbox-widgets:positive-predictive-value-parity-chart',
            version: '0.1.0',
            pluginGID: 'aiverify.stock.fairness-metrics-toolbox-widgets',
            mdxPath:
              'aiverify.stock.fairness-metrics-toolbox-widgets/widgets/positive-predictive-value-parity-chart.mdx',
            status: 'OK',
          },
          {
            cid: 'true-negative-rate-chart',
            name: 'Chart for True Negative Rate metric',
            description: 'Show bar chart for True Negative Rate metric',
            tags: ['stock', 'chart', 'fairness'],
            properties: [],
            widgetSize: {
              minW: 12,
              minH: 12,
              maxW: 12,
              maxH: 36,
            },
            dependencies: [
              {
                gid: 'aiverify.stock.algorithms.fairness_metrics_toolbox:fairness_metrics_toolbox',
                version: '0.1.0',
                valid: true,
              },
              {
                gid: 'aiverify.stock.fairness-metrics-toolbox-widgets:fairness-tree',
                valid: true,
              },
            ],
            mockdata: [],
            type: 'ReportWidget',
            gid: 'aiverify.stock.fairness-metrics-toolbox-widgets:true-negative-rate-chart',
            version: '0.1.0',
            pluginGID: 'aiverify.stock.fairness-metrics-toolbox-widgets',
            mdxPath:
              'aiverify.stock.fairness-metrics-toolbox-widgets/widgets/true-negative-rate-chart.mdx',
            status: 'OK',
          },
          {
            cid: 'true-positive-rate-chart',
            name: 'Chart for True Positive Rate metric',
            description: 'Show bar chart for True Positive Rate metric',
            tags: ['stock', 'chart', 'fairness'],
            properties: [],
            widgetSize: {
              minW: 12,
              minH: 12,
              maxW: 12,
              maxH: 36,
            },
            dependencies: [
              {
                gid: 'aiverify.stock.algorithms.fairness_metrics_toolbox:fairness_metrics_toolbox',
                version: '0.1.0',
                valid: true,
              },
              {
                gid: 'aiverify.stock.fairness-metrics-toolbox-widgets:fairness-tree',
                valid: true,
              },
            ],
            mockdata: [],
            type: 'ReportWidget',
            gid: 'aiverify.stock.fairness-metrics-toolbox-widgets:true-positive-rate-chart',
            version: '0.1.0',
            pluginGID: 'aiverify.stock.fairness-metrics-toolbox-widgets',
            mdxPath:
              'aiverify.stock.fairness-metrics-toolbox-widgets/widgets/true-positive-rate-chart.mdx',
            status: 'OK',
          },
        ],
        inputBlocks: [
          {
            cid: 'fairness-tree',
            name: 'Fairness Tree',
            description:
              'There are many fairness metrics, and it is impossible to fulfill all of them due to the Impossibility Theorem of Machine Fairness. Therefore, it is important to select and rank the relevant metrics to focus during the resolving of fairness issues (if any). The fairness tree guides the user to make this decision, and this section documents the decision-making process.',
            fullScreen: true,
            type: 'InputBlock',
            gid: 'aiverify.stock.fairness-metrics-toolbox-widgets:fairness-tree',
            version: '0.1.0',
            pluginGID: 'aiverify.stock.fairness-metrics-toolbox-widgets',
            width: 'md',
            mdxPath:
              'aiverify.stock.fairness-metrics-toolbox-widgets/inputs/fairness-tree.mdx',
          },
        ],
        isStock: true,
        installedAt: 1679903994465,
      },
      {
        gid: 'aiverify.stock.process-checklist',
        name: 'AI Verify Process Checklist',
        version: '0.1.0',
        author: 'Leong Peck Yoke',
        description: 'Process checklist for AI Verify framework',
        reportWidgets: [
          {
            cid: 'explainability-process-checklist-answers',
            name: 'Explainability Process Checklist Answers',
            tags: ['stock', 'process-checklist'],
            properties: [
              {
                key: 'section',
                helper: 'Enter the section to display',
                default: 'Explainability',
              },
              {
                key: 'startIndex',
                helper: 'Enter the start index of the process check to display',
                default: '0',
              },
            ],
            widgetSize: {
              minW: 12,
              minH: 3,
              maxW: 12,
              maxH: 36,
            },
            dependencies: [
              {
                gid: 'aiverify.stock.process-checklist:explainability-process-checklist',
                valid: true,
              },
            ],
            mockdata: [
              {
                type: 'InputBlock',
                gid: 'aiverify.stock.process-checklist:explainability-process-checklist',
                datapath: 'explainability-mockdata.json',
                data: {
                  'elaboration-explainability-2':
                    "Documented as part of company's software development process",
                  'completed-explainability-2': 'Yes',
                },
              },
            ],
            type: 'ReportWidget',
            gid: 'aiverify.stock.process-checklist:explainability-process-checklist-answers',
            version: '0.1.0',
            pluginGID: 'aiverify.stock.process-checklist',
            mdxPath:
              'aiverify.stock.process-checklist/widgets/explainability-process-checklist-answers.mdx',
            status: 'OK',
          },
          {
            cid: 'fairness-process-checklist-answers',
            name: 'Fairness Process Checklist Answers',
            tags: ['stock', 'process-checklist'],
            properties: [
              {
                key: 'section',
                helper: 'Enter the section to display',
                default: 'Fairness',
              },
              {
                key: 'startIndex',
                helper: 'Enter the start index of the process check to display',
                default: '0',
              },
            ],
            widgetSize: {
              minW: 12,
              minH: 3,
              maxW: 12,
              maxH: 36,
            },
            dependencies: [
              {
                gid: 'aiverify.stock.process-checklist:fairness-process-checklist',
                valid: true,
              },
            ],
            mockdata: [],
            type: 'ReportWidget',
            gid: 'aiverify.stock.process-checklist:fairness-process-checklist-answers',
            version: '0.1.0',
            pluginGID: 'aiverify.stock.process-checklist',
            mdxPath:
              'aiverify.stock.process-checklist/widgets/fairness-process-checklist-answers.mdx',
            status: 'OK',
          },
        ],
        inputBlocks: [
          {
            cid: 'explainability-process-checklist',
            name: 'Explainability Process Checklist',
            description: 'Process checklist for Explainability principle',
            group: 'AI Verify Process Checklists',
            width: 'xl',
            type: 'InputBlock',
            gid: 'aiverify.stock.process-checklist:explainability-process-checklist',
            version: '0.1.0',
            pluginGID: 'aiverify.stock.process-checklist',
            mdxPath:
              'aiverify.stock.process-checklist/inputs/explainability-process-checklist.mdx',
          },
          {
            cid: 'fairness-process-checklist',
            name: 'Fairness Process Checklist',
            description: 'Process checklist for Fairness principle',
            group: 'AI Verify Process Checklists',
            width: 'xl',
            type: 'InputBlock',
            gid: 'aiverify.stock.process-checklist:fairness-process-checklist',
            version: '0.1.0',
            pluginGID: 'aiverify.stock.process-checklist',
            mdxPath:
              'aiverify.stock.process-checklist/inputs/fairness-process-checklist.mdx',
          },
        ],
        isStock: true,
        installedAt: 1679904178330,
      },
      {
        gid: 'aiverify.stock.algorithms.fairness_metrics_toolbox_for_classification',
        version: '0.1.0',
        name: 'fairness metrics toolbox for classification',
        author: 'IMDA-T2E',
        description:
          'The Fairness Metrics Toolbox (FMT) for Classification contains a list of fairness metrics to measure how resources (e.g. opportunities, food, loan, medical help) are allocated among the demographic groups (e.g. married male, married female) given a set of sensitive feature(s) (e.g. gender, marital status). This plugin is developed for classification models.',
        algorithms: [
          {
            cid: 'fairness_metrics_toolbox_for_classification',
            name: 'fairness metrics toolbox for classification',
            modelType: ['classification'],
            version: '0.1.0',
            author: 'IMDA-T2E',
            description:
              'The Fairness Metrics Toolbox (FMT) for Classification contains a list of fairness metrics to measure how resources (e.g. opportunities, food, loan, medical help) are allocated among the demographic groups (e.g. married male, married female) given a set of sensitive feature(s) (e.g. gender, marital status). This plugin is developed for classification models.',
            tags: [
              'fairness metrics toolbox for classification',
              'classification',
            ],
            requireGroundTruth: true,
            requiredFiles: [
              'AUTHORS.rst',
              'CHANGELOG.md',
              'input.schema.json',
              'LICENSE',
              'output.schema.json',
              'fairness_metrics_toolbox_for_classification.meta.json',
              'fairness_metrics_toolbox_for_classification.py',
              'README.md',
              'requirements.txt',
              'syntax_checker.py',
            ],
            type: 'Algorithm',
            gid: 'aiverify.stock.algorithms.fairness_metrics_toolbox_for_classification:fairness_metrics_toolbox_for_classification',
            pluginGID:
              'aiverify.stock.algorithms.fairness_metrics_toolbox_for_classification',
            algoPath:
              '/home/amdlahir/projects/ai-verify/ai-verify-portal/plugins/aiverify.stock.algorithms.fairness_metrics_toolbox_for_classification/algorithms/fairness_metrics_toolbox_for_classification',
            requirements: [
              'joblib==1.2.0 ; python_version >= "3.10" and python_version < "4.0"',
              'numpy==1.23.5 ; python_version >= "3.10" and python_version < "4.0"',
              'scikit-learn==1.2.2 ; python_version >= "3.10" and python_version < "4.0"',
              'scipy==1.9.3 ; python_version >= "3.10" and python_version < "4.0"',
              'threadpoolctl==3.1.0 ; python_version >= "3.10" and python_version < "4.0"',
            ],
            inputSchema: {
              $schema: 'https://json-schema.org/draft/2020-12/schema',
              $id: 'https://gitlab.com/imda_dsl/t2po/ai-verify/ai-verify-stock-plugins/aiverify.stock.algorithms.fairness_metrics_toolbox/input.schema.json',
              title: 'Algorithm Plugin Input Arguments',
              description: 'A schema for algorithm plugin input arguments',
              type: 'object',
              required: ['sensitive_feature'],
              properties: {
                sensitive_feature: {
                  title: 'Sensitive Feature Names',
                  description: 'Array of Sensitive Feature Names (e.g. Gender)',
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
              },
            },
            outputSchema: {
              $schema: 'https://json-schema.org/draft/2020-12/schema',
              $id: 'https://gitlab.com/imda_dsl/t2po/ai-verify/ai-verify-stock-plugins/aiverify.stock.algorithms.fairness_metrics_toolbox/output.schema.json',
              title: 'Algorithm Plugin Output Arguments',
              description: 'A schema for algorithm plugin output arguments',
              type: 'object',
              required: ['sensitive_feature', 'output_classes', 'results'],
              properties: {
                sensitive_feature: {
                  description: 'Array of sensitive feature names',
                  type: 'array',
                  minItems: 1,
                  items: {
                    type: 'string',
                  },
                },
                output_classes: {
                  description: 'Array of output classes',
                  type: 'array',
                  minItems: 1,
                  items: {
                    type: ['string', 'number', 'integer', 'boolean'],
                  },
                },
                results: {
                  description:
                    'Array of metrics by output classes (# output classes)',
                  type: 'array',
                  minItems: 1,
                  items: {
                    type: 'object',
                    description: 'Dictionary of metric values by group',
                    required: [
                      'True Positive Rate',
                      'True Negative Rate',
                      'Positive Predictive Value Parity',
                      'Negative Predictive Value Parity',
                      'False Positive Rate',
                      'False Negative Rate',
                      'False Discovery Rate',
                      'False Omission Rate',
                    ],
                    properties: {
                      'True Positive Rate': {
                        $ref: '#/$defs/metric',
                      },
                      'True Negative Rate': {
                        $ref: '#/$defs/metric',
                      },
                      'Positive Predictive Value Parity': {
                        $ref: '#/$defs/metric',
                      },
                      'Negative Predictive Value Parity': {
                        $ref: '#/$defs/metric',
                      },
                      'False Positive Rate': {
                        $ref: '#/$defs/metric',
                      },
                      'False Negative Rate': {
                        $ref: '#/$defs/metric',
                      },
                      'False Discovery Rate': {
                        $ref: '#/$defs/metric',
                      },
                      'False Omission Rate': {
                        $ref: '#/$defs/metric',
                      },
                    },
                  },
                },
              },
              $defs: {
                metric: {
                  description:
                    'Array of metric values for each group, e.g. [{group:[1,2], metric:0.122},...]',
                  type: 'array',
                  items: {
                    type: 'object',
                    required: ['group', 'metric'],
                    properties: {
                      group: {
                        type: 'array',
                        description:
                          'Array of group values, one value for each feature, .e.g group: [1,4,7]',
                      },
                      metric: {
                        type: 'number',
                      },
                    },
                  },
                  minItems: 2,
                },
              },
            },
          },
        ],
        isStock: true,
        installedAt: 1681953154295,
      },
      {
        gid: 'aiverify.stock.shap-toolbox-widgets',
        version: '1.0.0',
        name: 'Widgets for SHAP toolbox',
        reportWidgets: [
          {
            cid: 'global-explainability-chart',
            widgetSize: {
              minW: 12,
              minH: 16,
              maxW: 12,
              maxH: 36,
            },
            name: 'Global Explainability - Overall Feature Importance (Bar Graph)',
            description:
              'Displays the overall feature importance in a barchart and summarized the results',
            dependencies: [
              {
                gid: 'aiverify.stock.algorithms.shap_toolbox:shap_toolbox',
                valid: true,
              },
            ],
            mockdata: [],
            properties: [
              {
                key: 'topNFeatures',
                helper: 'Show the top N features in the chart',
                default: '20',
              },
            ],
            type: 'ReportWidget',
            gid: 'aiverify.stock.shap-toolbox-widgets:global-explainability-chart',
            version: '1.0.0',
            pluginGID: 'aiverify.stock.shap-toolbox-widgets',
            mdxPath:
              'aiverify.stock.shap-toolbox-widgets/widgets/global-explainability-chart.mdx',
            status: 'OK',
          },
        ],
        isStock: false,
        installedAt: 1682644230122,
      },
    ],
    inputBlocks: [
      {
        cid: 'explainability-process-checklist',
        name: 'Explainability Process Checklist',
        description: 'Process checklist for Explainability principle',
        group: 'AI Verify Process Checklists',
        width: 'xl',
        type: 'InputBlock',
        gid: 'aiverify.stock.process-checklist:explainability-process-checklist',
        version: '0.1.0',
        pluginGID: 'aiverify.stock.process-checklist',
        mdxPath:
          'aiverify.stock.process-checklist/inputs/explainability-process-checklist.mdx',
      },
      {
        cid: 'fairness-process-checklist',
        name: 'Fairness Process Checklist',
        description: 'Process checklist for Fairness principle',
        group: 'AI Verify Process Checklists',
        width: 'xl',
        type: 'InputBlock',
        gid: 'aiverify.stock.process-checklist:fairness-process-checklist',
        version: '0.1.0',
        pluginGID: 'aiverify.stock.process-checklist',
        mdxPath:
          'aiverify.stock.process-checklist/inputs/fairness-process-checklist.mdx',
      },
      {
        cid: 'fairness-tree',
        name: 'Fairness Tree',
        description:
          'There are many fairness metrics, and it is impossible to fulfill all of them due to the Impossibility Theorem of Machine Fairness. Therefore, it is important to select and rank the relevant metrics to focus during the resolving of fairness issues (if any). The fairness tree guides the user to make this decision, and this section documents the decision-making process.',
        fullScreen: true,
        type: 'InputBlock',
        gid: 'aiverify.stock.fairness-metrics-toolbox-widgets:fairness-tree',
        version: '0.1.0',
        pluginGID: 'aiverify.stock.fairness-metrics-toolbox-widgets',
        width: 'md',
        mdxPath:
          'aiverify.stock.fairness-metrics-toolbox-widgets/inputs/fairness-tree.mdx',
      },
      {
        cid: 'testForm1',
        name: 'Test Form 1',
        description: 'Test Form 1 description blah blah',
        type: 'InputBlock',
        gid: 'aiverify.tests:testForm1',
        version: '1.0.0-alpha',
        pluginGID: 'aiverify.tests',
        width: 'md',
        mdxPath: 'aiverify.tests/inputs/testForm1.mdx',
      },
    ],
    algorithms: [
      {
        cid: 'adversarial_examples_toolbox',
        name: 'adversarial examples toolbox',
        modelType: ['classification'],
        version: '0.1.0',
        author: 'IMDA-T2E',
        description: 'My adversarial examples toolbox',
        tags: ['adversarial examples toolbox', 'classification'],
        requireGroundTruth: true,
        requiredFiles: [
          'AUTHORS.rst',
          'CHANGELOG.md',
          'input.schema.json',
          'LICENSE',
          'output.schema.json',
          'adversarial_examples_toolbox.meta.json',
          'adversarial_examples_toolbox.py',
          'README.md',
          'requirements.txt',
          'syntax_checker.py',
        ],
        type: 'Algorithm',
        gid: 'aiverify.stock.algorithms.adversarial_examples_toolbox:adversarial_examples_toolbox',
        pluginGID: 'aiverify.stock.algorithms.adversarial_examples_toolbox',
        algoPath:
          '/home/amdlahir/projects/ai-verify/ai-verify-portal/plugins/aiverify.stock.algorithms.adversarial_examples_toolbox/algorithms/adversarial_examples_toolbox',
        requirements: [
          'joblib==1.2.0 ; python_version >= "3.10" and python_version < "4.0"',
          'numpy==1.23.5 ; python_version >= "3.10" and python_version < "4.0"',
          'scikit-learn==1.2.2 ; python_version >= "3.10" and python_version < "4.0"',
          'scipy==1.9.3 ; python_version >= "3.10" and python_version < "4.0"',
          'threadpoolctl==3.1.0 ; python_version >= "3.10" and python_version < "4.0"',
        ],
        inputSchema: {
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          $id: 'https://gitlab.com/imda_dsl/t2po/ai-verify/ai-verify-stock-plugins/ai.verify.stock.algorithms.adversarial-examples-toolbox/input.schema.json',
          title: 'Algorithm Plugin Input Arguments',
          description: 'A schema for algorithm plugin input arguments',
          type: 'object',
          required: [],
          properties: {},
        },
        outputSchema: {
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          $id: 'https://gitlab.com/imda_dsl/t2po/ai-verify/ai-verify-stock-plugins/ai.verify.stock.algorithms.adversarial-examples-toolbox/output.schema.json',
          title: 'Algorithm Plugin Output Arguments',
          description: 'A schema for algorithm plugin output arguments',
          type: 'object',
          required: ['results'],
          minProperties: 1,
          properties: {
            results: {
              description: 'Algorithm Output',
              type: 'object',
              required: [
                'num_of_adversarial_samples',
                'org_accuracy',
                'adversarial_accuracy',
                'num_of_failed_adversarial_samples',
              ],
              properties: {
                num_of_adversarial_samples: {
                  description: 'Number of final adversarial samples',
                  type: 'number',
                },
                original_accuracy: {
                  description: 'Original Accuracy',
                  type: 'number',
                },
                adversarial_accuracy: {
                  description: 'Adversarial accuracy',
                  type: 'number',
                },
                num_of_failed_adversarial_samples: {
                  description:
                    'Number of samples that failed to generate adversarial samples',
                  type: 'number',
                },
              },
            },
          },
        },
      },
      {
        cid: 'fairness_metrics_toolbox_for_classification',
        name: 'fairness metrics toolbox for classification',
        modelType: ['classification'],
        version: '0.1.0',
        author: 'IMDA-T2E',
        description:
          'The Fairness Metrics Toolbox (FMT) for Classification contains a list of fairness metrics to measure how resources (e.g. opportunities, food, loan, medical help) are allocated among the demographic groups (e.g. married male, married female) given a set of sensitive feature(s) (e.g. gender, marital status). This plugin is developed for classification models.',
        tags: ['fairness metrics toolbox for classification', 'classification'],
        requireGroundTruth: true,
        requiredFiles: [
          'AUTHORS.rst',
          'CHANGELOG.md',
          'input.schema.json',
          'LICENSE',
          'output.schema.json',
          'fairness_metrics_toolbox_for_classification.meta.json',
          'fairness_metrics_toolbox_for_classification.py',
          'README.md',
          'requirements.txt',
          'syntax_checker.py',
        ],
        type: 'Algorithm',
        gid: 'aiverify.stock.algorithms.fairness_metrics_toolbox_for_classification:fairness_metrics_toolbox_for_classification',
        pluginGID:
          'aiverify.stock.algorithms.fairness_metrics_toolbox_for_classification',
        algoPath:
          '/home/amdlahir/projects/ai-verify/ai-verify-portal/plugins/aiverify.stock.algorithms.fairness_metrics_toolbox_for_classification/algorithms/fairness_metrics_toolbox_for_classification',
        requirements: [
          'joblib==1.2.0 ; python_version >= "3.10" and python_version < "4.0"',
          'numpy==1.23.5 ; python_version >= "3.10" and python_version < "4.0"',
          'scikit-learn==1.2.2 ; python_version >= "3.10" and python_version < "4.0"',
          'scipy==1.9.3 ; python_version >= "3.10" and python_version < "4.0"',
          'threadpoolctl==3.1.0 ; python_version >= "3.10" and python_version < "4.0"',
        ],
        inputSchema: {
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          $id: 'https://gitlab.com/imda_dsl/t2po/ai-verify/ai-verify-stock-plugins/aiverify.stock.algorithms.fairness_metrics_toolbox/input.schema.json',
          title: 'Algorithm Plugin Input Arguments',
          description: 'A schema for algorithm plugin input arguments',
          type: 'object',
          required: ['sensitive_feature'],
          properties: {
            sensitive_feature: {
              title: 'Sensitive Feature Names',
              description: 'Array of Sensitive Feature Names (e.g. Gender)',
              type: 'array',
              items: {
                type: 'string',
              },
            },
          },
        },
        outputSchema: {
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          $id: 'https://gitlab.com/imda_dsl/t2po/ai-verify/ai-verify-stock-plugins/aiverify.stock.algorithms.fairness_metrics_toolbox/output.schema.json',
          title: 'Algorithm Plugin Output Arguments',
          description: 'A schema for algorithm plugin output arguments',
          type: 'object',
          required: ['sensitive_feature', 'output_classes', 'results'],
          properties: {
            sensitive_feature: {
              description: 'Array of sensitive feature names',
              type: 'array',
              minItems: 1,
              items: {
                type: 'string',
              },
            },
            output_classes: {
              description: 'Array of output classes',
              type: 'array',
              minItems: 1,
              items: {
                type: ['string', 'number', 'integer', 'boolean'],
              },
            },
            results: {
              description:
                'Array of metrics by output classes (# output classes)',
              type: 'array',
              minItems: 1,
              items: {
                type: 'object',
                description: 'Dictionary of metric values by group',
                required: [
                  'True Positive Rate',
                  'True Negative Rate',
                  'Positive Predictive Value Parity',
                  'Negative Predictive Value Parity',
                  'False Positive Rate',
                  'False Negative Rate',
                  'False Discovery Rate',
                  'False Omission Rate',
                ],
                properties: {
                  'True Positive Rate': {
                    $ref: '#/$defs/metric',
                  },
                  'True Negative Rate': {
                    $ref: '#/$defs/metric',
                  },
                  'Positive Predictive Value Parity': {
                    $ref: '#/$defs/metric',
                  },
                  'Negative Predictive Value Parity': {
                    $ref: '#/$defs/metric',
                  },
                  'False Positive Rate': {
                    $ref: '#/$defs/metric',
                  },
                  'False Negative Rate': {
                    $ref: '#/$defs/metric',
                  },
                  'False Discovery Rate': {
                    $ref: '#/$defs/metric',
                  },
                  'False Omission Rate': {
                    $ref: '#/$defs/metric',
                  },
                },
              },
            },
          },
          $defs: {
            metric: {
              description:
                'Array of metric values for each group, e.g. [{group:[1,2], metric:0.122},...]',
              type: 'array',
              items: {
                type: 'object',
                required: ['group', 'metric'],
                properties: {
                  group: {
                    type: 'array',
                    description:
                      'Array of group values, one value for each feature, .e.g group: [1,4,7]',
                  },
                  metric: {
                    type: 'number',
                  },
                },
              },
              minItems: 2,
            },
          },
        },
      },
      {
        cid: 'shap_toolbox',
        name: 'shap toolbox',
        modelType: ['classification', 'regression'],
        version: '0.1.0',
        author: 'IMDA-T2E',
        description:
          'SHAP (SHapley Additive exPlanations) is a game theoretic approach to explain the output of any machine learning model. It connects optimal credit allocation with local explanations using the classic Shapley values from game theory and their related extensions (see papers for details and citations).',
        tags: ['shap toolbox', 'classification', 'regression'],
        requireGroundTruth: true,
        requiredFiles: [
          'AUTHORS.rst',
          'CHANGELOG.md',
          'input.schema.json',
          'LICENSE',
          'output.schema.json',
          'shap_toolbox.meta.json',
          'shap_toolbox.py',
          'README.md',
          'requirements.txt',
          'syntax_checker.py',
          'src',
        ],
        type: 'Algorithm',
        gid: 'aiverify.stock.algorithms.shap_toolbox:shap_toolbox',
        pluginGID: 'aiverify.stock.algorithms.shap_toolbox',
        algoPath:
          '/home/amdlahir/projects/ai-verify/ai-verify-portal/plugins/aiverify.stock.algorithms.shap_toolbox/algorithms/shap_toolbox',
        requirements: [
          'cloudpickle==2.2.1 ; python_version >= "3.10" and python_version < "4.0"',
          'colorama==0.4.6 ; python_version >= "3.10" and python_version < "4.0" and platform_system == "Windows"',
          'joblib==1.2.0 ; python_version >= "3.10" and python_version < "4.0"',
          'llvmlite==0.39.1 ; python_version >= "3.10" and python_version < "4.0"',
          'numba==0.56.4 ; python_version >= "3.10" and python_version < "4.0"',
          'numpy==1.23.5 ; python_version >= "3.10" and python_version < "4.0"',
          'packaging==23.0 ; python_version >= "3.10" and python_version < "4.0"',
          'pandas==1.5.3 ; python_version >= "3.10" and python_version < "4.0"',
          'python-dateutil==2.8.2 ; python_version >= "3.10" and python_version < "4.0"',
          'pytz==2023.3 ; python_version >= "3.10" and python_version < "4.0"',
          'scikit-learn==1.2.2 ; python_version >= "3.10" and python_version < "4.0"',
          'scipy==1.9.3 ; python_version >= "3.10" and python_version < "4.0"',
          'setuptools==67.6.1 ; python_version >= "3.10" and python_version < "4.0"',
          'shap==0.41.0 ; python_version >= "3.10" and python_version < "4.0"',
          'six==1.16.0 ; python_version >= "3.10" and python_version < "4.0"',
          'slicer==0.0.7 ; python_version >= "3.10" and python_version < "4.0"',
          'threadpoolctl==3.1.0 ; python_version >= "3.10" and python_version < "4.0"',
          'tqdm==4.65.0 ; python_version >= "3.10" and python_version < "4.0"',
        ],
        inputSchema: {
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          $id: 'https://gitlab.com/imda_dsl/t2po/ai-verify/ai-verify-stock-plugins/aiverify.stock.algorithms.shap_toolbox/input.schema.json',
          title: 'Algorithm Plugin Input Arguments',
          description: 'A schema for algorithm plugin input arguments',
          type: 'object',
          required: [
            'algo_type',
            'explain_type',
            'background_path',
            'background_samples',
            'data_samples',
          ],
          properties: {
            algo_type: {
              title: 'Algorithm Type',
              description: 'Algorithm Type - [tree, linear, kernel (default)]',
              type: 'string',
            },
            explain_type: {
              title: 'Explain Type',
              description: 'Explain Type - [global, local (default)]',
              type: 'string',
            },
            background_path: {
              title: 'Background data path',
              description: 'Background data path',
              type: 'string',
            },
            background_samples: {
              title: 'Background Samples',
              description: 'Background Samples (e.g. 25)',
              type: 'number',
            },
            data_samples: {
              title: 'Data Samples',
              description: 'Data Samples (e.g. 25)',
              type: 'number',
            },
          },
        },
        outputSchema: {
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          $id: 'https://gitlab.com/imda_dsl/t2po/ai-verify/ai-verify-stock-plugins/aiverify.stock.algorithms.shap_toolbox/output.schema.json',
          title: 'Algorithm Plugin Output Arguments',
          description: 'A schema for algorithm plugin output arguments',
          type: 'object',
          required: ['feature_names', 'results'],
          properties: {
            feature_names: {
              type: 'array',
              description: 'Array of feature names',
              minItems: 1,
              items: {
                type: 'string',
              },
            },
            results: {
              description: 'Matrix of feature values (# feature names)',
              type: 'object',
              required: [
                'num_local_classes',
                'local',
                'single_explainer_values',
                'single_shap_values',
                'global_shap_values',
                'global_samples',
                'num_global_classes',
                'global',
              ],
              properties: {
                num_local_classes: {
                  description: 'Number of local classes',
                  type: 'number',
                },
                local: {
                  description: '# of local classes',
                  type: 'array',
                  minItems: 1,
                  items: {
                    type: 'array',
                    minItems: 1,
                    items: {
                      type: 'array',
                      description: 'class values',
                      minItems: 1,
                      items: {
                        type: 'number',
                      },
                    },
                  },
                },
                single_explainer_values: {
                  description: 'array of single explainer values',
                  type: 'array',
                  minItems: 1,
                  items: {
                    type: 'number',
                  },
                },
                single_shap_values: {
                  description: 'array of single shap values',
                  type: 'array',
                  minItems: 1,
                  items: {
                    type: 'array',
                    description: 'class values',
                    minItems: 1,
                    items: {
                      type: 'number',
                    },
                  },
                },
                global_shap_values: {
                  description: 'global shap values',
                  type: 'array',
                  items: {
                    type: 'array',
                    description:
                      'Matrix of SHAP values (# samples x # features)',
                    minItems: 1,
                    items: {
                      type: 'array',
                      description: 'Array of SHAP values for each feature',
                      minItems: 1,
                      items: {
                        type: 'number',
                      },
                    },
                  },
                },
                global_samples: {
                  description:
                    'Matrix of feature values (# samples x # features)',
                  type: 'array',
                  items: {
                    type: 'array',
                    description: 'Array of sample values for each feature',
                    minItems: 1,
                    items: {
                      type: 'number',
                    },
                  },
                },
                num_global_classes: {
                  description: 'Number of global classes',
                  type: 'number',
                },
                global: {
                  description: '# of global classes',
                  type: 'array',
                  items: {
                    type: 'array',
                    minItems: 1,
                    items: {
                      type: 'number',
                    },
                  },
                },
              },
            },
          },
        },
      },
      {
        cid: 'partial_dependence_plot',
        name: 'Partial Dependence Plot',
        modelType: ['classification', 'regression'],
        version: '0.1.0',
        author: 'Test User',
        description:
          'Partial dependence plot (PDP) depicts the relationship between a small number of input variable and target. They show how predictions partially depend on values of the input variables of interests.',
        tags: ['Partial Dependence Plot', 'classification', 'regression'],
        requireGroundTruth: false,
        type: 'Algorithm',
        gid: 'aiverify.stock.algorithms.partial_dependence_plot:partial_dependence_plot',
        pluginGID: 'aiverify.stock.algorithms.partial_dependence_plot',
        algoPath:
          '/home/amdlahir/projects/ai-verify/ai-verify-portal/plugins/aiverify.stock.algorithms.partial_dependence_plot/algorithms/partial_dependence_plot',
        requirements: [
          'numpy==1.24.1 ; python_version >= "3.10" and python_version < "3.12"',
          'scipy==1.10.0 ; python_version >= "3.10" and python_version < "3.12"',
        ],
        inputSchema: {
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          $id: 'https://gitlab.com/imda_dsl/t2po/ai-verify/ai-verify-stock-plugins/partial_dependence_plot/input.schema.json',
          title: 'Algorithm Plugin Input Arguments',
          description: 'A schema for algorithm plugin input arguments',
          type: 'object',
          required: ['target_feature_name', 'percentiles', 'grid_resolution'],
          properties: {
            target_feature_name: {
              title: 'Target Feature Name',
              description: 'Target Feature Name (e.g. Interest_Rate)',
              type: 'string',
            },
            percentiles: {
              title: 'Cut-off percentiles',
              description: 'Cut-off percentiles (e.g. [0.01, 0.99])',
              type: 'array',
              minItems: 2,
              maxItems: 2,
              items: {
                type: 'number',
              },
            },
            grid_resolution: {
              title: 'Grid Resolution',
              description: 'Grid Resolution (e.g. 25)',
              type: 'number',
            },
          },
        },
        outputSchema: {
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          $id: 'https://gitlab.com/imda_dsl/t2po/ai-verify/ai-verify-stock-plugins/partial_dependence_plot/output.schema.json',
          title: 'Algorithm Plugin Output Arguments',
          description: 'A schema for algorithm plugin output arguments',
          type: 'object',
          required: ['feature_names', 'output_classes', 'results'],
          minProperties: 1,
          properties: {
            feature_names: {
              type: 'array',
              description: 'Array of feature names',
              minItems: 1,
              items: {
                type: 'string',
              },
            },
            output_classes: {
              type: 'array',
              description: 'Array of output classes',
              minItems: 1,
              items: {
                type: 'string',
              },
            },
            results: {
              description: 'Matrix of feature values (# feature names)',
              type: 'array',
              minItems: 1,
              items: {
                description: 'Matrix of PDP values (# output classes)',
                type: 'array',
                minItems: 1,
                items: {
                  type: 'array',
                  description: 'Array of values for each PDP',
                  minItems: 1,
                  items: {
                    type: 'number',
                  },
                },
              },
            },
          },
        },
      },
      {
        cid: 'fairness_metrics_toolbox',
        name: 'Fairness Metrics Toolbox',
        modelType: ['classification'],
        version: '0.1.0',
        author: 'Kelvin Kok',
        description:
          'The Fairness Metrics Toolbox (FMT) contains a list of fairness metrics to measure how resources (e.g. opportunities, food, loan, medical help) are allocated among the demographic groups (e.g. married male, married female) given a set of sensitive feature(s) (e.g. gender, marital status).',
        tags: ['Fairness Metrics Toolbox', 'classification'],
        requireGroundTruth: true,
        requiredFiles: [
          'AUTHORS.rst',
          'CHANGELOG.md',
          'input.schema.json',
          'LICENSE',
          'output.schema.json',
          'fairness_metrics_toolbox.meta.json',
          'fairness_metrics_toolbox.py',
          'README.md',
          'requirements.txt',
          'syntax_checker.py',
        ],
        type: 'Algorithm',
        gid: 'aiverify.stock.algorithms.fairness_metrics_toolbox:fairness_metrics_toolbox',
        pluginGID: 'aiverify.stock.algorithms.fairness_metrics_toolbox',
        algoPath:
          '/home/amdlahir/projects/ai-verify/ai-verify-portal/plugins/aiverify.stock.algorithms.fairness_metrics_toolbox/algorithms/fairness_metrics_toolbox',
        requirements: [
          'joblib==1.2.0 ; python_version >= "3.10" and python_version < "4.0"',
          'numpy==1.24.2 ; python_version >= "3.10" and python_version < "4.0"',
          'scikit-learn==1.2.1 ; python_version >= "3.10" and python_version < "4.0"',
          'scipy==1.9.3 ; python_version >= "3.10" and python_version < "4.0"',
          'threadpoolctl==3.1.0 ; python_version >= "3.10" and python_version < "4.0"',
        ],
        inputSchema: {
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          $id: 'https://gitlab.com/imda_dsl/t2po/ai-verify/ai-verify-stock-plugins/aiverify.stock.algorithms.fairness_metrics_toolbox/input.schema.json',
          title: 'Algorithm Plugin Input Arguments',
          description: 'A schema for algorithm plugin input arguments',
          type: 'object',
          required: ['sensitive_feature'],
          properties: {
            sensitive_feature: {
              title: 'Sensitive Feature Names',
              description: 'Array of Sensitive Feature Names (e.g. Gender)',
              type: 'array',
              items: {
                type: 'string',
              },
            },
          },
        },
        outputSchema: {
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          $id: 'https://gitlab.com/imda_dsl/t2po/ai-verify/ai-verify-stock-plugins/aiverify.stock.algorithms.fairness_metrics_toolbox/output.schema.json',
          title: 'Algorithm Plugin Output Arguments',
          description: 'A schema for algorithm plugin output arguments',
          type: 'object',
          required: ['sensitive_feature', 'output_classes', 'results'],
          properties: {
            sensitive_feature: {
              description: 'Array of sensitive feature names',
              type: 'array',
              minItems: 1,
              items: {
                type: 'string',
              },
            },
            output_classes: {
              description: 'Array of output classes',
              type: 'array',
              minItems: 1,
              items: {
                type: ['string', 'number', 'integer', 'boolean'],
              },
            },
            results: {
              description:
                'Array of metrics by output classes (# output classes)',
              type: 'array',
              minItems: 1,
              items: {
                type: 'object',
                description: 'Dictionary of metric values by group',
                required: [
                  'True Positive Rate',
                  'True Negative Rate',
                  'Positive Predictive Value Parity',
                  'Negative Predictive Value Parity',
                  'False Positive Rate',
                  'False Negative Rate',
                  'False Discovery Rate',
                  'False Omission Rate',
                ],
                properties: {
                  'True Positive Rate': {
                    $ref: '#/$defs/metric',
                  },
                  'True Negative Rate': {
                    $ref: '#/$defs/metric',
                  },
                  'Positive Predictive Value Parity': {
                    $ref: '#/$defs/metric',
                  },
                  'Negative Predictive Value Parity': {
                    $ref: '#/$defs/metric',
                  },
                  'False Positive Rate': {
                    $ref: '#/$defs/metric',
                  },
                  'False Negative Rate': {
                    $ref: '#/$defs/metric',
                  },
                  'False Discovery Rate': {
                    $ref: '#/$defs/metric',
                  },
                  'False Omission Rate': {
                    $ref: '#/$defs/metric',
                  },
                },
              },
            },
          },
          $defs: {
            metric: {
              description:
                'Array of metric values for each group, e.g. [{group:[1,2], metric:0.122},...]',
              type: 'array',
              items: {
                type: 'object',
                required: ['group', 'metric'],
                properties: {
                  group: {
                    type: 'array',
                    description:
                      'Array of group values, one value for each feature, .e.g group: [1,4,7]',
                  },
                  metric: {
                    type: 'number',
                  },
                },
              },
              minItems: 2,
            },
          },
        },
      },
    ],
    templates: [
      {
        cid: 'demo-2-mar-2023-template',
        name: 'Demo 2 Mar 2023 Template',
        description: 'template for demo on 2 Mar 2023',
        type: 'Template',
        gid: '046f18f4-9006-480f-9696-ad2ff65523c7:demo-2-mar-2023-template',
        version: '1.0.0',
        pluginGID: '046f18f4-9006-480f-9696-ad2ff65523c7',
        data: {
          pages: [
            {
              layouts: [
                {
                  w: 12,
                  h: 2,
                  x: 0,
                  y: 0,
                  i: '1677654688094',
                  minW: 1,
                  maxW: 12,
                  minH: 2,
                  maxH: 36,
                  moved: false,
                  static: false,
                },
                {
                  w: 12,
                  h: 15,
                  x: 0,
                  y: 2,
                  i: '1677654738248',
                  minW: 12,
                  maxW: 12,
                  minH: 12,
                  maxH: 36,
                  moved: false,
                  static: false,
                },
                {
                  w: 12,
                  h: 17,
                  x: 0,
                  y: 17,
                  i: '1677654744924',
                  minW: 12,
                  maxW: 12,
                  minH: 12,
                  maxH: 36,
                  moved: false,
                  static: false,
                },
                {
                  w: 12,
                  h: 1,
                  x: 0,
                  y: 35,
                  i: '_youcantseeme',
                  moved: false,
                  static: false,
                },
              ],
              reportWidgets: [
                {
                  layoutItemProperties: {
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: null,
                    bgcolor: null,
                  },
                  widgetGID: 'aiverify.stock.decorators:header1',
                  key: '1677654688094',
                  properties: {
                    title: '',
                    text: '{name}',
                  },
                },
                {
                  layoutItemProperties: {
                    justifyContent: 'left',
                    alignItems: 'top',
                    color: null,
                    bgcolor: null,
                  },
                  widgetGID:
                    'aiverify.stock.fairness-metrics-toolbox-widgets:false-discovery-rate-chart',
                  key: '1677654738248',
                  properties: null,
                },
                {
                  layoutItemProperties: {
                    justifyContent: 'left',
                    alignItems: 'top',
                    color: null,
                    bgcolor: null,
                  },
                  widgetGID:
                    'aiverify.stock.fairness-metrics-toolbox-widgets:false-negative-rate-chart',
                  key: '1677654744924',
                  properties: null,
                },
              ],
            },
            {
              layouts: [
                {
                  w: 12,
                  h: 35,
                  x: 0,
                  y: 0,
                  i: '1677654763640',
                  minW: 12,
                  maxW: 12,
                  minH: 12,
                  maxH: 36,
                  moved: false,
                  static: false,
                },
                {
                  w: 12,
                  h: 1,
                  x: 0,
                  y: 35,
                  i: '_youcantseeme',
                  moved: false,
                  static: false,
                },
              ],
              reportWidgets: [
                {
                  layoutItemProperties: {
                    justifyContent: 'left',
                    alignItems: 'top',
                    color: null,
                    bgcolor: null,
                  },
                  widgetGID:
                    'aiverify.stock.fairness-metrics-toolbox-widgets:false-omission-rate-chart',
                  key: '1677654763640',
                  properties: null,
                },
              ],
            },
            {
              layouts: [
                {
                  w: 12,
                  h: 29,
                  x: 0,
                  y: 2,
                  i: '1677656674885',
                  minW: 12,
                  maxW: 12,
                  minH: 3,
                  maxH: 36,
                  moved: false,
                  static: false,
                },
                {
                  w: 12,
                  h: 2,
                  x: 0,
                  y: 0,
                  i: '1677656749854',
                  minW: 1,
                  maxW: 12,
                  minH: 2,
                  maxH: 36,
                  moved: false,
                  static: false,
                },
                {
                  w: 12,
                  h: 1,
                  x: 0,
                  y: 35,
                  i: '_youcantseeme',
                  moved: false,
                  static: false,
                },
              ],
              reportWidgets: [
                {
                  layoutItemProperties: {
                    justifyContent: 'left',
                    alignItems: 'top',
                  },
                  widgetGID:
                    'aiverify.stock.process-checklist:fairness-process-checklist-answers',
                  key: '1677656674885',
                  properties: {
                    section: 'Fairness',
                    startIndex: '0',
                  },
                },
                {
                  layoutItemProperties: {
                    justifyContent: 'left',
                    alignItems: 'center',
                  },
                  widgetGID: 'aiverify.stock.decorators:header1',
                  key: '1677656749854',
                  properties: {
                    title: '',
                    text: 'Fairness Checklist',
                  },
                },
              ],
            },
            {
              layouts: [
                {
                  w: 12,
                  h: 35,
                  x: 0,
                  y: 0,
                  i: '1677656693173',
                  minW: 12,
                  maxW: 12,
                  minH: 3,
                  maxH: 36,
                  moved: false,
                  static: false,
                },
                {
                  w: 12,
                  h: 1,
                  x: 0,
                  y: 35,
                  i: '_youcantseeme',
                  moved: false,
                  static: false,
                },
              ],
              reportWidgets: [
                {
                  layoutItemProperties: {
                    justifyContent: 'left',
                    alignItems: 'top',
                  },
                  widgetGID:
                    'aiverify.stock.process-checklist:fairness-process-checklist-answers',
                  key: '1677656693173',
                  properties: {
                    section: 'Fairness',
                    startIndex: '3',
                  },
                },
              ],
            },
            {
              layouts: [
                {
                  w: 12,
                  h: 14,
                  x: 0,
                  y: 2,
                  i: '1677656725405',
                  minW: 12,
                  maxW: 12,
                  minH: 3,
                  maxH: 36,
                  moved: false,
                  static: false,
                },
                {
                  w: 12,
                  h: 2,
                  x: 0,
                  y: 0,
                  i: '1677656776114',
                  minW: 1,
                  maxW: 12,
                  minH: 2,
                  maxH: 36,
                  moved: false,
                  static: false,
                },
                {
                  w: 12,
                  h: 1,
                  x: 0,
                  y: 35,
                  i: '_youcantseeme',
                  moved: false,
                  static: false,
                },
              ],
              reportWidgets: [
                {
                  layoutItemProperties: {
                    justifyContent: 'left',
                    alignItems: 'top',
                  },
                  widgetGID:
                    'aiverify.stock.process-checklist:explainability-process-checklist-answers',
                  key: '1677656725405',
                  properties: {
                    section: 'Explainability',
                    startIndex: '0',
                  },
                },
                {
                  layoutItemProperties: {
                    justifyContent: 'left',
                    alignItems: 'center',
                  },
                  widgetGID: 'aiverify.stock.decorators:header1',
                  key: '1677656776114',
                  properties: {
                    title: '',
                    text: 'Explainability Checklist',
                  },
                },
              ],
            },
          ],
          globalVars: [],
          fromPlugin: true,
          projectInfo: {
            name: 'Demo 2 Mar 2023 Template',
            description: 'template for demo on 2 Mar 2023',
          },
        },
        id: '64536cac2285de1805dea945',
      },
    ],
    stockPlugins: [
      'aiverify.stock.decorators',
      'aiverify.stock.algorithms.fairness_metrics_toolbox_for_classification',
      'aiverify.stock.fairness-metrics-toolbox-widgets',
      'aiverify.stock.process-checklist',
    ],
  },
};

const emptyListResponse: ApiResult<PluginManagerType> = {
  status: 200,
  data: {
    plugins: [],
    inputBlocks: [],
    algorithms: [],
    templates: [],
    stockPlugins: [],
  },
};

const installPluginResponse: ApiResult<AIFPlugin> = {
  status: 200,
  data: {
    gid: 'aiverify.stock.algorithms.partial_dependence_plot',
    version: '0.1.0',
    name: 'Partial Dependence Plot',
    author: 'Test User',
    description:
      'Partial dependence plot (PDP) depicts the relationship between a small number of input variable and target. They show how predictions partially depend on values of the input variables of interests.',
    isStock: false,
    reportWidgets: [],
    inputBlocks: [],
    templates: [],
    algorithms: [
      {
        cid: 'partial_dependence_plot',
        name: 'Partial Dependence Plot',
        modelType: ['classification', 'regression'],
        version: '0.1.0',
        author: 'Test User',
        description:
          'Partial dependence plot (PDP) depicts the relationship between a small number of input variable and target. They show how predictions partially depend on values of the input variables of interests.',
        tags: ['Partial Dependence Plot', 'classification', 'regression'],
        requireGroundTruth: false,
        type: 'Algorithm',
        gid: 'aiverify.stock.algorithms.partial_dependence_plot:partial_dependence_plot',
        pluginGID: 'aiverify.stock.algorithms.partial_dependence_plot',
        algoPath:
          '/home/amdlahir/imda/projects/ai-verify-portal/plugins/aiverify.stock.algorithms.partial_dependence_plot/algorithms/partial_dependence_plot',
        requirements: [
          'numpy==1.24.1 ; python_version >= "3.10" and python_version < "3.12"',
          'scipy==1.10.0 ; python_version >= "3.10" and python_version < "3.12"',
        ],
        inputSchema: {
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          $id: 'https://gitlab.com/imda_dsl/t2po/ai-verify/ai-verify-stock-plugins/partial_dependence_plot/input.schema.json',
          title: 'Algorithm Plugin Input Arguments',
          description: 'A schema for algorithm plugin input arguments',
          type: 'object',
          required: ['target_feature_name', 'percentiles', 'grid_resolution'],
          properties: {
            target_feature_name: {
              title: 'Target Feature Name',
              description: 'Target Feature Name (e.g. Interest_Rate)',
              type: 'string',
            },
            percentiles: {
              title: 'Cut-off percentiles',
              description: 'Cut-off percentiles (e.g. [0.01, 0.99])',
              type: 'array',
              minItems: 2,
              maxItems: 2,
              items: {
                type: 'number',
              },
            },
            grid_resolution: {
              title: 'Grid Resolution',
              description: 'Grid Resolution (e.g. 25)',
              type: 'number',
            },
          },
        },
        outputSchema: {
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          $id: 'https://gitlab.com/imda_dsl/t2po/ai-verify/ai-verify-stock-plugins/partial_dependence_plot/output.schema.json',
          title: 'Algorithm Plugin Output Arguments',
          description: 'A schema for algorithm plugin output arguments',
          type: 'object',
          required: ['feature_names', 'output_classes', 'results'],
          minProperties: 1,
          properties: {
            feature_names: {
              type: 'array',
              description: 'Array of feature names',
              minItems: 1,
              items: {
                type: 'string',
              },
            },
            output_classes: {
              type: 'array',
              description: 'Array of output classes',
              minItems: 1,
              items: {
                type: 'string',
              },
            },
            results: {
              description: 'Matrix of feature values (# feature names)',
              type: 'array',
              minItems: 1,
              items: {
                description: 'Matrix of PDP values (# output classes)',
                type: 'array',
                minItems: 1,
                items: {
                  type: 'array',
                  description: 'Array of values for each PDP',
                  minItems: 1,
                  items: {
                    type: 'number',
                  },
                },
              },
            },
          },
        },
      },
    ],
  },
};

const algoPackageDependencyStatusResponse: ApiResult<DependencyStatusResult[]> =
  {
    status: 200,
    data: [
      { requirement: 'numpy==1.24.1', result: true, comment: 'Not compatible' },
      { requirement: 'scipy==1.10.0', result: false, comment: '' },
    ],
  };

export {
  pluginsListResponse,
  emptyListResponse,
  installPluginResponse,
  algoPackageDependencyStatusResponse,
};
