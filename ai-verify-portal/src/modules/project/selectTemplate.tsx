import {
  useCloneProjectTemplate,
  useDeleteProjectTemplate,
  useGetProjectTemplates,
} from 'src/lib/projectTemplateService';
import ProjectTemplate from 'src/types/projectTemplate.interface';
import styles from './styles/selectTemplate.module.css';
import sortMenuStyles from './styles/sortMenu.module.css';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import TemplateDetail from '../projectTemplate/projectTemplateDetail';
import { produce } from 'immer';
import ConfirmationDialog from 'src/components/confirmationDialog';
import clsx from 'clsx';
import { BlankTemplateId } from '.';
import { InputAdornment, OutlinedInput } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import Fuse from 'fuse.js';
import { serializeTemplatesSearchResult } from '../projectTemplate/utils/serializeFuseSearchResult';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { debounce } from 'lodash';
import { PageLevelErrorAlert } from 'src/components/pageLeverlErrorAlert';
import { toErrorWithMessage } from 'src/lib/errorUtils';
import { ListMenu, ListMenuItem } from 'src/components/listMenu';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import MenuBookIcon from '@mui/icons-material/MenuBook';

type TemplatesListProps = {
  selectedId?: string;
  onProjectTemplateSelected: (templateId: string | 'blank' | undefined) => void;
};

type BlankCanvasCardProps = {
  highlighted?: boolean;
  onClick: () => void;
};

const fuseSearchOptions = {
  includeMatches: true,
  findAllMatches: true,
  useExtendedSearch: true,
  keys: ['projectInfo.name', 'projectInfo.description'],
};

enum SortOption {
  TemplateNameAsc,
  TemplateNameDesc,
}

type SortMenuProps = {
  onClick: (sortOpt: SortOption) => void;
  selected: SortOption;
};

function BlankCanvasCard(props: BlankCanvasCardProps) {
  const { highlighted, onClick } = props;
  return (
    <div
      className={clsx(
        styles.blankCanvasCard,
        highlighted ? styles.card__highlighted : null
      )}>
      <div className={styles.blankCardmainContent} onClick={onClick}>
        <div className={styles.blankCardHeading}>Blank Canvas</div>
        <div className={styles.blankCardDescription}>
          Design your own report by dragging widgets onto a blank canvas
        </div>
      </div>
      <div className={styles.verticalDivider} />
    </div>
  );
}

// 👇 TODO - make Sort menu reusable component
function SortMenu(props: SortMenuProps) {
  const { selected, onClick } = props;
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  let sortDisplayText = '';
  switch (selected) {
    case SortOption.TemplateNameAsc:
      sortDisplayText = 'Template Name (asc)';
      break;
    case SortOption.TemplateNameDesc:
      sortDisplayText = 'Template Name (desc)';
      break;
  }

  function handleSortMenuClick(e: React.MouseEvent<HTMLDivElement>) {
    e.stopPropagation();
    setShowMenu((prev) => !prev);
  }

  function handleMenuItemClick(sortOpt: SortOption) {
    return () => {
      if (onClick) {
        onClick(sortOpt);
      }
      setShowMenu(false);
    };
  }

  const bindDocClickHandler = useCallback((e: Event) => {
    if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
      setShowMenu(false);
    }
  }, []);

  useEffect(() => {
    if (showMenu) {
      document.addEventListener('click', bindDocClickHandler);
    } else {
      document.removeEventListener('click', bindDocClickHandler);
    }
    return () => document.removeEventListener('click', bindDocClickHandler);
  }, [showMenu]);

  return (
    <div ref={menuRef} className={sortMenuStyles.sortMenu}>
      <div className={sortMenuStyles.label} style={{}}>
        Sort by
      </div>
      <div
        className={sortMenuStyles.optionDisplay}
        onClick={handleSortMenuClick}>
        {sortDisplayText}
        <div className={sortMenuStyles.icon}>
          {showMenu ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
        </div>
      </div>
      {showMenu ? (
        <ListMenu
          containerStyles={{
            position: 'absolute',
            zIndex: 101,
            fontSize: '13px',
            right: '0px',
            top: '36px',
            width: '220px',
          }}>
          <ListMenuItem
            id="dateAsc"
            displayText="Template Name (asc)"
            onClick={handleMenuItemClick(SortOption.TemplateNameAsc)}
          />
          <ListMenuItem
            id="dateDesc"
            displayText="Template Name (desc)"
            onClick={handleMenuItemClick(SortOption.TemplateNameDesc)}
          />
        </ListMenu>
      ) : null}
    </div>
  );
}

