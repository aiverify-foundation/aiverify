import { useEffect, useRef, useState } from 'react';
import { Icon, IconName } from "@/lib/components/IconSVG";

interface DropdownItem {
  id: string;
  name: string;
}

interface DropdownProps {
  id: string;
  title?: string;
  data: DropdownItem[];
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  style?: string;
  selectedId?: string;
  onSelect?: (id: string) => void;
}

const Dropdown = ({
  id,
  title = 'Select',
  data,
  position = 'bottom-left',
  style,
  selectedId,
  onSelect,
}: DropdownProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<DropdownItem | undefined>(
    data?.find((item) => item.id === selectedId)
  );
  const [dynamicPosition, setDynamicPosition] = useState(position);
  const [maxWidth, setMaxWidth] = useState(0);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);

  const handleChange = (item: DropdownItem) => {
    setSelectedItem(item);
    onSelect && onSelect(item.id);
    setIsOpen(false);
  };

  useEffect(() => {
    if (selectedId && data) {
      const newSelectedItem = data.find((item) => item.id === selectedId);
      setSelectedItem(newSelectedItem || selectedItem);
    }
  }, [selectedId, data]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const dropdownRect = dropdownRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
  
      // Check if the dropdown would overflow on the right
      const overflowsRight = dropdownRect.right > viewportWidth;
  
      // Check if the dropdown would overflow on the left
      const overflowsLeft = dropdownRect.left < 0;
  
      // If it overflows on the right but has space on the left, align left
      const needsLeftAlign = overflowsRight && dropdownRect.left > dropdownRect.width;
  
      // If it overflows on the bottom but has space on the top, align top
      const needsBottomAlign = dropdownRect.bottom > window.innerHeight;
  
      const newPosition = `${needsBottomAlign ? 'top' : 'bottom'}-${needsLeftAlign ? 'left' : 'right'}` as 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
      setDynamicPosition(newPosition);
    }
  }, [isOpen, position]);
  

  // Calculate the max width for the button
  useEffect(() => {
    if (measureRef.current) {
      const widths = data.map((item) => {
        measureRef.current!.textContent = item.name;
        return measureRef.current!.offsetWidth;
      });
      const maxWidth = Math.max(...widths);
      setMaxWidth(maxWidth + 15);
    }
  }, [data]);

  const dropdownClass = `absolute w-full min-w-[200px] overflow-y-auto py-3 rounded shadow-md z-40 border-secondary-300 bg-secondary-950 ${
    dynamicPosition === 'bottom-right' ? 'top-full left-0 mt-2' :
    dynamicPosition === 'bottom-left' ? 'top-full left-0 mt-2' :
    dynamicPosition === 'top-right' ? 'bottom-full right-0 mb-2' :
    'bottom-full left-0 mb-2'
  }`;
  

  return (
    <div ref={dropdownRef} className='relative'>
      <span
        ref={measureRef}
        style={{
          position: 'absolute',
          visibility: 'hidden',
          whiteSpace: 'nowrap',
        }}
      />
      <button
        id={id}
        aria-label='Toggle dropdown'
        aria-haspopup='true'
        aria-expanded={isOpen}
        type='button'
        onClick={() => setIsOpen(!isOpen)}
        className={`flex justify-between items-center gap-2 rounded py-2 px-4 border ${selectedItem ? 'bg-secondary-950 text-white' : 'bg-secondary-950 text-white'
          } ${style}`}
        style={{ minWidth: maxWidth + 100 }}
      >
        <span>{selectedItem?.name || title}</span>
        <Icon
          name={isOpen ? IconName.WideArrowUp : IconName.WideArrowDown}
          size={10}
          color="#FFFFFF"
        />
      </button>
      {isOpen && (
        <div aria-label='Dropdown menu' className={dropdownClass}>
          <ul
            role='menu'
            aria-labelledby={id}
            aria-orientation='vertical'
            className='leading-10'
          >
            {data?.map((item) => (
              <li
                key={item.id}
                onClick={() => handleChange(item)}
                className={`flex items-center cursor-pointer hover:bg-gray-200 px-3 ${selectedItem?.id === item.id ? 'bg-secondary-950' : ''
                  }`}
              >
                <span>{item.name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Dropdown;