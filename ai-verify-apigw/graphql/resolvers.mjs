// import { loadFilesSync } from '@graphql-tools/load-files';
import { mergeResolvers } from '@graphql-tools/merge';

import MyScalars from './modules/scalars/index.mjs';
import ProjectResolvers from './modules/project/project.mjs';
import DatasetResolvers from './modules/assets/dataset.mjs';
import ModelResolvers from './modules/assets/model.mjs';
import ProjectTemplateResolvers from './modules/project/projectTemplate.mjs';
import NotificationResolvers from './modules/notification/notification.mjs';

// const resolversArray = loadFilesSync(path.join(process.cwd(), 'server/graphql/modules/**/*.ts'), { recursive: true })
// console.log("resolversArray", resolversArray)
// const resolvers = mergeResolvers(resolversArray);
const resolvers = mergeResolvers([MyScalars, ProjectResolvers, ProjectTemplateResolvers, DatasetResolvers, ModelResolvers, NotificationResolvers]);

export default resolvers;