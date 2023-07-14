import { useCallback, useEffect, useRef, useState } from 'react';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import { ListMenu, ListMenuItem } from 'src/components/listMenu';
import sortMenuStyles from './styles/sortMenu.module.css';

enum SortOption {
  InstallDateAsc,
  InstallDateDesc,
  PluginNameAsc,
  PluginNameDesc,
}

type SortMenuProps = {
  onClick: (sortOpt: SortOption) => void;
  selected: SortOption;
};

function SortMenu(props: SortMenuProps) {
  const { selected, onClick } = props;
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  let sortDisplayText = '';
  switch (selected) {
    case SortOption.InstallDateAsc:
      sortDisplayText = 'Installed Date (asc)';
      break;
    case SortOption.InstallDateDesc:
      sortDisplayText = 'Installed Date (desc)';
      break;
    case SortOption.PluginNameAsc:
      sortDisplayText = 'Plugin Name (asc)';
      break;
    case SortOption.PluginNameDesc:
      sortDisplayText = 'Plugin Name (desc)';
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
        id="pluginsSortMenu"
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
            left: '0px',
            top: '60px',
            width: '200px',
          }}>
          <ListMenuItem
            id="dateAsc"
            displayText="Installed Date (asc)"
            onClick={handleMenuItemClick(SortOption.InstallDateAsc)}
          />
          <ListMenuItem
            id="dateDesc"
            displayText="Installed Date (desc)"
            onClick={handleMenuItemClick(SortOption.InstallDateDesc)}
          />
          <ListMenuItem
            id="nameAsc"
            displayText="Plugin Name (asc)"
            onClick={handleMenuItemClick(SortOption.PluginNameAsc)}
          />
          <ListMenuItem
            id="nameDesc"
            displayText="Plugin Name (desc)"
            onClick={handleMenuItemClick(SortOption.PluginNameDesc)}
          />
        </ListMenu>
      ) : null}
    </div>
  );
}

export { SortMenu, SortOption };
