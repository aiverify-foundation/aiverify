import { getAllModelNames } from 'server/lib/assetServiceBackend';
import {
  NewModelApiConfigModule,
  NewModelApiConfigModuleProps,
} from 'src/modules/assets/modelAPIComponent';

export async function getServerSideProps() {
  const allConfigNames = await getAllModelNames();
  return {
    props: {
      allConfigNames,
    },
  };
}

export default function NewModelApiConfigPage({
  allConfigNames,
}: NewModelApiConfigModuleProps) {
  return <NewModelApiConfigModule allConfigNames={allConfigNames} />;
}
