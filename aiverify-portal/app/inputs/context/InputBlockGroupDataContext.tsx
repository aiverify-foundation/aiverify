// import { useParams } from 'next/navigation';
import { debounce } from 'lodash';
import { useParams, useSearchParams } from 'next/navigation';
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useTransition,
} from 'react';
import {
  Plugin,
  InputBlock,
  InputBlockGroupData,
  InputBlockDataPayload,
  InputBlockGroupDataChild,
} from '@/app/types';

type InputBlockGroupDataChildUpdate = {
  cid: string;
  data: InputBlockDataPayload;
};

type InputBlockGroupDataUpdate = {
  // id: number;
  gid: string;
  name: string;
  group: string;
  input_blocks: InputBlockGroupDataChildUpdate[];
};

async function getInputBlocks(gid: string, group: string) {
  const res = await fetch(`/api/plugins/${gid}`);
  if (!res.ok) {
    return null;
  }
  const plugin: Plugin = await res.json();
  if (!plugin.input_blocks) return [];
  const iblist = plugin.input_blocks.filter((x) => x.group == group);
  return iblist.sort((a, b) => {
    return (a.groupNumber || 0) - (b.groupNumber || 0);
  });
}

async function getInputBlockGroupDataByGidGroup(
  gid: string,
  group: string
): Promise<InputBlockGroupData[] | null> {
  const endpointUrl = `/api/input_block_data/groups/${gid}/${encodeURI(group)}`;
  // console.log('endpointUrl:', endpointUrl);

  try {
    const res = await fetch(endpointUrl, { cache: 'no-cache' });

    if (!res.ok) {
      const responseText = await res.text();
      console.error(`Failed to fetch input block group data - ${responseText}`);
      throw new Error(
        `Failed to fetch input block group data - ${responseText}`
      );
    }

    return res.json();
  } catch (error) {
    console.error(
      'Error fetching input block group data by gid and group:',
      error
    );
    return null;
  }
}

export type GetInputBlockDataReturnType = {
  inputBlock: InputBlock;
  ibdata: InputBlockGroupDataChild;
};
export type InputBlockGroupDataContextType = {
  gid: string;
  group: string;
  groupId: number | undefined;
  cid: string | undefined;
  name: string | undefined;
  groupDataList: InputBlockGroupData[] | null;
  inputBlocks: InputBlock[] | null;
  currentGroupData: InputBlockGroupData | null;
  setInputBlockData: (cid: string, data: InputBlockDataPayload) => void;
  setName: (name: string) => void;
  getInputBlockData: (cid: string) => GetInputBlockDataReturnType | null;
  getGroupDataById: () => InputBlockGroupData | null;
  newGroupData: InputBlockGroupDataUpdate;
  updateNewGroupData: (cid: string, data: InputBlockDataPayload) => void;
  saveNewGroupData: () => Promise<void>;
  projectId: string | null;
  flow: string | null;
};

const InputBlockGroupDataContext = createContext<
  InputBlockGroupDataContextType | undefined
>(undefined);

