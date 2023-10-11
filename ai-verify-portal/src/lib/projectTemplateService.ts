import { gql, useQuery, useMutation } from '@apollo/client';

import ProjectTemplate from 'src/types/projectTemplate.interface';
// import { GET_PROJECT_TEMPLATES } from 'server/lib/projectServiceBackend';

export const GET_PROJECT_TEMPLATES = gql`
  query Query {
    projectTemplates {
      id
      createdAt
      updatedAt
      projectInfo {
        name
        description
      }
    }
  }
`;

export const useGetProjectTemplates = () => {
  const { data, loading, error } = useQuery(GET_PROJECT_TEMPLATES);
  return [data, loading, error];
};

export const CREATE_PROJECT_TEMPLATE = gql`
  mutation Mutation($projectTemplate: ProjectTemplateInput!) {
    createProjectTemplate(projectTemplate: $projectTemplate) {
      id
    }
  }
`;

/**
 * Send apollo mutation to create a new ProjectTemplate.
 * Note: useMutation in order to utilize the common browser client.
 * @param projectTemplate initial projectTemplate data
 * @returns Promise with Id of new projectTemplate on success
 */
type CreateProjectFunction = (
  projectTemplate: Partial<ProjectTemplate>
) => Promise<string>;
export const useCreateProjectTemplate = (): CreateProjectFunction => {
  const [createProjectTemplate] = useMutation(CREATE_PROJECT_TEMPLATE);
  const fn = (projectTemplate: Partial<ProjectTemplate>): Promise<string> => {
    return new Promise((resolve, reject) => {
      createProjectTemplate({
        variables: {
          projectTemplate,
        },
        onCompleted: (data) => resolve(data.createProjectTemplate.id),
        onError: (error) => reject(error),
      });
    });
  };
  return fn;
};

export const UPDATE_PROJECT_TEMPLATE = gql`
  mutation Mutation($id: ObjectID!, $projectTemplate: ProjectTemplateInput!) {
    updateProjectTemplate(id: $id, projectTemplate: $projectTemplate) {
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
      pages {
        layouts {
          h
          i
          maxH
          maxW
          minH
          minW
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
`;

/**
 * Send apollo mutation to update a ProjectTemplate.
 * @param id ProjectTemplate ID
 * @param projectTemplate projectTemplate data to update
 * @returns Promise with updated ProjectTemplate data
 */
type UpdateProjectTemplateFunction = (
  id: string,
  projectTemplate: Partial<ProjectTemplate>
) => Promise<string>;
export const useUpdateProjectTemplate = (): UpdateProjectTemplateFunction => {
  const [updateProjectTemplate] = useMutation(UPDATE_PROJECT_TEMPLATE);
  const fn = (
    id: string,
    projectTemplate: Partial<ProjectTemplate>
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      updateProjectTemplate({
        variables: {
          id,
          projectTemplate,
        },
        onCompleted: (data) => resolve(data.updateProjectTemplate),
        onError: (error) => reject(error),
      });
    });
  };
  return fn;
};

export const DELETE_PROJECT_TEMPLATE = gql`
  mutation Mutation($id: ObjectID!) {
    deleteProjectTemplate(id: $id)
  }
`;

/**
 * Send apollo mutation to delete a ProjectTemplate.
 * @param id ProjectTemplate ID
 * @returns Promise with deleted ProjectTemplate ID
 */
type deleteProjectFunction = (id: string) => Promise<string>;
export const useDeleteProjectTemplate = (): deleteProjectFunction => {
  const [deleteProjectTemplate] = useMutation(DELETE_PROJECT_TEMPLATE);
  const fn = (id: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      deleteProjectTemplate({
        variables: {
          id,
        },
        onCompleted: (data) => resolve(data.deleteProjectTemplate),
        onError: (error) => reject(error),
      });
    });
  };
  return fn;
};

export const CLONE_PROJECT_TEMPLATE = gql`
  mutation Mutation($id: ObjectID!) {
    cloneProjectTemplate(id: $id) {
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
          maxH
          maxW
          minH
          minW
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
`;

/**
 * Send apollo mutation to delete a ProjectTemplate.
 * @param id ProjectTemplate ID
 * @returns Promise with new cloned projectTemplate
 */
type cloneProjectTemplateFunction = (id: string) => Promise<ProjectTemplate>;
export const useCloneProjectTemplate = (): cloneProjectTemplateFunction => {
  const [cloneProjectTemplate] = useMutation(CLONE_PROJECT_TEMPLATE);
  const fn = (id: string): Promise<ProjectTemplate> => {
    return new Promise((resolve, reject) => {
      cloneProjectTemplate({
        variables: {
          id,
        },
        onCompleted: (data) => resolve(data.cloneProjectTemplate),
        onError: (error) => reject(error),
      });
    });
  };
  return fn;
};

export function exportTemplate(
  templateId: string,
  pluginGID: string,
  templateCID: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const options = {
      method: 'POST',
      Headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        templateId,
        pluginGID,
        templateCID,
      }),
    };
    fetch('/api/template/export', options)
      .then(async (res) => {
        if (res.status != 200)
          return reject('HTTP request error ' + res.status);
        const content = res.headers.get('content-disposition');
        if (!content) return reject('Missing content-deposition header');
        const found = content.match(/attachment;\s*filename=(.+)/i);
        if (!found) return reject('Missing content-deposition filename');
        const filename = found[1];
        const blob = await res.blob();
        const href = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = href;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        resolve('ok');
      })
      .catch((err) => {
        console.log(err);
        reject('Fetch Error');
      });
  });
}
