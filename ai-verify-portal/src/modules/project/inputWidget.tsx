import React, { useContext, useMemo } from 'react';
import Box from '@mui/material/Box';

import { InputDataContext, getComponents } from 'ai-verify-shared-library/lib';
import 'ai-verify-shared-library/styles.css';
// import { AIVCheckbox, AIVTextField } from "@ai-verify-shared-library/inputs";
import { getMDXComponent } from 'mdx-bundler/client';
const components = getComponents();

type Props = {
  mdxBundle: any;
};

export default function InputWidget({ mdxBundle }: Props) {
  const ctx = useContext(InputDataContext);
  // console.log("InputWidget ctx", ctx)
  const { code, frontmatter } = mdxBundle;
  const Component = useMemo(() => getMDXComponent(code, {}), [code, ctx]);
  // const Component = useMemo(() => getMDXComponent(code, {'MyCheckbox':MyCheckbox}), [code])

  return (
    <Box
      sx={{
        display: 'block',
        p: 0,
        m: 0,
        overflow: 'auto',
        position: 'relative',
      }}>
      <Component {...ctx} frontmatter={frontmatter} components={components} />
    </Box>
  );
}
