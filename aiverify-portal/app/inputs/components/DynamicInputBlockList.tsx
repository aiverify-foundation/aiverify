'use client';

import Fuse from 'fuse.js';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import ChecklistsFilters from '@/app/inputs/components/FilterButtons';
import { useDeleteInputBlockData } from '@/app/inputs/hooks/useDeleteInputBlockData';
import { InputBlock, InputBlockData } from '@/app/types';
import { Icon, IconName } from '@/lib/components/IconSVG';
import { ButtonVariant } from '@/lib/components/button';
import { Button } from '@/lib/components/button';
import { Card } from '@/lib/components/card/card';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { DynamicInputBlockModal } from './DynamicInputBlockModal';
import { MessageModal } from './MessageModal';
interface DynamicInputBlockListProps {
  title: string;
  description: string;
  inputBlock: InputBlock;
  inputBlockData: InputBlockData[];
}

export const DynamicInputBlockList: React.FC<DynamicInputBlockListProps> = ({
  title,
  description,
  inputBlock,
  inputBlockData,
}) => {
  const router = useRouter();

  // State for search query, sort option, and modal
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');
  const [showAddModal, setShowAddModal] = useState(false);

  // State for delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<InputBlockData | null>(null);

  // State for message modal
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageModalProps, setMessageModalProps] = useState<{
    title: string;
    message: string;
    type: 'success' | 'error';
  }>({
    title: '',
    message: '',
    type: 'success',
  });

  // Local copy of input block data that can be modified when items are deleted
  const [localInputBlockData, setLocalInputBlockData] =
    useState<InputBlockData[]>(inputBlockData);

  // Create a Fuse instance to search input block names
  const fuse = useMemo(() => {
    const options = {
      keys: ['name'],
      includeScore: true,
      threshold: 0.5,
    };
    return new Fuse(localInputBlockData, options);
  }, [localInputBlockData]);

  // Handle search input change
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Handle sort option change
  const handleSort = (newSortBy: string) => {
    setSortBy(newSortBy);
  };

  // Delete mutation hook
  const { mutate: deleteInputBlock } = useDeleteInputBlockData(
    // onSuccess callback
    () => {
      // Remove the deleted item from the local state
      if (itemToDelete) {
        setLocalInputBlockData((prev) =>
          prev.filter((item) => item.id !== itemToDelete.id)
        );
      }

      // Show success message
      setMessageModalProps({
        title: 'Success',
        message: `${title} was successfully deleted!`,
        type: 'success',
      });
      setShowMessageModal(true);
      setShowDeleteModal(false);
      setItemToDelete(null);
    },
    // onError callback
    (error) => {
      // Show error message
      setMessageModalProps({
        title: 'Error',
        message: error.message || `Failed to delete ${title}`,
        type: 'error',
      });
      setShowMessageModal(true);
      setShowDeleteModal(false);
    }
  );

  // Handle delete button click
  const handleDeleteClick = (e: React.MouseEvent, item: InputBlockData) => {
    e.preventDefault();
    e.stopPropagation();
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  // Handle confirm delete
  const handleConfirmDelete = () => {
    if (itemToDelete) {
      deleteInputBlock(itemToDelete.id);
    }
  };

  // Filter and sort the input blocks based on search query and sort options
  const filteredItems = useMemo(() => {
    const filtered = searchQuery
      ? fuse.search(searchQuery).map((result) => result.item)
      : localInputBlockData;

    // Sorting logic for input blocks
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'date-asc':
          return (
            new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
          );
        case 'date-desc':
          return (
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          );
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
  }, [localInputBlockData, searchQuery, sortBy, fuse]);

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/inputs">
            <Icon
              name={IconName.ArrowLeft}
              size={40}
              color="#FFFFFF"
            />
          </Link>
          <div className="ml-3">
            <h1 className="text-2xl font-bold text-white">{title}</h1>
            <h3 className="text-white">{description}</h3>
          </div>
        </div>
        <Button
          pill
          textColor="white"
          variant={ButtonVariant.OUTLINE}
          size="sm"
          text="ADD NEW INPUT"
          onClick={() => setShowAddModal(true)}
        />
      </div>

      <div className="mt-6 flex h-full flex-col">
        {/* Filters section */}
        <ChecklistsFilters
          onSearch={handleSearch}
          onSort={handleSort}
        />

        {/* Input blocks list */}
        {filteredItems.length > 0 ? (
          <div className="mt-4 flex-1 overflow-y-auto p-1 scrollbar-hidden">
            {filteredItems.map((item) => (
              <Link
                key={item.id}
                href={`/inputs/${inputBlock.gid}/${inputBlock.cid}/${item.id}`}>
                <Card
                  size="md"
                  className="mb-4 w-full cursor-pointer shadow-md transition-shadow duration-200 hover:shadow-lg"
                  style={{
                    border: '1px solid var(--color-secondary-300)',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    width: '100%',
                    height: 'auto',
                  }}
                  cardColor="var(--color-secondary-950)"
                  enableTiltEffect={false}>
                  <div className="flex w-full flex-col gap-2">
                    <div className="flex items-center">
                      <h3 className="flex-1 text-lg font-medium">
                        {item.name}
                      </h3>
                      <button
                        className="ml-4 rounded-full p-2 text-gray-400 transition-colors hover:bg-red-900 hover:text-white"
                        onClick={(e) => handleDeleteClick(e, item)}>
                        <Icon
                          name={IconName.Delete}
                          size={20}
                          color="currentColor"
                        />
                      </button>
                    </div>
                    <div className="text-sm text-gray-500">
                      Last updated:{' '}
                      {new Date(item.updated_at + "Z").toLocaleDateString('en-GB')}
                    </div>
                    <div className="mt-2 text-sm text-gray-400">
                      Created:{' '}
                      {new Date(item.created_at + "Z").toLocaleDateString('en-GB')}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-10 flex flex-col items-center justify-center rounded-lg bg-secondary-900 p-8">
            <Icon
              name={IconName.File}
              size={60}
              color="#FFFFFF"
            />
            <h2 className="mt-4 text-xl font-semibold text-white">
              No {title} Found
            </h2>
            <p className="mt-2 text-center text-secondary-400">
              {searchQuery
                ? `No matching items found for "${searchQuery}". Try a different search term.`
                : `You haven't created any ${title.toLowerCase()} yet. Click the button above to add one.`}
            </p>
          </div>
        )}
      </div>

      {/* Modal for adding new input block */}
      {showAddModal && (
        <DynamicInputBlockModal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            router.push(`/inputs/${inputBlock.gid}/${inputBlock.cid}`);
          }}
          gid={inputBlock.gid}
          cid={inputBlock.cid}
          title={title}
        />
      )}

      {/* Confirmation modal for deleting input block */}
      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          router.push(`/inputs/${inputBlock.gid}/${inputBlock.cid}`);
        }}
        onConfirm={handleConfirmDelete}
        title={title}
        itemName={itemToDelete?.name || ''}
      />

      {/* Message modal for success or error */}
      <MessageModal
        isOpen={showMessageModal}
        onClose={() => setShowMessageModal(false)}
        title={messageModalProps.title}
        message={messageModalProps.message}
        type={messageModalProps.type}
      />
    </div>
  );
};
