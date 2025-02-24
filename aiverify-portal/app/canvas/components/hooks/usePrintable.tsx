'use client';

import { useRef, useCallback } from 'react';

type UsePrintableOptions = {
  /**
   * Custom ID for the printable content element
   * @default "printable-content"
   */
  printableId?: string;
};

export function usePrintable(options: UsePrintableOptions = {}) {
  const { printableId = 'printable-content' } = options;
  const contentRef = useRef<HTMLDivElement>(null);

  const print = useCallback(() => {
    const originalContent = document.body.innerHTML;
    const printContent = contentRef.current?.innerHTML;

    const styleSheet = document.createElement('style');
    styleSheet.innerHTML = `
      @media print {
        body * {
          visibility: hidden;
        }
        #${printableId},
        #${printableId} * {
          visibility: visible;
        }
        #${printableId} {
          position: absolute;
          left: 0;
          top: 0;
        }
      }
    `;
    document.head.appendChild(styleSheet);

    if (printContent) {
      document.body.innerHTML = `<div id="${printableId}">${printContent}</div>`;
      window.print();
      document.body.innerHTML = originalContent;
      styleSheet.remove();
      location.reload();
    }
  }, [printableId]);

  return { contentRef, print };
}
