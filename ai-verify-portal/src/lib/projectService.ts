import { ApolloError, gql, useMutation, useSubscription, } from "@apollo/client";

import Project, { ProjectInput, Report } from 'src/types/project.interface';
import ProjectTemplate, { ProjectInformation } from "src/types/projectTemplate.interface";

export const SEARCH_PROJECTS_BY_WORDS_IN_NAME = gql`
    query Query($text: String) {
        projectsByTextSearch(text: $text) {
            id
            template {
                id
                projectInfo {
                    name
                    description
                    company
                }
            }
            createdAt
            updatedAt
            projectInfo {
                name
                description
            }
            report {
                status
            }
        }
    }
`;

export const CREATE_PROJECT = gql`
mutation Mutation($project: ProjectInput!) {
    createProject(project: $project) {
        id
    }
}
`

/**
 * Send apollo mutation to create a new Project.
 * Note: useMutation in order to utilize the common browser client.
 * @param project initial project data
 * @returns Promise with Id of new project on success
 */
type CreateProjectFunction = (project: Partial<Project>) => Promise<string>  
export const useCreateProject = (): CreateProjectFunction => {
    const [createProject, { data, loading, error }] = useMutation(CREATE_PROJECT);
    const fn = (project: Partial<Project>): Promise<string> => {
        return new Promise((resolve, reject) => {
            createProject({
                variables: {
                    project
                },
                onCompleted: (data) => resolve(data.createProject.id),
                onError: (error) => reject(error),
            })    
        })
    }
    return fn;
}

export const CREATE_PROJECT_FROM_TEMPLATE = gql`
mutation Mutation($project: ProjectInput!, $templateId: String!) {
    createProjectFromTemplate(project: $project, templateId: $templateId) {
        id
        projectInfo {
            name
            description
        }
        globalVars {
            key
            value
        }
        pages {
            layouts {
                h
                i
                isBounded
                isDraggable
                isResizable
                maxH
                maxW
                minH
                minW
                resizeHandles
                static
                w
                x
                y
            }
            reportWidgets {
                widgetGID
                key
                layoutItemProperties {
                    justifyContent
                    alignItems
                    textAlign
                    color
                    bgcolor
                }
                properties
            }
        }
    }
}
`

/**
 * Send apollo mutation to create a new Project from template.
 * @param project initial project data
 * @returns Promise with Id of new project on success
 */
type CreateProjectFromTemplateFunction = (project: Partial<Project>, id: string) => Promise<Partial<Project>>  
export const useCreateProjectFromTemplate = (): CreateProjectFromTemplateFunction => {
    const [createProjectFromTemplate, { data, loading, error }] = useMutation(CREATE_PROJECT_FROM_TEMPLATE);
    const fn = (project: Partial<Project>, templateId: string): Promise<Partial<Project>> => {
        return new Promise((resolve, reject) => {
            createProjectFromTemplate({
                variables: {
                    project,
                    templateId
                },
                onCompleted: (data) => resolve(data.createProjectFromTemplate),
                onError: (error) => reject(error),
            })    
        })
    }
    return fn;
}

export const UPDATE_PROJECT = gql`
mutation Mutation($id: ObjectID!, $project: ProjectInput!) {
    updateProject(id: $id, project: $project) {
        id
        projectInfo {
            name
            description
            reportTitle
            company
        }
        globalVars {
            key
            value
        }
        inputBlockData
        testInformationData {
            algorithmGID
            testArguments
        }
        pages {
            layouts {
                h
                i
                isBounded
                isDraggable
                isResizable
                maxH
                maxW
                minH
                minW
                resizeHandles
                static
                w
                x
                y
            }
            reportWidgets {
                widgetGID
                key
                layoutItemProperties {
                    justifyContent
                    alignItems
                    textAlign
                    color
                    bgcolor
                }
                properties
            }
        }
        modelAndDatasets { # 👈TODO - this could be slim 
            groundTruthColumn
            model {
                id
                filename
                filePath
                name
                ctime
                description
                status
                size
                modelType
                serializer
                modelFormat
                errorMessages
                type
            }
            testDataset { 
                id
                filename
                filePath
                name
                type
                ctime
                description
                status
                size
                serializer
                dataFormat
                errorMessages
            }
            groundTruthDataset {
                id
                filename
                filePath
                name
                type
                ctime
                description
                status
                size
                serializer
                dataFormat
                errorMessages
                dataColumns {
                    name
                    label
                }
            }
        }
    }
}
`

