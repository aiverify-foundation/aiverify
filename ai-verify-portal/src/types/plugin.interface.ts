/**
 * Contains the interface definitions of the plugin and components.
 * @todo Move to separate shared library project in future
 */

import ProjectTemplate from "./projectTemplate.interface";


/**
 * For now properties only support string values
 */
export interface UserDefinedProperty {
    key: string,
    helper?: string, // recommended to inform user use of the property
    // required?: boolean, // default to false
    default?: string,
    choices?: string[], // array of values 
}

export interface BasePluginComponent {
	readonly gid: string, // <plugin gid>:<component id>
    readonly version: string, // inherit from plugin version
    readonly cid: string, // component id
	readonly pluginGID: string, // reference plugin gid
    readonly name: string,
    readonly description?: string,
    readonly tags?: string[],
}

export interface BaseMDXComponent extends BasePluginComponent {
    readonly mdxPath: string, // path to file, relative to plugins dir
}

export enum PluginComponentType {
    Template = "Template",
    Algorithm = "Algorithm",
    InputBlock = "InputBlock",
    ReportWidget = "ReportWidget",
} 

export interface ComponentDependency {
    readonly type: PluginComponentType; // component type
    readonly gid: string; // gid of component
    readonly version?: string; // version of component
    valid: boolean; // whether this dependency is valid
}

export enum ModelType {
    classification = "classification",
    regression = "regression",
}

export interface InputSchema {
    title: string;
    description: string;
    properties: SchemaProperties;
}

export interface SchemaProperties {
    [key: string]: {
        type: string;
        description: string;
    };
}

export interface Algorithm extends BasePluginComponent {
    type: PluginComponentType.Algorithm;
    readonly modelType: ModelType[]; // AI model types
    readonly requireGroundTruth?: boolean; // whether this algo requires ground truth
    readonly author?: string,
    // readonly version?: string, // Version of the algorithm, default to plugin version if not specificed
    readonly algoPath: string, // path to algo directory, relative to plugins dir
    readonly inputSchema: InputSchema; // input json schema
    readonly outputSchema: object; // output json schema
    readonly requirements: string[]; // python package requirements
}

export enum InputBoxWidths {
    xs="xs",
    sm="sm",
    md="md",
    lg="lg",
    xl="xl"
}

export interface InputBlock extends BaseMDXComponent {
    type: PluginComponentType.InputBlock;
    readonly summaryPath: string, // path to file, relative to plugins dir
    readonly group?: string; // for grouping
    // properties: UserDefinedProperty[],
    width?: InputBoxWidths;
    fullScreen?: boolean;
}

type WidgetSize = {
    maxW: number,
    maxH: number,
    minW: number,
    minH: number,
    // defaultW: number,
    // defaultH: number,
}

export enum ReportWidgetStatus {
    OK="OK",
    Invalid="Invalid",
    MissingDependencies="MissingDependencies",
}

export enum MockDataType {
    Algorithm = "Algorithm",
    InputBlock = "InputBlock"
}

export interface MockData {
    readonly type: MockDataType,
    readonly gid:string,
    readonly data: object,
}

export interface ReportWidget extends BaseMDXComponent {
    type: PluginComponentType.ReportWidget;
    dynamicHeight: boolean;
    readonly dependencies?: ComponentDependency[];
    status: ReportWidgetStatus;
    widgetSize: WidgetSize;
    properties?: UserDefinedProperty[];
    mockdata?: MockData[];
}

export interface ProjectTemplateComponent extends BasePluginComponent {
    id: string; // corresponding mongodb ID
    data: ProjectTemplate;
}

export default interface AIFPlugin {
    type: "AIFPlugin";
    readonly gid: string; // plugin global id
    readonly version: string;
    readonly name: string;
    readonly description?: string;
    readonly author?: string;
    readonly url?: string;
    readonly tags?: string[];
    reportWidgets?: ReportWidget[]; // store gids of report widgets
    inputBlocks?: InputBlock[]; // store gids of report widgets
    algorithms?: Algorithm[]; // store gids of report widgets
    templates?: ProjectTemplateComponent[]; // store gids of report widgets
    isStock: boolean;
    installedAt: number;
}

export type AIFPluginCache = Required<Pick<AIFPlugin, 'algorithms' | 'inputBlocks' | 'reportWidgets' | 'templates'>>