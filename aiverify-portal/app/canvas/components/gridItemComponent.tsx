import { getMDXComponent } from 'mdx-bundler/client';
import { useMemo } from 'react';
import React from 'react';
import { Widget } from '@/app/types';

type GridItemComponentProps = {
  widget: Widget;
  inputBlockData?: unknown;
  testData?: unknown;
};

function GridItemComponent({ widget }: GridItemComponentProps) {
  const Component = useMemo(() => {
    if (!widget.mdx) {
      const MissingMdxMessage = () => (
        <div>{`${widget.name} - ${widget.cid} : Missing mdx`}</div>
      );
      MissingMdxMessage.displayName = 'MissingMdxMessage';
      return MissingMdxMessage;
    }
    return getMDXComponent(widget.mdx.code);
  }, [widget, widget.mdx]);

  const properties = useMemo(() => {
    if (!widget.properties) return {};
    return widget.properties.reduce((props, property) => {
      return {
        ...props,
        [property.key]: property.default || property.helper,
      };
    }, {});
  }, [widget.properties]);

  return (
    <Component
      properties={properties}
      frontmatter={widget.mdx ? widget.mdx.frontmatter : {}}
    />
  );
}

export { GridItemComponent };