/**
 * Send apollo mutation to update a Project.
 * @param id Project ID
 * @param project project data to update
 * @returns Promise with updated Project data
 */
type UpdateProjectFunction = (id: string, project: Partial<ProjectInput>) => Promise<string>  
export const useUpdateProject = (): UpdateProjectFunction => {
    const [updateProject, { data, loading, error }] = useMutation(UPDATE_PROJECT);
    const fn = (id: string, project: Partial<Project>): Promise<string> => {
        return new Promise((resolve, reject) => {
            updateProject({
                variables: {
                    id,
                    project
                },
                onCompleted: (data) => resolve(data.updateProject),
                onError: (error) => reject(error),
            })    
        })
    }
    //@ts-ignore
    return fn;
}

export const DELETE_PROJECT = gql`
mutation Mutation($id: ObjectID!) {
    deleteProject(id: $id)
}
`

/**
 * Send apollo mutation to delete a Project.
 * @param id Project ID
 * @returns Promise with deleted Project ID
 */
 type deleteProjectFunction = (id: string) => Promise<string>  
 export const useDeleteProject = (): deleteProjectFunction => {
     const [deleteProject, { data, loading, error }] = useMutation(DELETE_PROJECT);
     const fn = (id: string): Promise<string> => {
         return new Promise((resolve, reject) => {
            deleteProject({
                 variables: {
                     id,
                 },
                 onCompleted: (data) => resolve(data.deleteProject),
                 onError: (error) => reject(error),
             })    
         })
     }
     return fn;
}

export const CLONE_PROJECT = gql`
mutation Mutation($id: ObjectID!) {
    cloneProject(id: $id) {
        id
        projectInfo {
            name
            description
        }
        globalVars {
            key
            value
        }
        inputBlockData
        testInformationData {
            algorithmGID
            testArguments
        }
        report {
            status
        }
        pages {
            layouts {
                h
                i
                isBounded
                isDraggable
                isResizable
                maxH
                maxW
                minH
                minW
                resizeHandles
                static
                w
                x
                y
            }
            reportWidgets {
                widgetGID
                key
                layoutItemProperties {
                    justifyContent
                    alignItems
                    textAlign
                    color
                    bgcolor
                }
                properties
            }
        }
    }
}
`

/**
 * Send apollo mutation to delete a Project.
 * @param id Project ID
 * @returns Promise with new cloned project
 */
type cloneProjectFunction = (id: string) => Promise<Project>  
export const useCloneProject = (): cloneProjectFunction => {
    const [cloneProject, { data, loading, error }] = useMutation(CLONE_PROJECT);
    const fn = (id: string): Promise<Project> => {
        return new Promise((resolve, reject) => {
            cloneProject({
                variables: {
                    id,
                },
                onCompleted: (data) => resolve(data.cloneProject),
                onError: (error) => reject(error),
            })    
        })
    }
    return fn;
}


export const SAVE_PROJECT_AS_TEMPLATE = gql`
mutation Mutation($projectId: ObjectID!, $templateInfo:ProjectInformationInput!) {
    saveProjectAsTemplate(projectId: $projectId, templateInfo: $templateInfo) {
        id
    }
}
`

/**
 * Send apollo mutation to delete a Project.
 * @param projectId Project ID
 * @param templateInfo Template name and description
 * @returns Promise with new cloned project
 */
