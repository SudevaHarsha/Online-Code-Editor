import React, { createContext, useContext } from 'react';
import { useCodeEditor } from './codeEditor';

const CodeEditorContext = createContext(undefined);

export const CodeEditorProvider = ({ children }) => {
  const codeEditor = useCodeEditor();

  return (
    <CodeEditorContext.Provider value={codeEditor}>
      {children}
    </CodeEditorContext.Provider>
  );
};

export const useCodeEditorContext = () => {
  const context = useContext(CodeEditorContext);
  if (!context) {
    throw new Error('useCodeEditorContext must be used within a CodeEditorProvider');
  }
  return context;
};