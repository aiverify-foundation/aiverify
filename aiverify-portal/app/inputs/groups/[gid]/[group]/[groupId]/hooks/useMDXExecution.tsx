import React from 'react';
import * as ReactJSXRuntime from 'react/jsx-runtime';

/**
 * Executes an MDX bundle and extracts components from it
 * 
 * @param mdxBundle The MDX bundle with code to execute
 * @returns An object containing the extracted components and variables
 */
export function executeMDXBundle(mdxBundle: { code: string; frontmatter?: Record<string, unknown> }) {
  if (!mdxBundle?.code) {
    throw new Error('No MDX code provided');
  }
  
  try {
    // Prepare the execution context with React and jsx-runtime
    const context = {
      React,
      jsx: ReactJSXRuntime.jsx,
      jsxs: ReactJSXRuntime.jsxs,
      _jsx_runtime: ReactJSXRuntime,
      Fragment: ReactJSXRuntime.Fragment,
    };
    
    // Create and execute the module factory function
    const moduleFactory = new Function(
      ...Object.keys(context),
      `${mdxBundle.code}`
    );
    
    // Execute the module with the context
    const moduleExports = moduleFactory(...Object.values(context));
    
    return moduleExports;
  } catch (error) {
    console.error('Error executing MDX bundle:', error);
    throw new Error('Failed to execute MDX bundle');
  }
} 