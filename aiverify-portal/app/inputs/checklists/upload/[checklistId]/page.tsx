'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ChecklistDetail from './components/ChecklistDetail';
import Link from 'next/link';
import { Icon, IconName } from '@/lib/components/IconSVG';
import { Modal } from '@/lib/components/modal';
import {
  useChecklists,
  ChecklistsProvider,
} from '@/app/inputs/checklists/upload/context/ChecklistsContext';
import { usePathname, useRouter } from 'next/navigation';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

type PageParams = {
  checklistId: string; // Ensure this matches the dynamic param in the file path
  groupId: string;
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
    path === '/inputs/checklists/upload' ||
    path.startsWith('/inputs/checklists/upload/');

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
      lastPath !== '/inputs/checklists/upload' &&
      isUploadPath(pathname) &&
      !pathname.startsWith('/inputs/checklists/upload/')
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
  const {
    updateChecklistData,
    setSelectedChecklist,
    checklists,
    selectedChecklist,
  } = useChecklists();

  useEffect(() => {}, [checklists]);

  const { checkForExistingData, clearAllChecklists } = useChecklists();
  const { showModal, setShowModal } = useInactivityCheck();
  const [showClearModal, setShowClearModal] = useState(false);
  const router = useRouter();

  const handleNewSet = async () => {
    sessionStorage.removeItem('checklistData');
    sessionStorage.removeItem(MODAL_SHOWN_KEY);
    sessionStorage.removeItem(LAST_ACTIVE_TIME_KEY);

    clearAllChecklists();
    setShowModal(false);
    router.refresh();
  };

  const handleBack = () => {
    router.push('/inputs/checklists/upload');
  };

  const handleClearFields = () => {
    if (selectedChecklist) {
      updateChecklistData(selectedChecklist.cid, {}); // Clear the data for the current checklist
    }
    setShowClearModal(false);
  };

  // Find the checklist by its ID to ensure it is selected
  const checklist = checklists.find(
    (checklist) => checklist.cid === params.checklistId
  );

  React.useEffect(() => {
    if (checklist) {
      setSelectedChecklist(checklist); // Set the selected checklist context
    }
  }, [checklist, setSelectedChecklist]);

  return (
    <QueryClientProvider client={queryClient}>
      <ChecklistsProvider>
        <div className="mx-auto h-[calc(100vh-200px)] px-4 py-6">
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
                  <Link href={`/inputs/checklists/`}>Checklists</Link>
                </span>
                <span className="mx-2 text-2xl text-white">/</span>
                <span className="text-2xl text-white hover:underline">
                  <Link href={`/inputs/checklists/${params.groupId}`}>
                    {decodeURIComponent(params.checklistId)}
                  </Link>
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
              key={params.checklistId}
              id={params.checklistId}
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
        {showModal && checkForExistingData() && (
          <Modal
            heading="Continue Previous Work?"
            onCloseIconClick={() => setShowModal(false)}
            primaryBtnLabel="Continue"
            secondaryBtnLabel="Start New"
            onPrimaryBtnClick={() => setShowModal(false)}
            onSecondaryBtnClick={handleNewSet}
            enableScreenOverlay>
            <p className="text-center text-lg">
              Would you like to continue where you left off or start a new set
              of checklists?
            </p>
          </Modal>
        )}
      </ChecklistsProvider>
    </QueryClientProvider>
  );
}