export default function SelectTemplate(props: TemplatesListProps) {
  const { selectedId, onProjectTemplateSelected } = props;
  const [data, loading, error] = useGetProjectTemplates();
  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
  const [initialTemplatesLoaded, setInitialTemplatesLoaded] = useState(false);
  const [templateIdToDelete, setTemplateIdToDelete] = useState<string>();
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>();
  const [selectedSortOption, setSelectedSortOption] = useState<SortOption>(
    SortOption.TemplateNameAsc
  );
  const deleteProjectTemplateFn = useDeleteProjectTemplate();
  const cloneProjectTemplateFn = useCloneProjectTemplate();
  const searchInputRef = useRef<HTMLInputElement>();
  const templatesFuseRef = useRef<Fuse<ProjectTemplate>>();

  async function deleteTemplate(templateId: string) {
    const idx = templates.findIndex((t) => t.id === templateId);
    if (idx < 0) return;

    const updatedList = produce(templates, (draft) => {
      draft.splice(idx, 1);
    });

    const result = await deleteProjectTemplateFn(templateId);
    if (result) setTemplates(updatedList);
  }

  function handleCloneTemplate(templateId: string) {
    return async () => {
      const idx = templates.findIndex((t) => t.id === templateId);
      if (idx < 0) return;

      const newTemplateDoc = await cloneProjectTemplateFn(templateId);
      if (!newTemplateDoc) return;
      setTemplates(
        produce((draft) => {
          draft.push(newTemplateDoc);
        })
      );
    };
  }

  function handleDeleteTemplateClick(templateId: string) {
    return () => {
      if (!templateId) return;
      setShowDeleteConfirmation(true);
      setTemplateIdToDelete(templateId);
    };
  }

  function handleDeleteConfirm(confirm = false) {
    if (!confirm || !templateIdToDelete) {
      setShowDeleteConfirmation(false);
      return;
    }
    deleteTemplate(templateIdToDelete);
    setShowDeleteConfirmation(false);
  }

  function handleCardClick(templateId: string) {
    return () => {
      setSelectedTemplateId(templateId);
      onProjectTemplateSelected(templateId);
    };
  }

  function handleSearchInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    debouncedSearch(e.target.value);
    if (e.target.value.trim() === '' && data) {
      setTemplates(data.projectTemplates);
      return;
    }
  }

  function handleSortSelected(sortOption: SortOption) {
    setSelectedSortOption(sortOption);
  }

  const debouncedSearch = debounce(async (text: string) => {
    if (!text) {
      setTemplates(data.projectTemplates);
      return;
    }
    if (!templatesFuseRef.current) return;

    const fuseSearchResult = templatesFuseRef.current.search(`'${text}`);
    setTemplates(serializeTemplatesSearchResult(fuseSearchResult));
    setSelectedTemplateId(undefined);
    onProjectTemplateSelected(undefined);
  }, 500);

  const handleClearSearchBtnClick = () => {
    if (searchInputRef.current && searchInputRef.current.value.length) {
      searchInputRef.current.value = '';
      if (data) {
        setTemplates(data.projectTemplates);
        setSelectedTemplateId(undefined);
        onProjectTemplateSelected(undefined);
      }
    }
  };

  useEffect(() => {
    if (!templates || !initialTemplatesLoaded) return;
    const sortedTemplates = [...templates];
    switch (selectedSortOption) {
      case SortOption.TemplateNameDesc:
        sortedTemplates.sort((a, b) =>
          a.projectInfo.name > b.projectInfo.name ? -1 : 1
        );
        break;
      case SortOption.TemplateNameAsc:
        sortedTemplates.sort((a, b) =>
          a.projectInfo.name < b.projectInfo.name ? -1 : 1
        );
        break;
    }
    setTemplates(sortedTemplates);
  }, [selectedSortOption, initialTemplatesLoaded]);

  useEffect(() => {
    if (!data) return;
    templatesFuseRef.current = new Fuse(
      data.projectTemplates,
      fuseSearchOptions
    );
    setTemplates(data.projectTemplates);
    setInitialTemplatesLoaded(true);
  }, [data]);

  useEffect(() => {
    setSelectedTemplateId(selectedId);
  }, [selectedId]);

  return (
    <div className="mainContainer">
      <div className={styles.container__limits}>
        <div className={styles.layout}>
          <div style={{ marginBottom: '25px' }}>
            <div style={{ display: 'flex' }}>
              <MenuBookIcon
                style={{
                  fontSize: '30px',
                  marginRight: '15px',
                  marginTop: '2px',
                }}
              />
              <div>
                <h3 className="screenHeading">Select Report Template</h3>
                <p className="headingDescription">
                  Select a template or start with an empty canvas.
                </p>
              </div>
            </div>
            {!templates.length ? (
              <div
                style={{
                  color: '#c42983',
                  display: 'flex',
                  marginTop: '15px',
                  fontSize: '14px',
                }}>
                <InfoOutlinedIcon style={{ marginRight: '5px' }} />
                <span>
                  No Templates Found. Select &apos;Blank Canvas&apos; and click
                  &apos;Next&apos;
                </span>
                {/* {templates.length ? <span>Report template cannot be changed after this step.</span> : 
              <span>No Templates Found. Select &apos;Blank Canvas&apos; and click &apos;Next&apos;</span>} */}
              </div>
            ) : null}
          </div>
          {!loading && error ? (
            <PageLevelErrorAlert
              headingText="Error Loading Templates"
              error={toErrorWithMessage(error)}
              content="An error occured while loading report templates"
            />
          ) : (
            <>
              {data && data.projectTemplates.length ? (
                <div className={styles.searchRow}>
                  <div className={styles.searchInput}>
                    <OutlinedInput
                      inputRef={searchInputRef}
                      id="search"
                      type="text"
                      placeholder="Search templates"
                      style={{
                        height: '36px',
                        width: '100%',
                        background: '#FFFFFF',
                      }}
                      onChange={handleSearchInputChange}
                      startAdornment={
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      }
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '20px',
                        cursor: 'pointer',
                      }}
                      onClick={handleClearSearchBtnClick}>
                      <ClearIcon style={{ fontSize: '20px' }} />
                    </div>
                  </div>
                  {templates.length ? (
                    <SortMenu
                      selected={selectedSortOption}
                      onClick={handleSortSelected}
                    />
                  ) : null}
                </div>
              ) : null}
              <div className={styles.templatesList}>
                <BlankCanvasCard
                  highlighted={selectedTemplateId === BlankTemplateId}
                  onClick={handleCardClick(BlankTemplateId)}
                />
                {templates
                  ? templates.map((template) => {
                      if (!template.id) return null;
                      return (
                        <TemplateDetail
                          key={`${template.id}-detail`}
                          template={template}
                          highlighted={template.id === selectedTemplateId}
                          onDeleteBtnClick={handleDeleteTemplateClick(
                            template.id
                          )}
                          onCloneBtnClick={handleCloneTemplate(template.id)}
                          onClick={handleCardClick(template.id)}
                        />
                      );
                    })
                  : null}
              </div>
            </>
          )}
        </div>
      </div>
      {showDeleteConfirmation ? (
        <ConfirmationDialog
          title="Delete Template"
          message="Are you sure you want to delete this template?"
          onClose={handleDeleteConfirm}
        />
      ) : null}
    </div>
  );
}