export const InputBlockGroupDataProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const params = useParams<{
    gid: string;
    group: string;
    groupId: string | undefined;
    cid: string | undefined;
    name: string | undefined;
  }>();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');
  const flow = searchParams.get('flow');

  const { gid, group, cid } = params;
  const groupId = params.groupId ? parseInt(params.groupId) : undefined;
  const [inputBlocks, setInputBlocks] = useState<InputBlock[]>([]);
  const [groupDataList, setGroupDataList] = useState<InputBlockGroupData[]>([]);
  const [currentGroupData, setCurrentGroupData] =
    useState<InputBlockGroupData | null>(null);
  const [newGroupData, setNewGroupData] = useState<InputBlockGroupDataUpdate>({
    gid,
    name: group,
    group: group,
    input_blocks: [],
  });
  const [, startTransition] = useTransition();

  useEffect(() => {
    console.log('InputBlockGroupDataProvider', gid, group);
    if (gid && group) {
      const decodedGID = decodeURI(gid);
      const decodedGroup = decodeURI(group);
      startTransition(async () => {
        try {
          const ib = await getInputBlocks(decodedGID, decodedGroup);
          setInputBlocks(ib || []);
        } catch (e) {
          console.log('Error getting data:', e);
          setInputBlocks([]);
        }
      });
      startTransition(async () => {
        try {
          const groupData = await getInputBlockGroupDataByGidGroup(
            decodedGID,
            decodedGroup
          );
          if (!groupData) {
            throw new Error('Unable to get Group Data');
          }
          // console.log('TEST', decodedGID, decodedGroup, groupData);
          setGroupDataList(groupData);
          if (groupId) {
            const ibdata = groupData.find((x) => x.id == groupId);
            setCurrentGroupData(ibdata || null);
          }
        } catch (e) {
          console.log('Error get group data: ', e);
          setGroupDataList([]);
        }
      });
      // p1();
      // p2();
    } else {
      // setInputBlocks(null);
      // setGroupDataList([]);
      setCurrentGroupData(null);
    }
  }, [gid, group, groupId]);
  const debouncedSaveInputBlockData = useCallback(
    debounce((data: InputBlockGroupData) => {
      console.log('debouncedSaveInputBlockData:', data);
      // if (!currentGroupData) return;
      const input_blocks = data.input_blocks.map((e) => ({
        cid: e.cid,
        data: e.data,
      }));
      fetch(`/api/input_block_data/groups/${groupId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          input_blocks,
        }),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.json();
        })
        .then(() => {
          // console.log('Successfully saved input block data:', data);
        })
        .catch((error) => {
          console.error('Error saving input block data:', error);
        });
    }, 1000),
    [groupId]
  );
  const setInputBlockData = (cid: string, data: InputBlockDataPayload) => {
    if (!groupId) {
      console.error('Group ID not specified');
      return;
    }
    if (!currentGroupData) {
      console.error('currentGroupData is empty');
      return;
    }
    const newData = { ...currentGroupData };
    const ib = newData.input_blocks.find((x) => x.cid == cid);
    if (!ib) {
      console.error(`cid ${cid} not found in group data`);
      return;
    }
    ib.data = data; // to do autosave
    setCurrentGroupData(newData);
    debouncedSaveInputBlockData(newData);
  };
  const setName = (name: string) => {
    if (!groupId) {
      console.error('Group ID not specified');
      return;
    }
    if (!currentGroupData) {
      console.error('currentGroupData is empty');
      return;
    }
    const newData = { ...currentGroupData };
    newData.name = name;
    // console.log('newData:', newData);
    setCurrentGroupData(newData);
    debouncedSaveInputBlockData(newData);
  };
  const getInputBlockData = (cid: string) => {
    // console.log('getInputBlockData', cid, groupId, currentGroupData);
    if (!groupId) {
      console.log('Group ID not specified');
      return null;
    }
    if (!currentGroupData) {
      console.log('currentGroupData data is empty');
      return null;
    }
    if (!inputBlocks) {
      console.log('Input Block is empty');
      return null;
    }
    const inputBlock = inputBlocks.find((x) => x.cid == cid);
    if (!inputBlock) {
      return null;
    }
    const ibdata = currentGroupData.input_blocks.find((x) => x.cid == cid);
    if (!ibdata) {
      return null;
    }
    return { inputBlock, ibdata };
  };

  const getGroupDataById = () => {
    // console.log('groupId', groupId);
    // console.log('groupDataList', groupDataList);
    if (!groupId) return null;
    const groupData = groupDataList?.find((x) => x.id == groupId);
    // console.log('groupData', groupDataList);
    return groupData || null;
  };

  const updateNewGroupData = (cid: string, data: InputBlockDataPayload) => {
    setNewGroupData({
      ...newGroupData,
      [cid]: data,
    });
  };

  const saveNewGroupData = async () => {
    const res = await fetch(`/api/input_block_data/groups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newGroupData),
    });
    if (!res.ok) {
      throw new Error('Network response was not ok');
    }

    return await res.json();
  };

  return (
    <InputBlockGroupDataContext.Provider
      value={{
        gid: decodeURI(gid),
        group: decodeURI(group),
        groupId: groupId,
        cid: cid,
        name: currentGroupData?.name ?? group, // This reflects any changes made to the name in the current group data
        inputBlocks,
        groupDataList: groupDataList,
        currentGroupData,
        setInputBlockData,
        setName,
        getInputBlockData,
        getGroupDataById,
        newGroupData,
        updateNewGroupData,
        saveNewGroupData,
        projectId,
        flow,
      }}>
      {children}
    </InputBlockGroupDataContext.Provider>
  );
};

export const useInputBlockGroupData = () => {
  const context = useContext(InputBlockGroupDataContext);
  if (!context) {
    throw new Error(
      'useInputBlockGroupData must be used within an InputBlockGroupDataProvider'
    );
  }
  return context;
};