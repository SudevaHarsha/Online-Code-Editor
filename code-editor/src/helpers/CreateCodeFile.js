import React from "react";
import { useCodeEditorContext } from "../context/CodeEditorContext";
import { useFile } from "../context/UseFileContext";
import { v4 as uuidv4 } from "uuid";
import { useUser } from "../context/UserContext";

export const CreateCodeFile = async () => {
  const { language, theme, fontSize, editor, setFontSize, setEditor, getCode } =
    useCodeEditorContext();
  const { file, setFile, setIsModalOpen } = useFile();
  const { user } = useUser();
  const currentCode = editor.getValue();
  const id = uuidv4();
  try {
    const response = await fetch(
      "http://localhost:5000/api/files/create-file",
      {
        // Replace with your actual create-file route
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: file?.fileName,
          code: currentCode,
          language: language,
          userId: user._id,
          codeId: id,
        }),
      }
    );
    if (response.ok) {
      /* setFileName(filename); */
      const newFile = await response.json();
      setIsModalOpen(false);
      setFile(newFile?.file);
      alert("File created and code saved!");
    } else {
      alert("Failed to create file.");
    }
  } catch (error) {
    console.error("Error creating file:", error);
    alert("An error occurred while creating file.");
  }
  
};