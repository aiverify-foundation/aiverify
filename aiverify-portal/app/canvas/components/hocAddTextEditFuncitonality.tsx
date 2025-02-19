import { MDXContentProps } from 'mdx-bundler/client';
import React from 'react';

const dataKeyName = 'data-aivkey';

/**
 * This is a higher-order component that allows developers to add modifications like styling to the MDX component.
 * @param WrappedComponent - The MDX component to wrap.
 * @returns A new component that adds text behavior to the MDX component.
 */

export const hocAddTextEditFunctionality = <P extends MDXContentProps>(
  WrappedComponent: React.FunctionComponent<P>
) => {
  return function EditableComponent(props: P) {
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
                  style={{
                    overflow: 'hidden',
                    resize: 'none',
                    height: 'auto',
                    whiteSpace: 'pre-wrap',
                    width: '100%'
                  }}
                  name={props[dataKeyName]}
                  defaultValue={children as string}
                  className="w-full bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                  autoFocus
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = `${target.scrollHeight}px`;
                  }}
                  name={props[dataKeyName]}
                  defaultValue={children as string}
                  className="input-h1"
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
                  autoFocus
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = `${target.scrollHeight}px`;
                  }}
                  name={props[dataKeyName]}
                  defaultValue={children as string}
                  className="input-h2"
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
                  autoFocus
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = `${target.scrollHeight}px`;
                  }}
                  name={props[dataKeyName]}
                  defaultValue={children as string}
                  className="input-h3"
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