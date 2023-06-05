import { ReportWidget, InputBlock } from './plugin.interface';
// import { TestInformation } from './test.interface';

export type PropertyMap = {
	[key: string]: string
}

/** Allow some simple customization of the layout item box */
export type LayoutItemProperties = {
	justifyContent?: string
	alignItems?: string
	color?: string
	bgcolor?: string
	textAlign?: 'left' | 'right' | 'center' | 'justify'
}

/** additional properties for widget items in grid */
export type ReportWidgetItem = {
	widget: ReportWidget,
	widgetGID: string, // reference widget GID
	key: string, // layout key
	layoutItemProperties: LayoutItemProperties,
	properties?: PropertyMap,
}

export type Page = {
	layouts: ReactGridLayout.Layout[],
	reportWidgets: ReportWidgetItem[]
}

/*
export interface InputWidgetPropertyData {
	gid: string, // widget gid,
	// userProperties: PropertyData[], // user defined properties
}

export interface InputWidgetPropertyMap {
	[gid: string]: InputWidgetPropertyData;
}

export interface ReportWidgetPropertyData {
	gid: string, // widget gid,
	widgetBoxProperty: PropertyData[], // defined the widget box properties, should be readonly to widget 
	userProperties: PropertyData[], // user defined properties
}

export interface ReportWidgetPropertyMap {
	[gid: string]: ReportWidgetPropertyData;
}
*/

export type GlobalVariable = {
	key: string, // key
	value: string, // value
}

export interface ProjectInformation {
	name: string;
	description?: string;
	reportTitle?: string;
	company?: string;
}

/**
 * Represents the project data.
 */
 export default interface ProjectTemplate {
	id?: string, // project ID, null if new project
	fromPlugin: boolean,
	projectInfo: ProjectInformation;
	// description?: string,
	createdAt?: Date,
	updatedAt?: Date,
	pages: Page[],
	inputBlocks?: InputBlock[], // compute dependencies based on selected report widgets
	inputBlockGIDs?: string[], // compute dependencies based on selected report widgets
	// testInfo?: TestInformation,
	// inputBlocks: string[], // gids of inputblocks
	// inputWidgetProperties?: InputWidgetPropertyMap,
	// reportWidgets: ReportWidget[],
	// reportWidgetProperties: ReportWidgetPropertyMap[], // widget properties
	globalVars: GlobalVariable[],
}