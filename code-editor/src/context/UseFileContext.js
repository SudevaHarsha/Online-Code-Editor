import React, { createContext, useState, useEffect, useContext } from "react";
import { useCodeEditorContext } from "./CodeEditorContext";
import { LANGUAGE_CONFIG } from "../constants";

const FileContext = createContext();

export const FileProvider = ({ children }) => {
  const { language } = useCodeEditorContext();

  // All files together in one object
  const [files, setFiles] = useState(() => {
    try {
      const saved = localStorage.getItem("files");
      return saved && saved !== "undefined" ? JSON.parse(saved) : {};
    } catch (err) {
      console.error("Failed to parse files from localStorage:", err);
      return {};
    }
  });

  const handleCreateBsicFile = (Lang) => {
    console.log("Creating basic file for language:", Lang);
    const file = files[Lang] || {
      fileId: Date.now().toString(),
      fileName: `untitled.${Lang}`,
      Lang,
      code: LANGUAGE_CONFIG[Lang]?.defaultCode || "",
    };
    return file;
  };

  // Current file object (derived from files + currentLanguage)
  /*   const defaultFile = handleCreateBsicFile(language);
  const file =
    language && files[language] ? files[language] : defaultFile; */
  /* setFile(initialFile); */

  const [file, setFile] = useState(() => {
    const defaultFile = handleCreateBsicFile(language);
    return language && files[language] ? files[language] : defaultFile;
  }, []);
  console.log("Current file:", file);

  // Save entire files object to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("files", JSON.stringify(files));
  }, [files]);

  // Function to change language
  const changeLanguage = (Lang, code, newLang) => {
    if (!Lang) return;
    setFiles((prevFiles) => {
      const existingFile = prevFiles[Lang];
      console.log("existingFile:", existingFile);
      if (existingFile) {
        return {
          ...prevFiles,
          [Lang]: {
            ...existingFile,
            code,
          },
        };
      } else {
        return {
          ...prevFiles,
          [Lang]: {
            fileId: Date.now().toString(),
            fileName: `untitled.${Lang}`,
            language: Lang,
            code: LANGUAGE_CONFIG[Lang]?.defaultCode || "",
          },
        };
      }
    });
    setFile(handleCreateBsicFile(newLang));
  };

  // Function to update current file's code or meta
  const updateFile = (updates) => {
    if (!language) return;
    console.log("Updating file:", updates);
    setFiles((prevFiles) => ({
      ...prevFiles,
      [updates.language]: updates,
    }));
    setFile(updates);
  };

  const resetFile = (lang) => {
    setFiles((prevFiles) => {
      const newFile = {
        fileId: Date.now().toString(),
        fileName: `untitled.${lang}`,
        language: lang,
        code: LANGUAGE_CONFIG[lang]?.defaultCode || "",
      };
      setFile(newFile);
      return {
        ...prevFiles,
        [lang]: newFile,
      };
    });
  };

  const openFile = (newFile) => {
    setFiles((prevFiles) => ({
      ...prevFiles,
      [newFile.language]: newFile,
    }));
    setFile(newFile);
  };

  const handleCreateDefaultFile = (Lang) => {
    const file = {
      fileId: Date.now().toString(),
      fileName: `untitled.${Lang}`,
      Lang,
      code: LANGUAGE_CONFIG[Lang]?.defaultCode || "",
    };
    console.log("Creating new default file:", file);
    setFile(file);
    return file;
  };

  const [isModalOpen, setIsModalOpen] = useState(() => {
    const savedModalState = localStorage.getItem("is-modal-open");
    return savedModalState ? JSON.parse(savedModalState) : false;
  });

  useEffect(() => {
    localStorage.setItem("is-modal-open", JSON.stringify(isModalOpen));
  }, [isModalOpen]);

  return (
    <FileContext.Provider
      value={{
        file,
        updateFile,
        resetFile,
        changeLanguage,
        openFile,
        handleCreateDefaultFile,
        isModalOpen,
        setIsModalOpen,
      }}
    >
      {children}
    </FileContext.Provider>
  );
};

export const useFile = () => {
  return useContext(FileContext);
};
