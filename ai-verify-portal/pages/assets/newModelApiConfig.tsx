import { GetServerSideProps } from 'next';
import { getAllModelNames } from 'server/lib/assetServiceBackend';
import {
  NewModelApiConfigModule,
  NewModelApiConfigModuleProps,
} from 'src/modules/assets/modelAPIComponent';

export const getServerSideProps: GetServerSideProps<
  NewModelApiConfigModuleProps
> = async ({ query }) => {
  const allConfigNames = await getAllModelNames();
  const from = query.from as string;
  const projectId = query.projectId as string;
  if (from !== undefined && projectId !== undefined) {
    return {
      props: {
        entryPoint: from,
        currentProjectId: projectId,
        allConfigNames,
      },
    };
  }
  return {
    props: {
      allConfigNames,
    },
  };
};

export default function NewModelApiConfigPage({
  entryPoint,
  currentProjectId,
  allConfigNames,
}: NewModelApiConfigModuleProps) {
  if (entryPoint !== undefined && currentProjectId !== undefined) {
    return (
      <NewModelApiConfigModule
        allConfigNames={allConfigNames}
        entryPoint={entryPoint}
        currentProjectId={currentProjectId}
      />
    );
  }
  return <NewModelApiConfigModule allConfigNames={allConfigNames} />;
}
