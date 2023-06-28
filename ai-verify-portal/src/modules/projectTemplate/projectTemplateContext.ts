import { useReducer, useCallback, useState, useMemo, Dispatch, SetStateAction } from 'react';
import * as _ from 'lodash';
import moment from 'moment';

import ProjectTemplate, { ProjectInformation, Page, ReportWidgetItem, GlobalVariable } from 'src/types/projectTemplate.interface';
import { InputBlock, Algorithm, ComponentDependency } from 'src/types/plugin.interface';
import { WidgetProperties, useWidgetProperties } from 'src/lib/canvasUtils';

import PluginManagerType from 'src/types/pluginManager.interface';
import { useCreateProjectTemplate, useUpdateProjectTemplate, exportTemplate as myexportTemplate } from 'src/lib/projectTemplateService';
import { useCreateProject, useUpdateProject, useSaveProjectAsTemplate } from 'src/lib/projectService';



export enum UpdateActionTypes {
	UPDATE = 'UPDATE',
}

export type DataUpdateActions<Type> = {
	type: UpdateActionTypes,
	payload: Partial<Type>,
	updateFn?: _.DebouncedFunc<(id: string|undefined, state: Type) => void>
}

export enum ARUActionTypes {
	ADD = 'ADD',
	REMOVE = 'REMOVE',
	UPDATE = 'UPDATE',
	REPLACE = 'REPLACE',
	INSERT = 'INSERT',
	MOVE = 'MOVE',
}

export type ARUActions<Type> = {
	type: ARUActionTypes,
	index?: number,
	index2?: number,
	payload?: Type|Partial<Type>,
	payloadArray?: Type[],
	updateFn?: _.DebouncedFunc<(id: string|undefined, state: Type[]) => void>
}

export enum MapActionTypes {
	SET = 'SET',
	UNSET = 'UNSET',
}

export type GenericMap<Type> = {
	[key:string]: Type
}

export type MapActions<Type> = {
	type: MapActionTypes;
	key: string;
	payload?: Partial<Type>;
	updateFn?: _.DebouncedFunc<(id: string|undefined, state: GenericMap<Type>) => void>
}

type dependency2ReportWidgetsMapType = { [gid: string]:  ReportWidgetItem[] }

export type DependencyList = {
	inputBlocks: InputBlock[];
	algorithms: Algorithm[];
	missing: Partial<ComponentDependency>[];
}

export interface ProjectTemplateStore {
	updateReducer: <Type>(state: Type, action: DataUpdateActions<Type>) => Type;
	mapReducer: <Type>(state: GenericMap<Type>, action: MapActions<Type>) => GenericMap<Type>;
	setLastSavedTime: Dispatch<SetStateAction<moment.Moment | null>>;
	setIsNew: Dispatch<SetStateAction<boolean>>;
	setId: Dispatch<SetStateAction<string | undefined>>;
	projectMode: boolean;
	isNew: boolean;
	id: string|undefined;
	lastSavedTime: moment.Moment | null;
	fromPlugin: boolean;
	isReadonly: boolean;
	widgetProperties: WidgetProperties;
	pluginManager: PluginManagerType;
	projectInfo: ProjectInformation;
	dispatchProjectInfo: Dispatch<DataUpdateActions<ProjectInformation>>;
	pages: Page[];
	dispatchPages: Dispatch<ARUActions<Page>>;
	globalVars: GlobalVariable[];
	dispatchGlobalVars: Dispatch<ARUActions<GlobalVariable>>;
	// inputBlocks: InputBlock[];
	// algorithms: Algorithm[];
	dependencies: DependencyList;
	// dispatchInputBlocks: Dispatch<ARUActions<InputBlock>>;
	dependency2ReportWidgetsMap: dependency2ReportWidgetsMapType;
	addReportWidget: (reportWidget: ReportWidgetItem) => void;
	removeReportWidget: (reportWidget: ReportWidgetItem) => void;
	deletePage: (pageIdx: number) => void;
	widgetBundleCache: GenericMap<any>;
	dispatchWidgetBundleCache:  Dispatch<MapActions<any>>;
	reportWidgetComponents: GenericMap<any>;
	dispatchReportWidgetComponents:  Dispatch<MapActions<any>>;
	createProjectTemplate: () => Promise<string>;
	saveProjectAsTemplate: (templateInfo: ProjectInformation) => Promise<string>;
	exportTemplate: (pluginGID: string, templateCID: string) => Promise<string>;
	flushAllUpdates: () => void;
}

