import { loadFilesSync } from '@graphql-tools/load-files';
import { mergeTypeDefs } from '@graphql-tools/merge';
import process from 'node:process';

import path from 'node:path';

const typesArray = loadFilesSync(path.join(process.cwd(), './graphql/modules/**/*.graphql'), { recursive: true })
// console.log("typesArray", typesArray)

const mergedTypeDefs = mergeTypeDefs(typesArray);
export default mergedTypeDefs;
