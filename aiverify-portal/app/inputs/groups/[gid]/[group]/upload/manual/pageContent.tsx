'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useState, useRef, JSX } from 'react';
import { ChevronLeftIcon } from '@/app/inputs/utils/icons';
import { Modal } from '@/lib/components/modal';
import { InputBlockGroup } from '../../../../../utils/types';
import LayoutHeader from '../../components/LayoutHeader';
import { useChecklists } from '../context/ChecklistsContext';
import { useInputBlockGroupSubmission } from '../hooks/useUploadSubmission';
import InputBlockGroupDetail from './components/GroupDetail';
import { GroupNameInput } from './components/GroupNameInput';
import ProgressBar from './components/ProgressSidebar';
import SplitPane from './components/SplitPane';

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

export interface ChecklistsPageContentProps {
  // group: string;
  // plugin: Plugin;
  group: InputBlockGroup;
}

function ChecklistsPageContent({ group }: ChecklistsPageContentProps) {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');
  const flow = searchParams.get('flow');
  const isProjectFlow = !!projectId;

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
  const { submitInputBlockGroup: submitChecklist } =
    useInputBlockGroupSubmission();

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
          gid: group.gid,
          name: checklist.name,
          group: groupName,
        };

        // Convert to JSON string and back to ensure proper quotes
        return JSON.parse(JSON.stringify(formattedChecklist));
      });

      for (const checklist of checklistSubmissions) {
        await submitChecklist(checklist);
      }
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
    if (isProjectFlow) {
      router.push(`/inputs/groups/upload?flow=${flow}&projectId=${projectId}`);
    } else {
      router.push('/inputs/groups');
    }
  };

  const handleProjectBack = () => {
    router.push(`/project/select_data?flow=${flow}&projectId=${projectId}`);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    if (!isProjectFlow) {
      router.push('/inputs/groups/');
    }
  };

  return (
    <div className="flex h-[calc(100vh-50px)] flex-col px-4 py-6">
      <LayoutHeader
        projectId={projectId}
        onBack={handleProjectBack}
      />
      {/* Breadcrumb navigation */}
      <div className="flex">
        <div>
          <div
            className="mr-4 cursor-pointer"
            onClick={handleBack}>
            <ChevronLeftIcon
              size={35}
              color="#FFFFFF"
            />
          </div>
        </div>
        <div className="ml-3 items-end">
          <h1 className="mb-4 text-3xl font-bold text-white">
            Add New {group.groupName}
          </h1>
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
          leftPane={<ProgressBar group={group} />}
          rightPane={<InputBlockGroupDetail group={group} />}
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

export default ChecklistsPageContent;
