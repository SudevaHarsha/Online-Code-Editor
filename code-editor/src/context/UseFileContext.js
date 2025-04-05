import React, { createContext, useState, useEffect, useContext } from "react";

const FileContext = createContext();

export const FileProvider = ({ children }) => {
  const [file, setFile] = useState(() => {
    // ✅ Load user from localStorage properly
    const savedFile = localStorage.getItem("code-file");
    return savedFile ? JSON.parse(savedFile) : null; // Start as `null` instead of `{}`
  });

  const [isModalOpen, setIsModalOpen] = useState(() => {
    const savedModalState = localStorage.getItem("is-modal-open");
    return savedModalState ? JSON.parse(savedModalState) : false;
  });

  useEffect(() => {
    if (file) {
      localStorage.setItem("code-file", JSON.stringify(file)); // ✅ Only store if user exists
    } else {
      localStorage.removeItem("code-file"); // ✅ Clear storage on logout
    }
  }, [file]);

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
