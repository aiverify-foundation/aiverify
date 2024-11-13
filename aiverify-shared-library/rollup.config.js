import { nodeResolve }  from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import multi from '@rollup/plugin-multi-entry';
import json from '@rollup/plugin-json';
import css from 'rollup-plugin-css-only';

import typescript from '@rollup/plugin-typescript';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import terser from '@rollup/plugin-terser';

export default [
  {
    input: "packages/charts/src/index.ts",
    output: [
      {
        file: 'dist/charts.js',
        format: "esm",
      },
    ],
    plugins: [
      multi(),
      peerDepsExternal(),
      nodeResolve(),
      commonjs(),
      typescript({ tsconfig: './tsconfig.json'  }),
      terser(),
    ],
    external: ["react", "react-dom"],
  },
  {
    input: "packages/lib/src/index.ts",
    output: [
      {
        file: 'dist/library.js',
        format: "esm",
      },
    ],
    plugins: [
      multi(),
      peerDepsExternal(),
      nodeResolve(),
      commonjs(),
      typescript({ tsconfig: './tsconfig.json'  }),
      terser(),
    ],
    external: ["react", "react-dom"],
  },
  {
    input: "packages/graph/src/index.ts",
    output: [
      {
        file: 'dist/graph.js',
        format: "esm",
      },
    ],
    plugins: [
      multi(),
      peerDepsExternal(),
      nodeResolve(),
      commonjs(),
      typescript({ tsconfig: './tsconfig.json'  }),
      terser(),
      json(),
    ],
    external: ["react", "react-dom"],
  },
  {
    input: 'packages/styles/index.ts',
    output: {
      file: 'dist/style.ts',
      format: 'esm'
    },
    plugins: [css({ output: 'mdx.bundle.css' })]
  },
];

