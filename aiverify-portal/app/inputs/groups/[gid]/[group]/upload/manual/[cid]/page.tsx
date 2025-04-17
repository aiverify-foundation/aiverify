'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams, usePathname, useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect, useRef } from 'react';
import { useInputBlockGroupData } from '@/app/inputs/context/InputBlockGroupDataContext';
import { InputBlockDataPayload } from '@/app/types';
import { Icon, IconName } from '@/lib/components/IconSVG';
import { Modal } from '@/lib/components/modal';
// import { useChecklists } from '../../..//upload/context/ChecklistsContext';
import LayoutHeader from '../../../components/LayoutHeader';
import ChecklistDetail from './components/ChecklistDetail';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

type PageParams = {
  gid: string;
  group: string;
  // groupId: string;
  groupId: string;
  cid: string; // Ensure this matches the dynamic param in the file path
  [key: string]: string | string[];
};

const INACTIVITY_TIMEOUT = 1 * 5 * 1000;
const MODAL_SHOWN_KEY = 'continueModalShown';
const LAST_ACTIVE_TIME_KEY = 'lastActiveTime';
const LAST_PATH_KEY = 'lastPath';

function useInactivityCheck() {
  const [showModal, setShowModal] = useState(false);
  const pathname = usePathname();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const prevPathnameRef = useRef<string>('');

  const isUploadPath = (path: string) =>
    path === '/inputs/groups/upload' ||
    path.startsWith('/inputs/groups/upload/');

  const resetInactivityTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    sessionStorage.setItem(LAST_ACTIVE_TIME_KEY, Date.now().toString());

    timerRef.current = setTimeout(() => {
      if (isUploadPath(pathname)) {
        setShowModal(true);
        sessionStorage.setItem(MODAL_SHOWN_KEY, 'true');
      }
    }, INACTIVITY_TIMEOUT);
  };

  useEffect(() => {
    const lastPath = sessionStorage.getItem(LAST_PATH_KEY) || '';
    const modalShown = sessionStorage.getItem(MODAL_SHOWN_KEY);
    const lastActiveTime = sessionStorage.getItem(LAST_ACTIVE_TIME_KEY);

    sessionStorage.setItem(LAST_PATH_KEY, pathname);
    prevPathnameRef.current = pathname;

    if (
      lastPath !== '/inputs/groups/upload' &&
      isUploadPath(pathname) &&
      !pathname.startsWith('/inputs/groups/upload/')
    ) {
      const existingData = sessionStorage.getItem('checklistData');
      if (existingData && !modalShown) {
        setShowModal(true);
        sessionStorage.setItem(MODAL_SHOWN_KEY, 'true');
      }
    }

    if (lastActiveTime && isUploadPath(pathname)) {
      const timeDiff = Date.now() - parseInt(lastActiveTime);
      if (timeDiff >= INACTIVITY_TIMEOUT && !modalShown) {
        setShowModal(true);
        sessionStorage.setItem(MODAL_SHOWN_KEY, 'true');
      }
    }

    if (isUploadPath(pathname)) {
      const events = [
        'mousedown',
        'keydown',
        'scroll',
        'mousemove',
        'touchstart',
      ];
      const handleActivity = () => resetInactivityTimer();

      events.forEach((event) => {
        document.addEventListener(event, handleActivity);
      });

      resetInactivityTimer();

      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
        events.forEach((event) => {
          document.removeEventListener(event, handleActivity);
        });
      };
    }
  }, [pathname]);

  useEffect(() => {
    return () => {
      if (!isUploadPath(pathname)) {
        sessionStorage.removeItem(MODAL_SHOWN_KEY);
      }
    };
  }, [pathname]);

  return { showModal, setShowModal };
}

