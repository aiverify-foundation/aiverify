'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useState, useRef, JSX } from 'react';
import {
  ChecklistsProvider,
  useChecklists,
} from '@/app/inputs/checklists/upload/context/ChecklistsContext';
import { useChecklistSubmission } from '@/app/inputs/checklists/upload/hooks/useUploadSubmission';
import { ChevronLeftIcon } from '@/app/inputs/utils/icons';
import { Modal } from '@/lib/components/modal';
import GroupDetail from './components/GroupDetail';
import { GroupNameInput } from './components/GroupNameInput';
import ProgressBar from './components/ProgressSidebar';
import SplitPane from './components/SplitPane';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

const INACTIVITY_TIMEOUT = 10 * 60 * 1000; //10 mins of inactivity
const MODAL_SHOWN_KEY = 'continueModalShown';
const LAST_ACTIVE_TIME_KEY = 'lastActiveTime';
const LAST_PATH_KEY = 'lastPath';

interface ValidationError {
  type: string;
  loc: string[];
  msg: string;
  input: string;
}

interface SubmissionError {
  message: string;
  details?: string | ValidationError[];
  statusCode?: number;
}

function ErrorMessage({ error }: { error: SubmissionError | null }) {
  if (!error) return null;

  // Handle validation errors (422)
  if (error.statusCode === 422 && Array.isArray(error.details)) {
    return (
      <div>
        <p className="font-semibold">Validation Error:</p>
        <ul className="list-disc pl-4">
          {(error.details as ValidationError[]).map((err, index) => (
            <li key={index}>
              {err.msg} (at {err.loc.join('.')})
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // Handle duplicate checklist error (500)
  if (
    error.statusCode === 500 &&
    typeof error.message === 'string' &&
    error.message.includes('already exists')
  ) {
    const match = error.message.match(/group '(.*?)' already exists/);
    const groupName = match ? match[1] : 'Unknown group';
    return (
      <div>
        <p>
          `{groupName}` already exists. Please modify the group name and try
          again.
        </p>
      </div>
    );
  }

  // Default error message
  return (
    <div>
      <p>{error.message}</p>
      {error.details && typeof error.details === 'string' && (
        <p className="mt-1 text-sm">{error.details}</p>
      )}
    </div>
  );
}

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

function ChecklistsPageContent() {
  const {
    checkForExistingData,
    clearAllChecklists,
    clearGroupName,
    isLoading,
    error,
    groupName,
    checklists,
  } = useChecklists();
  const { showModal, setShowModal } = useInactivityCheck();
  const [showSaveError, setShowSaveError] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState<JSX.Element | string | null>(
    null
  );
  const router = useRouter();

  // Use the submission hook
  const { submitChecklist } = useChecklistSubmission();

  // Save logic using mutation
  const saveAllChecklists = async () => {
    if (!groupName.trim()) {
      setShowSaveError(true);
      return;
    }

    setShowSaveError(false);

    // Iterate through all checklists to prepare data
    try {
      const checklistSubmissions = checklists.map((checklist) => {
        const formattedChecklist = {
          cid: checklist.cid,
          data: checklist.data, // Ensure the data object is properly structured
          gid: 'aiverify.stock.process_checklist',
          name: checklist.name,
          group: groupName,
        };

        // Convert to JSON string and back to ensure proper quotes
        return JSON.parse(JSON.stringify(formattedChecklist));
      });

      for (const checklist of checklistSubmissions) {
        await submitChecklist(checklist);
      }
      console.log('here');
      setModalMessage('Checklists saved successfully');
      setIsModalVisible(true);
      clearAllChecklists();
      clearGroupName();
    } catch (error) {
      setModalMessage(<ErrorMessage error={error as SubmissionError} />);
      setIsModalVisible(true);
    }
  };

  const handleNewSet = async () => {
    sessionStorage.removeItem('checklistData');
    sessionStorage.removeItem('groupName');
    sessionStorage.removeItem(MODAL_SHOWN_KEY);
    sessionStorage.removeItem(LAST_ACTIVE_TIME_KEY);

    clearAllChecklists();
    clearGroupName();
    setShowModal(false);
    router.refresh();
  };

  const handleBack = () => {
    router.push('/inputs/checklists/');
  };

  const closeModal = () => {
    setIsModalVisible(false);
    router.push('/inputs/checklists/');
  };

  return (
    <div className="flex h-[calc(100vh-50px)] flex-col px-4 py-6">
      {/* Breadcrumb navigation */}
      <div className="flex">
        <div className="mr-8">
          <div
            className="mr-8 cursor-pointer"
            onClick={handleBack}>
            <ChevronLeftIcon
              size={35}
              color="#FFFFFF"
            />
          </div>
        </div>
        <div className="ml-3 items-end">
          <nav className="breadcrumbs mb-6 text-sm">
            <span className="bold text-2xl text-white hover:underline">
              <Link href={`/inputs/checklists/`}>Checklists</Link>
            </span>
            <span className="mx-2 text-2xl text-white">/</span>
            <span className="bold text-2xl text-white hover:underline">
              Add New Checklists
            </span>
          </nav>
        </div>
      </div>

      {showSaveError && (
        <div className="mb-4 rounded bg-red-100 p-3 text-red-700">
          Please enter a group name before saving.
        </div>
      )}
      <div className="w-full flex-1 overflow-y-auto rounded bg-secondary-950 p-6 scrollbar-hidden">
        <GroupNameInput />
        <SplitPane
          leftPane={<ProgressBar />}
          rightPane={<GroupDetail />}
        />
      </div>
      <div className="mt-4 flex flex-col gap-4">
        {error && <ErrorMessage error={error} />}
        <div className="flex items-center justify-end">
          <button
            onClick={saveAllChecklists}
            disabled={isLoading}
            className={`rounded px-4 py-2 text-white transition-all duration-200 ${isLoading ? 'cursor-not-allowed bg-primary-500 opacity-70' : 'bg-primary-700 hover:bg-primary-600'}`}>
            {isLoading ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>
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
            Would you like to continue where you left off or start a new set of
            checklists?
          </p>
        </Modal>
      )}
      {isModalVisible && (
        <Modal
          heading="Upload Status"
          onCloseIconClick={closeModal}
          enableScreenOverlay>
          {modalMessage}
        </Modal>
      )}
    </div>
  );
}

export default function ChecklistsPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <ChecklistsProvider>
        <ChecklistsPageContent />
      </ChecklistsProvider>
    </QueryClientProvider>
  );
}