type saveProjectAsTemplateFunction = (projectId: string, templateInfo: ProjectInformation) => Promise<ProjectTemplate>  
export const useSaveProjectAsTemplate = (): saveProjectAsTemplateFunction => {
    const [saveProjectAsTemplate, { data, loading, error }] = useMutation(SAVE_PROJECT_AS_TEMPLATE);
    const fn = (projectId: string, templateInfo: ProjectInformation): Promise<ProjectTemplate> => {
        return new Promise((resolve, reject) => {
            saveProjectAsTemplate({
                variables: {
                    projectId,
                    templateInfo,
                },
                onCompleted: (data) => resolve(data.saveProjectAsTemplate),
                onError: (error) => reject(error),
            })    
        })
    }
    return fn;
}



export const GENERATE_REPORT = gql`
mutation Mutation($projectID: ObjectID!, $algorithms: [String]!) {
    generateReport(projectID: $projectID, algorithms: $algorithms) {
        status
    }
}
`

/**
 * Send apollo mutation to generate project report.
 * @param projectID Project ID
 * @returns Promise with returned Report
 */
 type generateReportFunction = (projectID: string, algorithms: string[]) => Promise<Partial<Report>>  
 export const useGenerateReport = (): generateReportFunction => {
     const [generateReport, { data, loading, error }] = useMutation(GENERATE_REPORT);
     const fn = (projectID: string, algorithms: string[]): Promise<Partial<Report>> => {
         return new Promise((resolve, reject) => {
            generateReport({
                 variables: {
                    projectID,
                    algorithms,
                 },
                 onCompleted: (data) => resolve(data.generateReport),
                 onError: (error) => reject(error),
             })    
         })
     }
     return fn;
}


export const CANCEL_TEST_RUNS = gql`
mutation Mutation($projectID: ObjectID!, $algorithms: [String]!) {
    cancelTestRuns(projectID: $projectID, algorithms: $algorithms) {
        projectID
        status
        inputBlockData
        tests {
            algorithmGID
            testArguments
            status
            progress
        }    
    }
}
`

/**
 * Send apollo mutation to cancel test runs.
 * @param projectID Project ID
 * @returns Promise with returned Report
 */
 type cancelTestRunsFunction = (projectID: string, algorithms: string[]) => Promise<Report>  
 export const useCancelTestRuns = (): cancelTestRunsFunction => {
     const [cancelTestRuns, { data, loading, error }] = useMutation(CANCEL_TEST_RUNS);
     const fn = (projectID: string, algorithms: string[]): Promise<Report> => {
         return new Promise((resolve, reject) => {
            cancelTestRuns({
                 variables: {
                    projectID,
                    algorithms,
                 },
                 onCompleted: (data) => resolve(data.cancelTestRuns),
                 onError: (error) => reject(error),
             })    
         })
     }
     return fn;
}

export const TEST_TASK_UPDATED_SUBSCRIPTION = gql`
    subscription testTaskUpdated($projectID: ObjectID!) {
        testTaskUpdated(projectID: $projectID) {
            algorithmGID
            status
            timeStart
            timeTaken
            progress
        }
    }
`;

/**
 * Return subscription for Test Task updates
 * @param projectID Project ID
 * @returns 
 */
export const useSubscribeTestTaskUpdated = (projectID: string) => {
    const { data, loading, error } = useSubscription(
        TEST_TASK_UPDATED_SUBSCRIPTION,
        { variables: { projectID } }
    );
    return [ data, loading, error ];
}


export const REPORT_STATUS_UPDATE_SUBSCRIPTION = gql`
    subscription reportStatusUpdated($projectID: ObjectID!) {
        reportStatusUpdated(projectID: $projectID) {
            status
            timeTaken
            totalTestTimeTaken
        }
    }
`;

/**
 * Return subscription for Test Task updates
 * @param projectID Project ID
 * @returns 
 */
export const useSubscribeReportStatusUpdated = (projectID: string):
    [{reportStatusUpdated: Report} | undefined, boolean, ApolloError | undefined] => {
    const { data, loading, error } = useSubscription<{reportStatusUpdated: Report} | undefined>(
        REPORT_STATUS_UPDATE_SUBSCRIPTION,
        { variables: { projectID } }
    );
    return [ data, loading, error ];
}