export default function ChecklistDetailPage() {
  const params = useParams<PageParams>();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');
  const flow = searchParams.get('flow');
  const isProjectFlow = !!projectId;

  // const {
  //   updateChecklistData,
  //   setSelectedChecklist,
  //   checklists,
  //   selectedChecklist,
  // } = useChecklists();
  const { gid, group, newGroupData, updateNewGroupData } =
    useInputBlockGroupData();

  // see if redundant
  // useEffect(() => {
  //   console.log('Checklists updated:', inputBlocks);
  // }, [inputBlocks]);

  // const { checkForExistingData, clearAllChecklists } = useChecklists();
  const { showModal, setShowModal } = useInactivityCheck();
  const [showClearModal, setShowClearModal] = useState(false);
  const router = useRouter();

  const handleBack = () => {
    if (isProjectFlow) {
      router.push(
        `/inputs/groups/${gid}/${group}/upload/manual?flow=${flow}&projectId=${projectId}`
      );
    } else {
      router.push(`/inputs/groups/${gid}/${group}/upload/manual`);
    }
  };

  const handleProjectBack = () => {
    router.push(`/project/select_data?flow=${flow}&projectId=${projectId}`);
  };

  const handleNewSet = async () => {
    sessionStorage.removeItem('checklistData');
    sessionStorage.removeItem(MODAL_SHOWN_KEY);
    sessionStorage.removeItem(LAST_ACTIVE_TIME_KEY);

    // clearAllChecklists();
    setShowModal(false);
    if (isProjectFlow) {
      router.push(
        `/inputs/groups/${gid}/${group}/upload/manual?flow=${flow}&projectId=${projectId}`
      );
    } else {
      router.refresh();
    }
  };

  const handleClearFields = () => {
    // if (selectedChecklist) {
    //   updateChecklistData(selectedChecklist.cid, {}); // Clear the data for the current checklist
    // }
    updateNewGroupData(params.cid, {});
    setShowClearModal(false);
    setTimeout(() => {
      // Use history API for more reliable refresh
      window.location.href = window.location.href;
    }, 1000);
  };

  // Find the checklist by its ID to ensure it is selected
  // const checklist = checklists.find(
  //   (checklist) => checklist.cid === params.cid
  // );

  // React.useEffect(() => {
  //   if (checklist) {
  //     setSelectedChecklist(checklist); // Set the selected checklist context
  //   }
  // }, [checklist, setSelectedChecklist]);

  const onDataUpdated = (cid: string, data: InputBlockDataPayload) => {
    console.log('onDataUpdated:', cid, data);
    updateNewGroupData(params.cid, data);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="mx-auto h-[calc(100vh-200px)] px-4 py-6">
        <LayoutHeader
          projectId={projectId}
          onBack={handleProjectBack}
        />
        {/* Breadcrumb navigation */}
        <div className="flex">
          <Icon
            name={IconName.CheckList}
            size={35}
            color="#FFFFFF"
          />
          <div className="ml-3 items-end">
            <nav className="breadcrumbs mb-6 text-sm">
              <span className="text-2xl text-white hover:underline">
                <Link href="/inputs">Inputs</Link>
              </span>
              <span className="mx-2 text-2xl text-white">/</span>
              <span className="text-2xl text-white hover:underline">
                <Link
                  href={`/inputs/groups/${encodeURI(gid)}/${encodeURI(group)}/`}>
                  Groups
                </Link>
              </span>
              <span className="mx-2 text-2xl text-white">/</span>
              <span className="text-2xl text-white hover:underline">
                <Link
                  href={`/inputs/groups/${encodeURI(gid)}/${encodeURI(group)}/${params.groupId}`}>
                  {group}
                </Link>
              </span>
              <span className="mx-2 text-2xl text-white">/</span>
              <span className="text-2xl text-primary-300 text-white">
                {decodeURIComponent(params.cid)}
              </span>
              <span className="mx-2 text-2xl text-white">/</span>
              <span className="text-2xl text-primary-300 text-white">
                Details
              </span>
            </nav>
          </div>
        </div>

        {/* Buttons for Back and Clear */}
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="rounded bg-secondary-700 px-4 py-2 text-white">
            Back to Group
          </button>
          <button
            onClick={() => setShowClearModal(true)}
            className="rounded border border-gray-300 px-4 py-2">
            Clear Fields
          </button>
        </div>

        {/* Checklist detail content */}
        <div className="h-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-sm scrollbar-hidden">
          <ChecklistDetail
            key={params.cid}
            cid={params.cid}
            data={
              newGroupData.input_blocks.find((x) => x.cid === params.cid) || {}
            }
            onDataUpdated={(newData) => onDataUpdated(params.cid, newData)}
          />
        </div>

        {/* Clear modal */}
        {showClearModal && (
          <Modal
            heading="Confirm Clear"
            onCloseIconClick={() => setShowClearModal(false)}
            primaryBtnLabel="Yes, Clear"
            secondaryBtnLabel="Cancel"
            onPrimaryBtnClick={handleClearFields}
            onSecondaryBtnClick={() => setShowClearModal(false)}
            enableScreenOverlay>
            <p className="text-center text-lg">
              Are you sure you want to clear all fields? This action cannot be
              undone.
            </p>
          </Modal>
        )}
      </div>
      {showModal && (
        <Modal
          heading="Continue Previous Work?"
          onCloseIconClick={() => setShowModal(false)}
          primaryBtnLabel="Continue"
          secondaryBtnLabel="Start New"
          onPrimaryBtnClick={() => setShowModal(false)}
          onSecondaryBtnClick={handleNewSet}
          enableScreenOverlay>
          <p className="text-center text-lg">
            Would you like to continue where you left off or start a new set of
            checklists?
          </p>
        </Modal>
      )}
    </QueryClientProvider>
  );
}
