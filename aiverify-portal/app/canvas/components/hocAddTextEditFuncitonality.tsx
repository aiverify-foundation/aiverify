import { MDXContentProps } from 'mdx-bundler/client';
import React from 'react';

const dataKeyName = 'data-aivkey';
export const editorInputClassName = 'editor-input';

/**
 * This is a higher-order component that allows developers to add modifications like styling to the MDX component.
 * @param WrappedComponent - The MDX component to wrap.
 * @returns A new component that adds text behavior to the MDX component.
 */

export const hocAddTextEditFunctionality = <P extends MDXContentProps>(
  WrappedComponent: React.FunctionComponent<P>
) => {
  return function EditableComponent(props: P) {
    const h1Ref = React.useRef<HTMLTextAreaElement>(null);
    const h2Ref = React.useRef<HTMLTextAreaElement>(null);
    const h3Ref = React.useRef<HTMLTextAreaElement>(null);

    React.useEffect(() => {
      // Set the cursor to the end of the text area
      [h1Ref, h2Ref, h3Ref].forEach(ref => {
        if (ref.current) {
          const length = ref.current.value.length;
          ref.current.setSelectionRange(length, length);
        }
      });
    }, []);

    const handleTextAreaInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
      // Adjust the height of the text area to fit the content
      const target = e.target as HTMLTextAreaElement;
      target.style.height = 'auto';
      target.style.height = `${target.scrollHeight}px`;
    };

    return (
      <WrappedComponent
        {...props}
        components={{
          p: ({
            children,
            ...props
          }: { children: React.ReactNode } & Record<string, string>) => {
            if (dataKeyName in props) {
              return (
                <textarea
                  name={props[dataKeyName]}
                  defaultValue={children as string}
                  className={`input-p ${editorInputClassName}`}
                />
              );
            }
            return <div {...props}>{children}</div>;
          },
          h1: ({
            children,
            ...props
          }: { children: React.ReactNode } & Record<string, string>) => {
            if (dataKeyName in props) {
              return (
                <textarea
                  ref={h1Ref}
                  autoFocus
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  onInput={handleTextAreaInput}
                  name={props[dataKeyName]}
                  defaultValue={children as string}
                  className={`input-h1 ${editorInputClassName}`}
                />
              );
            }
            return <h1 {...props}>{children}</h1>;
          },
          h2: ({
            children,
            ...props
          }: { children: React.ReactNode } & Record<string, string>) => {
            if (dataKeyName in props) {
              return (
                <textarea
                  ref={h2Ref}
                  autoFocus
                  onInput={handleTextAreaInput}
                  name={props[dataKeyName]}
                  defaultValue={children as string}
                  className={`input-h2 ${editorInputClassName}`}
                />
              );
            }
            return <h2 {...props}>{children}</h2>;
          },
          h3: ({
            children,
            ...props
          }: { children: React.ReactNode } & Record<string, string>) => {
            if (dataKeyName in props) {
              return (
                <textarea
                  ref={h3Ref}
                  autoFocus
                  onInput={handleTextAreaInput}
                  name={props[dataKeyName]}
                  defaultValue={children as string}
                  className={`input-h3 ${editorInputClassName}`}
                />
              );
            }
            return <h3 {...props}>{children}</h3>;
          },
        }}
      />
    );
  };
};