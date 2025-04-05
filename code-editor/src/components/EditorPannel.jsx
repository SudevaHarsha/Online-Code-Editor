import { useEffect, useState } from "react";
import { Editor } from "@monaco-editor/react";
import { PlusIcon, RotateCcwIcon, SaveIcon, ShareIcon, TypeIcon } from "lucide-react";
import { useCodeEditorContext } from "../context/CodeEditorContext";
import { defineMonacoThemes, LANGUAGE_CONFIG } from "../constants";
import { motion } from "framer-motion";
import { useUser } from "../context/UserContext";
import { v4 as uuidv4 } from 'uuid';
import { useFile } from "../context/UseFileContext";
import SaveCode from "../helpers/SaveCode";
import { CreateCodeFile } from "../helpers/CreateCodeFile";
import { useNavigate } from "react-router-dom";

function EditorPanel() {

  const { language, theme, fontSize, editor, setFontSize, setEditor, getCode } = useCodeEditorContext();
  const { file, setFile, isModalOpen, setIsModalOpen } = useFile();
  const { user } = useUser();

  const [isSaved, setIsSaved] = useState(true);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  const navigate = useNavigate();

  console.log(language, theme, fontSize);

  useEffect(() => {
    const savedCode = localStorage.getItem(`editor-code-${language}`);
    const newCode = savedCode || LANGUAGE_CONFIG[language].defaultCode;
    if (editor) editor.setValue(newCode);
  }, [language, editor]);

  useEffect(() => {
    const savedFontSize = localStorage.getItem("editor-font-size");
    if (savedFontSize) setFontSize(parseInt(savedFontSize));
  }, [setFontSize]);

  const handleRefresh = () => {
    const defaultCode = LANGUAGE_CONFIG[language].defaultCode;
    if (editor) editor.setValue(defaultCode);
    localStorage.removeItem(`editor-code-${language}`);
  };

  const handleEditorChange = (value) => {
    if (value) localStorage.setItem(`editor-code-${language}`, value);
    setIsSaved(false);
  };

  const handleFontSizeChange = (newSize) => {
    const size = Math.min(Math.max(newSize, 12), 24);
    setFontSize(size);
    localStorage.setItem("editor-font-size", size.toString());
  };

  const handleSave = async () => {
    if (!user) {
      navigate("/sign-in");
      return;
    }
    if (editor) {
      if (file?.fileName && !file.fileName.startsWith("untitled") && file?.codeId) {
        // Call save-code route
        const currentCode = getCode();
        try {
          const response = await fetch(
            `https://online-code-editor-dmo6.onrender.com/api/files/save-code/${file?._id}`,
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
            setIsSaved(true);
            alert("Code Saved!");
          } else {
            alert("Failed to save code.");
          }
        } catch (error) {
          console.error("Error saving code:", error);
          alert("An error occurred while saving.");
        }
      } else {
        setIsModalOpen(true);
      }
    }
  };

  const handleModalSave = async () => {
    if (!user) {
      navigate("/sign-in");
      return;
    }
    if (file.fileName.trim()) {
      const currentCode = editor.getValue();
      const id = uuidv4();
      try {
        const response = await fetch(
          "https://online-code-editor-dmo6.onrender.com/api/files/create-file",
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
          setIsSaved(true);
          alert("File created and code saved!");
        } else {
          alert("Failed to create file.");
        }
      } catch (error) {
        console.error("Error creating file:", error);
        alert("An error occurred while creating file.");
      }
    }
  };

  const handleCreateNewFile = () => {
    const newFile = {
      fileName: `untitled-${uuidv4().slice(0, 8)}`,
      code: LANGUAGE_CONFIG[language].defaultCode,
      language: language,
      codeId: uuidv4(),
      userId: user._id,
    };
    setFile(newFile);
    if (editor) {
      editor.setValue(newFile.code);
    }
  };

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!isSaved && file?.code != getCode()) {
        e.preventDefault();
        e.returnValue = ''; // This triggers the browser confirmation
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isSaved]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      localStorage.removeItem("yourStateKey"); // replace with your key
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  /* 
    useEffect(() => {
      if (!file?.fileName && !file?.codeId) {
        return setIsModalOpen(true)
      }
      const handleBeforeUnload = () => SaveCode();
      window.addEventListener("beforeunload", handleBeforeUnload);
      return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [file]); */

  return (
    <div className="relative">
      <div className="relative bg-[#12121a]/90 backdrop-blur rounded-xl border border-white/[0.05] p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Font Size Slider */}
            <div className="flex items-center gap-3 px-3 py-2 bg-[#1e1e2e] rounded-lg ring-1 ring-white/5">
              <TypeIcon className="size-4 text-gray-400" />
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="12"
                  max="24"
                  value={fontSize}
                  onChange={(e) => handleFontSizeChange(parseInt(e.target.value))}
                  className="w-20 h-1 bg-gray-600 rounded-lg cursor-pointer"
                />
                <span className="text-sm font-medium text-gray-400 min-w-[2rem] text-center">
                  {fontSize}
                </span>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              className="p-2 bg-[#1e1e2e] hover:bg-[#2a2a3a] rounded-lg ring-1 ring-white/5 transition-colors"
              aria-label="Reset to default code"
            >
              <RotateCcwIcon className="size-4 text-gray-400" />
            </motion.button>
          </div>
          <div>
            <h6 className="text-white">{file?.fileName ? file?.fileName : "untitled"}</h6>
          </div>
          <div className="flex items-center gap-3">
            {/* Save Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCreateNewFile}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg overflow-hidden bg-[#1e1e2e] hover:bg-[#2a2a3a] ring-1 ring-white/5 transition-colors"
            >
              <PlusIcon className="size-4 text-gray-400" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg overflow-hidden bg-[#1e1e2e] hover:bg-[#2a2a3a] ring-1 ring-white/5 transition-colors"
            >
              <SaveIcon className="size-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-400">Save</span>
            </motion.button>

            {/* Share Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (file?.codeId) {
                  const url = `${window.location.origin}/editor/${file.codeId}`;
                  setShareUrl(url);
                  setShowShareDialog(true);
                } else {
                  alert("Please save the file first before sharing.");
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg overflow-hidden bg-gradient-to-r from-blue-500 to-blue-600 opacity-90 hover:opacity-100 transition-opacity"
            >
              <ShareIcon className="size-4 text-white" />
              <span className="text-sm font-medium text-white">Share</span>
            </motion.button>
          </div>
        </div>

        {/* Editor  */}
        <div className="relative group rounded-xl overflow-hidden ring-1 ring-white/[0.05]">
          {true && (
            <Editor
              height="600px"
              language={LANGUAGE_CONFIG[language].monacoLanguage}
              onChange={handleEditorChange}
              theme={theme}
              beforeMount={defineMonacoThemes}
              onMount={(editor) => setEditor(editor)}
              options={{
                minimap: { enabled: false },
                fontSize,
                automaticLayout: true,
                scrollBeyondLastLine: false,
                padding: { top: 16, bottom: 16 },
                renderWhitespace: "selection",
                fontFamily: '"Fira Code", "Cascadia Code", Consolas, monospace',
                fontLigatures: true,
                cursorBlinking: "smooth",
                smoothScrolling: true,
                contextmenu: true,
                renderLineHighlight: "all",
                lineHeight: 1.6,
                letterSpacing: 0.5,
                roundedSelection: true,
                scrollbar: {
                  verticalScrollbarSize: 8,
                  horizontalScrollbarSize: 8,
                },
              }}
            />
          )}

        </div>
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-30">
          <div className="bg-[#1e1e2e] p-6 rounded-lg ring-1 ring-white/5">
            <h2 className="text-lg font-semibold text-white mb-4">Enter Filename</h2>
            <input
              type="text"
              value={file?.fileName}
              onChange={(e) => setFile({ ...file, fileName: e.target.value })}
              className="w-full p-2 bg-[#2a2a3a] rounded-md text-white border border-gray-600 mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-gray-600 rounded-md text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleModalSave}
                className="px-4 py-2 bg-blue-500 rounded-md text-white"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      {showShareDialog && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-30">
          <div className="bg-[#1e1e2e] p-6 rounded-lg ring-1 ring-white/5 w-[90%] max-w-md">
            <h2 className="text-lg font-semibold text-white mb-4">Shareable Link</h2>
            <input
              type="text"
              readOnly
              value={shareUrl}
              onClick={(e) => e.target.select()}
              className="w-full p-2 mb-4 bg-[#2a2a3a] text-white rounded-md border border-gray-600"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowShareDialog(false)}
                className="px-4 py-2 bg-gray-600 rounded-md text-white"
              >
                Close
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(shareUrl);
                  alert("Link copied to clipboard!");
                }}
                className="px-4 py-2 bg-blue-500 rounded-md text-white"
              >
                Copy Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default EditorPanel;