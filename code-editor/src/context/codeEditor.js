import { useState, useRef } from "react";
import { LANGUAGE_CONFIG } from "../constants";
import { useUser } from "./UserContext";

const getInitialState = () => {
  if (typeof window === "undefined") {
    return {
      language: "javascript",
      fontSize: 16,
      theme: "vs-dark",
    };
  }

  const savedLanguage = localStorage.getItem("editor-language") || "javascript";
  const savedTheme = localStorage.getItem("editor-theme") || "vs-dark";
  const savedFontSize = localStorage.getItem("editor-font-size") || 16;

  return {
    language: savedLanguage,
    theme: savedTheme,
    fontSize: Number(savedFontSize),
  };
};

export const useCodeEditor = () => {
  const initialState = getInitialState();
  const [language, setLanguage] = useState(initialState.language);
  const [theme, setTheme] = useState(initialState.theme);
  const [fontSize, setFontSize] = useState(initialState.fontSize);
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState(null);
  const [editor, setEditor] = useState(null); // Monaco type removed
  const [fileName, setFileName] = useState("");
  const [codeId, setCodeId] = useState("");
  const [executionResult, setExecutionResult] = useState(null); // CodeEditorState type removed
  const editorRef = useRef(null);

  const {user} = useUser();

  const getCode = () => editorRef.current?.getValue() || "";

  const handleSetEditor = (editor) => {
    editorRef.current = editor;
    const savedCode = localStorage.getItem(`editor-code-${language}`);
    if (savedCode) editor.setValue(savedCode);
    setEditor(editor);
  };

  const handleSetTheme = (newTheme) => {
    localStorage.setItem("editor-theme", newTheme);
    setTheme(newTheme);
  };

  const handleFileName = (fileName) => {
    localStorage.setItem("file-name", fileName);
    setFileName(fileName);
  };

  const handleCodeId = (codeId) => {
    localStorage.setItem("code-id", codeId);
    setCodeId(codeId);
  };

  const handleSetFontSize = (newFontSize) => {
    localStorage.setItem("editor-font-size", newFontSize.toString());
    setFontSize(newFontSize);
  };

  const handleSetLanguage = (newLanguage) => {
    const currentCode = editorRef.current?.getValue();
    if (currentCode) {
      localStorage.setItem(`editor-code-${language}`, currentCode);
    }

    localStorage.setItem("editor-language", newLanguage);

    setLanguage(newLanguage);
    setOutput("");
    setError(null);
  };

  const runCode = async () => {
    const code = getCode();

    if (!code) {
      setError("Please enter some code");
      return;
    }

    setIsRunning(true);
    setError(null);
    setOutput("");

    /* try {
            const runtime = LANGUAGE_CONFIG[language].pistonRuntime;
            const response = await fetch("https://emkc.org/api/v2/piston/execute", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    language: runtime.language,
                    version: runtime.version,
                    files: [{ content: code }],
                }),
            });

            const data = await response.json();

            console.log("data back from piston:", data);

            if (data.message) {
                setError(data.message);
                setExecutionResult({ code, output: "", error: data.message });
                return;
            }

            if (data.compile && data.compile.code !== 0) {
                const error = data.compile.stderr || data.compile.output;
                setError(error);
                setExecutionResult({ code, output: "", error });
                return;
            }

            if (data.run && data.run.code !== 0) {
                const error = data.run.stderr || data.run.output;
                setError(error);
                setExecutionResult({ code, output: "", error });
                return;
            }
 */
    try {
      const response = await fetch("http://localhost:5000/api/execute", {
        // Replace with your backend URL
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": user?.token
        },
        body: JSON.stringify({
          language: language,
          code: code,
          input: "",
        }),
      });

      const data = await response.json();

      console.log("data back from backend:", data);

      if (data.error) {
        setError(data.error);
        setExecutionResult({ code, output: "", error: data.error });
        return;
      }
      const output = data.output.trim();

      setOutput(output);
      setError(null);
      setExecutionResult({ code, output, error: null });
    } catch (error) {
      console.log("Error running code:", error);
      setError("Error running code");
      setExecutionResult({ code, output: "", error: "Error running code" });
    } finally {
      setIsRunning(false);
    }
  };

  return {
    language,
    theme,
    fontSize,
    output,
    isRunning,
    error,
    editor,
    executionResult,
    fileName,
    codeId,
    setCodeId: handleCodeId,
    setFileName: handleFileName,
    getCode,
    setEditor: handleSetEditor,
    setTheme: handleSetTheme,
    setFontSize: handleSetFontSize,
    setLanguage: handleSetLanguage,
    runCode,
  };
};

/* export const getExecutionResult = () => {
    const { executionResult } = useCodeEditor();
    return executionResult;
}; */
