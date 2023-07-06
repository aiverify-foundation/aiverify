import { useRouter } from 'next/router';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ProjectTemplate from 'src/types/projectTemplate.interface';
import { MinimalHeader } from '../home/header';
import ClearIcon from '@mui/icons-material/Clear';
import styles from './styles/templates.module.css';
import sortMenuStyles from './styles/sortMenu.module.css';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Fuse from 'fuse.js';
import { produce } from 'immer';
import { debounce } from 'lodash';
import { serializeTemplatesSearchResult } from './utils/serializeFuseSearchResult';
import { OutlinedInput } from '@mui/material';
import TemplateDetail from './projectTemplateDetail';
import {
  useCloneProjectTemplate,
  useDeleteProjectTemplate,
} from 'src/lib/projectTemplateService';
import ConfirmationDialog from 'src/components/confirmationDialog';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import { ListMenu, ListMenuItem } from 'src/components/listMenu';

type Props = {
  templates: ProjectTemplate[];
};

const fuseSearchOptions = {
  includeMatches: true,
  findAllMatches: true,
  useExtendedSearch: true,
  keys: ['projectInfo.name', 'projectInfo.description'],
};

type BlankCanvasCardProps = {
  onClick: () => void;
};

enum SortOption {
  TemplateNameAsc,
  TemplateNameDesc,
}

type SortMenuProps = {
  onClick: (sortOpt: SortOption) => void;
  selected: SortOption;
};

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

function BlankCanvasCard(props: BlankCanvasCardProps) {
  const { onClick } = props;
  return (
    <div className={styles.blankCanvasCard}>
      <div className={styles.blankCardmainContent} onClick={onClick}>
        <div className={styles.blankCardHeading}>Create New Template</div>
        <div className={styles.blankCardDescription}>
          Design your own report by dragging widgets onto a blank canvas
        </div>
      </div>
    </div>
  );
}

export default function TemplateListModule({ templates }: Props) {
  const [projectTemplates, setProjectTemplates] = useState<ProjectTemplate[]>(
    []
  );
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [templateIdToDelete, setTemplateIdToDelete] = useState<string>();
  const [initialTemplatesLoaded, setInitialTemplatesLoaded] = useState(false);
  const [selectedSortOption, setSelectedSortOption] = useState<SortOption>(
    SortOption.TemplateNameAsc
  );
  const deleteProjectTemplateFn = useDeleteProjectTemplate();
  const cloneProjectTemplateFn = useCloneProjectTemplate();
  const searchInputRef = useRef<HTMLInputElement>();
  const templatesFuseRef = useRef<Fuse<ProjectTemplate>>();
  const router = useRouter();

  function handleSortSelected(sortOption: SortOption) {
    setSelectedSortOption(sortOption);
  }

  async function deleteTemplate(templateId: string) {
    const idx = templates.findIndex((t) => t.id === templateId);
    if (idx < 0) return;

    const updatedList = produce(templates, (draft) => {
      draft.splice(idx, 1);
    });

    const result = await deleteProjectTemplateFn(templateId);
    if (result) setProjectTemplates(updatedList);
  }

  function handleCloneTemplate(templateId: string) {
    return async () => {
      const idx = templates.findIndex((t) => t.id === templateId);
      if (idx < 0) return;

      const newTemplateDoc = await cloneProjectTemplateFn(templateId);
      if (!newTemplateDoc) return;
      setProjectTemplates(
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

  function handleSearchInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    debouncedSearch(e.target.value);
    if (e.target.value.trim() === '') {
      setProjectTemplates(templates);
      return;
    }
  }

  function handleNewTemplateClick() {
    router.push(`/projectTemplate/create`);
  }

  const debouncedSearch = debounce(async (text: string) => {
    if (!text) {
      setProjectTemplates(templates);
      return;
    }
    if (!templatesFuseRef.current) return;

    const fuseSearchResult = templatesFuseRef.current.search(`'${text}`);
    setProjectTemplates(serializeTemplatesSearchResult(fuseSearchResult));
  }, 500);

  const handleClearSearchBtnClick = () => {
    if (searchInputRef.current && searchInputRef.current.value.length) {
      searchInputRef.current.value = '';
      if (templates) setProjectTemplates(templates);
    }
  };

  useEffect(() => {
    if (!projectTemplates || !initialTemplatesLoaded) return;
    const sortedTemplates = [...projectTemplates];
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
    setProjectTemplates(sortedTemplates);
  }, [selectedSortOption, initialTemplatesLoaded]);

  useEffect(() => {
    if (!templates) return;
    templatesFuseRef.current = new Fuse(templates, fuseSearchOptions);
    setProjectTemplates(templates);
    setInitialTemplatesLoaded(true);
  }, [templates]);

  return (
    <div>
      <MinimalHeader />
      <div className="layoutContentArea">
        <div className="scrollContainer">
          <div className="mainContainer">
            <div className={styles.container__limits}>
              <div className={styles.layout}>
                <div style={{ marginBottom: '25px' }}>
                  <div style={{ display: 'flex' }}>
                    <MenuBookIcon
                      style={{ fontSize: '30px', marginRight: '15px' }}
                    />
                    <div>
                      <h3 className="screenHeading">Project Templates</h3>
                      <p className="headingDescription">
                        Manage report templates
                      </p>
                    </div>
                  </div>
                </div>

                {templates.length ? (
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
                    {projectTemplates.length ? (
                      <SortMenu
                        selected={selectedSortOption}
                        onClick={handleSortSelected}
                      />
                    ) : null}
                  </div>
                ) : (
                  <p>
                    No Report Templates found. Click on &apos;Create New
                    Template&apos; to design one.
                  </p>
                )}

                <div className={styles.templatesList}>
                  <BlankCanvasCard onClick={handleNewTemplateClick} />
                  {projectTemplates
                    ? projectTemplates.map((template) => {
                        if (!template.id) return null;
                        return (
                          <TemplateDetail
                            key={`${template.id}-detail`}
                            template={template}
                            disableHover
                            onDeleteBtnClick={handleDeleteTemplateClick(
                              template.id
                            )}
                            onCloneBtnClick={handleCloneTemplate(template.id)}
                          />
                        );
                      })
                    : null}
                </div>
              </div>
            </div>
          </div>
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
