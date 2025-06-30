import React from "react";
import { useFile } from "../context/UseFileContext";
import { useUser } from "../context/UserContext";
import { useCodeEditorContext } from "../context/CodeEditorContext";

const SaveCode = async () => {
  const { language, theme, fontSize, editor, setFontSize, setEditor, getCode } =
    useCodeEditorContext();
  const { file, setFile } = useFile();
  const { user } = useUser();

  const currentCode = getCode();
  try {
    const response = await fetch(
      `http://localhost:5000/api/files/save-code/${file?._id}`,
      {
        // Replace with your actual save-code route
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: file?.fileName,
          code: currentCode,
          language: language,
          codeId: file?.codeId,
          userId: user._id,
        }),
      }
    );
    const modifiedFile = await response.json();
    if (response.ok) {
      setFile(modifiedFile?.file);
      alert("Code Saved!");
    } else {
      alert("Failed to save code.");
    }
  } catch (error) {
    console.error("Error saving code:", error);
    alert("An error occurred while saving.");
  }
};

export default SaveCode;
