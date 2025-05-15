import { useParams, useSearchParams } from 'next/navigation';
import React, { createContext, useContext, useState } from 'react';
// import { InputBlock } from '@/app/types';

type InputBlockDataType = {
  [key: string]: unknown;
};

type InputBlockDataContextType = {
  data: InputBlockDataType;
  setData: (data: InputBlockDataType) => void;
  gid: string | undefined;
  cid: string | undefined;
  id: string | null;
};

const InputBlockDataContext = createContext<
  InputBlockDataContextType | undefined
>(undefined);

// const getInputBlock = async (
//   gid: string | undefined,
//   cid: string | undefined
// ) => {
//   if (!gid || !cid) {
//     return null;
//   }
//   try {
//     const plugin = await getPlugin(gid);
//     if (!plugin || !plugin.input_blocks) {
//       return null;
//     }
//     const ib = plugin.input_blocks.find(
//       (ib) => ib.cid === cid
//     ) as InputBlock | null;
//     return ib || null;
//   } catch {
//     return null;
//   }
//   // find cid
// };

export const InputBlockDataProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [data, setData] = useState<InputBlockDataType>({});
  // const [meta, setMeta] = useState<InputBlock | null>(null);
  const { gid, cid } = useParams() as {
    gid: string | undefined;
    cid: string | undefined;
  };
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  // const meta = use(getInputBlock(gid, cid));

  if (id) {
  }

  return (
    <InputBlockDataContext.Provider value={{ data, setData, gid, cid, id }}>
      {children}
    </InputBlockDataContext.Provider>
  );
};

export const useInputBlockData = () => {
  const context = useContext(InputBlockDataContext);
  if (!context) {
    throw new Error(
      'useInputBlockData must be used within an InputBlockDataProvider'
    );
  }
  return context;
};