/**
 * Represents the project context to be passed to child components
 */
export const DEBOUNCE_WAIT = 5000; // in ms
export function useProjectTemplateStore(data: ProjectTemplate, pluginManager: PluginManagerType, projectMode = false): ProjectTemplateStore {
	const [ isNew, setIsNew ] = useState<boolean>(!!!data.id);
	const [ id, setId ] = useState<string|undefined>(data.id);
	const [ lastSavedTime, setLastSavedTime ] = useState<moment.Moment|null>(null)
	const [ fromPlugin, setFromPlugin ] = useState<boolean>(data.fromPlugin);
	const isReadonly = useMemo<boolean>(() => {
		return !projectMode && data.fromPlugin;
	}, [data, projectMode]);

	/**
	 * Reducers
	 * Note: React expects reducers to be pure. Gets called twice in Strict mode in development. Need to be careful with callbacks.
	 */

	function updateReducer<Type>(state: Type, action: DataUpdateActions<Type>):Type {
		// console.log("projectInfoReducer", state, action)
		switch(action.type) {
			case UpdateActionTypes.UPDATE:
				const newState = {
					...state,
					...action.payload,
				}
				if (action.updateFn)
					action.updateFn(id, newState as Type)
				return newState;
			default:
				throw new Error("Invalid action");
		}
	} // updateReducer

	function arrayReducer<Type>(state: Type[], action: ARUActions<Type>):Type[] {
		switch(action.type) {
			case ARUActionTypes.ADD:
				if (!action.payload)
					throw new Error("Missing payload");
				const newState = [
					...state,
					action.payload as Type,
				] as Type[]
				// console.log("newState", JSON.stringify(newState))
				if (action.updateFn)
					action.updateFn(id, newState as Type[]);
				return newState;
			case ARUActionTypes.INSERT:
				if (!action.payload)
					throw new Error("Missing payload");
				if (_.isNil(action.index))
					throw new Error("Missing index");
				const newState3 = [
					...state,
				] as Type[]
				newState3.splice(action.index, 0, action.payload as Type )
				if (action.updateFn)
					action.updateFn(id, newState3 as Type[]);
				return newState3;
			case ARUActionTypes.MOVE:
				if (_.isNil(action.index))
					throw new Error("Missing index");
				if (_.isNil(action.index2))
					throw new Error("Missing index2");
				const newState4 = [
					...state,
				] as Type[]
				const removedItem = newState4.splice(action.index, 1 );
				newState4.splice(action.index2, 0, removedItem[0] as Type);
				if (action.updateFn)
					action.updateFn(id, newState4 as Type[]);
				return newState4;
			case ARUActionTypes.REMOVE:
				if (_.isNil(action.index))
					throw new Error("Missing index");
				// console.log("before slice", JSON.stringify(state))
				// state.splice(action.index, 1);
				// console.log("after slice", JSON.stringify(state))
				const newState2 = [...state,]; // clone the array
				newState2.splice(action.index, 1);
				if (action.updateFn)
					action.updateFn(id, newState2 as Type[]);
				return newState2;
			case ARUActionTypes.UPDATE:
				// console.log("ACTION UPDATE", action, state.length)
				if (_.isNil(action.index) || !action.payload)
					throw new Error("Missing index or payload");
				if (action.index < 0 || action.index >= state.length)
					return state;
				state[action.index] = {
					...state[action.index],
					...action.payload,
				};
				if (action.updateFn)
					action.updateFn(id, state as Type[]);
				// console.log("updateState", JSON.stringify(state))
				return state;
			case ARUActionTypes.REPLACE:
				if (!action.payloadArray)
					throw new Error("payload");
				if (action.updateFn)
					action.updateFn(id, action.payloadArray);
				// console.log("updateState", JSON.stringify(state))
				return action.payloadArray as Type[];	
			default:
				throw new Error("Invalid action");
		}
	} // arrayReducer

	function mapReducer<Type>(state: GenericMap<Type>, action: MapActions<Type>): GenericMap<Type> {
		// console.log("projectInfoReducer", state, action)
		switch(action.type) {
			case MapActionTypes.SET:
				if (!action.key || !action.payload)
					return state;
				const newPayload = {
					...state[action.key] || {},
					...action.payload,
				} as Type;
				const newState2 = {
					...state,
					[action.key]: newPayload,
				}
				if (action.updateFn)
					action.updateFn(id, newState2);
				return newState2;
			case MapActionTypes.UNSET:
				if (!action.key)
					return state;
				const newState = _.cloneDeep(state) as GenericMap<Type>;
				delete newState[action.key];
				if (action.updateFn)
					action.updateFn(id, newState);
				return newState;
			default:
				throw new Error("Invalid action");
		}
	} // mapReducer

	
	const updateProjectFn = projectMode ? useUpdateProject() : useUpdateProjectTemplate();

	/** create the reducers */

	// @ts-ignore
	const [projectInfo, _dispatchProjectInfo] = useReducer(updateReducer<ProjectInformation>,{
		...data.projectInfo,
		// name: "Test Project Name",
		// description: "Test Project Description",
	});
	const _sendProjectInfoUpdates = useCallback(
		_.debounce((id: string|undefined, state: ProjectInformation) => {
			// console.log("Updating page", id, pages);
			if (!id || id.length == 0)
				return;
			if (isNew) // project create don't update first
				return;
			// console.log("sending info update to api");
			const data = _.pick(state, [ "name", "description", "reportTitle", "company" ]);
			updateProjectFn(id, { projectInfo:data }).then(() => {
				// console.log("updated proj", proj);
				setLastSavedTime(moment());
			}).catch(err => {
				console.error("Update Info error:", err);
			});	
		}, DEBOUNCE_WAIT), []
	)

	const dispatchProjectInfo = (action: DataUpdateActions<ProjectInformation>) => {
		// console.log("dispatchPages", id, action)
		_dispatchProjectInfo({
			...action,
			updateFn: _sendProjectInfoUpdates,
		});
	}


	// @ts-ignore
	/*
	const [modelAndDatasets, _dispatchModelAndDatasets] = useReducer(updateReducer<ModelAndDatasets>, data.modelAndDatasets || {});
	const _sendModelAndDatasets = useCallback(
		_.debounce((id: string|undefined, state: ModelAndDatasets) => {
			// console.log("Updating page", id, pages);
			if (!id || id.length == 0)
				return;
			const data = _.pick(state, [ "model", "testDataset", "groundTruthDataset", "groundTruthColumn"]);
			updateProjectFn(id, { modelAndDatasets: data }).then(proj => {
				setLastSavedTime(moment());
			}).catch(err => {
				console.error("Update Info error:", err);
			});	
		}, DEBOUNCE_WAIT), []
	)

	const dispatchModelAndDatasets = (action: DataUpdateActions<ModelAndDatasets>) => {
		_dispatchModelAndDatasets({
			...action,
			updateFn: _sendModelAndDatasets,
		});
	}
	*/

	// @ts-ignore
	const [pages, _dispatchPages] = useReducer(arrayReducer<Page>, data.pages || []);
	const _sendPageUpdates = useCallback(
		_.debounce((id: string|undefined, pages: Page[]) => {
			if (!id || id.length == 0)
				return;
			const _pages = pages.map(page => {
				const data = _.pick(page, [ "layouts", "reportWidgets" ]);
				data.layouts = data.layouts.map(layout => {
					const l = _.pick(layout, [ "h", "i", "isBounded", "isDraggable", "isResizable", "maxH", "maxW", "minH", "minW", "resizeHandles", "static", "w", "x", "y" ])
					return l;
				}) as ReactGridLayout.Layout[];
				data.reportWidgets = data.reportWidgets.map(item => {
					const ret =  _.pick(item, [ "widgetGID", "key", "layoutItemProperties", "properties" ]);
					if (item.layoutItemProperties)
						ret.layoutItemProperties = _.pick(item.layoutItemProperties, [
							"textAlign",
							"justifyContent",
							"alignItems",
							"color",
							"bgcolor"
						])
					return ret;
				}) as ReportWidgetItem[]
				return data;
			}) as Page[]
			updateProjectFn(id, { pages:_pages }).then(() => {
				// console.log("updated proj", proj);
				setLastSavedTime(moment());
			}).catch(err => {
				console.error("Update page error", err);
			});
		}, DEBOUNCE_WAIT), []
	)

	const dispatchPages = (action: ARUActions<Page>) => {
		_dispatchPages({
			...action,
			updateFn: _sendPageUpdates,
		});
	}

	// @ts-ignore
	const [globalVars, _dispatchGlobalVars] = useReducer(arrayReducer<GlobalVariable>,data.globalVars || []);
	const _sendGlobalVarsUpdates = useCallback(
		_.debounce((id: string|undefined, globalVars: GlobalVariable[]) => {
			// console.log("Updating page", id, pages);
			if (!id || id.length == 0)
				return;
			const _globalVars = globalVars.map(item => {
				return _.pick(item, [ "key", "value" ]);
			}) as GlobalVariable[]
			updateProjectFn(id, { globalVars:_globalVars }).then(() => {
				// console.log("updated proj", proj);
				setLastSavedTime(moment());
			}).catch(err => {
				console.error("Update global vars error", err);
			});
		}, DEBOUNCE_WAIT), []
	)
	const dispatchGlobalVars = (action: ARUActions<GlobalVariable>) => {
		// console.log("dispatchPages", id, action)
		_dispatchGlobalVars({
			...action,
			updateFn: _sendGlobalVarsUpdates,
		});
	}

	const widgetProperties = useWidgetProperties({
		projectInfo,
		globalVars,
	});

	const [dependency2ReportWidgetsMap, setDependency2ReportWidgetsMap] = useState<dependency2ReportWidgetsMapType>(() => {
		const mymap = {} as dependency2ReportWidgetsMapType;
		for (const page of data.pages) {
			for (const item of page.reportWidgets) {
				if (item.widget && item.widget.dependencies) {
					for (const dep of item.widget.dependencies) {
						// console.log("dep", dep);
						if (mymap[dep.gid]) {
							const item2 = mymap[dep.gid].find(e => e.key === item.key) as ReportWidgetItem|undefined;
							if (!item2) {
								mymap[dep.gid].push(item);
							}
						} else {
							mymap[dep.gid] = [item];
						}
					}
				}
			}
		}
		// console.log("mymap", mymap)
		return mymap;
	});

	/*
	const inputBlocks = useMemo<InputBlock[]>(() => {
		// console.log("Compute inputBlocks")
		return Object.keys(dependency2ReportWidgetsMap).reduce((acc, gid) => {
			const comp = pluginManager.inputBlocks.find(e => e.gid === gid);
			if (comp && comp.type === 'InputBlock')
				acc.push(comp as InputBlock);
			// else
			// 	console.log("Invalid or missing input block", gid);
			return acc;
		},[] as InputBlock[]);
	}, [dependency2ReportWidgetsMap])

	const algorithms = useMemo<Algorithm[]>(() => {
		// console.log("Compute inputBlocks")
		return Object.keys(dependency2ReportWidgetsMap).reduce((acc, gid) => {
			const comp = pluginManager.algorithms.find(e => e.gid === gid);
			if (comp && comp.type === 'Algorithm') {
				// console.log("algo comp", comp)
				acc.push(comp as Algorithm);
			}
			return acc;
		},[] as Algorithm[]);
	}, [dependency2ReportWidgetsMap])
	*/

	const dependencies = useMemo<DependencyList>(() => {
		return Object.keys(dependency2ReportWidgetsMap).reduce((acc, gid) => {
			let comp = pluginManager.algorithms.find(e => e.gid === gid) as any;
			if (!comp)
				comp = pluginManager.inputBlocks.find(e => e.gid === gid) as any;
			if (comp) {
				switch (comp.type as string) {
					case "Algorithm":
						acc.algorithms.push(comp as Algorithm);
						break;
					case "InputBlock":
						acc.inputBlocks.push(comp as InputBlock);
						break;
				}
			} else {
				acc.missing.push({
					gid
				});
			}
			return acc;
		}, {
			algorithms: [],
			inputBlocks: [],
			missing: [],
		} as DependencyList);
	}, [dependency2ReportWidgetsMap])

	const addReportWidget = (reportWidget: ReportWidgetItem): void => {
		// console.log("addReportWidget", reportWidget)
		if (!reportWidget.widget.dependencies || reportWidget.widget.dependencies.length == 0)
			return;
		let ibMap = null as dependency2ReportWidgetsMapType|null;
		for (const dep of reportWidget.widget.dependencies) {
			let comp = pluginManager.inputBlocks.find(e => e.gid === dep.gid) as any;
			if (!comp) {
				comp = pluginManager.algorithms.find(e => e.gid === dep.gid);
			}
			if (!comp) {
				console.error("Cannot find component", dep);
				continue;
			}
			// if (comp.type === PluginComponentType.InputBlock) {
			// 	let ib = inputBlocks.find(e => e.gid === dep.gid)
			// 	if (!ib) { // dependency not exists
			// 		dispatchInputBlocks({ type:ARUActionTypes.ADD, payload:comp })
			// 	}
			// }
			if (!ibMap)
				ibMap =  _.cloneDeep(dependency2ReportWidgetsMap)
			if (ibMap[dep.gid]) {
				const item = ibMap[dep.gid].find(e => e.key === reportWidget.key) as ReportWidgetItem|undefined;
				if (!item) {
					ibMap[dep.gid].push(reportWidget);
				}
			} else {
				ibMap[dep.gid] = [reportWidget];
			}
		}
		if (ibMap)
			setDependency2ReportWidgetsMap(ibMap);
	}

	const removeReportWidget = (reportWidget: ReportWidgetItem): void => {
		if (!reportWidget.widget ||
			!reportWidget.widget.dependencies ||
			reportWidget.widget.dependencies.length == 0) return;
		let ibMap: dependency2ReportWidgetsMapType | null = null;
		for (const dep of reportWidget.widget.dependencies) {
			if (!dependency2ReportWidgetsMap[dep.gid]) {
				continue;
			}
			if (!ibMap)
				ibMap = _.cloneDeep(dependency2ReportWidgetsMap);
			const idx = ibMap[dep.gid].findIndex(e => e.key === reportWidget.key);
			if (idx < 0) {
				continue;
			}
			if (!ibMap)
				ibMap = _.cloneDeep(dependency2ReportWidgetsMap);
			ibMap[dep.gid].splice(idx, 1);
			if (ibMap[dep.gid].length == 0) {
				delete ibMap[dep.gid]
			}
		}
		if (ibMap)
			setDependency2ReportWidgetsMap(ibMap);
	}

	// recompute widget dependencies on page delete
	const deletePage = (pageIdx: number) => {
    const page = pages[pageIdx];
		let ibMap = null as dependency2ReportWidgetsMapType|null;
		// let tmpInputBlocks = null as InputBlock[] | null; 
    for (const reportWidget of page.reportWidgets) {
			if (!reportWidget.widget)
				continue;
      if (!reportWidget.widget.dependencies || reportWidget.widget.dependencies.length == 0)
				continue;
			for (const dep of reportWidget.widget.dependencies) {
				if (!dependency2ReportWidgetsMap[dep.gid]) {
					continue;
				}
				if (!ibMap)
					ibMap = _.cloneDeep(dependency2ReportWidgetsMap);
				const idx = ibMap[dep.gid].findIndex(e => e.key === reportWidget.key);
				if (idx < 0) {
					continue;
				}
				if (!ibMap)
					ibMap = _.cloneDeep(dependency2ReportWidgetsMap);
				ibMap[dep.gid].splice(idx, 1);
				if (ibMap[dep.gid].length == 0) {
					delete ibMap[dep.gid];
					// remove input block
					// if (!tmpInputBlocks)
					// 	tmpInputBlocks = _.cloneDeep(inputBlocks)
					// const idx2 = tmpInputBlocks.findIndex(e => e.gid == dep.gid);
					// if (idx2 >= 0) {
					// 	tmpInputBlocks.splice(idx2, 1)
					// }
				}
			}
    }
		if (ibMap)
			setDependency2ReportWidgetsMap(ibMap)
		// if (tmpInputBlocks)
		// 	dispatchInputBlocks({ type:ARUActionTypes.REPLACE, payloadArray:tmpInputBlocks })
    // projectStore.dispatchPages({ type:ARUActionTypes.REMOVE, index:pageIdx })
	}

	// store the widget MDX bundle
	// @ts-ignore
	const [widgetBundleCache, dispatchWidgetBundleCache] = useReducer(mapReducer<any>, {});

	// store the report widget components built from MDX
	// @ts-ignore
	const [reportWidgetComponents, dispatchReportWidgetComponents] = useReducer(mapReducer<any>, {});

	const createProjectTemplateFn = projectMode?useCreateProject():useCreateProjectTemplate();
	const createProjectTemplate = () => {
		return new Promise<string>((resolve, reject) => {
			const project = {
				projectInfo,
				pages: [],
			}
			createProjectTemplateFn(project).then((result: string) => {
				setId(result);
				setIsNew(false);
				setLastSavedTime(moment())
				resolve(result);
			}).catch(err => {
				reject(err);
			})
	
		})
	}

	const saveProjectAsTemplateFn = useSaveProjectAsTemplate();
	const saveProjectAsTemplate = (templateInfo: ProjectInformation) => {
		return new Promise<string>((resolve, reject) => {
			saveProjectAsTemplateFn(id as string, templateInfo).then((result: ProjectTemplate) => {
				resolve(result.id as string);
			}).catch(err => {
				reject(err);
			})
	
		})
	}

	const exportTemplate = (pluginGID: string, templateCID: string) => {
		return myexportTemplate(id as string, pluginGID, templateCID);
	}

	const _allDebounceFns = [
		_sendProjectInfoUpdates,
		_sendPageUpdates,
		_sendGlobalVarsUpdates,
	]

	// flush all updates
	const flushAllUpdates = (): void => {
		for (const fn of _allDebounceFns) {
			fn.flush();
		}
	}

	return {
		updateReducer,
		mapReducer,
		setLastSavedTime,
		fromPlugin,
		isReadonly,
		setIsNew,
		setId,
		id,
		projectMode,
		isNew,
		lastSavedTime,
		widgetProperties,
		pluginManager,
		projectInfo,
		dispatchProjectInfo,
		pages,
		dispatchPages,
		globalVars,
		dispatchGlobalVars,
		// inputBlocks,
		// algorithms,
		dependencies,
		dependency2ReportWidgetsMap,
		addReportWidget,
		removeReportWidget,
		deletePage,
		widgetBundleCache,
		dispatchWidgetBundleCache,
		reportWidgetComponents,
		dispatchReportWidgetComponents,
		createProjectTemplate,
		saveProjectAsTemplate,
		exportTemplate,
		flushAllUpdates,
	}
}