import React, { createContext, useState, useEffect, useContext } from "react";

const FileContext = createContext();

export const FileProvider = ({ children }) => {
  const [file, setFile] = useState();
  useEffect(() => {
    const lastFileId = localStorage.getItem("last-open-fileId");
    if (lastFileId) {
      const meta = JSON.parse(localStorage.getItem(`file-meta-${lastFileId}`));
      const code = localStorage.getItem(`file-code-${lastFileId}`);
      if (meta) {
        setFile({ ...meta, code: code || "" });
      }
    }
  }, []);

  // ===== Keep current file in sync with localStorage =====
  useEffect(() => {
    if (!file) return;
    localStorage.setItem(`file-meta-${file.fileId}`, JSON.stringify({
      fileId: file.fileId,
      fileName: file.fileName,
      language: file.language
    }));
    localStorage.setItem(`file-code-${file.fileId}`, file.code);
    localStorage.setItem("last-open-fileId", file.fileId);
  }, [file]); 
  
  /* => {
    // ✅ Load user from localStorage properly
    const savedFile = localStorage.getItem("code-file");
    return savedFile ? JSON.parse(savedFile) : null; // Start as `null` instead of `{}`
  }); */

  const [isModalOpen, setIsModalOpen] = useState(() => {
    const savedModalState = localStorage.getItem("is-modal-open");
    return savedModalState ? JSON.parse(savedModalState) : false;
  });

  console.log("FileProvider initialized with file:", file);

 /*  useEffect(() => {
    if (file) {
      localStorage.setItem("code-file", JSON.stringify(file)); // ✅ Only store if user exists
    } else {
      localStorage.removeItem("code-file"); // ✅ Clear storage on logout
    }
  }, [file]); */

  useEffect(() => {
    localStorage.setItem("is-modal-open", JSON.stringify(isModalOpen));
  }, [isModalOpen]);

  return (
    <FileContext.Provider value={{ file, setFile, isModalOpen, setIsModalOpen }}>
      {children}
    </FileContext.Provider>
  );
};

export const useFile = () => {
  return useContext(FileContext);
};
