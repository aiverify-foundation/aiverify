'use client';

import JSONEditor, { JSONEditorOptions } from 'jsoneditor';
import { useEffect, useImperativeHandle, useRef } from 'react';
import 'jsoneditor/dist/jsoneditor.css';
import { cn } from '@/lib/utils/twmerge';

type JSONEditorProps = {
  ref: React.ForwardedRef<JsonEditorHandle>;
  data?: object;
  options?: Partial<JSONEditorOptions>;
  showMainMenuBar?: boolean;
  showNavigationBar?: boolean;
  showStatusBar?: boolean;
  darkMode?: boolean;
  className?: string;
  onChange?: (json: string) => void;
  onSyntaxError: (error: string) => void;
};

export interface JsonEditorHandle {
  getValue: () => object;
  setValue: (
    key: string,
    value: string | number | boolean | null | (string | number)[]
  ) => void;
  clear: () => void;
}

export function JsonEditor({
  ref,
  data,
  options = {},
  showMainMenuBar = false,
  showNavigationBar = true,
  showStatusBar = true,
  darkMode = true,
  className,
  onChange,
  onSyntaxError,
}: JSONEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<JSONEditor | null>(null);

  useImperativeHandle(ref, () => ({
    getValue: () => {
      if (editorRef.current) {
        return editorRef.current.get();
      }
      return null;
    },
    setValue: (
      key: string,
      value: string | number | boolean | null | (string | number)[]
    ) => {
      if (editorRef.current) {
        try {
          const currentJson = editorRef.current.get();
          const updatedJson = {
            ...currentJson,
            [key]: value,
          };
          editorRef.current.set(updatedJson);
          onChange?.(updatedJson);
        } catch (err) {
          onSyntaxError(err as string);
        }
      }
    },
    clear: () => {
      if (editorRef.current) {
        try {
          editorRef.current.set({});
          onChange?.('');
        } catch (err) {
          onSyntaxError(err as string);
        }
      }
    },
  }));

  useEffect(() => {
    if (containerRef.current && !editorRef.current) {
      const editor = new JSONEditor(containerRef.current, {
        mode: 'code',
        history: true,
        search: true,
        mainMenuBar: showMainMenuBar,
        navigationBar: showNavigationBar,
        statusBar: showStatusBar,
        ...options,
        onChange: () => {
          try {
            const json = editor.get();
            onChange?.(json);
          } catch (err) {
            onSyntaxError(err as string);
          }
        },
      } as JSONEditorOptions);

      editor.set(data);
      editorRef.current = editor;
    }

    return () => {
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.update(data);
    }
  }, [data]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      if (darkMode) {
        container.classList.add('jsoneditor-dark');
      } else {
        container.classList.remove('jsoneditor-dark');
      }
    }
  }, [darkMode]);

  return (
    <section className={cn('w-full overflow-hidden', className)}>
      <style
        jsx
        global>{`
        .jsoneditor-dark {
          --jse-theme-color: #1e1e1e;
          --jse-theme-color-highlight: #2f2f2f;
          --jse-background-color: #1e1e1e;
          --jse-text-color: #d4d4d4;
          --jse-selection-background-color: #264f78;
          --jse-selection-text-color: #d4d4d4;
          --jse-separator-color: #404040;
          --jse-key-color: #9cdcfe;
          --jse-value-color: #ce9178;
          --jse-value-number-color: #b5cea8;
          --jse-value-boolean-color: #569cd6;
          --jse-value-null-color: #569cd6;
          --jse-invalid-color: #ff3f3f;
          --jse-icon-color: #d4d4d4;
          --jse-icon-hover-color: #ffffff;
          --jse-search-match-color: #724c27;
        }

        .jsoneditor .ace-jsoneditor .ace_active-line {
          background-color: #616161;
        }

        .jsoneditor-dark .jsoneditor-menu {
          background-color: #333333;
          border-bottom: 1px solid #464646;
        }

        .jsoneditor-dark .jsoneditor-search input {
          color: #d4d4d4;
          background-color: #3c3c3c;
          border-color: #464646;
        }

        .jsoneditor-dark .jsoneditor-search input:focus {
          border-color: #007acc;
        }

        .jsoneditor-dark .jsoneditor-frame,
        .jsoneditor-dark .jsoneditor-search div.jsoneditor-results {
          background-color: #1e1e1e;
        }

        .jsoneditor-dark tr.jsoneditor-highlight,
        .jsoneditor-dark tr.jsoneditor-selected {
          background-color: #264f78;
        }

        .jsoneditor-dark .jsoneditor-field,
        .jsoneditor-dark .jsoneditor-value {
          color: #d4d4d4;
        }

        .jsoneditor-dark .jsoneditor-readonly {
          color: #d1d1d1;
        }

        /* ACE editor dark mode styles */
        .jsoneditor-dark .ace-jsoneditor {
          background-color: #1e1e1e;
          color: #d4d4d4;
        }

        .jsoneditor-dark .ace-jsoneditor .ace_gutter {
          background-color: #333333;
          color: #858585;
        }

        .jsoneditor-dark .ace-jsoneditor .ace_print-margin {
          width: 1px;
          background: #464646;
        }

        .jsoneditor-dark .ace-jsoneditor .ace_constant.ace_numeric {
          color: #b5cea8;
        }

        .jsoneditor-dark .ace-jsoneditor .ace_string {
          color: #ce9178;
        }

        .jsoneditor-dark .ace-jsoneditor .ace_constant.ace_boolean {
          color: #569cd6;
        }

        .jsoneditor-dark .ace-jsoneditor .ace_constant.ace_language {
          color: #569cd6;
        }

        .jsoneditor-dark .ace-jsoneditor .ace_invalid {
          background-color: #ff3f3f;
          color: #ffffff;
        }

        .jsoneditor-dark .ace-jsoneditor .ace_support.ace_function {
          color: #dcdcaa;
        }

        .jsoneditor-dark .ace-jsoneditor .ace_variable {
          color: #9cdcfe;
        }

        .jsoneditor-dark .ace-jsoneditor .ace_storage,
        .jsoneditor-dark .ace-jsoneditor .ace_keyword,
        .jsoneditor-dark .ace-jsoneditor .ace_meta.ace_tag {
          color: #569cd6;
        }

        .jsoneditor-dark .ace-jsoneditor .ace_punctuation,
        .jsoneditor-dark .ace-jsoneditor .ace_bracket {
          color: #d4d4d4;
        }

        .jsoneditor-dark .ace-jsoneditor .ace_comment {
          color: #6a9955;
        }

        .jsoneditor-dark .ace-jsoneditor .ace_content {
          background-color: #413f3f;
        }

        .jsoneditor-dark .jsoneditor-statusbar {
          background-color: #413f3f;
          border-top: 1px solid #757575;
        }

        .jsoneditor-dark .jsoneditor {
          border: 1px solid #414141;
        }

        .jsoneditor-dark .ace-jsoneditor .ace_indent-guide {
          background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAACCAYAAACZgbYnAAAAEklEQVQImWNgYGBgYHB3d/8PAAOIAdULw8qMAAAAAElFTkSuQmCC)
            right repeat-y;
        }
      `}</style>
      <div
        ref={containerRef}
        className="size-full"
      />
    </section>
  );
}

JsonEditor.displayName = 'JsonEditor';
